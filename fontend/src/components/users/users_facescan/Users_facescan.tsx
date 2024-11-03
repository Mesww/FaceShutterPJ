import { useState, useRef, useEffect } from 'react';
import { Scan, Camera, X, FlipHorizontal } from "lucide-react";
import * as faceapi from 'face-api.js';
import LoadingSpinner from '@/components/loading/loading';
import { FaceScanPageProps } from '@/interfaces/users_facescan.interface';
import { sendImageToBackend } from '@/containers/sendImageToBackend';
const FaceScanPage: React.FC<FaceScanPageProps> = ({ modelPath = '/models/weights' }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedsendImage, setCapturedsendImage] = useState<string | null>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const MODELPATH = modelPath;
  const [name] = useState<string>('test');
  const [employeeId] = useState<string>('123');

  // Load models for face detection
  useEffect(() => {
    const loadModels = async () => {
      setIsLoading(true);
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODELPATH);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODELPATH);
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODELPATH);
      console.log('Models loaded');

      setIsLoading(false);
    };
    if (isScanning) {
      loadModels();
    }
  }, [MODELPATH, isScanning]);

  const detectFace = async () => {
    if (!videoRef.current || !canvasRef.current ) return;
    console.log("Starting face detection...");
    
    const videoElement = videoRef.current;
    const displaySize = {
      width: videoElement.videoWidth,
      height: videoElement.videoHeight
    };
    if (displaySize.width === 0 || displaySize.height === 0) {
      console.error("Video element has no dimensions.");
      return;
    }
    faceapi.matchDimensions(videoRef.current, displaySize);

    detectionIntervalRef.current = setInterval(async () => {
      // console.log('capturedImage:', capturedImage);
      if (capturedImage) {
        // console.log('captured face image:', capturedImage!==null);
        stopCamera()
        // stopDetection(); // Stop further detection
      }
      console.log("Detecting face...");
      const detections = await faceapi.detectAllFaces(videoRef.current!, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks();

      if (detections.length > 1) {
        alert("Multiple faces detected. Please ensure only one face is in the frame.");
        stopCamera();
        // stopDetection();
        setIsScanning(false);
      } else if (detections.length === 1) {
        console.log("Face detected");
        await captureFaceImage(); // Capture face image
        
      }
    }, 100);
  };

  const captureFaceImage = async () => {
    console.log('prepare capturing face image...' );
    if (!canvasRef.current || !videoRef.current) return;
    console.log('capturing face image...');
    const ctx = canvasRef.current.getContext('2d');
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    console.log('capturing face image...2');
    if (!ctx) return;
    console.log('capturing face image...3');
    ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
    // Convert the captured image to Blob
 
    // Capture the canvas image as data URL
    const image = await canvasRef.current.toDataURL('image/png');
    setCapturedImage(image); // Set captured image in state
    if (image) {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
      stopCamera()
      canvasRef.current?.toBlob((blob) => {
        if (blob) {
          setCapturedsendImage(URL.createObjectURL(blob));
        }
      }, 'image/jpeg', 0.8);
      if (capturedsendImage) {
        
        await sendImageToBackend(setIsLoading, capturedsendImage, name, employeeId);
      }
      // stopDetection(); // Stop further detection
      console.log('captured face image:', image !== null);
    }
  };
  
  // const stopDetection = () => {
  //   if (detectionIntervalRef.current) {
  //     clearInterval(detectionIntervalRef.current);
  //     detectionIntervalRef.current = null;
  //   }
  // };
  // Function to start camera
  const startCamera = async () => {
    try {
      setCapturedImage(null); // Clear any previously captured image

      if (streamRef.current) {
        stopCamera();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      // face dectect
      videoRef.current?.addEventListener('play', detectFace);

    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("ไม่สามารถเข้าถึงกล้องได้ กรุณาตรวจสอบการอนุญาตการใช้งานกล้อง");
      setIsScanning(false);
    }
  };

  // Function to stop camera
  const stopCamera = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current); // Clear detection interval
      detectionIntervalRef.current = null;
    }
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach((track: MediaStreamTrack) => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Function to switch camera
  const switchCamera = () => {
    setFacingMode(prevMode => prevMode === "user" ? "environment" : "user");
  };

  // Handle overlay close
  const handleClose = () => {
    console.log('Closing camera...');
    stopCamera();
    setIsScanning(false);
    setCapturedImage(null); // Clear captured image

  };

  useEffect(() => {
    if (isScanning) {
      void startCamera();
    }
    return () => {
      if (streamRef.current) {
        stopCamera();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isScanning, facingMode]); // startCamera is now memoized by dependencies

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        stopCamera();
      }
    };
  }, []);

  const CloseButton = () => (
    <button
      onClick={handleClose}
      className="absolute top-4 right-4 w-12 h-12 flex items-center justify-center bg-black/20 text-white hover:bg-black/40 rounded-full transition-colors pointer-events-auto z-50"
      style={{ touchAction: 'manipulation' }}
      aria-label="ปิดกล้อง"
    >
      <X size={32} />
    </button>
  );

  const SwitchCameraButton = () => (
    <button
      onClick={switchCamera}
      className="absolute top-4 left-4 w-12 h-12 flex items-center justify-center bg-black/20 text-white hover:bg-black/40 rounded-full transition-colors pointer-events-auto z-50"
      style={{ touchAction: 'manipulation' }}
      aria-label="สลับกล้อง"
    >
      <FlipHorizontal size={24} />
    </button>
  );

  const ScanningOverlay = () => (
    <div className="fixed inset-0 bg-gray-900 z-50 pointer-events-auto">
      <CloseButton />
      <SwitchCameraButton />

      {capturedImage ? (
            <img src={capturedImage} alt="Captured face" className="captured-image absolute inset-0 w-full h-full object-cove" />
          ) : (
            <video ref={videoRef} autoPlay playsInline className="video-feed absolute inset-0 w-full h-full object-cover" />
          )}
          <canvas ref={canvasRef} style={{ display: 'none' }} /> {/* Hidden canvas */}

      {/* <video
        ref={videoRef}
        autoPlay
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      /> */}
       {/* <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      width={videoRef.current?.videoWidth || 640}
      height={videoRef.current?.videoHeight || 480}
    /> */}

      <div className="relative h-screen flex flex-col z-10">
        <div className="h-20" />

        <div className="flex-1 flex flex-col items-center px-4">
          <div className="relative w-full max-w-lg max-h-[60vh] aspect-[3/4]">
            <div className="absolute inset-0 border-2 border-white/30 rounded-3xl">
              <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-blue-400 rounded-tl-3xl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-blue-400 rounded-tr-3xl" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-blue-400 rounded-bl-3xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-blue-400 rounded-br-3xl" />
            </div>

            <div className="absolute inset-0 flex items-center justify-center">
              <Scan size={64} className="text-blue-400 animate-pulse" />
            </div>
          </div>

          <div className="text-center text-white space-y-2 mt-4">
            <p className="text-lg font-medium">กรุณาวางใบหน้าให้อยู่ในกรอบ</p>
            <p className="text-sm text-gray-300">ให้แน่ใจว่าใบหน้าของคุณอยู่ในที่ที่มีแสงสว่างเพียงพอ</p>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">สแกนใบหน้า</h3>
            <Scan className="text-blue-600" size={24} />
          </div>
          <p className="text-gray-600 mb-4">บันทึกเวลาเข้างานด้วยการสแกนใบหน้า</p>
          <button
            onClick={() => setIsScanning(true)}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Camera size={20} />
            <span>เริ่มสแกน</span>
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">การสแกนล่าสุด</h3>
          <div className="space-y-2">
            <p className="text-gray-600">วันที่: 2 พฤศจิกายน 2024</p>
            <p className="text-gray-600">เวลา: 09:00 น.</p>
            <p className="text-gray-600">สถานะ: เข้างาน</p>
          </div>
        </div>
      </div>
      {(
        isScanning && (isLoading ? <LoadingSpinner /> : <ScanningOverlay />)
      )
      }
    </div>
  );
};

export default FaceScanPage;