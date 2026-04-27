import random
import asyncio
import threading
import webview
from time import sleep

from Helper import NexusLogging, NexusColor, Discord, fetch_session

import curl_cffi.requests


class PFPChanger:
    """Class for changing profile pictures for a token."""

    def __init__(self, image: str, useragent: str, proxy: str | None = None):
        self.image = image
        self.useragent = useragent
        self.discord = Discord
        self.session = curl_cffi.requests.Session(impersonate="chrome")

        if proxy:
            self.session.proxies = {"http": f"http://{proxy}", "https": f"http://{proxy}"}

    def change_pfp(self, token: str):
        fetch_session(token)
        response = self.session.patch(
            "https://discord.com/api/v9/users/@me",
            headers=self.discord.fill_headers(token, self.useragent),
            json={"avatar": f"{self.image}"},
            timeout=10,
        )

        if response.status_code == 200:
            NexusLogging.print_status(token=token, message="PFP Changed", color=NexusColor.GREEN)
            return True

        if response.status_code == 429:
            NexusLogging.print_status(token=token, message="Ratelimit (429)", color=NexusColor.RED)
            return "Ratelimit (429)"

        NexusLogging.print_error(token=token, message="Error", response=response)
        return f"{response.text} ({response.status_code})"


class PFPController:
    """Controller for handling multiple tokens and updating stats in JS."""

    def __init__(self):
        self.loop = asyncio.new_event_loop()
        self.thread = threading.Thread(target=self._start_loop, daemon=True)
        self.thread.start()
        self.is_updating = False

        self.zstats = {"successful": 0, "failed": 0, "pending": 0, "total": 0, "current": 0}

    def _start_loop(self):
        asyncio.set_event_loop(self.loop)
        self.loop.run_forever()

    def update_pfp_multi(
        self,
        tokens: list[str],
        images: list[str],
        delay_enabled: bool = True,
        delay_min: int = 1,
        delay_max: int = 3,
        proxies: list[str] | None = None
    ):
        """Start updating PFPs for multiple tokens using threads with optional proxies."""

        if self.is_updating:
            return {"success": False, "error": "Already running"}

        self.is_updating = True
        self.stats = {
            "successful": 0,
            "failed": 0,
            "pending": len(tokens),
            "total": len(tokens),
            "current": 0
        }
        self._update_js_stats()

        threads = []

        def worker(token):
            if not self.is_updating:
                return

            try:
                if delay_enabled:
                    sleep(random.uniform(delay_min, delay_max))

                image = random.choice(images) if len(images) > 1 else images[0]
                proxy = random.choice(proxies) if proxies else None
                
                changer = PFPChanger(
                    image=image,
                    useragent=(
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                        "AppleWebKit/537.36 (KHTML, like Gecko) "
                        "Chrome/124.0.0.0 Safari/537.36"
                    ),
                    proxy=proxy
                )

                result = changer.change_pfp(token)

                if result is True:
                    self.stats["successful"] += 1
                else:
                    self.stats["failed"] += 1

            except Exception as e:
                self.stats["failed"] += 1
                print(f"[ERROR] {token} -> {e}")

            finally:
                self.stats["current"] += 1
                self.stats["pending"] -= 1
                self._update_js_stats()

                if self.stats["current"] >= self.stats["total"]:
                    self.is_updating = False
                    try:
                        window = webview.windows[0]
                        window.evaluate_js("window.onPfpUpdateComplete()")
                    except Exception:
                        pass

        for token in tokens:
            t = threading.Thread(target=worker, args=(token,))
            t.start()
            threads.append(t)

        for t in threads:
            t.join()

        return {"success": True}


    async def _update_single(self, token: str, images: list[str], delay_enabled: bool, delay_min: int, delay_max: int):
        if not self.is_updating:
            return

        if delay_enabled:
            await asyncio.sleep(random.uniform(delay_min, delay_max))

        image = random.choice(images) if len(images) > 1 else images[0]
        changer = PFPChanger(image=image, useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")
        result = changer.change_pfp(token)

        if result is True:
            self.stats["successful"] += 1
        else:
            self.stats["failed"] += 1

        self.stats["current"] += 1
        self.stats["pending"] -= 1
        self._update_js_stats()

        if self.stats["current"] >= self.stats["total"]:
            self.is_updating = False
            try:
                window = webview.windows[0]
                window.evaluate_js('toast.info("Info", "Profile picture update process completed");')
            except Exception:
                pass

    def _update_js_stats(self):
        """Push current stats to JS."""
        try:
            window = webview.windows[0]
            js_code = (
                f"updateStatsAndProgress({{"
                f"successful: {self.stats['successful']}, "
                f"failed: {self.stats['failed']}, "
                f"pending: {self.stats['pending']}, "
                f"total: {self.stats['total']}, "
                f"current: {self.stats['current']}"
                f"}});"
            )
            window.evaluate_js(js_code)
        except Exception:
            pass

    def stop(self):
        """Stop updating PFPs."""
        self.is_updating = False
