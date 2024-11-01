import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { BACKEND_URL } from '../../configs/backend';
interface FaceDetectionProps {
  width?: number;
  height?: number;
  modelPath?: string;
}

const FaceDetection: React.FC<FaceDetectionProps> = ({ 
  width = 640, 
  height = 480,
  modelPath = '/models/weights' 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [stream, setStream] = useState<MediaStream|null>(null);
  const [error, setError] = useState<string>('');
  const [loadingStatus, setLoadingStatus] = useState<string>('');
  const name = 'test';
  const employee_id = '123456';
  useEffect(() => {
    const loadModels = async () => {
      try {
        setLoadingStatus('Loading models...');
        
        const MODEL_URL = modelPath;

        await faceapi.nets.tinyFaceDetector.load(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.load(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.load(MODEL_URL);
        await faceapi.nets.faceExpressionNet.load(MODEL_URL);

        setIsModelLoaded(true);
        setLoadingStatus('');
      } catch (err) {
        console.error('Error loading models:', err);
        setError(`Error loading models: ${err instanceof Error ? err.message : String(err)}`);
        setLoadingStatus('');
      }
    };

    loadModels();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        const stream = videoRef.current.srcObject as MediaStream;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [modelPath]);

  useEffect(() => {
    const startVideo = async () => {
      if (!videoRef.current || !isModelLoaded) return;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: {
            width: { ideal: width },
            height: { ideal: height }
          }
        });
        videoRef.current.srcObject = stream;
        setStream(stream)
      } catch (err) {
        setError(`Error accessing webcam: ${err instanceof Error ? err.message : String(err)}`);
      }
    };

    if (isModelLoaded) {
      startVideo();
    }
  }, [isModelLoaded, width, height]);

  const handleVideoPlay = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const displaySize = { width, height };
    faceapi.matchDimensions(canvasRef.current, displaySize);

    const detectFaces = async () => {
      if (!videoRef.current || !canvasRef.current) return;

      const detections = await faceapi
        .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions().withFaceDescriptors();

      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      const context = canvasRef.current.getContext('2d');
      
      if (context) {
        context.clearRect(0, 0, width, height);
        faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
        faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections);
        faceapi.draw.drawFaceExpressions(canvasRef.current, resizedDetections);
      }
      const faceEmbeddings = resizedDetections.map(d => d.descriptor); 

      if (faceEmbeddings.length > 1) {
        alert('โปรดอยู่คนเดียวนะไอเหี้ย');
      }

      if (faceEmbeddings.length > 0 && faceEmbeddings.length < 2 && stream ) {
        stream.getTracks().forEach(track => track.stop());
        sendEmbeddingsToBackend(faceEmbeddings);
        console.log(faceEmbeddings);
      }

      requestAnimationFrame(detectFaces); // Use requestAnimationFrame for continuous detection
    };

    detectFaces(); // Start detecting faces
  };

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-500 rounded-md">
        <p className="text-red-700">{error}</p>
        <p className="text-sm text-red-600 mt-2">
          Please make sure the model files are in the correct location: {modelPath}
        </p>
      </div>
    );
  }

  if (loadingStatus) {
    return <div className="text-blue-600">{loadingStatus}</div>;
  }
  const sendEmbeddingsToBackend = (embeddings: Float32Array[]) => {
    // Convert Float32Array to regular array
    const embeddingsArray = embeddings.map(embedding => Array.from(embedding));
  const payload = { embedding: embeddingsArray, name, employee_id };
  
  console.log('Sending payload to backend:', payload); // Log the payload
    fetch(BACKEND_URL + '/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ embedding: embeddingsArray, name, employee_id })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
      }
      return response.json();
    })
    .then(data => {
      console.log(data);
    })
    .catch(error => {
      console.error('Error sending face embeddings:', error);
    });
  };


  return (
    <div className="relative">
      <video
        ref={videoRef}
        className="absolute top-0 left-0"
        autoPlay
        playsInline
        muted
        width={width}
        height={height}
        onPlay={handleVideoPlay}
      />
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0"
        width={width}
        height={height}
      />
    </div>
  );
};

export default FaceDetection;
