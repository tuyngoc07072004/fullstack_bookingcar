import { createHashRouter } from "react-router-dom";
import App from "../App";
import Home from "../pages/Home";
import BookRide from "../pages/BookRide";
import Confirmation from "../pages/Confirmation";
import MyTrips from "../pages/MyTrips";
import DriverDashboard from "../pages/Driver/DriverDashboard";
import DriverRegister from "../pages/Driver/DriverRegister";
import DriverLogin from "../pages/Driver/DriverLogin";
import DriverCreateTrip from "../pages/Driver/DriverCreateTrip";

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
  // Driver routes
  { path: "driver-login", element: <DriverLogin /> },
  { path: "driver-register", element: <DriverRegister /> },
  { path: "driver-dashboard", element: <DriverDashboard /> },
  { path: "driver/create-trip", element: <DriverCreateTrip /> },
]);

export default router;