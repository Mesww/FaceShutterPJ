from datetime import datetime
from backend.configs.db import connect_to_mongodb
from backend.models.returnformat import Returnformat
from backend.models.user_model import Faceimage, RoleEnum, User, Userupdate
from fastapi import HTTPException
from bson import ObjectId

from backend.utils.image_utills import Image_utills  # Import ObjectId from BSON (MongoDB)

class UserService:
    
    @staticmethod
    async def get_user_by_employee_id(employee_id: str) -> Returnformat:
        try:
            db = await connect_to_mongodb()  # Establish database connection
            collection = db["users"]
            print(employee_id)
            
            # Correct way: "employee_id" should be the field name
            query = {"employee_id": str(employee_id)}
            user = await collection.find_one(filter=query)
            print(F"Found {user}")
            
            if not user:
                return Returnformat(400, "User not found", None)
                
            # Return success response with user data
            return Returnformat(200, "User fetched successfully", user)
        
        except Exception as e:
            return Returnformat(400, str(e), None)
    @staticmethod
    async def get_is_user_by_employee_id(employee_id: str) -> Returnformat:
        try:
            db = await connect_to_mongodb()  # Establish database connection
            collection = db["users"]
            print(employee_id)
            
            # Correct way: "employee_id" should be the field name
            query = {"employee_id": str(employee_id)}
            user = await collection.find_one(filter=query)
            print(F"Found {user}")
            
            if not user:
                return Returnformat(400, "User not found", False)
                
            # Return success response with user data
            return Returnformat(200, "User fetched successfully", True)
        
        except Exception as e:
            return Returnformat(400, str(e), None)
    
    @staticmethod
    async def register_user(request: User) -> Returnformat:
        try:
            db = connect_to_mongodb()  # Establish database connection
            collection = db["users"]
            
            # Check if user already exists by employee_id
            old_user = collection.find_one({"employee_id": request.employee_id})
            if old_user:
                return Returnformat(400, "User already exists", None)
            
            # Prepare user data for insertion
            user_data = request.model_dump()  # Pydantic models use dict() instead of model_dump()
            user_data["roles"] = request.roles.value  # Convert Enum to string
            
            # Insert the new user into the database
            new_user = collection.insert_one(user_data)
            
            # Fetch the inserted document (optional but useful)
            inserted_user = collection.find_one({"_id": new_user.inserted_id})
            
            # Convert ObjectId to string for serialization
            inserted_user["_id"] = str(inserted_user["_id"])
            
            # Return success response with user data
            return Returnformat(200, "User registered successfully", inserted_user)
        
        except Exception as e:
            return Returnformat(400, str(e), None)
    @staticmethod
    async def update_user_by_employee_id(employee_id: str, request: Userupdate) -> Returnformat:
        try:
            db = connect_to_mongodb()  # Establish database connection
            collection = db["users"]
            
            # Prepare user data for update
            user_data = request.model_dump()  # Pydantic models use dict() instead of model_dump()
            user_data["roles"] = request.roles.value  # Convert Enum to string  
            # Update the user in the database
            updated_user = collection.update_one(
                {"employee_id": employee_id},
                {"$set": user_data}
            )
            
            # Check if the user was updated successfully
            if updated_user.modified_count == 0:
                return Returnformat(400, "User not found", None)
            
            # Fetch the updated document (optional but useful)
            updated_user = collection.find_one({"employee_id": employee_id})
            
            # Convert ObjectId to string for serialization
            updated_user["_id"] = str(updated_user["_id"])
            
            # Return success response with updated user data
            return Returnformat(200, "User updated successfully", updated_user)
        except Exception as e:
            return Returnformat(400, str(e), None)
    @staticmethod
    async def create_user_image_by_employee_id(request: User) -> Returnformat:
        try:
            db = await connect_to_mongodb()  # Establish database connection
            collection = db["users"]
            
            # Prepare user data for update
            user_data = request.model_dump()  # Pydantic models use dict() instead of model_dump()
            user_data["roles"] = request.roles.value  # Convert Enum to string  
            
            new_user = await collection.insert_one(user_data)
            
            
            # Fetch the updated document (optional but useful)
            new_user = await collection.find_one({"_id": new_user.inserted_id})
            
            # Convert ObjectId to string for serialization
            new_user["_id"] = str(new_user["_id"])
            
            # Return success response with updated user data
            return Returnformat(200, "User updated successfully", new_user)
        except Exception as e:
            return Returnformat(400, str(e), None)
    @staticmethod
    async def update_user_image_by_employee_id(employee_id: str, request: Faceimage) -> Returnformat:
        try:
            db = await connect_to_mongodb()
            collection = db["users"]
            
            faceimage_data = request.model_dump()

            # Find the user and their existing face images
            user = await collection.find_one({"employee_id": employee_id})
            if not user:
                return Returnformat(400, "User not found", None)

            existing_faceimages = user.get("faceimage", [])
            
            # Check if an image with the same scan_direction already exists
            for existing_image in existing_faceimages:
                if existing_image["scan_direction"] == faceimage_data["scan_direction"]:
                    # Update the existing face image instead of adding a new one
                    updated_user = await collection.update_one(
                        {
                            "employee_id": employee_id,
                            "faceimage.scan_direction": faceimage_data["scan_direction"]
                        },
                        {
                            "$set": {
                                "faceimage.$": [faceimage_data]
                            }
                        }
                    )
                    
                    if updated_user.modified_count == 0:
                        return Returnformat(400, "Failed to update face image", None)
                    
                    updated_user = await collection.find_one({"employee_id": employee_id})
                    updated_user["_id"] = str(updated_user["_id"])
                    
                    return Returnformat(200, "Face image updated successfully", updated_user)

            # If no existing image with the same scan_direction, add the new one
            updated_user = await collection.update_one(
                {"employee_id": employee_id},
                {"$push": {"faceimage": faceimage_data}}
            )
            
            if updated_user.modified_count == 0:
                return Returnformat(400, "Failed to add face image", None)
            
            updated_user = await collection.find_one({"employee_id": employee_id})
            updated_user["_id"] = str(updated_user["_id"])
            
            return Returnformat(200, "Face image added successfully", updated_user)
            
        except Exception as e:
            return Returnformat(400, str(e), None)
    
    # @staticmethod
    # async def authorregis(employee_id: str, request: User) -> Returnformat:
    #     try:
    #         db = await connect_to_mongodb()  # Establish database connection
    #         collection = db["users"]
            
    #         # Prepare user data for update
    #         user_data = request.model_dump()  # Pydantic models use dict() instead of model_dump()
    #         user_data["roles"] = request.roles.value  # Convert Enum to string  
            
    #         new_user = await collection.insert_one(user_data)
            
            
    #         # Fetch the updated document (optional but useful)
    #         new_user = await collection.find_one({"_id": new_user.inserted_id})
            
    #         # Convert ObjectId to string for serialization
    #         new_user["_id"] = str(new_user["_id"])
            
    #         # Return success response with updated user data
    #         return Returnformat(200, "User updated successfully", new_user)
    #     except Exception as e:
    #         return Returnformat(400, str(e), None)
    
    # Save user data and images to the server
    @staticmethod
    async def save_user_and_images(employee_id, name, email, password, images,tel):
        try:
            image_utills = Image_utills()
            db = await connect_to_mongodb()  # Establish database connection
            collection = db["users"]
            # Save images to disk
            saved_image_paths = []
            for img_data in images['images']:
                direction = img_data["direction"]
                frame = img_data["frame"]
                feature = img_data["feature"]
                # Generate a unique filename for each image
                filepath =image_utills.save_image(image=frame, filename=f"{name}_{direction.replace(' ', '_').lower()}.jpg")

                # Append the path to the list
                saved_image_paths.append({"path": filepath, "direction": direction,"feature":feature})

                
            
            # Save user data to MongoDB
            user = User(
                employee_id= employee_id,
                name= name,
                email= email,
                password= password,
                tel= tel,
                images= saved_image_paths,
                roles= RoleEnum.USER,
                created_at= datetime.now(),
                
                updated_at= None
            )
            user = user.model_dump()
            user["roles"] = user["roles"].value
            result = await collection.insert_one(user)
            return str(result.inserted_id)
        except Exception as e:
            
            raise HTTPException(status_code=400, detail=str(e))