### BackEnd
==============================================
!!! python 3.10 only !!!

pip freeze > requirements.txt
To generate or Update a requirements.txt 
To install
pip install -r requirements.txt



# Development
    uvicorn backend.main:app --reload
## Window
    uvicorn backend.app:app --reload 
# Production
    gunicorn backend.main:app -w 4 -k uvicorn.workers.UvicornWorker

.env need 
MONGO_URI = database url
DB_NAME = database name

==============================================
