import asyncio
from fastapi import WebSocket,WebSocketDisconnect
from puresnmp import Client, PyWrapper, V2C
from puresnmp.exc import Timeout
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

"""
    For testing purposes
"""
# if __name__ == "__main__":
#     target = '172.30.99.11'
#     community = 'mfunet'
#     oid = '1.3.6.1.4.1.9.9.599.1.3.1.1.27'
#     search_term = '6431501102'

#     snmp_data = asyncio.run(find_employee_in_snmp(target, community, oid, search_term))
#     print(f"SNMP Data: {snmp_data}")