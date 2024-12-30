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
  const [errorDirectiom, setErrorDirection] = useState<string>("");
  const [timeWebSocket, setTimeWebSocket] = useState<WebSocket | null>(null);
  const [currentTime, setCurrentTime] = useState<string>("00:00:00");

  const [errorsMessage, setErrorsMessage] = useState<string | null>(null);

  // Camera States
  const webcamRef = useRef<Webcam>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
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

  // WebSocket Message Handler
  const handleWebSocketMessage = useCallback((event: MessageEvent) => {
    try {
      const message = event.data;

      if (message.startsWith("{")) {
        setIsLoadings(false);
        setLoadingMessage("");
        const jsonData = JSON.parse(message);
        if (jsonData.data === undefined) {
          return;
        }
        const status = jsonData.data.status;
        const messages = jsonData.data.message;
        // console.log(status);

        switch (status) {
          case "progress":
            setInstruction(messages);
            setErrorsMessage('');
            break;
          case "pending":
            setLoadingMessage(messages);
            setIsLoadings(true);
            break;
          case "failed":
            setErrorsMessage(messages);
            setInstruction("วางใบหน้าในกรอบ");
            break;
          case "alert":
            Swal.fire({
              icon: 'warning',
              title: 'แจ้งเตือน',
              text: messages,
              confirmButtonText: 'ตกลง',
              confirmButtonColor: '#3085d6',
              width: '90%', // ปรับขนาดสำหรับมือถือ
              customClass: {
                popup: 'mobile-popup',
                title: 'mobile-title',
                confirmButton: 'mobile-btn',
              },
            }).then(() => {
              setIsLoadings(false);
              handleScanStop();
            })
            break;
          case "stopped":
            setIsLoadings(false);
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
            break;
          case "scanning":
            setInstruction(jsonData.data.instructions);
            break;
          case "success":
            handleScanSuccess(jsonData.data.token);
            break;
        }
      }
      // Existing other message handlers...
      else if (message.startsWith("Image ")) {
        const match = message.match(/Image (\d+) captured for (\w+)/);
        if (match) {
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // console.error("Error processing WebSocket message:", error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setIsLogined, fetchCheckinoroutTime]);

  const handleScanStop = () => {
    setIsScanning(false);
    setIsAuthen(false);
    setInstruction("");
    if (!getLogined()) {
      setUserDetails({ employee_id: "", name: "", email: "", password: "", tel: "", roles: "" });
    }
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // console.error("Error sending image:", error);
        setConnectionStatus('disconnected');
      }

      return croppedImageSrc;
    }
    return null;
  }, [facingMode, isScanning, isAuthen]);

  // เพิ่มฟังก์ชันสำหรับจัดการ WebSocket เวลา
const setupTimeWebSocket = useCallback(() => {
  const ws = new WebSocket(`${BACKEND_WS_URL}/time`);
  
  ws.onopen = () => {
    // console.log("Time WebSocket connected");
  };
  
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      setCurrentTime(data.current_time);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // console.error("Error parsing time data:", error);
    }
  };
  
  ws.onclose = () => {
    // console.log("Time WebSocket disconnected");
    // ลองเชื่อมต่อใหม่หลังจาก 5 วินาที
    setTimeout(() => setupTimeWebSocket(), 5000);
  };
  
  ws.onerror = () => {
    // console.error("Time WebSocket error:", error);
  };
  
  setTimeWebSocket(ws);
  
  return () => {
    ws.close();
  };
}, []);

