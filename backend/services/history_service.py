from datetime import datetime

import pytz

from backend.configs.config import DEFAULT_TIMEZONE
from backend.configs.db import connect_to_mongodb


class History_Service:
    @staticmethod
    async def migrate_to_history():
        timezone = pytz.timezone(DEFAULT_TIMEZONE)
        db= await connect_to_mongodb()
        today_collection = db['checkinouttoday']
        history_collection = db['checkinouthistory']
        today_date = datetime.now(tz=timezone).strftime("%Y-%m-%d")
        records = await today_collection.find().to_list(1000)

        if not records:
            return {"message": "No records to migrate."}

        # Insert all today’s records into history
        for record in records:
            record["created_at"] = datetime.now(tz=timezone)
            record["updated_at"] = record.get("updated_at", datetime.now(tz=timezone))
            await history_collection.insert_one(record)

        # Clear today's collection
        await today_collection.delete_many({})
        return {"message": "Migration complete", "migrated_count": len(records)}

    @staticmethod
    async def get_history_records(start_date: str, end_date: str):
        db= await connect_to_mongodb()
        history_collection = db['checkinouthistory']
        # Query historical records within a date range
        records = await history_collection.find({
            "date": {"$gte": start_date, "$lte": end_date}
        }).to_list(1000)
        return {"data": records}