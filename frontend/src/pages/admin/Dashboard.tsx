import { useDispatch } from "react-redux";
import { useNavigate, Outlet, Link } from "react-router-dom";
import { logout } from "../../store/features/authSlice";
import { Button } from "antd";
import { Routes } from "../../utils/routes_name";

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate(Routes.login);
  };

  return (
    <div>
      <h1>Admin Dashboard</h1>

      {/* Navbar */}
      <nav style={{ marginBottom: "20px" }}>
        <Link to="/admin/dashboard/profile" style={{ marginRight: "10px" }}>
          Profile
        </Link>
        <Link to="/admin/dashboard/page" style={{ marginRight: "10px" }}>
          Page
        </Link>
        <Button onClick={handleLogout}>Logout</Button>
      </nav>

      {/* Nested Routes */}
      <Outlet />
    </div>
  );
};

export default AdminDashboard;
