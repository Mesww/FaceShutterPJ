import { BACKEND_URL } from "@/configs/backend";
import { interfaceResponseFacescanInterface } from "@/interfaces/response_facescan,interface";

export const sendImageToBackend = async (setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,capturedImage: string | null,name:string,employeeId:string) => {
    if (!capturedImage) {
      alert('Please capture an image first');
      return;
    }
    try {
     setIsLoading(true); 
      // Convert data URL to Blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();

      const formData = new FormData();
      formData.append('image', blob, `${name}_${employeeId}.jpg`);
      formData.append('name', name);
      formData.append('employee_id', employeeId);

      const apiResponse = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        body: formData,
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(errorData.detail || 'Registration failed');
      }

      const data:interfaceResponseFacescanInterface = await apiResponse.json();
      alert('Registration successful!');
      console.log(data);
      setIsLoading(false);
      return data;
    } catch (error) {
      console.error('Error:', error);
      alert(error instanceof Error ? error.message : 'Registration failed');
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };
