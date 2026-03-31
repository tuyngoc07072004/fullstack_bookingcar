import { createHashRouter } from "react-router-dom";
import App from "../App";
import Home from "../pages/Home";
import BookRide from "../pages/BookRide";
import Confirmation from "../pages/Confirmation";
import MyTrips from "../pages/MyTrips";
import StaffDashboard from "../pages/Staff/StaffDashboard";
import StaffLogin from "../pages/Staff/StaffLogin";
import StaffRegister from "../pages/Staff/StaffRegister";

const router = createHashRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: "book-ride", element: <BookRide /> },
      { path: "confirmation", element: <Confirmation /> },
      { path: "my-trips", element: <MyTrips /> },
    ],
  },
  { path: "staff-login", element: <StaffLogin /> },
  { path: "staff-register", element: <StaffRegister /> },
  { path: "staff-dashboard", element: <StaffDashboard /> },

]);

export default router;