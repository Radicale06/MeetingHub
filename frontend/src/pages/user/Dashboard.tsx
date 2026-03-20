import { useDispatch } from "react-redux";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { logout } from "../../store/features/authSlice";
import { Button } from "antd";
import { Routes } from "../../utils/routes_name";

const UserDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate(Routes.login);
  };

  return (
    <div>
      <h1>User Dashboard</h1>

      {/* Navbar */}
      <nav style={{ marginBottom: "20px" }}>
        <Link to="/user/dashboard/profile" style={{ marginRight: "10px" }}>
          Profile
        </Link>
        <Link to="/user/dashboard/page" style={{ marginRight: "10px" }}>
          Page
        </Link>
        <Button onClick={handleLogout}>Logout</Button>
      </nav>

      {/* Nested Routes */}
      <Outlet />

      <Button type="primary" size="large" onClick={handleLogout}>
        Logout
      </Button>
    </div>
  );
};

export default UserDashboard;
