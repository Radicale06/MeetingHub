import "./App.css";
import { BrowserRouter, Routes as RouterRoutes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "./store/store";
import { ReactNode } from "react";
import { Routes } from "./utils/routes_name";

// Pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AuthCallback from "./pages/AuthCallback";
import Unauthorized from "./pages/Unauthorized";

// Dashboard
import DashboardLayout from "./components/layout/DashboardLayout";
import Home from "./pages/dashboard/Home";
import Meetings from "./pages/dashboard/Meetings";
import Recordings from "./pages/dashboard/Recordings";
import Contacts from "./pages/dashboard/Contacts";
import Settings from "./pages/dashboard/Settings";

// Meeting
import PreJoin from "./pages/meeting/PreJoin";
import MeetingRoom from "./pages/meeting/MeetingRoom";
import MeetingEnded from "./pages/meeting/MeetingEnded";

function App() {
  const auth = useSelector((state: RootState) => state.authState.auth);

  const PrivateRoute = ({ children }: { children: ReactNode }) => {
    if (!auth) return <Navigate to={Routes.login} />;
    return <>{children}</>;
  };

  const PublicRoute = ({ children }: { children: ReactNode }) => {
    if (auth) return <Navigate to={Routes.dashboard} />;
    return <>{children}</>;
  };

  return (
    <BrowserRouter>
      <RouterRoutes>
        {/* Public */}
        <Route path={Routes.landing} element={<Landing />} />
        <Route
          path={Routes.login}
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path={Routes.register}
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        <Route path={Routes.authCallback} element={<AuthCallback />} />
        <Route path={Routes.unauthorized} element={<Unauthorized />} />

        {/* Dashboard (protected, nested) */}
        <Route
          path={Routes.dashboard}
          element={
            <PrivateRoute>
              <DashboardLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Home />} />
          <Route path="meetings" element={<Meetings />} />
          <Route path="recordings" element={<Recordings />} />
          <Route path="contacts" element={<Contacts />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Meeting (protected) */}
        <Route
          path="/meeting/:code"
          element={
            <PrivateRoute>
              <PreJoin />
            </PrivateRoute>
          }
        />
        <Route
          path="/meeting/:code/room"
          element={
            <PrivateRoute>
              <MeetingRoom />
            </PrivateRoute>
          }
        />
        <Route
          path="/meeting/:code/ended"
          element={
            <PrivateRoute>
              <MeetingEnded />
            </PrivateRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to={Routes.landing} />} />
      </RouterRoutes>
    </BrowserRouter>
  );
}

export default App;
