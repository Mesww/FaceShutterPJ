import asyncio
import json
from typing import List
from fastapi import WebSocket,WebSocketDisconnect
from puresnmp import Client, PyWrapper, V2C
from puresnmp.exc import Timeout

from backend.configs.db import connect_to_mongodb
class SnmpService:

    async def finder_snmp(self,host, community, oid, search_term)  -> dict | None:
      try:
        print(f"Finding {search_term} in {oid} on {host} with community {community}")
        
        client = PyWrapper(Client(host, V2C(community)))
        
        async for oid, value in client.walk(oid):
            # Convert value to string and remove b' and ' from the string
            value = str(value).replace('b\'', '').replace('\'', '')
            
            print(f"OID: {oid}, Value: {value}")
            
            # Check if search term is in the value
            if search_term in value:
                print(f"Found {search_term} in OID {oid}: {value}")
                return {'oid': oid, 'value': value}
              
        return None
      except Exception as e:
        print(f"Error: {e}")
        return None

    async def initialize_ap_collection(self) -> bool:
      try:
        print(f"Adding APs")
        db = await connect_to_mongodb()
        ap_collection = db['APs']
        # Check if AP data exists in the collection
        ap_data = await ap_collection.find_one()
        if not ap_data:
          print("No AP data found in the database. Reading from ap.json")
          
          # Read AP data from ap.json
          with open('./APs_data.json', 'r') as file:
            ap_data = json.load(file)
          
          # Insert AP data into the database
          await ap_collection.insert_many(ap_data)
          print("AP data inserted into the database")
          return True
        else:
          print("AP data already exists in the database")
        return False
      except Exception as e:
        print(f"Error: {e}")
        return False

    async def finder_multisnmp(self,host:str, community:str, oids: List[str], search_term:str, defaultIndextype:int = 13) -> dict | None:
      try:
        print(f"Finding {search_term} in {oids} on {host} with community {community}")
        
        client = PyWrapper(Client(host, V2C(community)))
        
        async for oid, value in client.multiwalk(oids):
            # Convert value to string and remove b' and ' from the string
            # value = str(value).replace('b\'', '').replace('\'', '')
            oid = oid.split(".")
            oid = oid[defaultIndextype]
            print(f"OID: {oid}, Value: {value}")
            # Check if search term is in the value
           
        return None
      except Exception as e:
        print(f"Error: {e}")
        return None
"""
    For testing purposes
"""
if __name__ == "__main__":
    target = '172.30.99.11'
    community = 'mfunet'
    oid = ['1.3.6.1.4.1.9.9.599.1.3.1.1.27','1.3.6.1.4.1.9.9.599.1.3.1.1.8']
    search_term = '6431501102'
    snmpService = SnmpService()
    snmp_data = asyncio.run((snmpService.finder_multisnmp(target, community, oid, search_term)))
    print(f"SNMP Data: {snmp_data}")