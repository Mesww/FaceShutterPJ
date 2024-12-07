from typing import Dict

from fastapi import WebSocket


SIMILARITY_THRESHOLD = 60.0


DEFAULT_TIMEZONE = "Asia/Bangkok"

CHECKIN_TIME_START = "12:00:00"
CHECKIN_TIME_END = "12:59:00"

# CHECKIN_TIME_START = "16:00:00"
# CHECKIN_TIME_END = "17:00:00"

CHECKOUT_TIME_START = "16:00:00"
CHECKOUT_TIME_END = "16:59:00"

# For Face Detection
MAX_ATTEMPTS = 50
MIN_CONFIDENCE_THRESHOLD = 0.55
CONSECUTIVE_SUCCESS_NEEDED = 2

# for Face Registration
SCAN_DIRECTION = ["Front"]
IMAGE_PER_DIRECTION = 1

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