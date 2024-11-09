import { RouteObject } from "react-router-dom";
import Homepage from "./home/home";
import FaceDetection from "./facedection/facedection";
import AdminDashboard from "./admin/admin_dashboard/Admin_dashboard";
import AdminManage from "./admin/admin_manage/Admin_manage";
import AdminAccess from "./admin/admin_access/Admin_access";
import AdminReports from "./admin/admin_reports/Admin_reports";
import UsersDashboard from "./users/users_dashboard/Users_dashboard";
import UsersFacescan from "./users/users_facescan/Users_facescan";
import UsersEditprofile from "./users/users_editprofile/Users_editprofile";
import UsersHistory from "./users/users_history/Users_history";
import UsersNotification from "./users/users_notification/Users_notificationproblem";
import Login from "./login/login";
// import Sidebar from "./admin/sidebar/Sidebar";


  // ? use this function to create admin routes
  const createRoutes = (): RouteObject[] => [
    { path: "Home", element: <Homepage  /> },
    { path: "FaceDetection", element: <FaceDetection  /> },
    { path: "AdminDashboard", element: <AdminDashboard  /> },
    { path: "AdminManage", element: <AdminManage  /> },
    { path: "AdminAccess", element: <AdminAccess  /> },
    { path: "AdminReports", element: <AdminReports  /> },
    { path: "UsersDashboard", element: <UsersDashboard  /> },
    { path: "UsersFacescan", element: <UsersFacescan  /> },
    { path: "UsersEditprofile", element: <UsersEditprofile  /> },
    { path: "UsersHistory", element: <UsersHistory  /> },
    { path: "UsersNotification", element: <UsersNotification  /> },
    { path: "Login", element: <Login  /> },
    // { path: "Sidebar", element: <Sidebar  /> },
  ];
  
  export default createRoutes;