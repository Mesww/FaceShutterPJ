import { RouteObject } from "react-router-dom";
import Homepage from "./home/home";
import FaceDetection from "./facedection/facedection";

  
  // ? use this function to create admin routes
  const createRoutes = (): RouteObject[] => [
    { path: "Home", element: <Homepage  /> },
    { path: "FaceDetection", element: <FaceDetection  /> },
  ];
  
  export default createRoutes;