// เพิ่ม useEffect สำหรับจัดการ WebSocket เวลา
useEffect(() => {
  const cleanup = setupTimeWebSocket();
  return () => {
    cleanup();
    if (timeWebSocket) {
      timeWebSocket.close();
    }
  };
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [setupTimeWebSocket]);


  // WebSocket Setup and Cleanup
  useEffect(() => {
    let imageInterval: NodeJS.Timeout;

    const cleanup = () => {
      if (imageInterval) clearInterval(imageInterval);
      if (websocket) websocket.close();
      setWebSocket(null);
      setConnectionStatus('disconnected');
    };
    const on_close = () => {
      cleanup();
      setLoadingMessage("");
      setIsLoadings(false);
      stopCamera();
      setIsScanning(false);
      setIsAuthen(false);
      setErrors(null);
      setInstruction("");
      setErrorDirection("");

    }
    const setupWebSocket = (url: string, token?: string) => {
      cleanup();
      setIsLoadings(true);
      setLoadingMessage("กำลังเชื่อมต่อเซิฟเวอร์...");

      const wsUrl = token ? `${url}?token=${encodeURIComponent(token)}` : url;
      const ws = new WebSocket(wsUrl);
      setWebSocket(ws);
      setConnectionStatus('connecting');

      ws.onopen = () => {
        // console.log("WebSocket connected");
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
      ws.onclose = () => on_close();
      ws.onerror = () => {
        cleanup();
        setErrors("การเชื่อมต่อล้มเหลว กรุณาลองใหม่อีกครั้ง");
      };
    };

    if (isScanning || isAuthen) {
      const baseUrl = BACKEND_WS_URL;
      const path = isScanning ? '/scan' : '/auth';
      
      const token = isAuthen ? getLogined() : undefined;
      // console.log('Test');
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
        ws.onerror = () => {
          // console.error('WebSocket error:', error);
          setErrors("การเชื่อมต่อล้มเหลว กรุณาลองใหม่อีกครั้ง");
        };
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // console.error('Error switching camera:', error);
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
    setInstruction("");
    setErrorDirection("");
    setWebSocket(null); 
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

  const DigitalClock: React.FC<{ time: string }> = ({ time }) => {
    return (
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in-out">
        <div className="font-mono text-xl md:text-2xl tracking-wider">
          {time}
        </div>
      </div>
    );
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

      // กนาดของวิดีโอ
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;

      // คำนวณขนาดกรอบที่ต้องการ (380x380 pixels หรือตามที่แสดงในหน้าจอ)
      const frameSize = Math.min(videoWidth, videoHeight) * 0.6;

      // กำหนดขนาด canvas ให้ตรงกับกรอบที่แสดง
      canvas.width = frameSize;
      canvas.height = frameSize;

      // คำนวณตำแหน่งกึ่งกลางเพื่อให้ตรงกับกรอบที่แสดง
      const centerX = (videoWidth - frameSize) / 2;
      const centerY = (videoHeight - frameSize) / 2;

      // วาดภาพลงบน canvas
      if (context) {
        // ทำ mirror ภาพ
        context.translate(canvas.width, 0);
        context.scale(-1, 1);

        // วาดภาพเฉพาะส่วนที่อยู่ในกรอบ
        context.drawImage(
          video,
          centerX, centerY, frameSize, frameSize, // source rectangle
          0, 0, frameSize, frameSize // destination rectangle
        );
      }

      // แปลง canvas เป็น base64
      const croppedImageBase64 = canvas.toDataURL('image/jpeg', 0.9);

      // แปลง base64 เป็น byte array
      const imageData = croppedImageBase64.split(',')[1];
      const byteCharacters = atob(imageData);
      const byteArray = new Uint8Array(Array.from(byteCharacters).map(char => char.charCodeAt(0)));

      websocket.send(JSON.stringify({
        captured_image: Array.from(byteArray)
      }));

      setInstruction("กำลังประมวลผลภาพ...");

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // console.error("Error capturing and sending image:", error);
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
        <Header profileimage={profileImage} currentMenuItem={currentMenuItem} name={userDetails.name} >
          
          </Header>
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
                    mirrored={facingMode === "user"}
                    videoConstraints={{
                      facingMode: facingMode,
                      width: { ideal: 1280 },
                      height: { ideal: 720 }
                    }}
                  />
                  {/* ย้ายปุ่มถ่ายภาพมาไว้นอก div ที่มี position relative */}
                  {isScanning && !isAuthen && (
                    <div className="fixed bottom-0 left-0 right-0 mb-8 flex justify-center z-[60]">
                      <button
                        onClick={captureImage}
                        className="px-8 py-4 bg-blue-600 text-white rounded-full hover:bg-blue-700 
                transition-colors flex items-center gap-3 text-lg font-semibold shadow-lg"
                      >
                        <Camera size={28} />
                        ถ่ายภาพ
                      </button>
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-[380px] h-[380px] border-4 border-blue-500 rounded-lg shadow-xl top-[-50px]">
                      {/* กรอบวงกลมสำหรับแนวนำการจัดวางใบหน้า */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-1/2 h-1/2 border-2 border-dashed border-white/50 rounded-full">
                          {/* เพิ่มเส้นประกอบเพื่อช่วยในการจัดตำแหน่ง */}
                          <div className="absolute inset-0">
                            <div className="absolute left-1/2 top-0 bottom-0 w-px border-l border-white/30"></div>
                            <div className="absolute top-1/2 left-0 right-0 h-px border-t border-white/30"></div>
                          </div>
                        </div>
                      </div>

                      {/* เพิ่มเส้นแนวนำที่มุม */}
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white/50"></div>
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white/50"></div>
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white/50"></div>
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white/50"></div>
                    </div>
                  </div>

                  <div className="absolute top-0 left-0 right-0 flex flex-col items-center pt-4 mt-5">
                    <div className="text-center">
                      {(isScanning && !isAuthen ? instruction || "วางใบหน้าในกรอบ" : instruction) && (
                        <p className="custom-instruction-text">
                          {isScanning && !isAuthen ? instruction || "วางใบหน้าในกรอบ" : instruction}
                        </p>
                      )}
                      {errorDirectiom || errorsMessage ? (
                        <p className="custom-error-text mt-1">
                          {errorDirectiom || errorsMessage}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </>
              </div>
            </div>
          )}
          
        </div>
      {((!isScanning && !isAuthen) && (!showConfirmDialog && !isRegister)) && (
        <div className="fixed md:bottom-4 bottom-24 right-4 z-50">
          <DigitalClock time={currentTime} />
        </div>
      )}
        <Outlet />

      </main>
    </div>
  );
};

export default FaceScanPage;