import React, { useState, useRef, useEffect } from 'react';
import { Camera, Scan, X, FlipHorizontal, UserCircle } from "lucide-react";
import Sidebar from '../sidebar/Sidebar';
import Header from '../header/Header.js';
import { useUserData } from '../../../containers/provideruserdata';
import { edituserdata } from '@/containers/getUserdata.js'; // Import the edituserdata function
import LoadingSpinner from '@/components/loading/loading.js';
import Webcam from 'react-webcam';

const EditProfilePage: React.FC = () => {
  const { userData, profileImage, isLoading, setProfileImage,refreshUserData,isLogined } = useUserData();
  const [isScanning, setIsScanning] = useState(false);
  const [facingMode, setFacingMode] = useState("user");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const webcamRef = useRef<Webcam>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [isLoadings, setIsLoadings] = useState(false);
  const [loadingmessage, setLoadingmessage] = useState("");
  // State for form fields
  const [name, setName] = useState(userData?.name || '');
  const [email, setEmail] = useState(userData?.email || '');
  const [phone, setPhone] = useState(userData?.tel || '');
  // console.log(userData);


  const stopCamera = () => {
    if (webcamRef.current?.video) {
      const mediaStream = webcamRef.current.video.srcObject as MediaStream;
      mediaStream?.getTracks().forEach(track => track.stop());
    }
  };

  const handleClose = () => {
    stopCamera();
    setIsScanning(false);
  };

  
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await edituserdata(userData?.employee_id || '', name, email, phone, imageFile);
      await refreshUserData();
      alert('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    }
  };

  
    // Camera Controls
  const handleSwitchCamera = () => {
      stopCamera();
      setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };


  const ScanningOverlay = () =>  (
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
  );

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
    setLoadingmessage("กำลังโหลดข้อมูล...");
    console.log('isLoadings:',isLoadings);
  }, [isLoading, isLoadings]);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">

      {/* Mobile Sidebar */}
      <div className={`md:hidden`}>
        <Sidebar
          isSidebarCollapsed={false}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
          isLogined={isLogined}
        />
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
          isLogined={isLogined}
        />
      </div>

      {/* Main Content */}
      <div className={`flex-1 w-full md:w-auto transition-all duration-300 
        ${isSidebarCollapsed ? 'md:ml-16' : 'md:ml-72'}`}>
         {isLoading? (
              <LoadingSpinner message={loadingmessage} />
            ) : ( <Header name={name} currentMenuItem={currentMenuItem} />)}

        <div className="w-full p-2 md:p-4 bg-white">
          <div className="p-4 md:p-6 bg-white rounded-lg shadow">
            <div className="mb-6 md:mb-8">
              <h3 className="text-xl md:text-2xl font-semibold mb-2">แก้ไขข้อมูลส่วนตัว</h3>
              {/* <p className="text-gray-600">อัพเดตข้อมูลและรูปโปรไฟล์ของคุณ</p> */}
            </div>

            {isLoading? (
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
                      onClick={() => setIsScanning(true)}
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

          {isScanning && <ScanningOverlay />}
        </div>
      </div >
    </div >
  );
};

export default EditProfilePage;