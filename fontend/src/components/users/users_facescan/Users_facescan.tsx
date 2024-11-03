import { useState, useRef, useEffect } from 'react';
import { Scan, Camera, X, FlipHorizontal } from "lucide-react";

const FaceScanPage = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Function to start camera
  const startCamera = async () => {
    try {
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
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("ไม่สามารถเข้าถึงกล้องได้ กรุณาตรวจสอบการอนุญาตการใช้งานกล้อง");
      setIsScanning(false);
    }
  };

  // Function to stop camera
  const stopCamera = () => {
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

      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />

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

      {isScanning && <ScanningOverlay />}
    </div>
  );
};

export default FaceScanPage;