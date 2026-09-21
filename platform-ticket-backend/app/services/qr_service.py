import base64
from io import BytesIO

import qrcode


def generate_qr_base64(payload: str) -> str:
    img = qrcode.make(payload)
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buffer.getvalue()).decode()
