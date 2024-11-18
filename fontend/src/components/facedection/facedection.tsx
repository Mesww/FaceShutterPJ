import React, { useRef, useState, useEffect } from 'react';

// Define types for Fullscreen API
interface FullscreenElement extends Element {
  webkitRequestFullscreen?: () => Promise<void>;
}

interface FullscreenDocument extends Document {
  webkitExitFullscreen?: () => Promise<void>;
  webkitFullscreenElement?: Element | null;
}

const CameraCapture = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const [name, setName] = useState<string>('');
  const [employeeId, setEmployeeId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [scanningStage, setScanningStage] = useState<'idle' | 'prepare-front' | 'front' | 'prepare-left' | 'left' | 'prepare-right' | 'right' | 'prepare-up' | 'up' | 'prepare-down' | 'down'>('idle');
  const [instructions, setInstructions] = useState<string>('กดปุ่ม "เริ่มสแกน" เพื่อเริ่มต้น');
  const [countdown, setCountdown] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const enterFullscreen = async () => {
    const container = containerRef.current as FullscreenElement;
    if (container) {
      try {
        if (container.requestFullscreen) {
          await container.requestFullscreen();
        } else if (container.webkitRequestFullscreen) {
          await container.webkitRequestFullscreen();
        }
        setIsFullscreen(true);
      } catch (error) {
        console.error('Error entering fullscreen:', error);
      }
    }
  };

  const exitFullscreen = async () => {
    const doc = document as FullscreenDocument;
    try {
      if (doc.fullscreenElement) {
        await doc.exitFullscreen();
      } else if (doc.webkitExitFullscreen) {
        await doc.webkitExitFullscreen();
      }
      setIsFullscreen(false);
      // Unlock screen orientation if supported
      if ('orientation' in screen && 'unlock' in screen.orientation) {
        screen.orientation.unlock();
      }
    } catch (error) {
      console.error('Error exiting fullscreen:', error);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('ไม่สามารถเข้าถึงกล้องได้ กรุณาตรวจสอบการอนุญาตการใช้งานกล้อง');
    }
  };

  const stopCamera = async () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
    setScanningStage('idle');
    setInstructions('กดปุ่ม "เริ่มสแกน" เพื่อเริ่มต้น');
    setCountdown(0);
    await exitFullscreen();
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
          const imageUrl = URL.createObjectURL(blob);
          setCapturedImages(prev => [...prev, imageUrl]);
        }
      }, 'image/jpeg', 0.8);
    }
  };

  const startScanning = async () => {
    setCapturedImages([]);
    setScanningStage('prepare-front');
    setInstructions('เตรียมตัว: กรุณามองตรงที่กล้อง');
    setCountdown(5);
    await startCamera();
    await enterFullscreen();
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (countdown > 0) {
      timeoutId = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      switch (scanningStage) {
        case 'prepare-front':
          setScanningStage('front');
          setInstructions('กำลังถ่ายภาพ: มองตรงที่กล้อง');
          setCountdown(3);
          break;
        case 'front':
          captureImage();
          setScanningStage('prepare-left');
          setInstructions('เตรียมตัว: กรุณาหันหน้าไปทางซ้าย');
          setCountdown(5);
          break;
        case 'prepare-left':
          setScanningStage('left');
          setInstructions('กำลังถ่ายภาพ: หันหน้าไปทางซ้าย');
          setCountdown(3);
          break;
        case 'left':
          captureImage();
          setScanningStage('prepare-right');
          setInstructions('เตรียมตัว: กรุณาหันหน้าไปทางขวา');
          setCountdown(5);
          break;
        case 'prepare-right':
          setScanningStage('right');
          setInstructions('กำลังถ่ายภาพ: หันหน้าไปทางขวา');
          setCountdown(3);
          break;
        case 'right':
          captureImage();
          setScanningStage('prepare-up');
          setInstructions('เตรียมตัว: กรุณาหันหน้าขึ้น');
          setCountdown(5);
          break;
        case 'prepare-up':
          setScanningStage('up');
          setInstructions('กำลังถ่ายภาพ: หันหน้าขึ้น');
          setCountdown(3);
          break;
        case 'up':
          captureImage();
          setScanningStage('prepare-down');
          setInstructions('เตรียมตัว: กรุณาหันหน้าลง');
          setCountdown(5);
          break;
        case 'prepare-down':
          setScanningStage('down');
          setInstructions('กำลังถ่ายภาพ: หันหน้าลง');
          setCountdown(3);
          break;
        case 'down':
          captureImage();
          setScanningStage('idle');
          setInstructions('การสแกนเสร็จสิ้น');
          stopCamera();
          break;
      }
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown, scanningStage]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document as FullscreenDocument;
      setIsFullscreen(!!(doc.fullscreenElement || doc.webkitFullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };

  const handleEmployeeIdChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEmployeeId(event.target.value);
  };

  const sendImagesToBackend = async () => {
    if (capturedImages.length === 0) {
      alert('กรุณาทำการสแกนใบหน้าก่อน');
      return;
    }
    if (!name || !employeeId) {
      alert('กรุณากรอกชื่อและรหัสพนักงาน');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();

      await Promise.all(capturedImages.map(async (imageUrl, index) => {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        formData.append('images', blob, `${name}_${employeeId}_${index}.jpg`);
      }));

      formData.append('name', name);
      formData.append('employee_id', employeeId);

      const apiResponse = await fetch(`${VITE_BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        body: formData,
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(errorData.detail || 'การลงทะเบียนล้มเหลว');
      }

      const data = await apiResponse.json();
      alert('ลงทะเบียนสำเร็จ!');
      console.log(data);

      setName('');
      setEmployeeId('');
      setCapturedImages([]);

    } catch (error) {
      console.error('Error:', error);
      alert(error instanceof Error ? error.message : 'การลงทะเบียนล้มเหลว');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative ${isFullscreen ? 'fixed inset-0 bg-black' : 'p-4 max-w-md mx-auto'}`}
    >
      <div className={`space-y-4 ${isFullscreen ? 'h-full flex flex-col' : ''}`}>
        {!isFullscreen && (
          <div className="space-y-2">
            <input
              className="w-full p-2 border-2 rounded-lg"
              type="text"
              placeholder="ชื่อ"
              value={name}
              onChange={handleNameChange}
            />
            <input
              className="w-full p-2 border-2 rounded-lg"
              type="text"
              placeholder="รหัสพนักงาน"
              value={employeeId}
              onChange={handleEmployeeIdChange}
            />
          </div>
        )}

        <div className={`relative ${isFullscreen ? 'flex-1' : ''}`}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className={`${isFullscreen ? 'h-full w-full object-cover' : 'w-full border rounded-lg'}`}
            style={{ transform: 'scaleX(-1)' }}
          />
          <div className={`absolute top-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-center ${isFullscreen ? '' : 'rounded-t-lg'}`}>
            {instructions}
            {countdown > 0 && (
              <div className="text-2xl font-bold mt-1">
                {countdown}
              </div>
            )}
          </div>
        </div>

        <div className={`flex space-x-2 ${isFullscreen ? 'absolute bottom-4 left-4 right-4' : ''}`}>
          {scanningStage === 'idle' ? (
            <button
              onClick={startScanning}
              className="flex-1 bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600"
            >
              เริ่มสแกน
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="flex-1 bg-red-500 text-white p-2 rounded-lg hover:bg-red-600"
            >
              หยุดสแกน
            </button>
          )}
        </div>

        {!isFullscreen && capturedImages.length > 0 && (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
              {capturedImages.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`Captured ${index + 1}`}
                  className="w-full border rounded-lg"
                />
              ))}
            </div>
            <button
              onClick={sendImagesToBackend}
              disabled={isLoading || scanningStage !== 'idle'}
              className="w-full bg-purple-500 text-white p-2 rounded-lg hover:bg-purple-600 disabled:bg-gray-400"
            >
              {isLoading ? 'กำลังส่งข้อมูล...' : 'ส่งข้อมูล'}
            </button>
          </div>
        )}

        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  );
};

export default CameraCapture;