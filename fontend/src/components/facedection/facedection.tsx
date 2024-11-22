import { h1 } from 'framer-motion/client';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from "react-webcam";

interface UserDetails {
  employee_id: string;
  name: string;
  email: string;
  password: string;
}

const CameraCapture: React.FC = () => {
  const [websocket, setWebSocket] = useState<WebSocket | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails>({
    employee_id: "",
    name: "",
    email: "",
    password: "",
  });
  const [scanning, setScanning] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [imageSrc, setImageSrc] = useState<string | null>(null);  // State to hold the image
  const [scanDirections, setScanDirections] = useState<string[]>([]);
  const webcamRef = useRef<Webcam>(null);
  const [currentDirectionIdx, setCurrentDirectionIdx] = useState(0);

  const sendImage = useCallback((ws: WebSocket) => {
    if (!webcamRef.current || !ws || ws.readyState !== WebSocket.OPEN) return null;

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return null;

    try {
      // Convert base64 to binary
      const byteCharacters = atob(imageSrc.split(",")[1]);
      const byteNumbers = Array.from(byteCharacters).map((char) => char.charCodeAt(0));
      const byteArray = new Uint8Array(byteNumbers);
      ws.send(
        JSON.stringify({
          image: Array.from(byteArray), // Send as an array
        })
      );
    } catch (error) {
      console.error("Error sending image:", error);
      setConnectionStatus('disconnected');
    }

    return imageSrc;
  }, []);

  const handleWebSocketMessage = useCallback((event: MessageEvent) => {
    try {
      const message = event.data;
      if (message.startsWith("{")) {
        const jsonData = JSON.parse(message);
        console.log("Received JSON data:", jsonData);
        // Handle the JSON data here
        if(jsonData['scan_directions']){
          setScanDirections(jsonData['scan_directions']);
        }
      }
        // Check if the message looks like base64 image data
    if (message.startsWith("/9j/") || message.includes("base64,")) {
      console.log("Received image data");
      let base64Image;
      
      // If the message already includes the data URI prefix, use it directly
      if (message.startsWith("data:image/jpeg;base64,")) {
        base64Image = message;
      } else {
        // Otherwise, create the data URI
        base64Image = `data:image/jpeg;base64,${message}`;
      }
      
      setImageSrc(base64Image);
      return;
    }
      if (message.startsWith("Please move your head to:")) {
        setInstruction(message.replace("Please move your head to: ", ""));
        setConnectionStatus('connected');
      }
      else if (message.startsWith("Image captured for")) {
        setCurrentDirectionIdx((prev) => prev + 1);
      }
      else if (message.startsWith("Incorrect direction!") || 
               message.startsWith("No face detected")) {
        console.log(message);
       
      }
      else if (message.startsWith("User data and images saved successfully")) {
        alert("Scan complete and data saved!");
        setScanning(false);
        setInstruction("");
        setConnectionStatus('disconnected');
      } 
      else if (message.startsWith("image_data:")) {
        const imageData = message.replace("image_data:", "");
        console.log("Received base64 image data:", imageData); // Check the image data in the console
  
        const base64Image = `data:image/jpeg;base64,${imageData}`;
        setImageSrc(base64Image);
      }
      else {
        console.log("Received message:", message);
      }
    } catch (error) {
      console.error("Error processing WebSocket message:", error);
    }
  }, [setImageSrc]);

  useEffect(() => {
    let imageInterval: NodeJS.Timeout;

    if (scanning) {
      const ws = new WebSocket("ws://localhost:8000/ws/scan");
      setWebSocket(ws);
      setConnectionStatus('connecting');

      ws.onopen = () => {
        setConnectionStatus('connected');
        ws.send(JSON.stringify(userDetails));

        imageInterval = setInterval(() => {
          sendImage(ws);
        }, 1000); 
      };

      ws.onmessage = handleWebSocketMessage;

      ws.onclose = (event) => {
        if (imageInterval) clearInterval(imageInterval);
        setWebSocket(null);
        setConnectionStatus('disconnected');
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        if (imageInterval) clearInterval(imageInterval);
        setConnectionStatus('disconnected');
      };

      return () => {
        if (imageInterval) clearInterval(imageInterval);
        ws.close();
      };
    }
  }, [scanning, userDetails, sendImage, handleWebSocketMessage]);

  const handleStartScan = () => {
    setScanning(true);
    setCurrentDirectionIdx(0);
  };

  const handleInputChange = (field: keyof UserDetails, value: string) => {
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[field];
        return newErrors;
      });
    }

    setUserDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-md rounded-lg">
      <h1 className="text-2xl font-bold mb-6 text-center">3D Face Scan</h1>
      {!scanning ? (
        <div className="space-y-4">
          <div>
            <label className="block mb-1">Employee ID:</label>
            <input
              type="text"
              value={userDetails.employee_id}
              onChange={(e) => handleInputChange('employee_id', e.target.value)}
              className={`w-full p-2 border rounded ${errors.employee_id ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.employee_id && <p className="text-red-500 text-sm mt-1">{errors.employee_id}</p>}
          </div>
          <div>
            <label className="block mb-1">Name:</label>
            <input
              type="text"
              value={userDetails.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full p-2 border rounded ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block mb-1">Email:</label>
            <input
              type="email"
              value={userDetails.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`w-full p-2 border rounded ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>
          <div>
            <label className="block mb-1">Password:</label>
            <input
              type="password"
              value={userDetails.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className={`w-full p-2 border rounded ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>
          <button 
            onClick={handleStartScan}
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition duration-300"
          >
            Start Scanning
          </button>
        </div>
      ) : (
        (scanDirections.length === 0 ? <h1>No scan directions</h1> :
        <div>
          <h2 className="text-xl mb-4 font-semibold text-center">
            Current Direction: {instruction || scanDirections[currentDirectionIdx]}
          </h2>
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            width={640}
            height={480}
            className="mx-auto mb-4 border-2 border-gray-300 rounded"
          />
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Progress: {currentDirectionIdx + 1} / {scanDirections.length}
            </p>
            <p className={`text-xs mt-2 ${
              connectionStatus === 'connected' 
                ? 'text-green-600' 
                : connectionStatus === 'connecting'
                ? 'text-yellow-600'
                : 'text-red-600'
            }`}>
              {connectionStatus === 'connected' 
                ? 'Connected and capturing images' 
                : connectionStatus === 'connecting'
                ? 'Connecting...'
                : 'Disconnected. Attempting to reconnect...'}
            </p>
          </div>
          {imageSrc ? <img src={imageSrc} alt="Captured" className="mx-auto mt-4 border rounded" />:<h1>No image</h1>}
        </div>)
      )}
    </div>
  );
};

export default CameraCapture;
