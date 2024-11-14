import time
from puresnmp import V2C, Client, PyWrapper
import asyncio

# Initialize a global cache dictionary to store processed student IDs
student_cache = {}

async def snmp_walk_and_find(host, community, oid, target_id):
    client = PyWrapper(Client(host, V2C(community)))
    start_time = time.time()  # Record the start time
    
    # Check if the target_id is already in the cache
    if target_id in student_cache:
        print(f'Found student ID in cache: {target_id}')
        print(f'Time taken with cache: {time.time() - start_time:.2f} seconds')
        return target_id

    # Walk through SNMP data and build the cache if target_id is not found
    async for oid, value in client.walk(oid):
        student_id = str(value).strip("b'")  # Convert the value to a string
        
        if student_id:
            print(f'Checking student ID: {student_id}')
            # Add the student ID to the cache for future lookups
            student_cache[student_id] = True
            
            # Check if this is the target ID
            if student_id == target_id:
                end_time = time.time()
                print(f'Found student ID: {student_id}')
                print(f'Time taken for walk: {end_time - start_time:.2f} seconds')
                return student_id
            
    end_time = time.time()  # Record the end time if target ID is not found
    print('Student ID not found in this walk.')
    print(f'Time taken for walk: {end_time - start_time:.2f} seconds')
    return None

async def main():
    host = '172.30.99.11'
    community = 'mfunet'
    oid = '1.3.6.1.4.1.9.9.599.1.3.1.1.27'  # Use the correct OID from your context
    target_id = ' 6432101018'
    found_id = await snmp_walk_and_find(host, community, oid, target_id)
    
    if found_id:
        print('Found student ID:', found_id)
    else:
        print('Student ID not found.')

# Run the async main function
asyncio.run(main())
