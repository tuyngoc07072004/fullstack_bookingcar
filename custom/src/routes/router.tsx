import { createHashRouter } from "react-router-dom";
import App from "../App";
import Home from "../pages/Home";
import BookRide from "../pages/BookRide";
import Confirmation from "../pages/Confirmation";
import MyTrips from "../pages/MyTrips";

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
]);

export default router;