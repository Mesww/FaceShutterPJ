pip freeze > requirements.txt
To generate or Update a requirements.txt 
To install
pip install -r requirements.txt

# Development
uvicorn backend.main:app --reload

# Production
gunicorn backend.main:app -w 4 -k uvicorn.workers.UvicornWorker

.env need 
COMMUNITY = for get data from router 
HOST = ip router
MONGO_URI = database url
DB_NAME = database name