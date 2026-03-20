import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { useAppWebSocket } from "../../hooks/useAppWebSocket";

const DashboardLayout: React.FC = () => {
  useAppWebSocket();

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <TopBar />
        <div
          style={{
            flex: 1,
            overflow: "auto",
            backgroundColor: "#f8fafc",
            padding: 24,
          }}
        >
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
