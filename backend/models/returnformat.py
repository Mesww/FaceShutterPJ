class Returnformat:
    def __init__(self, status, message, data):
        self.status = status
        self.message = message
        self.data = data
    
    def to_json(self):
        return {
            'status': self.status,
            'message': self.message,
            'data': self.data
        }