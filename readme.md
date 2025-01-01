### BackEnd
==============================================
!!! python 3.10 only !!!

pip freeze > requirements.txt
To generate or Update a requirements.txt 
To install
pip install -r requirements.txt



# Development
    uvicorn backend.app:app --reload 
# Production
    gunicorn backend.app:app -w 4 -k uvicorn.workers.UvicornWorker

.env need 
MONGOURL = mongodb://root:1234@faceshuttermongo:27017/
SECRET_KEY = NeverGonnaGiveYouUp
ALGORITHM = HS256
FRONTEND_URL = http://localhost:8080/
SNMP_HOST 
SNMP_COMMUNITY

==============================================
