import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, FlipHorizontal, UserCircle } from "lucide-react";
import Sidebar from '../sidebar/Sidebar';
import Header from '../header/Header.js';
import { useUserData } from '../../../containers/provideruserdata';
import { edituserdata } from '@/containers/getUserdata.js'; // Import the edituserdata function
import LoadingSpinner from '@/components/loading/loading.js';
import Webcam from 'react-webcam';
import { getLogined } from '@/containers/userLogin.js';
import Swal from 'sweetalert2';
import "../users_editprofile/Users_editprofile.css";
import { BACKEND_WS_URL } from '@/configs/backend.js';

const EditProfilePage: React.FC = () => {
  // ====== Provider Data ======
  const {
    isLoading,
    isLogined,
    userData,
    fetchCheckinoroutTime,
    profileImage,
    refreshUserData,
    logout,
  } = useUserData();

  // ================== Add the following code ==================
  const [isScanning, setIsScanning] = useState(false);
  const [facingMode, setFacingMode] = useState("user");
  const [imageFile] = useState<File | null>(null);
  const webcamRef = useRef<Webcam>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [isLoadings, setIsLoadings] = useState(false);
  const [loadingmessage, setLoadingMessage] = useState("");
  // State for form fields
  const [name, setName] = useState(userData?.name || '');
  const [email, setEmail] = useState(userData?.email || '');
  const [phone, setPhone] = useState(userData?.tel || '');

  const [countdown, setCountdown] = useState<number>(0);
  const [isCountdownActive, setIsCountdownActive] = useState<boolean>(false);

  // console.log(userData)

  const [websocket, setWebSocket] = useState<WebSocket | null>(null);
  ;
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [errors, setErrors] = useState<string | null>(null);
  const [toltalDirection, setToltalDirection] = useState<number>(0);
  const [imageCount, setImageCount] = useState<number>(0);
  const [errorDirectiom, setErrorDirection] = useState<string>("");

  const directionInstructions: Record<string, string> = {
    "Front": "กรุณาหันหน้าตรง",
    "Turn_left": "กรุณาหันหน้าไปทางซ้าย",
    "Turn_right": "กรุณาหันหน้าไปทางขวา"
  };
  const errordirectionInstructions: Record<string, string> = {
    "Front": "ตรง",
    "Turn_left": "ซ้าย",
    "Turn_right": "ขวา"
  };
  const [currentDirection, setCurrentDirection] = useState<string>("");




  const stopCamera = () => {
    if (webcamRef.current?.video) {
      console.log('Stopping camera...');
      const mediaStream = webcamRef.current.video.srcObject as MediaStream;
      mediaStream?.getTracks().forEach(track => track.stop());
    }
  };

  const handleClose = () => {
    stopCamera();
    setIsScanning(false);
    handleScanStop();
    setErrors(null);
    setImageCount(0);
  };


  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await edituserdata(userData?.employee_id || '', name, email, phone, imageFile);
      await refreshUserData();
      Swal.fire({
        title: 'สำเร็จ!',
        text: 'อัปเดตโปรไฟล์เรียบร้อยแล้ว',
        icon: 'success',
        confirmButtonText: 'ตกลง',
        width: '90%', // ให้ขนาดหน้าต่างยืดหยุ่นตามหน้าจอมือถือ
        customClass: {
          popup: 'mobile-popup',
          title: 'mobile-title',
        },
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      Swal.fire({
        title: 'เกิดข้อผิดพลาด!',
        text: 'ไม่สามารถอัปเดตโปรไฟล์ได้',
        icon: 'error',
        confirmButtonText: 'ลองใหม่',
        width: '90%', // ปรับขนาดสำหรับมือถือ
        customClass: {
          popup: 'mobile-popup',
          title: 'mobile-title',
        },
      });
    }
  };

  // Camera Controls
  const handleSwitchCamera = () => {
    stopCamera();
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  // Image Processing
  const sendImage = useCallback((ws: WebSocket) => {
    if (!webcamRef.current || !ws || ws.readyState !== WebSocket.OPEN) return null;

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return null;

    const canvas = document.createElement('canvas');
    const video = webcamRef.current.video;
    if (!video) return null;

    const frameSize = Math.min(video.videoWidth, video.videoHeight) * 0.7;
    const x = (video.videoWidth - frameSize) / 2;
    const y = (video.videoHeight - frameSize) / 2;

    canvas.width = frameSize;
    canvas.height = frameSize;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      if (facingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }

      ctx.drawImage(
        video,
        x, y, frameSize, frameSize,
        0, 0, frameSize, frameSize
      );

      const croppedImageSrc = canvas.toDataURL('image/jpeg');

      try {
        const byteCharacters = atob(croppedImageSrc.split(",")[1]);
        const byteArray = new Uint8Array(Array.from(byteCharacters).map(char => char.charCodeAt(0)));
        ws.send(JSON.stringify({ image: Array.from(byteArray) }));
        // console.log('Image sent',new Date().toLocaleTimeString());
        // console.log(video ? 'video' : 'no video');
      } catch (error) {
        console.error("Error sending image:", error);
        setConnectionStatus('disconnected');
      }

      return croppedImageSrc;
    }
    return null;
  }, [facingMode]);

  const handleScanStop = () => {
    setIsScanning(false);
    setInstruction("");
    setConnectionStatus('disconnected');
    websocket?.close();
  };

  const handleScanSuccess = async () => {
    console.log('Scan success');
    await fetchCheckinoroutTime();
    await refreshUserData();
    handleScanStop();

    // Show SweetAlert after successful scan
    Swal.fire({
      title: 'สแกนสำเร็จ!',
      text: 'คุณได้อัปเดตรูปโปรไฟล์เรียบร้อยแล้ว',
      icon: 'success',
      confirmButtonText: 'ตกลง',
      width: '90%',
      customClass: {
        popup: 'mobile-popup',
        title: 'mobile-title',
      },
    });
  };

  const handleHeadMovementInstruction = (message: string) => {
    setInstruction(message.replace("Please move your head to: ", ""));
    setConnectionStatus('connected');
  };


  // WebSocket Message Handler
  const handleWebSocketMessage = useCallback(async (event: MessageEvent) => {
    try {
      const message = event.data;

      if (message.startsWith("{")) {
        const jsonData = JSON.parse(message);
        if (jsonData.data === undefined) return;

        const status = jsonData.data.status;
        const messages = jsonData.data.message;

        switch (status) {
          case "register":
            setToltalDirection(jsonData.data.totaldirection);
            break;
          case "success":
            await handleScanSuccess();
            break;
          case "progress":
            console.log(messages);
            setInstruction(messages);
            break;
          case "failed":
            console.error("Error:", messages);
            setInstruction("กรุณาวางใบหน้าให้อยู่ในกรอบ");
            break;
          case "stopped":
            handleScanStop();
            break;

        }
      }

      // Handle direction instructions without resetting camera
      if (message.startsWith("Please move your head to:")) {
        const direction = message.replace("Please move your head to: ", "");
        const specificInstruction = directionInstructions[direction] || direction;
        handleHeadMovementInstruction(specificInstruction);
        // setInstruction(specificInstruction);
        // reset image count here
        setImageCount(0);
        setCurrentDirection(direction);
      }
      // Handle incorrect direction message
      else if (message.startsWith("Incorrect direction! Detected:")) {
        const match = message.match(/Incorrect direction! Detected: (\w+)/);
        console.log(match);
        if (match) {
          const direction = match[1];
          const errorDetails = `ท่านหันหน้าไปทาง ${errordirectionInstructions[direction]}`;
          setErrorDirection(errorDetails);
        }
      }

      // Handle image count without affecting camera
      else if (message.startsWith("Image ")) {
        const match = message.match(/Image (\d+) captured for (\w+)/);
        if (match) {
          const count = parseInt(match[1]);
          const direction = match[2];
          console.log(direction);
          console.log('dicrection:', directionInstructions[direction]);
          setImageCount(count);
          setCurrentDirection(direction);
          setInstruction(`${directionInstructions[direction]}`);
          setErrorDirection("");
        }
      }

      else if (message.startsWith("User data and images saved successfully")) {
        console.log('Scan success');
        await fetchCheckinoroutTime();
        await refreshUserData();
        handleScanStop();
      }
    } catch (error) {
      console.error("Error processing WebSocket message:", error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [directionInstructions, handleScanSuccess, setImageCount]); // Minimize dependencies

  // WebSocket Setup and Cleanup
  useEffect(() => {
    let imageInterval: NodeJS.Timeout;
    let ws: WebSocket | null = null;

    const cleanup = () => {
      if (imageInterval) clearInterval(imageInterval);
      if (ws) ws.close();
      setWebSocket(null);
      setConnectionStatus('disconnected');
    };

    const setupWebSocket = (url: string, token?: string) => {
      if (!isScanning) return;

      cleanup();
      setIsLoadings(true);
      setLoadingMessage("กำลังเชื่อมต่อเซิฟเวอร์...");

      if (!token) {
        setErrors("ไม่พบ Token");
        return;
      }

      const wsUrl = `${url}?token=${encodeURIComponent(token)}`;
      ws = new WebSocket(wsUrl);
      setWebSocket(ws);

      ws.onopen = () => {
        setConnectionStatus('connected');
        setIsLoadings(false);
        setLoadingMessage("กำลังสแกนใบหน้า...");

        imageInterval = setInterval(() => {
          if (ws?.readyState === WebSocket.OPEN) {
            sendImage(ws);
          }
        }, 1000);
      };

      ws.onmessage = handleWebSocketMessage;
      ws.onclose = cleanup;
      ws.onerror = () => {
        cleanup();
        setErrors("การเชื่อมต่อล้มเหลว กรุณาลองใหม่อีกครั้ง");
      };
    };

    if (isScanning) {
      const baseUrl = BACKEND_WS_URL;
      const path = '/edit_image';
      const token = getLogined();
      setupWebSocket(`${baseUrl}${path}`, token);
    }

    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isScanning]);


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
    setIsLoadings(isLoading);
    setLoadingMessage("กำลังโหลดข้อมูล...");
    console.log('isLoadings:', isLoadings);
    setName(userData?.name || '');
    setEmail(userData?.email || '');
    setPhone(userData?.tel || '');
    console.log('FaceScan State:', {
      isScanning,
      isLoadings,
      connectionStatus,
      instruction,
      errors
    });
    // refreshUserData();
  }, [connectionStatus, errors, instruction, isLoading, isLoadings, isScanning, userData?.email, userData?.name, userData?.tel]);

  // Countdown logic
  useEffect(() => {
    let countdownTimer: NodeJS.Timeout;

    if (isCountdownActive && countdown > 0) {
      countdownTimer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownTimer);
            setIsCountdownActive(false);
            setIsScanning(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (countdownTimer) clearInterval(countdownTimer);
    };
  }, [isCountdownActive, countdown]);

  // Modify the start scanning method
  const startScanningWithCountdown = () => {
    setCountdown(3); // Start 3-second countdown
    setIsCountdownActive(true);
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">

      {/* Mobile Sidebar */}
      <div className={`md:hidden`}>
        <Sidebar
          isSidebarCollapsed={false}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
          isLogined={isLogined}
          logout={logout}
          setName={setName}
        />
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
          isLogined={isLogined}
          logout={logout}
          setName={setName}
        />
      </div>

      {/* Main Content */}
      <div className={`flex-1 w-full md:w-auto transition-all duration-300 
        ${isSidebarCollapsed ? 'md:ml-16' : 'md:ml-72'}`}>
        {isLoading ? (
          <LoadingSpinner message={loadingmessage} />
        ) : (<Header profileimage={profileImage} name={name} currentMenuItem={currentMenuItem} />)}

        <div className="w-full p-2 md:p-4 bg-white">
          <div className="p-4 md:p-6 bg-white rounded-lg shadow">
            <div className="mb-6 md:mb-8">
              <h3 className="text-xl md:text-2xl font-semibold mb-2">แก้ไขข้อมูลส่วนตัว</h3>
              {/* <p className="text-gray-600">อัพเดตข้อมูลและรูปโปรไฟล์ของคุณ</p> */}
            </div>

            {isLoading ? (
              <LoadingSpinner message={loadingmessage} />
            ) : (
              <>
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
                      onClick={startScanningWithCountdown}
                      className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors"
                    >
                      <Camera size={20} />
                    </button>
                    {/* Countdown overlay */}
                    {isCountdownActive && (
                      <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
                        <div className="text-white text-9xl font-bold animate-pulse">
                          {countdown}
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">คลิกที่ไอคอนกล้องเพื่อถ่ายภาพโปรไฟล์</p>
                </div>

                <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit} encType="multipart/form-data">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ชื่อ-นามสกุล
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      อีเมล
                    </label>
                    <input
                      type="email"
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      เบอร์โทรศัพท์
                    </label>
                    <input
                      type="tel"
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    บันทึกข้อมูล
                  </button>
                </form>
              </>
            )}
          </div>

          {isScanning && (
            (
              <div className="fixed inset-0 bg-gray-900 z-50">

                {/* Countdown overlay
                {countdown > 0 && (
                  <div className="absolute inset-0 bg-black/70 z-50 flex items-center justify-center">
                    <div className="text-white text-9xl font-bold animate-pulse">
                      {countdown}
                    </div>
                  </div>
                )} */}

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
                  {isLoadings && <LoadingSpinner message={loadingmessage} />}
                  <>
                    <Webcam
                      ref={webcamRef}
                      audio={false}
                      screenshotFormat="image/jpeg"
                      className="absolute inset-0 w-full h-full object-cover"
                      mirrored={true}
                    />

                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative w-[420px] h-[420px] border-4 border-blue-500 rounded-lg shadow-xl top-[-50px]">
                      </div>
                    </div>

                    <div className="absolute top-0 left-0 right-0 flex flex-col items-center pt-4 mt-5">
                      <div className="text-white text-center">
                        {currentDirection && imageCount < toltalDirection && (
                          <p
                            className="text-xl font-semibold mb-2"
                            style={{
                              textShadow: "2px 2px 0px black, -2px 2px 0px black, 2px -2px 0px black, -2px -2px 0px black",
                            }}
                          >
                            {`${currentDirection} - Image ${imageCount}/${toltalDirection}`}
                          </p>
                        )}
                        <p
                          className="text-2xl font-semibold"
                          style={{
                            textShadow: "2px 2px 0px black, -2px 2px 0px black, 2px -2px 0px black, -2px -2px 0px black",
                          }}
                        >
                          {imageCount === toltalDirection ? "กรุณาวางใบหน้าให้อยู่ในกรอบ" : instruction}
                        </p>
                        <p
                          className="text-xl font-semibold text-red-500"
                          style={{
                            textShadow: "2px 2px 0px black, -2px 2px 0px black, 2px -2px 0px black, -2px -2px 0px black",
                          }}
                        >
                          {errorDirectiom}
                        </p>
                      </div>
                    </div>
                  </>
                </div>
              </div>
            )
          )}
        </div>
      </div >
    </div >
  );
};

export default EditProfilePage;