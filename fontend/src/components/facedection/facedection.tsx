import React, { useRef, useState } from 'react';



const CameraCapture  = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const [name, setName] = useState<string>('');
  // const [email, setEmail] = useState<string>('');
  const [employeeId, setEmployeeId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Failed to access camera. Please ensure camera permissions are granted.');
    }
  };

  const captureImage = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (canvas && video && video.videoWidth && video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (!context) return;
      
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          setCapturedImage(URL.createObjectURL(blob));
        }
      }, 'image/jpeg', 0.8);
    }
  };

  

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };
  // const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   setEmail(event.target.value);
  // };

  const handleEmployeeIdChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEmployeeId(event.target.value);
  };

  const sendImageToBackend = async () => {
    if (!capturedImage) {
      alert('Please capture an image first');
      return;
    }
    if (!name || !employeeId) {
      alert('Please enter both name and employee ID');
      return;
    }

    setIsLoading(true);
    try {
      // Convert data URL to Blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();

      const formData = new FormData();
      formData.append('image', blob, `${name}_${employeeId}.jpg`);
      formData.append('name', name);
      formData.append('employee_id', employeeId);
      // formData.append('email', email);
      const apiResponse = await fetch(`${VITE_BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        body: formData,
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(errorData.detail || 'Registration failed');
      }

      const data = await apiResponse.json();
      alert('Registration successful!');
      console.log(data);

      // Reset form
      setName('');
      setEmployeeId('');
      // setEmail('');
      setCapturedImage(null);

    } catch (error) {
      console.error('Error:', error);
      alert(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="space-y-4">
        <div className="space-y-2">
          <input 
            className="w-full p-2 border-2 rounded-lg"
            type="text"
            placeholder="Name"
            value={name}
            onChange={handleNameChange}
          />
          <input 
            className="w-full p-2 border-2 rounded-lg"
            type="text"
            placeholder="Employee ID"
            value={employeeId}
            onChange={handleEmployeeIdChange}
          />
          {/* <input 
            className="w-full p-2 border-2 rounded-lg"
            type="email"
            placeholder="Email"
            value={email}
            onChange={handleEmailChange}
          /> */}
        </div>

        <div className="space-y-2">
          <video 
            ref={videoRef}
            autoPlay
            className="w-full border rounded-lg"
          />
          <div className="flex space-x-2">
            <button
              onClick={startCamera}
              className="flex-1 bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600"
            >
              Start Camera
            </button>
            <button
              onClick={captureImage}
              className="flex-1 bg-green-500 text-white p-2 rounded-lg hover:bg-green-600"
            >
              Capture Image
            </button>
          </div>
        </div>

        {capturedImage && (
          <div className="space-y-2">
            <img 
              src={capturedImage}
              alt="Captured"
              className="w-full border rounded-lg"
            />
            <button
              onClick={sendImageToBackend}
              disabled={isLoading}
              className="w-full bg-purple-500 text-white p-2 rounded-lg hover:bg-purple-600 disabled:bg-gray-400"
            >
              {isLoading ? 'Sending...' : 'Send to Backend'}
            </button>
          </div>
        )}

        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  );
};

export default CameraCapture;