"""File which stores the NexusLogging Class"""
from typing import Optional
import json
import re

import webview

from Helper.NexusColors.color import NexusColor
from Helper.NexusColors.gradient import GradientPrinter



def strip_ansi(text: str) -> str:
    """Removes ANSI escape sequences so the web UI doesn't show broken codes."""
    return re.sub(r'\033\[[0-9;]*m', '', text)

class NexusLogging:
    """A class for Logging"""

    LC = f"{NexusColor.NEXUS}[{NexusColor.LIGHTBLACK}RASENGAN{NexusColor.NEXUS}]"

            
    @staticmethod
    def print_status(token: str, message: str, color: str, prefix: Optional[str] = None, length: Optional[int] = 45) -> None:
        try:
            window = webview.windows[0]
            # Clean message for GUI
            clean_msg = strip_ansi(f"{token[:length]} -> {message}")
            js_code = f'addLog("{clean_msg}", "succses");'
            window.evaluate_js(js_code)
        except Exception as e:
            print(f"[JS Log Fallback] {message} (info) | Error: {e}")
        GradientPrinter.gradient_print(
            input_text=token[:length],
            end_text=f"{NexusColor.RESET} -> {color}{message}",
            start_color="#ff0000",
            end_color="#660000",
            prefix=prefix
        )

    @staticmethod
    def print_error(
            token: str, message: str, response: str
        ) -> None:
        """
        Prints error details in case of a failed operation.

        Args:
            token (str): The token associated with the failed operation.
            message (str): The error message to display.
            response (requests.Response): The server response containing error details.
        """
        try:
            window = webview.windows[0]
            # Clean error for GUI
            raw_err = f"{token[:45]} -> {message}: {response.text} ({response.status_code})"
            log_message = strip_ansi(raw_err)
            js_code = f'addLog({json.dumps(log_message)}, "succses");'
            window.evaluate_js(js_code)
        except Exception as e:
            print(f"[JS Log Fallback] {message} (info) | Error: {e}")
                    
        GradientPrinter.gradient_print(
            input_text=token[:45],
            end_text=f"{NexusColor.RESET} -> {NexusColor.RED}{message}: {response.text} ({response.status_code})",
            start_color="#ff0000",
            end_color="#660000",
            correct=False,
        )
   