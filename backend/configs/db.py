from pathlib import Path
from dotenv import dotenv_values, load_dotenv
from pymongo import MongoClient,database,AsyncMongoClient


pathenv = Path('./.env')
load_dotenv(dotenv_path=pathenv)
config = dotenv_values()
MONGOURL = config.get('MONGOURL', "mongodb://localhost:27017/")
async def connect_to_mongodb() -> database.Database:
    # Replace the connection string with your own MongoDB connection string
    try:
        # Create a MongoClient object
        client =  AsyncMongoClient(MONGOURL)
        
        # Access the database
        db = client["face_data"]
        
        # Return the database object
        return db
    
    except Exception as e:
        print("Error connecting to MongoDB:", str(e))
        return None