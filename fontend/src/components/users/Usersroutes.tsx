import { RouteObject } from "react-router-dom";
import UsersFacescan from "../users/users_facescan/Users_facescan";
import UsersEditprofile from "../users/users_editprofile/Users_editprofile";
import UsersHistory from "../users/users_history/Users_history";
import UsersNotification from "../users/users_notification/Users_notificationproblem";
// import CameraCapture from "../facedection/facedection";
// import UsersDashboard from "../users/users_dashboard/Users_dashboard";

  const usersRoutes = (): RouteObject[] => [
    // { path: "UsersDashboard", element: <UsersDashboard  /> },
    { path: "UsersFacescan", element: <UsersFacescan  /> },
    { path: "UsersEditprofile", element: <UsersEditprofile /> },
    { path: "UsersHistory", element: <UsersHistory  /> },
    { path: "UsersNotification", element: <UsersNotification  /> },
    // {path:"CameraCapture",element:<CameraCapture/>}
  ];
  
  export default usersRoutes;