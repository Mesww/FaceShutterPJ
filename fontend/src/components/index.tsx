import { RouteObject } from "react-router-dom";
import Homepage from "./home/home";
import FaceDetection from "./facedection/facedection";
import AdminDashboard from "./admin/admin_dashboard/Admin_dashboard";
import AdminManage from "./admin/admin_manage/Admin_manage";
import AdminAccess from "./admin/admin_access/Admin_access";
import AdminReports from "./admin/admin_reports/Admin_reports";
import ServiceDashboard from "./service_unit/service_unit_dashboard/Service_unit";
import ServiceNotifications from "./service_unit/service_unit_notification/NotificationProblem";
import ServiceCheck from "./service_unit/service_unit_check_attandend/Service_check-attandend";
import UsersDashboard from "./users/users_dashboard/Users_dashboard";


  // ? use this function to create admin routes
  const createRoutes = (): RouteObject[] => [
    { path: "Home", element: <Homepage  /> },
    { path: "FaceDetection", element: <FaceDetection  /> },
    { path: "AdminDashboard", element: <AdminDashboard  /> },
    { path: "AdminManage", element: <AdminManage  /> },
    { path: "AdminAccess", element: <AdminAccess  /> },
    { path: "AdminReports", element: <AdminReports  /> },
    { path: "ServiceDashboard", element: <ServiceDashboard  /> },
    { path: "ServiceNotifications", element: <ServiceNotifications  /> },
    { path: "ServiceCheck", element: <ServiceCheck  /> },
    { path: "UsersDashboard", element: <UsersDashboard  /> },
  ];
  
  export default createRoutes;