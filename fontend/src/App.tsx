import './App.css'
import createRoute from "./components/index";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
function App() {
  const createRoutes = createRoute();
  return (
    <BrowserRouter>
      <Routes>
      <Route path="/" element={<Navigate to="/faceDetection" />} />
        {createRoutes.map((route, index) => (
          <Route key={index} path={route.path} element={route.element} />
        ))}
      </Routes>
        </BrowserRouter>)
        
      }
export default App;
