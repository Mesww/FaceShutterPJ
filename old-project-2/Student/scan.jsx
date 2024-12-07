// import React, { useState, useEffect, useRef } from 'react';
// import { Camera, UserCheck2, UserX2 } from 'lucide-react';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

// const FaceScan = () => {
//   const [scanning, setScanning] = useState(false);
//   const [student, setStudent] = useState(null);
//   const [status, setStatus] = useState('idle');
//   const videoRef = useRef(null);
//   const streamRef = useRef(null);

//   const startScanning = async () => {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ video: true });
//       if (videoRef.current) {
//         videoRef.current.srcObject = stream;
//         streamRef.current = stream;
//         setScanning(true);
//         pollForFaces();
//       }
//     } catch (error) {
//       console.error('Error accessing camera:', error);
//       setStatus('error');
//     }
//   };

//   const stopScanning = () => {
//     if (streamRef.current) {
//       streamRef.current.getTracks().forEach(track => track.stop());
//       setScanning(false);
//       setStudent(null);
//       setStatus('idle');
//     }
//   };

//   const pollForFaces = async () => {
//     if (!scanning) return;

//     try {
//       const response = await fetch('/api/scan-face', {
//         method: 'POST',
//         body: JSON.stringify({
//           image: videoRef.current.toDataURL('image/jpeg')
//         })
//       });

//       const data = await response.json();
      
//       if (data.student) {
//         setStudent(data.student);
//         setStatus(data.status);
//         if (data.status === 'MARKED' || data.status === 'ALREADY_MARKED') {
//           setTimeout(stopScanning, 3000);
//         }
//       }
//     } catch (error) {
//       console.error('Error scanning face:', error);
//     }

//     if (scanning) {
//       setTimeout(pollForFaces, 500);
//     }
//   };

//   useEffect(() => {
//     return () => {
//       stopScanning();
//     };
//   }, []);

//   const renderStatus = () => {
//     switch (status) {
//       case 'MARKED':
//         return (
//           <Alert className="bg-green-100">
//             <UserCheck2 className="h-5 w-5" />
//             <AlertTitle>Attendance Marked</AlertTitle>
//             <AlertDescription>
//               Successfully recorded attendance for {student?.name}
//             </AlertDescription>
//           </Alert>
//         );
//       case 'ALREADY_MARKED':
//         return (
//           <Alert className="bg-yellow-100">
//             <UserCheck2 className="h-5 w-5" />
//             <AlertTitle>Already Marked</AlertTitle>
//             <AlertDescription>
//               Attendance was already recorded for {student?.name}
//             </AlertDescription>
//           </Alert>
//         );
//       case 'UNKNOWN':
//         return (
//           <Alert className="bg-red-100">
//             <UserX2 className="h-5 w-5" />
//             <AlertTitle>Unknown Student</AlertTitle>
//             <AlertDescription>
//               Unable to recognize the student. Please try again.
//             </AlertDescription>
//           </Alert>
//         );
//       case 'error':
//         return (
//           <Alert className="bg-red-100">
//             <AlertTitle>Error</AlertTitle>
//             <AlertDescription>
//               An error occurred while scanning. Please try again.
//             </AlertDescription>
//           </Alert>
//         );
//       default:
//         return null;
//     }
//   };

//   const renderStudentProfile = () => {
//     if (!student) return null;

//     return (
//       <Card className="mt-4">
//         <CardHeader className="bg-pink-100">
//           <CardTitle>Student Profile</CardTitle>
//         </CardHeader>
//         <CardContent className="text-center">
//           <div className="mt-4 space-y-2">
//             <h3 className="text-xl font-semibold">{student.name}</h3>
//             <p className="text-gray-600">ID: {student.student_id}</p>
//             <p className="text-gray-600">Major: {student.major}</p>
//           </div>
//         </CardContent>
//       </Card>
//     );
//   };

//   return (
//     <div className="p-6 max-w-4xl mx-auto">
//       <div className="flex flex-col items-center space-y-4">
//         <Card className="w-full">
//           <CardHeader>
//             <CardTitle className="flex items-center justify-between">
//               Face Attendance Scanner
//               <button
//                 onClick={scanning ? stopScanning : startScanning}
//                 className={`flex items-center px-4 py-2 rounded-lg ${
//                   scanning
//                     ? 'bg-red-500 hover:bg-red-600'
//                     : 'bg-blue-500 hover:bg-blue-600'
//                 } text-white`}
//               >
//                 <Camera className="mr-2 h-5 w-5" />
//                 {scanning ? 'Stop Scanning' : 'Start Scanning'}
//               </button>
//             </CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
//               {scanning ? (
//                 <video
//                   ref={videoRef}
//                   autoPlay
//                   playsInline
//                   className="w-full h-full object-cover"
//                 />
//               ) : (
//                 <div className="flex items-center justify-center h-full">
//                   <p className="text-gray-500">Camera is off</p>
//                 </div>
//               )}
//             </div>
//             {renderStatus()}
//           </CardContent>
//         </Card>
//         {renderStudentProfile()}
//       </div>
//     </div>
//   );
// };

// export default FaceScan;