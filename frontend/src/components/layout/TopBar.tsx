import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Input, Avatar, Dropdown, Badge } from "antd";
import { BellOutlined, SearchOutlined, UserOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import { RootState } from "../../store/store";
import { logout } from "../../store/features/authSlice";
import LanguageSwitcher from "../LanguageSwitcher";

const TopBar: React.FC = () => {
  const auth = useSelector((state: RootState) => state.authState.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const user = auth?.user;
  const initials =
    user?.firstName && user?.lastName
      ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
      : user?.email
        ? user.email[0].toUpperCase()
        : "U";

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const dropdownItems: MenuProps["items"] = [
    {
      key: "profile",
      label: t("common.profile"),
      onClick: () => navigate("/dashboard/settings"),
    },
    {
      key: "settings",
      label: t("common.settings"),
      onClick: () => navigate("/dashboard/settings"),
    },
    { type: "divider" },
    {
      key: "logout",
      label: t("common.signOut"),
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <div
      style={{
        height: 64,
        backgroundColor: "#fff",
        borderBottom: "1px solid #e5e7eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
      }}
    >
      <Input
        placeholder={t("common.search")}
        prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
        style={{ width: 360, borderRadius: 8 }}
        allowClear
      />

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <LanguageSwitcher dark={false} />

        <Badge count={0} dot={false}>
          <BellOutlined style={{ fontSize: 20, color: "#64748b", cursor: "pointer" }} />
        </Badge>

        <Dropdown menu={{ items: dropdownItems }} placement="bottomRight" trigger={["click"]}>
          <div style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            {user?.avatarUrl ? (
              <Avatar src={user.avatarUrl} size={36} />
            ) : (
              <Avatar
                size={36}
                style={{ backgroundColor: "#3b82f6", fontWeight: 600 }}
                icon={!initials ? <UserOutlined /> : undefined}
              >
                {initials}
              </Avatar>
            )}
          </div>
        </Dropdown>
      </div>
    </div>
  );
};

export default TopBar;
