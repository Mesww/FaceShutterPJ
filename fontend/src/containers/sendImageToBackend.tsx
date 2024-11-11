import { BACKEND_URL } from "@/configs/backend";
import { interfaceResponseFacescanInterface } from "@/interfaces/response_facescan.interface";

// Types
interface SendImageProps {
  setIsLoading: (loading: boolean) => void;
  capturedImage: string | null;
  name: string;
  employeeId: string;
}

interface ApiError {
  detail: string;
  status: number;
}

class ImageUploadError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ImageUploadError';
  }
}

// Utility functions
const createFormData = (
  blob: Blob, 
  name: string, 
  employeeId: string
): FormData => {
  const formData = new FormData();
  formData.append('image', blob, `${name}_${employeeId}.jpg`);
  formData.append('name', name);
  formData.append('employee_id', employeeId);
  return formData;
};

const handleApiResponse = async (response: Response): Promise<interfaceResponseFacescanInterface> => {
  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new ImageUploadError(
      errorData.detail || 'Registration failed',
      response.status
    );
  }
  return response.json();
};

// Main function
export const sendImageToBackend = async ({
  setIsLoading,
  capturedImage,
  name,
  employeeId
}: SendImageProps): Promise<interfaceResponseFacescanInterface> => {
  try {
    // Validate input
    if (!capturedImage) {
      throw new ImageUploadError('Please capture an image first');
    }
    
    console.log(`name, employeeId ${name}, ${employeeId}`);
    if (!name || !employeeId) {
      throw new ImageUploadError('Name and employee ID are required');
    }

    setIsLoading(true);

    // Convert data URL to Blob
    const response = await fetch(capturedImage);
    if (!response.ok) {
      throw new ImageUploadError('Failed to process captured image');
    }

    const blob = await response.blob();
    const formData = createFormData(blob, name, employeeId);

    // Send to backend
    const apiResponse = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: 'POST',
      body: formData,
      headers: {
        // Add any required headers here
        'Accept': 'application/json',
      }
    });
    console.log('apiResponse', apiResponse);
    const data = await handleApiResponse(apiResponse);

    // Show success message
    // console.log('Registration successful:', data);
    return data;

  } catch (error) {
    // Error handling
    let errorMessage = 'An unexpected error occurred';
    
    if (error instanceof ImageUploadError) {
      errorMessage = error.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    console.error('Registration error:', error);
    throw new ImageUploadError(errorMessage);

  } finally {
    setIsLoading(false);
  }
};