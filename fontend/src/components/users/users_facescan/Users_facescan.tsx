import { useState, useRef, useEffect, useCallback } from 'react';
import { Scan, Camera, X, FlipHorizontal } from "lucide-react";
import * as faceapi from 'face-api.js';
import LoadingSpinner from '@/components/loading/loading';
import { FaceScanPageProps } from '@/interfaces/users_facescan.interface';
import { sendImageToBackend } from '@/containers/sendImageToBackend';
import { interfaceResponseFacescanInterface } from '@/interfaces/response_facescan.interface';
import Sidebar from '../sidebar/Sidebar';
import Header from '../header/Header.js';
import { Outlet } from 'react-router-dom';

const FaceScanPage: React.FC<FaceScanPageProps> = ({
  modelPath = '/models/weights',
  name = 'test',
  employeeId = '123'
}) => {
  // State
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [loadingmessage, setLoadingMessage] = useState<string | null>(null);
  const [data_recieved, setData_recieved] = useState<interfaceResponseFacescanInterface | null>(null);
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Start camera stream
  const startCamera = useCallback(async () => {
    if (!videoRef.current) return;
    try {
      if (streamRef.current) {
        const tracks = streamRef.current.getTracks();
        tracks.forEach(track => track.stop());
      }

      setIsLoading(true);
      setLoadingMessage('กำลังเปิดกล้อง...');
      const constraints = {
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      // console.log('stream:', stream);
      // console.log('videoRef.current:', videoRef.current); // Video element should now be available
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Wait for video to be ready
        console.log('videoRef.current:', videoRef.current);
        await new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              resolve();
            };
          }
        });

        await videoRef.current.play();
        streamRef.current = stream;

        // Start face detection after video is playing
        detectFace();
      }

      setIsLoading(false);
      setLoadingMessage(null);
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Cannot access camera. Please check camera permissions.");
      setIsScanning(false);
      setIsLoading(false);
      setLoadingMessage(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }

    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Face detection
  const detectFace = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const videoElement = videoRef.current;
    const displaySize = {
      width: videoElement.videoWidth,
      height: videoElement.videoHeight
    };

    if (!displaySize.width || !displaySize.height) {
      console.error("Invalid video dimensions");
      return;
    }

    faceapi.matchDimensions(canvasRef.current, displaySize);

    detectionIntervalRef.current = setInterval(async () => {
      if (!videoRef.current) return;

      try {
        const detections = await faceapi
          .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks();

        if (detections.length > 1) {
          alert("Multiple faces detected. Please ensure only one face is in the frame.");
          stopCamera();
          setIsScanning(false);
        } else if (detections.length === 1) {
          await captureFaceImage();
        }
      } catch (error) {
        console.error('Face detection error:', error);
      }
    }, 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopCamera]);

  // Capture image
  const captureFaceImage = async () => {
    if (!canvasRef.current || !videoRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;

    await ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
    
    try {
      // ! must have  await 
      const image = await canvasRef.current.toDataURL('image/png');
      if (!image) {
        throw new Error('Failed to capture image');
      }
      setCapturedImage(image);

      // console.log('Captured image data:', image);
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }

      stopCamera();
      setLoadingMessage('กำลังส่งข้อมูล...');
      // Send to backend
      const data = await sendImageToBackend({setIsLoading: setIsLoading, capturedImage: image,name: name,employeeId: employeeId});
      setData_recieved(data);
      // alert(data.message);
      console.log(data_recieved);
      // handleClose();
      // setLoadingMessage(null);
    } catch (error) {
      console.error('Error capturing image:', error);
      alert(error);
    }
  };

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        setIsLoading(true);
        setLoadingMessage('กำลังโหลดโมเดล...');
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(modelPath),
          faceapi.nets.faceLandmark68Net.loadFromUri(modelPath),
          faceapi.nets.faceRecognitionNet.loadFromUri(modelPath)
        ]);
        console.log('Face detection models loaded');
        setIsLoading(false);
        setLoadingMessage(null);
      } catch (error) {
        console.error('Error loading face detection models:', error);
        setIsLoading(false);
        setLoadingMessage(null);

      }
    };

    if (isScanning) {
      loadModels().then(() => startCamera());
    }

    return () => {
      stopCamera();
    };
  }, [isScanning, modelPath, startCamera, stopCamera]);


  useEffect(() => {
    if (isScanning) {
      startCamera();
    }
  }, [isScanning, startCamera]);

  // Handle camera switch
  const handleSwitchCamera = () => {
    setFacingMode(prev => prev === "user" ? "environment" : "user");
  };

  // Handle close
  const handleClose = () => {
    stopCamera();
    setIsScanning(false);
    setCapturedImage(null);
  };


  // Map paths to titles and descriptions
  const menuItems = [
    {
      path: "/UsersFacescan",
      title: "สแกนใบหน้า",
      description: "บันทึกเวลาด้วยการสแกนใบหน้า",
    },
    {
      path: "/UsersEditprofile",
      title: "แก้ไขข้อมูลส่วนตัว",
      description: "อัพเดตข้อมูลส่วนตัว เช่น ชื่อ อีเมล",
    },
    {
      path: "/UsersHistory",
      title: "ประวัติการเข้างาน",
      description: "ตรวจสอบประวัติการเข้า-ออกงาน",
    },
    {
      path: "/UsersNotification",
      title: "การแจ้งเตือน",
      description: "รับการแจ้งเตือนเมื่อมีการเปลี่ยนแปลง",
    },
  ];

  const currentMenuItem = menuItems.find((item) => item.path === location.pathname);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">

      {/* Mobile Sidebar */}
      <div className={`md:hidden`}>
        <Sidebar
          isSidebarCollapsed={false}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
        />
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
        />
      </div>

      {/* Main Content */}
      <main className={`flex-1 w-full md:w-auto transition-all duration-300 
        ${isSidebarCollapsed ? 'md:ml-16' : 'md:ml-72'}`}>
        <Header currentMenuItem={currentMenuItem} />

        {/* Main content area with proper margin for sidebar */}
        <div className="w-full p-2 md:p-4 bg-white">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">สแกนใบหน้า</h3>
                <Scan className="text-blue-600" size={24} />
              </div>
              <p className="text-gray-600 mb-4">
                บันทึกเวลาเข้างานด้วยการสแกนใบหน้า
              </p>
              <button
                onClick={() => setIsScanning(true)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Camera size={20} />
                <span>เริ่มสแกน</span>
              </button>
            </div>

            {isScanning && (
              <div className="fixed inset-0 bg-gray-900 z-50">
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 w-12 h-12 flex items-center justify-center bg-black/20 text-white hover:bg-black/40 rounded-full transition-colors z-50"
                >
                  <X size={32} />
                </button>

                <button
                  onClick={handleSwitchCamera}
                  className="absolute top-4 left-4 w-12 h-12 flex items-center justify-center bg-black/20 text-white hover:bg-black/40 rounded-full transition-colors z-50"
                >
                  <FlipHorizontal size={24} />
                </button>

                <div className="relative h-screen">
                  {isLoading && (
                    <LoadingSpinner message={loadingmessage} />
                  )}
                  (
                  <>
                    {capturedImage ? (
                      <img
                        src={capturedImage}
                        alt="Captured face"
                        className="absolute inset-0 w-full h-full object-contain"
                      />
                    ) : (
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    )}
                    <canvas ref={canvasRef} className="hidden" />

                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative w-64 h-64 border-2 border-blue-400 rounded-lg">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Scan size={48} className="text-blue-400 animate-pulse" />
                        </div>
                      </div>
                    </div>
                  </>
                  )
                </div>
              </div>
            )}
          </div>
        </div>
        <Outlet />
      </main>
    </div>
  );
};

export default FaceScanPage;