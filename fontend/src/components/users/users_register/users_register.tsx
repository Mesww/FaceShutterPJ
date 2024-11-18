import React, { useState, useRef, useEffect } from 'react';

interface FaceRegisterData {
    name: string;
    id: string;
    faceData: string | null;
}

const FaceRegistration: React.FC = () => {
    const [registerData, setRegisterData] = useState<FaceRegisterData>({
        name: '',
        id: '',
        faceData: null
    });

    const [isCameraActive, setIsCameraActive] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState<string>('');
    const [scanPhase, setScanPhase] = useState<'left' | 'center' | 'right'>('center');
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        if (isCameraActive) {
            const interval = setInterval(() => {
                setScanPhase(current => {
                    switch (current) {
                        case 'center': return 'right';
                        case 'right': return 'left';
                        case 'left': return 'center';
                        default: return 'center';
                    }
                });
            }, 2000);

            return () => clearInterval(interval);
        }
    }, [isCameraActive]);

    const startCamera = async () => {
        try {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                }
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
                
                // แก้ไขการเริ่มเล่นวิดีโอ
                try {
                    await videoRef.current.play();
                    setIsCameraActive(true);
                    setError('');
                } catch (playError) {
                    console.error('Error playing video:', playError);
                    setError('ไม่สามารถเริ่มกล้องได้ กรุณาลองใหม่อีกครั้ง');
                }
            }
        } catch (err) {
            console.error('Error accessing camera:', err);
            if (err instanceof DOMException) {
                if (err.name === 'NotAllowedError') {
                    setError('กรุณาอนุญาตการใช้งานกล้อง');
                } else if (err.name === 'NotFoundError') {
                    setError('ไม่พบกล้องบนอุปกรณ์ของคุณ');
                } else {
                    setError('เกิดข้อผิดพลาดในการเข้าถึงกล้อง: ' + err.message);
                }
            } else {
                setError('ไม่สามารถเข้าถึงกล้องได้ กรุณาตรวจสอบการอนุญาตใช้งานกล้อง');
            }
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsCameraActive(false);
    };

    // จับภาพใบหน้า
    const captureFace = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                // กำหนดขนาด canvas ให้ตรงกับ video
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
                context.drawImage(videoRef.current, 0, 0);
                const faceImage = canvasRef.current.toDataURL('image/jpeg');
                setRegisterData(prev => ({ ...prev, faceData: faceImage }));
                stopCamera();
            }
        }
    };

    // cleanup เมื่อ component unmount
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setRegisterData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Submitting registration data:', registerData);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
    };

    // CSS สำหรับ animation guide
    const getScanGuideStyle = () => {
        const baseStyle = {
            position: 'absolute' as const,
            top: '50%',
            transform: 'translateY(-50%)',
            width: '4px',
            height: '80%',
            backgroundColor: 'rgba(0, 255, 0, 0.5)',
            transition: 'left 0.5s ease-in-out'
        };

        switch (scanPhase) {
            case 'left':
                return { ...baseStyle, left: '20%' };
            case 'right':
                return { ...baseStyle, left: '80%' };
            default:
                return { ...baseStyle, left: '50%' };
        }
    };

    return (
        <div style={{
            maxWidth: '600px',
            margin: '0 auto',
            padding: '20px',
            fontFamily: 'sans-serif'
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '20px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}>
                <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>
                    ลงทะเบียนด้วยใบหน้า
                </h2>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px' }}>
                            ชื่อ-นามสกุล:
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={registerData.name}
                            onChange={handleInputChange}
                            required
                            style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #ccc',
                                borderRadius: '4px'
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '5px' }}>
                            ID:
                        </label>
                        <input
                            type="text"
                            name="id"
                            value={registerData.id}
                            onChange={handleInputChange}
                            required
                            style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #ccc',
                                borderRadius: '4px'
                            }}
                        />
                    </div>

                    <div style={{ marginTop: '20px' }}>
                        <div style={{
                            position: 'relative',
                            width: '100%',
                            aspectRatio: '4/3',
                            backgroundColor: '#f0f0f0',
                            borderRadius: '8px',
                            overflow: 'hidden'
                        }}>
                            {isCameraActive && (
                                <div style={getScanGuideStyle()} />
                            )}
                            {isCameraActive ? (
                                <>
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            transform: 'scaleX(-1)' // กลับภาพซ้าย-ขวา
                                        }}
                                    />
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '10px',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        color: 'white',
                                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                        padding: '8px',
                                        borderRadius: '4px',
                                        fontSize: '14px'
                                    }}>
                                        กรุณาหมุนใบหน้าช้าๆ ตามเส้นสีเขียว
                                    </div>
                                </>
                            ) : registerData.faceData ? (
                                <img
                                    src={registerData.faceData}
                                    alt="Captured face"
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        transform: 'scaleX(-1)' // กลับภาพซ้าย-ขวา
                                    }}
                                />
                            ) : (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: '100%',
                                    color: '#666'
                                }}>
                                    กรุณาเริ่มสแกนใบหน้า
                                </div>
                            )}
                            <canvas ref={canvasRef} style={{ display: 'none' }} />
                        </div>

                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '10px',
                            marginTop: '10px'
                        }}>
                            {!isCameraActive && !registerData.faceData && (
                                <button
                                    type="button"
                                    onClick={startCamera}
                                    style={{
                                        padding: '8px 16px',
                                        backgroundColor: '#007bff',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    เริ่มสแกนใบหน้า
                                </button>
                            )}
                            {isCameraActive && (
                                <button
                                    type="button"
                                    onClick={captureFace}
                                    style={{
                                        padding: '8px 16px',
                                        backgroundColor: '#28a745',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    ถ่ายภาพ
                                </button>
                            )}
                            {registerData.faceData && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setRegisterData(prev => ({ ...prev, faceData: null }));
                                        startCamera();
                                    }}
                                    style={{
                                        padding: '8px 16px',
                                        backgroundColor: '#dc3545',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    ถ่ายใหม่
                                </button>
                            )}
                        </div>
                    </div>

                    {error && (
                        <div style={{
                            color: '#dc3545',
                            textAlign: 'center',
                            marginTop: '10px'
                        }}>
                            {error}
                        </div>
                    )}

                    {showSuccess && (
                        <div style={{
                            backgroundColor: '#d4edda',
                            color: '#155724',
                            padding: '10px',
                            borderRadius: '4px',
                            textAlign: 'center',
                            marginTop: '10px'
                        }}>
                            ลงทะเบียนสำเร็จ! ระบบกำลังประมวลผลข้อมูลของคุณ
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={!registerData.faceData || !registerData.name || !registerData.id}
                        style={{
                            padding: '12px',
                            backgroundColor: (!registerData.faceData || !registerData.name || !registerData.id)
                                ? '#6c757d'
                                : '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: (!registerData.faceData || !registerData.name || !registerData.id)
                                ? 'not-allowed'
                                : 'pointer',
                            marginTop: '20px'
                        }}
                    >
                        ลงทะเบียน
                    </button>
                </form>
            </div>
        </div>
    );
};

export default FaceRegistration;