import jwt

SECRET_KEY = "NeverGonnaGiveYouUp"
ALGORITHM = "HS256"

token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTYiLCJleHAiOjE3MzI2MDUzNzIuNjEzMTkzLCJpYXQiOjE3MzI1MTg5NzIuNjEzMjM4fQ.W5zIEQhLxftkk0cnPkdmXr4ED6oadXbTFrXAdDfV38w"
try:
    decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    print("Decoded payload:", decoded)
except jwt.ExpiredSignatureError:
    print("Token expired")
except jwt.InvalidTokenError as e:
    print("Invalid token:", str(e))