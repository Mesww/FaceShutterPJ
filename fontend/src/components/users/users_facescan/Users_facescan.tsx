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
import { useUserData } from '@/containers/provideruserdata.js';

const FaceScanPage: React.FC<FaceScanPageProps> = ({
  modelPath = '/models/weights',

}) => {
  // State
  const [isScanning, setIsScanning] = useState(false);
  const [isLoadings, setIsLoadings] = useState(true);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [name, setName] = useState<string>('');
  const [employeeId, setEmployeeId] = useState<string>('');
  // const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [loadingmessage, setLoadingMessage] = useState<string | null>(null);
  const [data_received, setData_received] = useState<interfaceResponseFacescanInterface | null>(null);
  // Get the enhanced context
  const { userData, isLoading, refreshUserData } = useUserData();

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  // Check if we can start scanning

    // Validate user data without causing re-renders
    const validateUserData = useCallback(() => {
      if (!userData?.user?.name || !userData?.user?.employee_id) {
        return { 
          valid: false, 
          error: 'User profile is incomplete. Please update your profile.' 
        };
      }
      return { valid: true, error: null };
    }, [userData]);
  


  useEffect(() => {
    if (!isLoading && userData) {
      if (!userData.user?.name || !userData.user?.employee_id) {
        setIsLoadings(false);
        return;
      }
      if (userData.user?.employee_id && userData.user?.name) {
        setEmployeeId(userData.user.employee_id);
        setName(userData.user.name);
      }
      setIsLoadings(false);
    } else {
      setIsLoadings(true);
    }
  }, [isLoading, userData, name, employeeId]);
   // Enhanced camera initialization
   const startCamera = useCallback(async () => {
    if (!videoRef.current) return;
    
    try {
      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      setIsLoadings(true);
      setLoadingMessage('กำลังเปิดกล้อง...');

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      if (!videoRef.current) return;
      
      videoRef.current.srcObject = stream;
      streamRef.current = stream;

      // Wait for video to be ready
      await new Promise<void>((resolve) => {
        if (videoRef.current) {
          videoRef.current.onloadedmetadata = () => resolve();
        }
      });

      await videoRef.current.play();

      // Ensure user data is available before starting face detection
      if (!userData) {
        await refreshUserData();
      }

      const validation = validateUserData();
      if (!validation.valid && validation.error) {
        throw new Error(validation.error);
      }

      detectFace();
      setIsLoadings(false);
      setLoadingMessage(null);

    } catch (err) {
      console.error("Camera initialization error:", err);
      setScanError(err instanceof Error ? err.message : "Failed to access camera");
      setIsScanning(false);
      setIsLoadings(false);
      setLoadingMessage(null);
      stopCamera();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode, userData, refreshUserData, validateUserData]);
   // Clean up resources
   const stopCamera = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);
 // Enhanced face detection
 const detectFace = useCallback(async () => {
  if (!videoRef.current || !canvasRef.current) return;

  const validation = validateUserData();
  if (!validation.valid) {
    stopCamera();
    setScanError(validation.error);
    return;
  }

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
        setScanError("Multiple faces detected. Please ensure only one face is in the frame.");
        stopCamera();
        setIsScanning(false);
      } else if (detections.length === 1) {
        await captureFaceImage();
      }
    } catch (error) {
      console.error('Face detection error:', error);
      setScanError('Face detection failed. Please try again.');
    }
  }, 1000);
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [validateUserData]);

  // Enhanced image capture
  const captureFaceImage = async () => {
    if (!canvasRef.current || !videoRef.current || !userData?.user) return;
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    try {
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;

      ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      const image = await canvasRef.current.toDataURL('image/jpeg');
      
      if (!image) {
        throw new Error('Failed to capture image');
      }

      clearInterval(detectionIntervalRef.current!);
      stopCamera();
      
      setLoadingMessage('กำลังส่งข้อมูล...');
      const data = await sendImageToBackend({ 
        setIsLoading: setIsLoadings, 
        capturedImage: image, 
        name: userData.user.name, 
        employeeId: userData.user.employee_id 
      });
      
      setData_received(data);
      alert(data.message);
      handleClose();
      
    } catch (error) {
      console.error('Image capture error:', error);
      setScanError('Failed to capture and process image. Please try again.');
      alert('Failed to capture and process image. Please try again.');
      handleClose();
    } finally {
      setLoadingMessage(null);
    }
  };

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        setIsLoadings(true);
        setLoadingMessage('กำลังโหลดโมเดล...');
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(modelPath),
          faceapi.nets.faceLandmark68Net.loadFromUri(modelPath),
          faceapi.nets.faceRecognitionNet.loadFromUri(modelPath)
        ]);
        console.log('Face detection models loaded');
        setIsLoadings(false);
        setLoadingMessage(null);
      } catch (error) {
        console.error('Error loading face detection models:', error);
        setIsLoadings(false);
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

  // Start scanning with validation
  const startScanning = useCallback(async () => {
    const validation = validateUserData();
    if (!validation.valid) {
      setScanError(validation.error);
      return;
    }

    try {
      // Refresh user data if it's stale
      const lastRefreshTime = localStorage.getItem('lastUserDataRefresh');
      const REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes

      if (!lastRefreshTime || Date.now() - parseInt(lastRefreshTime) > REFRESH_THRESHOLD) {
        setLoadingMessage('Refreshing user data...');
        await refreshUserData();
        localStorage.setItem('lastUserDataRefresh', Date.now().toString());
      }

      setScanError(null);
      setIsScanning(true);
    } catch (error) {
      setScanError('Failed to start scanning. Please try again.');
      console.error('Scanning error:', error);
    }
  }, [validateUserData, refreshUserData]);


  // Handle camera switch
  const handleSwitchCamera = () => {
    setFacingMode(prev => prev === "user" ? "environment" : "user");
  };

  // Handle close
  const handleClose = () => {
    stopCamera();
    setIsScanning(false);
    // setCapturedImage(null);
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


  useEffect(() => {
    console.log('FaceScan State:', {
      isScanning,
      isLoadings,
      scanError,
      userData: userData?.user,
      isLoading,
      data_received
    });
  }, [isScanning, isLoadings, scanError, userData, isLoading, data_received]);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      {isLoading && (<LoadingSpinner message={loadingmessage} />)}
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
        <Header currentMenuItem={currentMenuItem} name={name} />
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
              {scanError && (
                <div className="text-red-500 mb-4">
                  {scanError}
                </div>
              )}
              <button
                onClick={startScanning}
                disabled={isLoading || isScanning}
                className={`w-full px-4 py-2 ${isLoading || isScanning
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                  } text-white rounded-lg transition-colors flex items-center justify-center gap-2`}
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
                  {isLoadings && (
                    <LoadingSpinner message={loadingmessage} />
                  )}
                  (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover"
                    />
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