import './App.css'
// import createRoute from "./components/index";
import UsersFacescan from "./components/users/users_facescan/Users_facescan";
import Login from "./components/login/login";

import adminRoutes from "./components/admin/Adminroutes";
import usersRoutes from "./components/users/Usersroutes";
import Adminlayout from "./components/admin/Adminlayout";
import Userslayout from "./components/users/Userslayout";
import ProtectmapRoute from "./components/ProtectmapRoute";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { UserProvider } from './containers/provideruserdata';
function App() {
  // const createRoutes = createRoute();
  const adminRoute = adminRoutes();
  const usersRoute = usersRoutes();

  return (

    <Router>
      
      <UserProvider>
        <Routes>
        <Route path='/users/UsersFacescan'element={ <UsersFacescan  />} />

          <Route
            path="/"
            element={<Navigate to="/users/UsersFacescan" />}
          />

          <Route
            path="/users/"
            element={<Navigate to="/users/UsersFacescan" />}
          />

          <Route
            path="users/*"
            element={
              <ProtectmapRoute requireRoles={["ADMIN", "USER"]}>
                <Userslayout />
              </ProtectmapRoute>
            }
          >
            {usersRoute.map((route, index) => (
              <Route key={index} path={route.path} element={route.element} />
            ))}
          </Route>
        </Routes>
      </UserProvider>

        {/* Amin Routes */}
        <Routes>
          <Route path='/admin/' element={<Navigate to="/admin/login" />}>
          </Route>
          
          <Route path='/admin/login' element={<Login/>}>
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
    </Router>
  )
}
export default App;
