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
// import { useUserData } from '@/containers/provideruserdata.js';

const FaceScanPage: React.FC<FaceScanPageProps> = () => {
  // State
  const [isScanning, setIsScanning] = useState(false);
  const [isLoadings, setIsLoadings] = useState(false);
  const [userDetails, setUserDetails] = useState<User>({
    employee_id: "",
    name: "",
    email: "",
    password: "",
    tel: "",
  });
  const [employeeId, setEmployeeId] = useState<string>('');
  // const [capturedImage, setCapturedImage] = useState<string | null>(null);

  
  const [loadingmessage, setLoadingMessage] = useState<string | null>(null);
  const webcamRef = useRef<Webcam>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [imageSrc, setImageSrc] = useState<string | null>(null);  // State to hold the image
  const [scanDirections, setScanDirections] = useState<string[]>([]);
  const [instruction, setInstruction] = useState("");
  const [websocket, setWebSocket] = useState<WebSocket | null>(null);
  const [isAuthen, setIsAuthen] = useState(false);
  const [errors, setErrors] = useState<string | null>();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  // ============= Provider ===============  
  const { isLogined, setIsLogined, userData, isCheckinorout } = useUserData();

  const [login, setLogin] = useState<boolean>(false);

  const [currentDirectionIdx, setCurrentDirectionIdx] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  // send image to backend
  const sendImage = useCallback((ws: WebSocket) => {
    if (!webcamRef.current || !ws || ws.readyState !== WebSocket.OPEN) return null;

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return null;

    const canvas = document.createElement('canvas');
    const video = webcamRef.current.video;

    if (!video) return null;

    // คำนวณขนาดและตำแหน่งของกรอบ
    const frameSize = Math.min(video.videoWidth, video.videoHeight) * 0.7;
    const x = (video.videoWidth - frameSize) / 2;
    const y = (video.videoHeight - frameSize) / 2;

    canvas.width = frameSize;
    canvas.height = frameSize;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // สลับการวาดภาพถ้าใช้ front camera เพื่อให้ไม่ mirror
      if (facingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }

      ctx.drawImage(
        video,
        x, y, frameSize, frameSize,  // source rectangle
        0, 0, frameSize, frameSize   // destination rectangle
      );

      const croppedImageSrc = canvas.toDataURL('image/jpeg');

      try {
        const byteCharacters = atob(croppedImageSrc.split(",")[1]);
        const byteNumbers = Array.from(byteCharacters).map((char) => char.charCodeAt(0));
        const byteArray = new Uint8Array(byteNumbers);

        ws.send(
          JSON.stringify({
            image: Array.from(byteArray),
          })
        );
      } catch (error) {
        console.error("Error sending image:", error);
        setConnectionStatus('disconnected');
      }

      return croppedImageSrc;
    }

    return null;
  }, [facingMode]);
  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((event: MessageEvent) => {
    try {
      const message = event.data;
      if (message.startsWith("{")) {
        const jsonData = JSON.parse(message);
        if (jsonData.data === undefined) {
          console.log("Received JSON data:", jsonData);
          return;
        }
        console.log("Received JSON data:", jsonData.data);
        const status = jsonData.data.status;
        const messages = jsonData.data.message;
        const translateMessage = (originalMessage: string): string => {
          const translations: { [key: string]: string } = {
            // Authentication errors
            "Invalid credentials": "ข้อมูลประจำตัวไม่ถูกต้อง",
            "User not found": "ไม่พบผู้ใช้งาน",
            "Incorrect password": "รหัสผ่านไม่ถูกต้อง",

            // Face scanning errors
            "Face not detected": "ไม่พบใบหน้า กรุณาวางหน้าให้ชัดเจน",
            "Multiple faces detected": "พบใบหน้ามากกว่า 1 ใบ กรุณาถ่ายเดี่ยว",
            "Poor lighting conditions": "แสงไม่เพียงพอ กรุณาปรับแสง",
            "Face too close": "ใบหน้าใกล้กล้องเกินไป กรุณาถอยห่าง",
            "Face too far": "ใบหน้าห่างจากกล้องเกินไป กรุณาเข้าใกล้",

            // Default case
            "default": "กรุณาวางใบหน้าให้อยู่ในกรอบ" 
          };

          // Check if there's an exact match first
          if (translations[originalMessage]) {
            return translations[originalMessage];
          }

          // If no exact match, check for partial matches
          for (const [key, value] of Object.entries(translations)) {
            if (originalMessage.includes(key)) {
              return value;
            }
          }

          // If no match found, return the original message or a default error message
          return translations['default'];
        };
        // Handle the JSON data here
        if (status === "progress") {
          console.log("Progress:", messages);
          setInstruction(messages);
          // setTotal_steps(jsonData['total_steps']);
        }
        else if (status === 'pending') {
          console.log("User data received, awaiting scan...");
          console.log("User data:", jsonData.data);
        } else if (status === 'failed') {
          console.error("Error:", messages);
          const translatedMessage = translateMessage(messages);
          setInstruction(translatedMessage);
          setErrors(translatedMessage);

        } else if (status === 'stopped') {
          setIsScanning(false);
          setIsAuthen(false);
          setInstruction("");
          setUserDetails({ employee_id: "", name: "", email: "", password: "", tel: "" });
          setConnectionStatus('disconnected');
        }
         else if (status === 'success') {
          console.log("User data and images saved successfully");
          console.log("User data:", messages);
          console.log("User token:", jsonData.data.token);
          const token = jsonData.data.token;
          setIsScanning(false);
          setIsAuthen(false);
          setInstruction("");
          setUserDetails({ employee_id: "", name: "", email: "", password: "", tel: "" });
          setConnectionStatus('disconnected');
          setLogined(token)
          setIsLogined(true);
          setLogin(true);
        }
      }
      // Check if the message looks like base64 image data
      if (message.startsWith("/9j/") || message.includes("base64,")) {
        console.log("Received image data");
        let base64Image;

        // If the message already includes the data URI prefix, use it directly
        if (message.startsWith("data:image/jpeg;base64,")) {
          base64Image = message;
        } else {
          // Otherwise, create the data URI
          base64Image = `data:image/jpeg;base64,${message}`;
        }

        setImageSrc(base64Image);
        return;
      }
      if (message.startsWith("Please move your head to:")) {
        setInstruction(message.replace("Please move your head to: ", ""));
        setConnectionStatus('connected');
      }
      else if (message.startsWith("Image captured for")) {
        setCurrentDirectionIdx((prev) => prev + 1);
      }
      else if (message.startsWith("Incorrect direction!") ||
        message.startsWith("No face detected")) {
        console.log(message);

      }
      else if (message.startsWith("User data and images saved successfully")) {
        alert("Scan complete and data saved!");
        setIsScanning(false);
        setInstruction("");
        setUserDetails({ employee_id: "", name: "", email: "", password: "", tel: "" });
        setConnectionStatus('disconnected');
      }
      else if (message.startsWith("image_data:")) {
        const imageData = message.replace("image_data:", "");
        console.log("Received base64 image data:", imageData); // Check the image data in the console

        const base64Image = `data:image/jpeg;base64,${imageData}`;
        setImageSrc(base64Image);
      }
      else {
        console.log("Received message:", message);
      }
    } catch (error) {
      console.error("Error processing WebSocket message:", error);
    }
  }, [setImageSrc,  setIsLogined,setLogin]);

  useEffect(() => {
    let imageInterval: NodeJS.Timeout;

    const setupWebSocket = (url: string, token?: string) => {
      setIsLoadings(true);
      setLoadingMessage("กำลังเชื่อมต่อเซิฟเวอร์...");

      // Create WebSocket with token in query parameter instead of subprotocol
      const wsUrl = token 
        ? `${url}?token=${encodeURIComponent(token)}`
        : url;
      console.log(wsUrl);
      const ws = new WebSocket(wsUrl);
      setWebSocket(ws);
      setConnectionStatus('connecting');

      ws.onopen = () => {
        setConnectionStatus('connected');
        setIsLoadings(false);
        setLoadingMessage("กำลังสแกนใบหน้า...");
        
        // Send initial data
        if (isScanning) {
          ws.send(JSON.stringify(userDetails));
        } else if (isAuthen && employeeId) {
          ws.send(JSON.stringify({ employee_id: employeeId }));
        }

        // Start sending images
        imageInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            sendImage(ws);
          }
        }, 1000);
      };

      ws.onmessage = handleWebSocketMessage;

      ws.onclose = (event) => {
        console.log("WebSocket closed:", event.code, event.reason);
        cleanup();
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        cleanup();
        // Optionally show error to user
        setErrors("การเชื่อมต่อล้มเหลว กรุณาลองใหม่อีกครั้ง");
      };
    };

    const cleanup = () => {
      if (imageInterval) {
        clearInterval(imageInterval);
      }
      if (websocket) {
        websocket.close();
      }
      setWebSocket(null);
      setConnectionStatus('disconnected');
    };

    if (isScanning || isAuthen) {
      const baseUrl = "ws://localhost:8000/ws";
      const path = isScanning ? '/scan' : '/auth';
      const token = isAuthen ? getLogined() : undefined;
      setupWebSocket(`${baseUrl}${path}`, token);

      return () => {
        cleanup();
      };
    }
  }, [isAuthen, isScanning, userDetails, employeeId, sendImage, handleWebSocketMessage, websocket]);

  // Employee ID form submission
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // ตรวจสอบว่ามีการกรอก employee ID หรือไม่
    if (!employeeId || employeeId.trim() === '') {
      setErrors('กรุณากรอก Employee ID');
      return;
    }

    // ตรวจสอบรูปแบบของ Employee ID
    if (!/^\d{6,10}$/.test(employeeId)) {
      setErrors('Employee ID must be 6-10 digits.');
      return;
    }

    const error = validateEmployeeId(employeeId);

    if (error) {
      setErrors(employeeId);
      return;
    }

    console.log("Form submitted with Employee ID:", employeeId);
    const isUser: Responsedata = await getisuserdata(employeeId);
    console.log("User data:", isUser.data);

    if (!isUser.data) {
      setShowConfirmDialog(true); // แสดง confirmation dialog แทนที่จะแสดง RegisModal ทันที
      return;
    }
    setIsAuthen(true);
  };

  // เพิ่ม handlers สำหรับ confirmation dialog
  const handleConfirmRegistration = () => {
    setShowConfirmDialog(false);
    setIsRegister(true);
  };

  const handleCancelRegistration = () => {
    setShowConfirmDialog(false);
    setEmployeeId("");
  };

  // Handle camera switch
  const handleSwitchCamera = () => {
    // Stop current video track
    if (webcamRef.current && webcamRef.current.video) {
      const mediaStream = webcamRef.current.video.srcObject as MediaStream;
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => {
          track.stop();
        });
      }
    }

    // Toggle facing mode
    setFacingMode(prevMode => prevMode === 'user' ? 'environment' : 'user');
  };
  const stopCamera = () => {
    if (webcamRef.current && webcamRef.current.video) {
      const mediaStream = webcamRef.current.video.srcObject as MediaStream;
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => {
          track.stop();
        });
      }
    }
  }
  // Handle close
  const handleClose = () => {
    stopCamera();
    setIsScanning(false);
    setIsAuthen(false);
    // setCapturedImage(null);
  };


  // Map paths to titles and descriptions
  const menuItems = isLogined|| login ? [
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
  },];

  const currentMenuItem = menuItems.find((item) => item.path === location.pathname);

  // logging state changes
  useEffect(() => {

    if (userData) {
      // console.log('User data:', userData.employee_id);
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

  const validateEmployeeId = (value: string) => {
    // Example validation: must be non-empty and numeric with 6-10 digits
    if (!value || value.trim() === '') {
      return "กรุณากรอก Employee ID";
    }
    if (!/^\d{6,10}$/.test(value)) {
      return "Employee ID must be 6-10 digits.";
    }
    return null;
  };

  const handleInputChange = (value: string) => {
    const errors = validateEmployeeId(value);
    setErrors(errors);
    setEmployeeId(value);
  };

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
          isLogined={isLogined||login}
        />
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
          isLogined={isLogined||login}
        />
      </div>

      {/* Main Content */}
      <main className={`flex-1 w-full md:w-auto transition-all duration-300 
        ${isSidebarCollapsed ? 'md:ml-16' : 'md:ml-72'}`}>
        <Header currentMenuItem={currentMenuItem} name={userDetails.name} />
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
                disabled={isLogined|| login}
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
                disabled={isScanning || (isLogined && isCheckinorout === null)}
                className={`w-full px-4 py-2 ${isScanning
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
                  } text-white rounded-lg transition-colors flex items-center justify-center gap-2`}
              >
                <Camera size={20} />
                {isLogined||login
                  ? (isCheckinorout ?? "ยังไม่ถึงเวลาเข้าหรือออกงาน")
                  : (isCheckinorout ?? "Login")}
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
                (
                <>
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    className="absolute inset-0 w-full h-full object-cover"
                    mirrored={true}
                  />
                  {/* <canvas ref={canvasRef} className="hidden" /> */}

                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-[420px] h-[420px] border-4 border-blue-500 rounded-lg shadow-xl 
                          before:absolute before:inset-0 before:border-2 before:border-dashed before:border-white 
                          before:pointer-events-none before:rounded-lg">
                      {/* เพิ่มเส้นขอบ dashed ด้านใน */}
                    </div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black/60 text-white p-4 rounded-lg">
                      <p className="text-xl font-semibold text-center">
                        {instruction}
                      </p>
                    </div>
                  </div>
                  {/* Inside the webcam scanning area */}
                  {instruction && (
                    <div className={`absolute inset-0 flex items-center justify-center ${errors ? 'text-red-500' : 'text-white'}`}>
                      <div className={`bg-black/60 p-4 rounded-lg ${errors ? 'bg-red-500/60' : 'bg-black/60'}`}>
                        <p className="text-xl font-semibold text-center">
                          {instruction}
                        </p>
                      </div>
                    </div>
                  )}
                </>
                )
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