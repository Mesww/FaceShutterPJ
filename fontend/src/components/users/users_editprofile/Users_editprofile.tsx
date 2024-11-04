import { useState, useRef, useEffect } from 'react';
import { Camera, Scan, X, FlipHorizontal, UserCircle } from "lucide-react";

const EditProfilePage = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [facingMode, setFacingMode] = useState("user");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

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

  const stopCamera = () => {
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const switchCamera = () => {
    setFacingMode(prevMode => prevMode === "user" ? "environment" : "user");
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg');
        setProfileImage(imageData);
        handleClose();
      }
    }
  };

  const handleClose = () => {
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
  }, [isScanning, facingMode]);

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
          <button 
            onClick={capturePhoto}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Camera size={24} />
            <span>ถ่ายภาพ</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full mx-auto">
      <div className="p-4 md:p-6 bg-white rounded-lg shadow">
        <div className="mb-6 md:mb-8">
          <h3 className="text-xl md:text-2xl font-semibold mb-2">แก้ไขข้อมูลส่วนตัว</h3>
          <p className="text-gray-600">อัพเดตข้อมูลและรูปโปรไฟล์ของคุณ</p>
        </div>

        <div className="mb-6 flex flex-col items-center">
          <div className="relative mb-4">
            {profileImage ? (
              <img 
                src={profileImage} 
                alt="Profile" 
                className="w-32 h-32 rounded-full object-cover"
              />
            ) : (
              <UserCircle size={128} className="text-gray-400" />
            )}
            <button
              onClick={() => setIsScanning(true)}
              className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors"
            >
              <Camera size={20} />
            </button>
          </div>
          <p className="text-sm text-gray-600">คลิกที่ไอคอนกล้องเพื่อถ่ายภาพโปรไฟล์</p>
        </div>
       
        <form className="space-y-4 md:space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ชื่อ-นามสกุล
            </label>
            <input
              type="text"
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              defaultValue="Robert Johnson"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              อีเมล
            </label>
            <input
              type="email"
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              defaultValue="robert@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              เบอร์โทรศัพท์
            </label>
            <input
              type="tel"
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              defaultValue="0812345678"
            />
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            บันทึกข้อมูล
          </button>
        </form>
      </div>

      {isScanning && <ScanningOverlay />}
    </div>
  );
};
 
export default EditProfilePage;