import './App.css'
// import createRoute from "./components/index";
import adminRoutes from "./components/admin/Adminroutes";
import usersRoutes from "./components/users/Usersroutes";
import Adminlayout from "./components/admin/Adminlayout";
import Userslayout from "./components/users/Userslayout";
import ProtectmapRoute from "./components/ProtectmapRoute";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
function App() {
  // const createRoutes = createRoute();
  const adminRoute = adminRoutes();
  const usersRoute = usersRoutes();
  return (
    <BrowserRouter>
      {/* <Routes>
        {createRoutes.map((route, index) => (
          <Route key={index} path={route.path} element={route.element} />
          ))}
          </Routes> */}

      {/* Users Routes */}
      <Routes>
          <Route
            path="/"
            element={<Navigate to="/users/UsersFacescan" />}
          />

        <Route
          path="users/*"
          element={
            <ProtectmapRoute requireRoles={["ADMIN","USER"]}>
              <Userslayout />
            </ProtectmapRoute>
          }
        >
          {usersRoute.map((route, index) => (
            <Route key={index} path={route.path} element={route.element} />
          ))}
          </Route>
      </Routes>

      {/* Amin Routes */}
      <Routes>
        <Route path='/admin/' element={<Navigate to={"/admin/login"}/>}>

        </Route>
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
