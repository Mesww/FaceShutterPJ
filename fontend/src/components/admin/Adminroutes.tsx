import { RouteObject } from "react-router-dom";
// import AdminDashboard from "./admin_dashboard/Admin_dashboard";
import AdminManage from "./admin_manage/Admin_manage";
// import AdminAccess from "./admin_access/Admin_access";
import AdminReports from "./admin_reports/Admin_reports";
import AdminNotifications from "./admin_notification/NotificationProblem";
// import Login from "../login/login";
import AdminSettings from "./admin_setting/admin_setting";


  // ? use this function to create admin routes
  const adminRoutes = (): RouteObject[] => [
    // { path: "Login", element: <Login  /> },
    { path: "AdminManage", element: <AdminManage  /> },
    { path: "AdminReports", element: <AdminReports  /> },
    { path: "AdminNotifications", element: <AdminNotifications  /> },
    { path: "AdminSettings", element: <AdminSettings  /> },
  ];
  
  export default adminRoutes;