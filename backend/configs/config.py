from pathlib import Path
from typing import Dict

from fastapi import WebSocket

from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import serialization, hashes

SIMILARITY_THRESHOLD = 60.0




DEFAULT_TIMEZONE = "Asia/Bangkok"

CHECKIN_TIME_START = "13:00:00"
CHECKIN_TIME_END = "15:59:00"

# CHECKIN_TIME_START = "16:00:00"
# CHECKIN_TIME_END = "17:00:00"

CHECKOUT_TIME_START = "16:00:00"
CHECKOUT_TIME_END = "18:59:00"

# For Face Detection
MAX_ATTEMPTS = 50
MIN_CONFIDENCE_THRESHOLD = 0.55
CONSECUTIVE_SUCCESS_NEEDED = 1

# For Face Registration
SCAN_DIRECTION = ["Front"]
IMAGE_PER_DIRECTION = 1

# For SNMP Service
SNMP_OIDS = {
    'id': '1.3.6.1.4.1.9.9.599.1.3.1.1.27',
    'type': '1.3.6.1.4.1.9.9.599.1.3.1.1.28',
    'macAccespoint': '1.3.6.1.4.1.9.9.599.1.3.1.1.8'
}

PATHENV = Path("./.env")

# Store active connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, employee_id: str):
        await websocket.accept()
        self.active_connections[employee_id] = websocket

    def disconnect(self, employee_id: str):
        if employee_id in self.active_connections:
            del self.active_connections[employee_id]

    async def send_message(self, message: dict, employee_id: str):
        if employee_id in self.active_connections:
            await self.active_connections[employee_id].send_json(message)
            
# Generate RSA Key Pair
private_key = rsa.generate_private_key(
    public_exponent=65537,
    key_size=2048,
)
public_key = private_key.public_key()

# Serialize public key to share with frontend
public_key_pem = public_key.public_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PublicFormat.SubjectPublicKeyInfo
)