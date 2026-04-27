"""vcjoiner.py File for the Discord VC Joiner"""
import json
import sys
import os
import threading
import random
import asyncio
import websockets
from websockets.exceptions import ConnectionClosedError
import webview

sys.path.append(
    os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..")
    )
)

from Helper import (
    NexusColor,
    NexusLogging,
    pink_gradient,
    Utils,
    config
)


class DiscordVCJoiner:
    """
    A class to handle joining Discord voice channels programmatically via the Discord Gateway.
    """
    def __init__(self, token: str, guild_id: int, channel_id: int, options: dict) -> None:
        self.token: str = token
        self.guild_id: int = guild_id
        self.channel_id: int = channel_id

        self.heartbeat_interval: int = None
        self.session_id: str = None
        self.voice_server_info: dict = None
        self.websocket = None

        self.randomize = options.get("randomize_options", False)
        self.self_mute = options.get("mute", False)
        self.self_deaf = options.get("deaf", False)
        self.joined = False
        
    @staticmethod
    def resolve_value(value, randomize):
        if value is True:
            return True
        elif value is False and randomize:
            return random.choice([True, False])
        else:
            return value

    async def connect_to_gateway(self) -> None:
        try:
            async with websockets.connect("wss://gateway.discord.gg/?v=9&encoding=json", max_size=None) as ws:
                self.websocket = ws
                await self.identify()
                await self.event_listener()
        except Exception as e:
            NexusLogging.print_status(
                token=self.token,
                message=f"Gateway connection failed: {str(e)}",
                color=NexusColor.RED,
                prefix=f"{NexusLogging.LC} "
            )
            try:
                window = webview.windows[0]
                js_code = (
                    f"window.addVCConnection('{self.token}', '{self.guild_id}', "
                    f"'{self.channel_id}', 'Connection failed');"
                )
                window.evaluate_js(js_code)
            except Exception:
                pass

    async def identify(self) -> None:
        payload = {
            "op": 2,
            "d": {
                "token": self.token,
                "intents": 513,
                "properties": {
                    "$os": "linux",
                    "$browser": "disco",
                    "$device": "disco"
                }
            }
        }
        await self.send_json(payload)

    async def heartbeat(self) -> None:
        while self.heartbeat_interval:
            try:
                await asyncio.sleep(self.heartbeat_interval / 1000)
                await self.send_json({"op": 1, "d": None})
            except asyncio.CancelledError:
                break
            except ConnectionClosedError:
                break
            except Exception:
                break

    async def join_vc(self) -> None:
        randomize = self.randomize
        self_mute = self.resolve_value(self.self_mute, randomize)
        self_deaf = self.resolve_value(self.self_deaf, randomize)
        payload = {
            "op": 4,
            "d": {
                "guild_id": str(self.guild_id),
                "channel_id": str(self.channel_id),
                "self_mute": self_mute,
                "self_deaf": self_deaf
            }
        }
        await self.send_json(payload)

    async def event_listener(self) -> None:
        try:
            async for message in self.websocket:
                event = json.loads(message)

                if event["op"] == 10:
                    self.heartbeat_interval = event["d"]["heartbeat_interval"]
                    asyncio.create_task(self.heartbeat())

                elif event["op"] == 0 and event["t"] == "READY":
                    self.session_id = event["d"]["session_id"]
                    await self.join_vc()

                elif event["op"] == 0 and event["t"] == "VOICE_SERVER_UPDATE":
                    self.voice_server_info = event["d"]
                    if not self.joined:
                        self.joined = True
                        NexusLogging.print_status(
                            token=self.token,
                            message="Joined VC",
                            color=NexusColor.GREEN,
                            prefix=f"{NexusLogging.LC} "
                        )
                        try:
                            window = webview.windows[0]
                            js_code = (
                                f"window.addVCConnection('{self.token}', "
                                f"'{self.guild_id}', '{self.channel_id}', 'Connected');"
                            )
                            window.evaluate_js(js_code)
                        except Exception as e:
                            NexusLogging.print_status(
                                token=self.token,
                                message=f"JS Update Error: {str(e)}",
                                color=NexusColor.RED,
                                prefix=f"{NexusLogging.LC} "
                            )
        except Exception as e:
            NexusLogging.print_status(
                token=self.token,
                message=f"Event loop error: {str(e)}",
                color=NexusColor.RED,
                prefix=f"{NexusLogging.LC} "
            )

    async def send_json(self, data: dict) -> None:
        await self.websocket.send(json.dumps(data))

    async def disconnect_vc(self) -> None:
        payload = {
            "op": 4,
            "d": {
                "guild_id": str(self.guild_id),
                "channel_id": None,
                "self_mute": False,
                "self_deaf": False
            }
        }
        try:
            await self.send_json(payload)
        except Exception:
            pass
        finally:
            try:
                await self.websocket.close()
            except Exception:
                pass

        NexusLogging.print_status(
            token=self.token,
            message="Disconnected from VC",
            color=NexusColor.RED,
            prefix=f"{NexusLogging.LC} "
        )
        try:
            window = webview.windows[0]
            js_code = f"window.removeVCConnection('{self.token}', '{self.guild_id}', '{self.channel_id}');"
            window.evaluate_js(js_code)
        except Exception as e:
            NexusLogging.print_status(
                token=self.token,
                message=f"JS Update Error: {str(e)}",
                color=NexusColor.RED,
                prefix=f"{NexusLogging.LC} "
            )


class VCController:
    """Keeps one persistent event loop for all joins."""
    def __init__(self):
        self.vc_instances: dict[str, DiscordVCJoiner] = {}
        self.loop = asyncio.new_event_loop()
        self.thread = threading.Thread(target=self._start_loop, daemon=True)
        self.thread.start()

    def _start_loop(self):
        asyncio.set_event_loop(self.loop)
        self.loop.run_forever()

    def join_vc_multi(self, tokens, guild_id, channel_id, options=None):
        options = options or {}
        for token in tokens:
            instance = DiscordVCJoiner(token=token, guild_id=guild_id, channel_id=channel_id, options=options)
            self.vc_instances[token] = instance
            self.loop.call_soon_threadsafe(asyncio.create_task, instance.connect_to_gateway())


    def leave_vc(self, token, guild_id, channel_id):
        instance = self.vc_instances.get(token)
        if not instance:
            return {"success": False, "error": "Not connected"}
        try:
            fut = asyncio.run_coroutine_threadsafe(instance.disconnect_vc(), self.loop)
            fut.result(timeout=3)
            del self.vc_instances[token]
            return {"success": True, "message": "Disconnected from VC"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def leave_vc_multi(self, tokens, guild_id, channel_id):
        results = {}
        for token in tokens:
            results[token] = self.leave_vc(token, guild_id, channel_id)
        return results

    def _check_future(self, fut, token):
        if fut.exception():
            print(f"Task for {token} failed:", fut.exception())
