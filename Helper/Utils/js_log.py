import webview
import re

def strip_ansi(text: str) -> str:
    return re.sub(r'\033\[[0-9;]*m', '', text)

def send_log_to_js(message, type="info"):
        try:
            window = webview.windows[0]
            # Remove ANSI codes before sending to webview
            clean_message = strip_ansi(message)
            js_code = f'addLog("{clean_message}", "{type}");'
            window.evaluate_js(js_code)
        except Exception as e:
            print(f"[JS Log Fallback] {message} ({type}) | Error: {e}")
