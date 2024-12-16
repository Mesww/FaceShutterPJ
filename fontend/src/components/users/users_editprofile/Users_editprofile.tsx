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
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
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
  const [role,setRole] = useState(userData?.roles || '');
  // console.log(userData)

  const [websocket, setWebSocket] = useState<WebSocket | null>(null);
  ;
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [errors, setErrors] = useState<string | null>(null);
  const [, setToltalDirection] = useState<number>(0);
  const [, setImageCount] = useState<number>(0);
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
  const [, setCurrentDirection] = useState<string>("");


  const stopCamera = () => {
    if (webcamRef.current?.video) {
      console.log('Stopping camera...');
      const mediaStream = webcamRef.current.video.srcObject as MediaStream;
      mediaStream?.getTracks().forEach(track => track.stop());
    }
  };

  const handleClose = () => {
    if (websocket?.readyState === WebSocket.OPEN) {
      websocket.send(JSON.stringify({
        action: "normal_close",
        message: "User closed camera normally"
      }));
      websocket.close();
    }

    stopCamera();
    setIsScanning(false);
    setErrors(null);
    setImageCount(0);
    setInstruction("");
    setErrorDirection("");
    setCurrentDirection("");
  };


  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
     
      await edituserdata(userData?.employee_id || '', name, email, phone, imageFile, role);

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
    setFacingMode(prevMode => prevMode === "user" ? "environment" : "user");
  };

  const handleScanStop = () => {
    setIsScanning(false);
    setInstruction("");
    setConnectionStatus('disconnected');
    websocket?.close();
  };

  const handleScanSuccess = async () => {
    try {
      console.log('Scan success - starting update process');

      // ปิดการสแกน
      handleScanStop();

      // รอสักครู่ก่อนดึงข้อมูลใหม่
      await new Promise(resolve => setTimeout(resolve, 1000));

      // ดึงข้อมูลใหม่
      await fetchCheckinoroutTime();
      await refreshUserData();

      // แสดง SweetAlert หลังจากอัพเดทสำเร็จ
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
    } catch (error) {
      console.error('Error updating profile:', error);

      // แสดง SweetAlert กรณีเกิดข้อผิดพลาด
      Swal.fire({
        title: 'เกิดข้อผิดพลาด!',
        text: 'ไม่สามารถอัปเดตข้อมูลได้ กรุณาลองใหม่อีกครั้ง',
        icon: 'error',
        confirmButtonText: 'ตกลง',
        width: '90%',
        customClass: {
          popup: 'mobile-popup',
          title: 'mobile-title',
        },
      });
    }
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
            if (messages.includes("ไม่พบใบหน้า")) {
              setInstruction("ไม่พบใบหน้าในภาพ กรุณาถ่ายใหม่");
              setErrorDirection("กรุณาวางใบหน้าให้อยู่ในกรอบและถ่ายใหม่");
              return;
            }
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
        setImageCount(0);
        setCurrentDirection(direction);
      }
      // Handle incorrect direction message
      else if (message.startsWith("Incorrect direction! Detected:")) {
        const match = message.match(/Incorrect direction! Detected: (\w+)/);
        if (match) {
          const direction = match[1];
          const errorDetails = `ท่านหันหน้าไปทาง ${errordirectionInstructions[direction]}`;
          setErrorDirection(errorDetails);
        }
      }
      // Handle image count
      else if (message.startsWith("Image ")) {
        const match = message.match(/Image (\d+) captured for (\w+)/);
        if (match) {
          const count = parseInt(match[1]);
          const direction = match[2];
          setImageCount(count);
          setCurrentDirection(direction);
          setInstruction(`${directionInstructions[direction]}`);
          setErrorDirection("");
        }
      }
    } catch (error) {
      console.error("Error processing WebSocket message:", error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [directionInstructions, handleScanSuccess, setImageCount]);

  // WebSocket Setup and Cleanup
  useEffect(() => {
    // กำหนดค่าเริ่มต้นให้ imageInterval
    const imageInterval: NodeJS.Timeout | undefined = undefined;
    let ws: WebSocket | null = null;

    const cleanup = () => {
      if (imageInterval) clearInterval(imageInterval);
      if (ws) {
        ws.close();
        setWebSocket(null);
      }
      setConnectionStatus('disconnected');
    };

    const setupWebSocket = async (url: string, token?: string) => {
      if (!isScanning) return;

      cleanup();
      setIsLoadings(true);
      setLoadingMessage("กำลังเชื่อมต่อเซิฟเวอร์...");

      if (!token) {
        setErrors("ไม่พบ Token");
        return;
      }

      try {
        const wsUrl = `${url}?token=${encodeURIComponent(token)}`;
        ws = new WebSocket(wsUrl);
        setWebSocket(ws);

        ws.onopen = () => {
          setConnectionStatus('connected');
          setIsLoadings(false);
          setLoadingMessage("กำลังสแกนใบหน้า...");
        };

        ws.onmessage = handleWebSocketMessage;

        ws.onclose = () => {
          console.log('WebSocket closed');
          cleanup();
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          cleanup();
          setErrors("การเชื่อมต่อล้มเหลว กรุณาลองใหม่อีกครั้ง");
        };

      } catch (error) {
        console.error('Error setting up WebSocket:', error);
        cleanup();
        setErrors("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
      }
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

  const currentMenuItem = menuItems.find((item) => window.location.pathname.includes(item.path));


  useEffect(() => {
    setIsLoadings(isLoading);
    setLoadingMessage("กำลังโหลดข้อมูล...");
    console.log('isLoadings:', isLoadings);
    setName(userData?.name || '');
    setEmail(userData?.email || '');
    setPhone(userData?.tel || '');
    setRole(userData?.roles || '');
    console.log('FaceScan State:', {
      isScanning,
      isLoadings,
      connectionStatus,
      instruction,
      errors
    });
    // refreshUserData();
  }, [connectionStatus, errors, instruction, isLoading, isLoadings, isScanning, userData?.email, userData?.name, userData?.tel,userData?.roles]);

  // Modify the start scanning method
  const startScanning = () => {
    setIsScanning(true);
  };

  const captureImage = useCallback(() => {
    if (!webcamRef.current || !websocket || websocket.readyState !== WebSocket.OPEN) {
      setInstruction("กรุณารอการเชื่อมต่อกล้อง");
      return;
    }

    try {
      const video = webcamRef.current.video;
      if (!video) {
        setInstruction("ไม่สามารถเข้าถึงกล้องได้");
        return;
      }

      // สร้าง canvas สำหรับครอปภาพ
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) {
        setInstruction("ไม่สามารถสร้าง canvas ได้");
        return;
      }

      // กำหนดขนาดกรอบสี่เหลี่ยมที่ใช้ครอปใบหน้า
      const frameSize = Math.min(video.videoWidth, video.videoHeight) * 0.7;
      canvas.width = frameSize;
      canvas.height = frameSize;

      // คำนวณตำแหน่งกึ่งกลางของวิดีโอ
      const centerX = (video.videoWidth - frameSize) / 2;
      const centerY = (video.videoHeight - frameSize) / 2;

      // วาดภาพลงบน canvas โดยครอปเฉพาะส่วนกลาง
      if (context) {
        // ทำ mirror ภาพ
        context.translate(canvas.width, 0);
        context.scale(-1, 1);

        context.drawImage(
          video,
          centerX, centerY, frameSize, frameSize, // source rectangle
          0, 0, frameSize, frameSize // destination rectangle
        );
      }

      // แปลง canvas เป็น base64
      const croppedImageBase64 = canvas.toDataURL('image/jpeg', 0.8);

      // แปลง base64 เป็น byte array
      const imageData = croppedImageBase64.split(',')[1];
      const byteCharacters = atob(imageData);
      const byteArray = new Uint8Array(Array.from(byteCharacters).map(char => char.charCodeAt(0)));
      
      // ส่งข้อมูลไปยังเซิร์ฟเวอร์
      websocket.send(JSON.stringify({
        captured_image: Array.from(byteArray)
      }));

      setInstruction("กำลังประมวลผลภาพ...");

    } catch (error) {
      console.error("Error capturing and sending image:", error);
      setInstruction("เกิดข้อผิดพลาดในการถ่ายและส่งภาพ");
    }
  }, [webcamRef, websocket]);

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
                      onClick={startScanning}
                      className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors"
                    >
                      <Camera size={20} />
                    </button>
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
                      videoConstraints={{
                        facingMode: facingMode,
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                      }}
                    />

                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative w-[420px] h-[420px] border-4 border-blue-500 rounded-lg shadow-xl top-[-50px]">
                      </div>
                    </div>

                    <div className="absolute top-0 left-0 right-0 flex flex-col items-center pt-4 mt-5">
                      <div className="text-white text-center">
                        <p
                          className="text-2xl font-semibold"
                          style={{
                            textShadow: "2px 2px 0px black, -2px 2px 0px black, 2px -2px 0px black, -2px -2px 0px black",
                          }}
                        >
                          {instruction || "กรุณาถ่ายภาพใบหน้าของคุณ"}
                        </p>
                        {errorDirectiom && (
                          <p
                            className="text-xl font-semibold text-red-500"
                            style={{
                              textShadow: "2px 2px 0px black, -2px 2px 0px black, 2px -2px 0px black, -2px -2px 0px black",
                            }}
                          >
                            {errorDirectiom}
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                </div>

                {isScanning && (
                  <button
                    onClick={captureImage}
                    className="absolute bottom-8 left-1/2 transform -translate-x-1/2 px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Camera size={24} />
                    ถ่ายภาพ
                  </button>
                )}
              </div>
            )
          )}
        </div>
      </div >
    </div >
  );
};

export default EditProfilePage;