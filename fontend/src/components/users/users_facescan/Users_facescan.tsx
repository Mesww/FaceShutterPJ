import { useState, useRef, useEffect, useCallback } from 'react';
import { Scan, Camera, X, FlipHorizontal } from "lucide-react";
import LoadingSpinner from '@/components/loading/loading';
import { FaceScanPageProps, Responsedata, User } from '@/interfaces/users_facescan.interface';
import Sidebar from '../sidebar/Sidebar';
import Header from '../header/Header.js';
import { Outlet } from 'react-router-dom';
import { getLogined, setLogined } from '@/containers/userLogin.js';
import { getisuserdata } from '@/containers/getUserdata.js';
import RegisModal from './regis_modal.js';
import Webcam from 'react-webcam';
import { useUserData } from '@/containers/provideruserdata.js';
import Swal from 'sweetalert2';
import "../users_facescan/Users_facescan.css";
import { BACKEND_WS_URL } from '@/configs/backend.js';
// import { useUserData } from '@/containers/provideruserdata.js';

const FaceScanPage: React.FC<FaceScanPageProps> = () => {
  // Core States
  const [isScanning, setIsScanning] = useState(false);
  const [isLoadings, setIsLoadings] = useState(false);
  const [loadingmessage, setLoadingMessage] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [instruction, setInstruction] = useState("");
  const [errors, setErrors] = useState<string | null>();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [imageCount, setImageCount] = useState<number>(0);
  const [currentDirection, setCurrentDirection] = useState<string>("");

  // User States
  const [userDetails, setUserDetails] = useState<User>({
    employee_id: "",
    name: "",
    email: "",
    password: "",
    tel: "",
    roles: "",
  });
  const [employeeId, setEmployeeId] = useState<string>('');
  const [isAuthen, setIsAuthen] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [login, setLogin] = useState<boolean>(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [toltalDirection, setToltalDirection] = useState<number>(0);
  const [errorDirectiom, setErrorDirection] = useState<string>("");

  const [errorsMessage, setErrorsMessage] = useState<string | null>(null);

  // Camera States
  const webcamRef = useRef<Webcam>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  // const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [websocket, setWebSocket] = useState<WebSocket | null>(null);

  // Provider Data
  const {
    isLogined,
    setIsLogined,
    userData,
    isCheckinroute,
    disableCheckinorout,
    disableCheckinorouttext,
    fetchCheckinoroutTime,
    logout,
    profileImage
  } = useUserData();

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

  // WebSocket Message Handler
  const handleWebSocketMessage = useCallback((event: MessageEvent) => {
    try {
      const message = event.data;
      console.log(message);

      if (message.startsWith("{")) {
        const jsonData = JSON.parse(message);
        if (jsonData.data === undefined) {
          console.log("Received JSON data:", jsonData);
          return;
        }
        const status = jsonData.data.status;
        const messages = jsonData.data.message;
        console.log("Status:", status);
        
        switch (status) {
          case "progress":
            console.log(messages);
            setInstruction(messages);
            setErrorsMessage('');
            break;
          case "pending":
            console.log("User data received, awaiting scan...");
            break;
          case "failed":
            console.error("Error:", messages);
            setErrorsMessage(messages);
            setInstruction("กรุณาวางใบหน้าให้อยู่ในกรอบ");
            break;
          case "stopped":
            handleScanStop();
            break;
          case "alreadycheckedin":
            Swal.fire({
              icon: 'info',
              title: 'เข้างานเรียบร้อย',
              text: 'วันนี้คุณได้ทำการเข้างานแล้ว',
              confirmButtonText: 'OK',
              confirmButtonColor: '#3085d6',
              width: '90%', // ปรับขนาดสำหรับมือถือ
              customClass: {
                popup: 'mobile-popup',
                title: 'mobile-title',
                confirmButton: 'mobile-btn',
              },
            }).then(() => {
              handleScanSuccess(jsonData.data.token);
            });
            break;

          case "alreadycheckedout":
            Swal.fire({
              icon: 'info',
              title: 'ออกงานเรียบร้อย',
              text: 'วันนี้คุณได้ทำการออกงานแล้ว',
              confirmButtonText: 'OK',
              confirmButtonColor: '#3085d6',
              width: '90%', // ปรับขนาดสำหรับมือถือ
              customClass: {
                popup: 'mobile-popup',
                title: 'mobile-title',
                confirmButton: 'mobile-btn',
              },
            }).then(() => {
              handleScanSuccess(jsonData.data.token);
            });
            break;

          case "alreadycheckedinout":
            Swal.fire({
              icon: 'info',
              title: 'เข้างาน/ออกงานแล้ว',
              text: 'วันนี้คุณได้ทำการเข้างาน/ออกงานแล้ว',
              confirmButtonText: 'OK',
              confirmButtonColor: '#3085d6',
              width: '90%', // ปรับขนาดสำหรับมือถือ
              customClass: {
                popup: 'mobile-popup',
                title: 'mobile-title',
                confirmButton: 'mobile-btn',
              },
            }).then(() => {
              handleScanSuccess(jsonData.data.token);
            });
            break;
          case "register":
            console.log("User data received, awaiting scan...", jsonData.data.totaldirection);
            setToltalDirection(jsonData.data.totaldirection);
            break;
          case "scanning":
            console.log("User data received, awaiting scan...", jsonData.data.instructions);
            setInstruction(jsonData.data.instructions);
            break;
          case "success":
            handleScanSuccess(jsonData.data.token);
            break;
        }
      }
      // Handle image count and direction instructions
      if (message.startsWith("Please move your head to:")) {
        const direction = message.replace("Please move your head to: ", "");

        const specificInstruction = directionInstructions[direction] || direction;
        handleHeadMovementInstruction(specificInstruction);
        // Reset image count when direction changes
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
      // Existing other message handlers...
      else if (message.startsWith("Image ")) {
        const match = message.match(/Image (\d+) captured for (\w+)/);
        if (match) {
          const count = parseInt(match[1]);
          const direction = match[2];
          setImageCount(count);
          setCurrentDirection(direction);
          setInstruction(`${directionInstructions[direction]}`);
          setErrorDirection('')
        }
      }
      else if (message.startsWith("User data and images saved successfully")) {
        // Show SweetAlert for successful scan
        Swal.fire({
          icon: 'success',
          title: 'บันทึกข้อมูลสำเร็จ',
          text: 'ระบบได้บันทึกภาพและข้อมูลของคุณเรียบร้อยแล้ว',
          confirmButtonText: 'ตกลง',
          confirmButtonColor: '#3085d6',
          width: '90%',
          customClass: {
            popup: 'mobile-popup',
            title: 'mobile-title',
            confirmButton: 'mobile-btn',
          },
        }).then(() => {
          handleScanStop();
        });
      }
    } catch (error) {
      console.error("Error processing WebSocket message:", error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setIsLogined, fetchCheckinoroutTime]);

  const handleScanStop = () => {
    setIsScanning(false);
    setIsAuthen(false);
    setInstruction("");
    setUserDetails({ employee_id: "", name: "", email: "", password: "", tel: "",roles: "" });
    setConnectionStatus('disconnected');
    setErrorsMessage('');
    if (websocket) websocket.close();
    setWebSocket(null);
  };

  const handleScanSuccess = (token: string) => {
    if (token) {
      setLogined(token);
      setIsLogined(true);
      setLogin(true);
      // Add SweetAlert for successful scan
      Swal.fire({
        icon: 'success',
        title: 'เข้าสู่ระบบสำเร็จ',
        text: 'การสแกนใบหน้าเข้าสู่ระบบของคุณเสร็จสมบูรณ์',
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#3085d6',
        width: '90%',
        customClass: {
          popup: 'mobile-popup',
          title: 'mobile-title',
          confirmButton: 'mobile-btn',
        },
      });
    }
    else if (!token) {
      Swal.fire({
        icon: 'success',
        title: 'บันทึกข้อมูลสำเร็จ',
        text: 'ระบบได้บันทึกภาพและข้อมูลของคุณเรียบร้อยแล้ว',
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#3085d6',
        width: '90%',
        customClass: {
          popup: 'mobile-popup',
          title: 'mobile-title',
          confirmButton: 'mobile-btn',
        },
      });
    }
    handleScanStop();
    fetchCheckinoroutTime();
  };

  const handleHeadMovementInstruction = (message: string) => {
    setInstruction(message.replace("Please move your head to: ", ""));
    setConnectionStatus('connected');
  };

  // Image Processing
  const sendImage = useCallback((ws: WebSocket) => {
    if (isScanning && !isAuthen) return null;

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
      } catch (error) {
        console.error("Error sending image:", error);
        setConnectionStatus('disconnected');
      }

      return croppedImageSrc;
    }
    return null;
  }, [facingMode, isScanning, isAuthen]);

  // WebSocket Setup and Cleanup
  useEffect(() => {
    let imageInterval: NodeJS.Timeout;

    const cleanup = () => {
      if (imageInterval) clearInterval(imageInterval);
      if (websocket) websocket.close();
      setWebSocket(null);
      setConnectionStatus('disconnected');
    };

    const setupWebSocket = (url: string, token?: string) => {
      cleanup();
      setIsLoadings(true);
      setLoadingMessage("กำลังเชื่อมต่อเซิฟเวอร์...");

      const wsUrl = token ? `${url}?token=${encodeURIComponent(token)}` : url;
      const ws = new WebSocket(wsUrl);
      setWebSocket(ws);
      setConnectionStatus('connecting');

      ws.onopen = () => {
        console.log("WebSocket connected");
        setConnectionStatus('connected');
        setIsLoadings(false);
        setLoadingMessage("กำลังสแกนใบหน้า...");

        if (isScanning) {
          ws.send(JSON.stringify(userDetails));
        } else if (isAuthen && employeeId) {
          ws.send(JSON.stringify({ employee_id: employeeId }));
        }

        imageInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            sendImage(ws);
          }
        }, 1000);
      };

      ws.onmessage = handleWebSocketMessage;
      ws.onclose = () => cleanup();
      ws.onerror = () => {
        cleanup();
        setErrors("การเชื่อมต่อล้มเหลว กรุณาลองใหม่อีกครั้ง");
      };
    };

    if (isScanning || isAuthen) {

      const baseUrl = BACKEND_WS_URL;
      const path = isScanning ? '/scan' : '/auth';
      const token = isAuthen ? getLogined() : undefined;
      console.log('Test');
      setupWebSocket(`${baseUrl}${path}`, token);
    }

    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isScanning, sendImage, handleWebSocketMessage, isAuthen]);

  // Form Handling
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!employeeId || employeeId.trim() === '') {
      setErrors('กรุณากรอก Employee ID');
      return;
    }

    if (!/^\d{6,10}$/.test(employeeId)) {
      setErrors('Employee ID must be 6-10 digits.');
      return;
    }

    const error = validateEmployeeId(employeeId);
    if (error) {
      setErrors(error);
      return;
    }

    const isUser: Responsedata = await getisuserdata(employeeId);

    if (!isUser.data) {
      setShowConfirmDialog(true);
      return;
    }
    setIsAuthen(true);
  };

  // Camera Controls
  const handleSwitchCamera = async () => {
    try {
      // เก็บสถานะปัจจุบัน
      const currentFacingMode = facingMode;
      const wasScanning = isScanning;
      
      // หยุดกล้องและปิด WebSocket เดิม
      if (websocket?.readyState === WebSocket.OPEN) {
        websocket.close();
      }
      stopCamera();

      // สลับโหมดกล้อง
      setFacingMode(currentFacingMode === "user" ? "environment" : "user");

      // รอให้กล้องเปลี่ยนโหมดเสร็จ
      await new Promise(resolve => setTimeout(resolve, 500));

      // ถ้ากำลังสแกนอยู่ ให้เริ่ม WebSocket ใหม่
      if (wasScanning) {
        const baseUrl = BACKEND_WS_URL;
        const path = '/scan';
        const wsUrl = `${baseUrl}${path}`;
        
        const ws = new WebSocket(wsUrl);
        setWebSocket(ws);
        
        ws.onopen = () => {
          setConnectionStatus('connected');
          setIsLoadings(false);
          if (userDetails) {
            ws.send(JSON.stringify(userDetails));
          }
        };
        
        ws.onmessage = handleWebSocketMessage;
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          setErrors("การเชื่อมต่อล้มเหลว กรุณาลองใหม่อีกครั้ง");
        };
      }
    } catch (error) {
      console.error('Error switching camera:', error);
      setErrors("เกิดข้อผิดพลาดในการสลับกล้อง");
    }
  };

  const stopCamera = () => {
    if (webcamRef.current?.video) {
      const mediaStream = webcamRef.current.video.srcObject as MediaStream;
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
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
    setIsAuthen(false);
    setErrors(null);
    setImageCount(0);
    setInstruction("");
    setErrorDirection("");
    setCurrentDirection("");
    setWebSocket(null); // เพิ่มบรรทัดนี้
  };

  // Registration Handlers
  const handleConfirmRegistration = () => {
    setShowConfirmDialog(false);
    setIsRegister(true);
  };

  const handleCancelRegistration = () => {
    setShowConfirmDialog(false);
    setEmployeeId("");
  };

  // Validation
  const validateEmployeeId = (value: string): string | null => {
    if (!value || value.trim() === '') {
      return "กรุณากรอก Employee ID";
    }
    if (!/^\d{6,10}$/.test(value)) {
      return "Employee ID must be 6-10 digits.";
    }
    return null;
  };

  const handleInputChange = (value: string) => {
    const error = validateEmployeeId(value);
    setErrors(error);
    setEmployeeId(value);
  };

  // Menu Configuration
  const menuItems = (isLogined || login) ? [
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
  ] : [{
    path: "/UsersFacescan",
    title: "สแกนใบหน้า",
    description: "บันทึกเวลาด้วยการสแกนใบหน้า",
  }];

  // Data Sync Effect
  useEffect(() => {
    if (userData) {
      setEmployeeId(userData.employee_id);
      setUserDetails(userData);
    }
    console.log('FaceScan State:', {
      isScanning,
      isLoadings,
      connectionStatus,
      instruction,
    });
  }, [isScanning, isLoadings, connectionStatus, instruction, userData]);

  const currentMenuItem = menuItems.find(item => window.location.pathname.includes(item.path));

  // เพิ่มฟังก์ชัน captureImage สำหรับการถ่ายภาพ
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
      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">ยืนยันการลงทะเบียน</h3>
            <p className="text-gray-600 mb-6">
              ไม่พบข้อมูล Employee ID ของคุณในระบบ คุณต้องการลงทะเบียนใช่หรือไม่?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancelRegistration}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmRegistration}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RegisModal - แสดงเมื่อ isRegister เป็น true */}
      {(isRegister && employeeId.trim() !== "") && (
        <RegisModal
          employeeId={employeeId}
          setIsRegister={setIsRegister}
          isRegister={isRegister}
          userDetails={userDetails}
          setUserDetails={setUserDetails}
          setIsScanning={setIsScanning}
        />
      )}
      {/* {isLoading && (<LoadingSpinner message={loadingmessage} />)} */}
      {/* Mobile Sidebar */}

      <div className={`md:hidden`}>
        <Sidebar
          isSidebarCollapsed={false}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
          isLogined={isLogined || login}
          logout={logout}
        />
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
          isLogined={isLogined || login}
          logout={logout}
          setUserDetails={setUserDetails}
        />
      </div>

      {/* Main Content */}
      <main className={`flex-1 w-full md:w-auto transition-all duration-300 
        ${isSidebarCollapsed ? 'md:ml-16' : 'md:ml-72'}`}>
        <Header profileimage={profileImage} currentMenuItem={currentMenuItem} name={userDetails.name} />
        {/* Main content area with proper margin for sidebar */}
        <div className="w-full p-2 md:p-4 bg-white">
          <form onSubmit={handleFormSubmit} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white rounded-lg shadow p-6">
              <label className="block font-bold text-base mb-2"><span className="text-red-500 ml-1">*</span> Employee ID:</label>
              <input
                type="text"
                value={employeeId}
                onChange={(e) => handleInputChange(e.target.value)}
                className={`w-full p-2 border rounded ${errors ? 'border-red-500' : 'border-gray-300'
                  }`}
                disabled={isLogined || login}
              />
              {errors && (
                <p className="text-red-500 text-sm mt-1">{errors}</p>
              )}
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">สแกนใบหน้า</h3>
                <Scan className="text-blue-600" size={24} />
              </div>
              <p className="text-gray-600 mb-4">
                บันทึกเวลาเข้างานด้วยการสแกนใบหน้า
              </p>

              <button
                type='submit'
                disabled={isScanning || (isLogined && isCheckinroute === null) || disableCheckinorout}
                className={`w-full px-4 py-2 ${isScanning || (isLogined && isCheckinroute === null) || disableCheckinorout
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
                  } text-white rounded-lg transition-colors flex items-center justify-center gap-2`}
              >
                <Camera size={20} />
                {isLogined || login
                  ? (!disableCheckinorout ? (
                    isCheckinroute !== null ? (isCheckinroute === "checkin" ? "เข้างาน" : "ออกงาน") : "ยังไม่ถึงเวลาเข้าหรือออกงาน") : disableCheckinorouttext)
                  : isCheckinroute !== null ? (isCheckinroute === "checkin" ? "เข้างาน" : "ออกงาน") : "เข้าสู่ระบบ"}
              </button>
            </div>
          </form>

          {(isScanning || isAuthen) && (
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

                  {/* แสดงปุ่มถ่ายภาพเฉพาะในโหมดลงทะเบียน */}
                  {isScanning && !isAuthen && (
                    <button
                      onClick={captureImage}
                      className="absolute bottom-8 left-1/2 transform -translate-x-1/2 px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Camera size={24} />
                      ถ่ายภาพ
                    </button>
                  )}

                  {/* คำแนะนำและสถานะ */}
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
                        {isScanning && !isAuthen 
                          ? (instruction || "กรุณาถ่ายภาพใบหน้าของคุณ")
                          : instruction}
                      </p>
                      <p
                        className="text-xl font-semibold text-red-500"
                        style={{
                          textShadow: "2px 2px 0px black, -2px 2px 0px black, 2px -2px 0px black, -2px -2px 0px black",
                        }}
                      >
                        {errorDirectiom || errorsMessage}
                      </p>
                    </div>
                  </div>
                </>
              </div>
            </div>
          )}
        </div>
        <Outlet />
      </main>
    </div>
  );
};

export default FaceScanPage;