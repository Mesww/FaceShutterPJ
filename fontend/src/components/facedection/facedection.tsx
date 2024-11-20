import React, { useRef, useState, useEffect } from 'react';

interface FaceScanStatus {
  status: 'initializing' | 'connected' | 'scanning' | 'complete' | 'error' | 'disconnected';
  message?: string;
}

const CameraCapture = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [name, setName] = useState<string>('');
  const [employeeId, setEmployeeId] = useState<string>('');
  const [scanStatus, setScanStatus] = useState<FaceScanStatus>({ status: 'initializing' });
  const [currentInstruction, setCurrentInstruction] = useState<string>('');
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isVideoReady, setIsVideoReady] = useState<boolean>(false);
  const pendingInstructionRef = useRef<string | null>(null);
  const [isVideoVisible, setIsVideoVisible] = useState(false);
  const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const WS_URL = VITE_BACKEND_URL.replace('http', 'ws');

  useEffect(() => {
    return () => {
      cleanupResources();
    };
  }, []);

  const cleanupResources = () => {
    console.log('Cleaning up resources...');
    if (wsRef.current) {
      wsRef.current.close();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsVideoReady(false);
    setIsVideoVisible(false);
    pendingInstructionRef.current = null;
    setScanStatus({status: 'initializing'});
  };

  const initializeVideoElement = () => {
    return new Promise<void>((resolve) => {
      setIsVideoVisible(true);
      // Wait for next render cycle when video element will be in DOM
      setTimeout(() => {
        if (videoRef.current) {
          console.log('Video element initialized');
          resolve();
        } else {
          console.error('Failed to initialize video element');
          setScanStatus({
            status: 'error',
            message: 'Failed to initialize video element'
          });
          resolve();
        }
      }, 100);
    });
  };

  const startCamera = async () => {
    console.log('Starting camera initialization...');
    
    // First ensure video element is in DOM
    await initializeVideoElement();
    
    if (!videoRef.current) {
      console.error('Video element still not available after initialization');
      setScanStatus({
        status: 'error',
        message: 'Failed to initialize video element'
      });
      return false;
    }

    try {
      // Stop any existing streams
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      console.log('Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      streamRef.current = stream;
      videoRef.current.srcObject = stream;

      return new Promise<boolean>((resolve) => {
        if (!videoRef.current) {
          resolve(false);
          return;
        }

         videoRef.current.onloadedmetadata = async () => {
          console.log('Video metadata loaded');
          try {
            await videoRef.current?.play();
            console.log('Video playback started');
             setIsVideoReady(true);
             console.log('Video ready state:', isVideoReady);
             resolve(true);
            
          } catch (error) {
            console.error('Error playing video:', error);
            setScanStatus({
              status: 'error',
              message: 'Failed to start video playback'
            });
            resolve(false);
          }
        };

        videoRef.current.onerror = () => {
          console.error('Video element error occurred');
          setScanStatus({
            status: 'error',
            message: 'Video initialization error'
          });
          resolve(false);
        };
      });

    } catch (error) {
      console.error('Error accessing camera:', error);
      setScanStatus({
        status: 'error',
        message: 'Failed to access camera. Please ensure camera permissions are granted.'
      });
      return false;
    }
  };

  const startFaceScan = async () => {
    if (!name || !employeeId) {
      alert('Please enter both name and employee ID');
      return;
    }

    wsRef.current = new WebSocket(`${WS_URL}/ws/face-scan/${employeeId}`);
    
    wsRef.current.onopen = () => {
      console.log('WebSocket connected, initializing video...');
      setScanStatus({ status: 'connected' });
      startCamera().then(success => {
        console.log('Camera initialization result:', success);
      });
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setScanStatus({ status: 'error', message: 'Connection error occurred' });
      cleanupResources();
    };

    wsRef.current.onclose = () => {
      console.log('WebSocket disconnected');
      setScanStatus({ status: 'disconnected' });
      cleanupResources();
    };
  };

  const handleWebSocketMessage = async (data: any) => {
    console.log('Received WebSocket message:', data.type);
    
    switch (data.type) {
      case 'instruction':
        console.log('Instruction received:', data.direction);
        setCurrentInstruction(data.direction);
        
        if (!isVideoReady) {
          console.log('Video not ready, starting camera...');
          pendingInstructionRef.current = data.direction;
          await startCamera();
          captureAndSendFrame();

        } else {
          console.log('Video ready, capturing frame...');
          captureAndSendFrame();
        }
        break;

      case 'result':
        if (data.status === 200) {
          setProcessedImage(`data:image/jpeg;base64,${data.data.frame}`);
          setScanStatus({ status: 'scanning', message: data.message });
        } else {
          setScanStatus({ status: 'error', message: data.message });
        }
        break;

      case 'complete':
        console.log('Face scanning complete');
        setScanStatus({ status: 'complete', message: 'Face scanning complete!' });
        // cleanupResources();

        break;

      case 'error':
        setScanStatus({ status: 'error', message: data.message });
        break;
    }
  };

  const captureAndSendFrame = () => {
    console.log('Attempting to capture and send frame...');
    console.log('Video ready state:', isVideoReady);
    console.log('Video ref exists:', !!videoRef.current);
    console.log('Canvas ref exists:', !!canvasRef.current);
    console.log('WebSocket ready state:', wsRef.current?.readyState);

    if (!videoRef.current || !canvasRef.current || !wsRef.current) {
      console.error('Required resources not ready');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.error('Video dimensions not available');
      return;
    }

    try {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext('2d');
      if (!context) {
        console.error('Could not get canvas context');
        return;
      }

      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const frame = canvas.toDataURL('image/jpeg', 0.8);

      wsRef.current.send(JSON.stringify({
        type: 'frame',
        frame: frame,
        name: name,
        employee_id: employeeId
      }));
      
      console.log('Frame captured and sent successfully');
    } catch (error) {
      console.error('Error capturing or sending frame:', error);
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
            onChange={(e) => setName(e.target.value)}
            disabled={scanStatus.status === 'scanning'}
          />
          <input 
            className="w-full p-2 border-2 rounded-lg"
            type="text"
            placeholder="Employee ID"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            disabled={scanStatus.status === 'scanning'}
          />
        </div>

        {scanStatus.status === 'initializing' && (
          <button
            onClick={startFaceScan}
            className="w-full bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600"
          >
            Start Face Scan
          </button>
        )}

        {isVideoVisible && (
          <div className="space-y-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <p className="text-center font-medium">{currentInstruction}</p>
            </div>

            <div className="relative">
              <video 
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full border rounded-lg"
              />
              {processedImage && (
                <div className="absolute top-0 right-0 w-1/3 p-1">
                  <img 
                    src={processedImage}
                    alt="Processed"
                    className="w-full border rounded-lg"
                  />
                </div>
              )}
            </div>

            <div className="bg-gray-100 p-3 rounded-lg">
              <p className="text-center">
                Status: {scanStatus.status}
                {scanStatus.message && ` - ${scanStatus.message}`}
              </p>
            </div>
          </div>
        )}

        {scanStatus.status === 'complete' && (
          <div className="bg-green-100 p-3 rounded-lg">
            <p className="text-center font-medium">Face scanning completed successfully!</p>
            <button
              onClick={() => {
                cleanupResources();
                setScanStatus({ status: 'initializing' });
                setProcessedImage(null);
              }}
              className="w-full mt-2 bg-green-500 text-white p-2 rounded-lg hover:bg-green-600"
            >
              Start New Scan
            </button>
          </div>
        )}

        {scanStatus.status === 'error' && (
          <div className="bg-red-100 p-3 rounded-lg">
            <p className="text-center text-red-600">{scanStatus.message}</p>
            <button
              onClick={() => {
                cleanupResources();
                setScanStatus({ status: 'initializing' });
              }}
              className="w-full mt-2 bg-red-500 text-white p-2 rounded-lg hover:bg-red-600"
            >
              Try Again
            </button>
          </div>
        )}

        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  );
};

export default CameraCapture;