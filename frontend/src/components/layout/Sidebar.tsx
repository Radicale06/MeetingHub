import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AppstoreOutlined,
  VideoCameraOutlined,
  PlayCircleOutlined,
  TeamOutlined,
  SettingOutlined,
} from "@ant-design/icons";

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const navItems = [
    { label: t("meetings.title").replace(/s$/, ""), labelKey: "dashboard", icon: <AppstoreOutlined />, path: "/dashboard" },
    { label: t("meetings.title"), icon: <VideoCameraOutlined />, path: "/dashboard/meetings" },
    { label: t("recordings.title"), icon: <PlayCircleOutlined />, path: "/dashboard/recordings" },
    { label: t("contacts.title"), icon: <TeamOutlined />, path: "/dashboard/contacts" },
  ];

  const isActive = (path: string) => {
    if (path === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(path);
  };

  const itemStyle = (path: string): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 16px",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: isActive(path) ? 600 : 400,
    color: isActive(path) ? "#3b82f6" : "#64748b",
    backgroundColor: isActive(path) ? "#eff6ff" : "transparent",
    transition: "all 0.2s",
  });

  return (
    <div
      style={{
        width: 240,
        minWidth: 240,
        height: "100vh",
        backgroundColor: "#fff",
        borderRight: "1px solid #e5e7eb",
        display: "flex",
        flexDirection: "column",
        padding: "20px 12px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px 24px", cursor: "pointer" }}
        onClick={() => navigate("/dashboard")}
      >
        <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <VideoCameraOutlined style={{ color: "#fff", fontSize: 16 }} />
        </div>
        <span style={{ fontSize: 18, fontWeight: 700, color: "#1e293b" }}>{t("common.appName")}</span>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
        {navItems.map((item) => (
          <div key={item.path} style={itemStyle(item.path)} onClick={() => navigate(item.path)}>
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      <div style={itemStyle("/dashboard/settings")} onClick={() => navigate("/dashboard/settings")}>
        <span style={{ fontSize: 18 }}><SettingOutlined /></span>
        <span>{t("common.settings")}</span>
      </div>
    </div>
  );
};

export default Sidebar;
