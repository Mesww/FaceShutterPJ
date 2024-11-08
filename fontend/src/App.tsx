import './App.css'
import createRoute from "./components/index";
import adminRoutes from "./components/admin/Adminroutes";
import Adminlayout from "./components/admin/Adminlayout";
import ProtectmapRoute from "./components/ProtectmapRoute";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
function App() {
  const createRoutes = createRoute();
  const adminRoute = adminRoutes();
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Navigate to="/faceDetection" />}
        />
        {createRoutes.map((route, index) => (
          <Route key={index} path={route.path} element={route.element} />
        ))}
      </Routes>

      {/* Amin Routes */}
      <Routes>
        <Route
          path="/admin/*"
          element={
            <ProtectmapRoute requireRoles={["ADMIN"]}>
              <Adminlayout />
            </ProtectmapRoute>
          }
        >
          {adminRoute.map((route, index) => (
            <Route key={index} path={route.path} element={route.element} />
          ))}
          </Route>
      </Routes>
    </BrowserRouter>
  )
}
export default App;
