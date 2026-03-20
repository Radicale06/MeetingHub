import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Form, Input, Select, Button, Tabs, Upload, Avatar, message } from "antd";
import { UploadOutlined, UserOutlined } from "@ant-design/icons";
import { RootState } from "../../store/store";
import { updateUser } from "../../store/features/authSlice";
import { ApiClientWithHeaders } from "../../api/index";

const timezones = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Dubai",
  "Australia/Sydney",
];

const languages = [
  { value: "en", label: "English" },
  { value: "fr", label: "French" },
  { value: "es", label: "Spanish" },
  { value: "de", label: "German" },
  { value: "ar", label: "Arabic" },
];

const Settings: React.FC = () => {
  const auth = useSelector((state: RootState) => state.authState.auth);
  const dispatch = useDispatch();
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const user = auth?.user;

  const handleSave = async (values: any) => {
    if (!auth?.accessToken) return;
    setSaving(true);
    try {
      const api = ApiClientWithHeaders(auth.accessToken);
      const res = await (api as any).request({
        path: "/user/me",
        method: "PATCH",
        body: {
          firstName: values.firstName,
          lastName: values.lastName,
          jobTitle: values.jobTitle,
          company: values.company,
          timezone: values.timezone,
          language: values.language,
        },
      });
      if (res.ok) {
        dispatch(
          updateUser({
            firstName: values.firstName,
            lastName: values.lastName,
            jobTitle: values.jobTitle,
            company: values.company,
            timezone: values.timezone,
            language: values.language,
          })
        );
        message.success("Profile updated successfully");
      } else {
        message.error("Failed to update profile");
      }
    } catch {
      message.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const initials =
    user?.firstName && user?.lastName
      ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
      : user?.email
        ? user.email[0].toUpperCase()
        : "U";

  const ProfileTab = (
    <div style={{ maxWidth: 560 }}>
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          firstName: user?.firstName || "",
          lastName: user?.lastName || "",
          email: user?.email || "",
          jobTitle: user?.jobTitle || "",
          company: user?.company || "",
          timezone: user?.timezone || "UTC",
          language: user?.language || "en",
        }}
        onFinish={handleSave}
      >
        {/* Avatar upload area */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
          {user?.avatarUrl ? (
            <Avatar src={user.avatarUrl} size={72} />
          ) : (
            <Avatar
              size={72}
              style={{ backgroundColor: "#3b82f6", fontSize: 28, fontWeight: 600 }}
              icon={!initials ? <UserOutlined /> : undefined}
            >
              {initials}
            </Avatar>
          )}
          <Upload showUploadList={false} beforeUpload={() => false}>
            <Button icon={<UploadOutlined />}>Upload Photo</Button>
          </Upload>
        </div>

        <div style={{ display: "flex", gap: 16 }}>
          <Form.Item name="firstName" label="First Name" style={{ flex: 1 }}>
            <Input placeholder="First name" />
          </Form.Item>
          <Form.Item name="lastName" label="Last Name" style={{ flex: 1 }}>
            <Input placeholder="Last name" />
          </Form.Item>
        </div>

        <Form.Item name="email" label="Email">
          <Input disabled />
        </Form.Item>

        <Form.Item name="jobTitle" label="Job Title">
          <Input placeholder="e.g. Product Manager" />
        </Form.Item>

        <Form.Item name="company" label="Company">
          <Input placeholder="e.g. Acme Inc." />
        </Form.Item>

        <h3 style={{ fontSize: 16, fontWeight: 600, color: "#1e293b", marginTop: 32, marginBottom: 16 }}>
          Experience Preferences
        </h3>

        <div style={{ display: "flex", gap: 16 }}>
          <Form.Item name="timezone" label="Timezone" style={{ flex: 1 }}>
            <Select
              showSearch
              options={timezones.map((tz) => ({ value: tz, label: tz }))}
              placeholder="Select timezone"
            />
          </Form.Item>
          <Form.Item name="language" label="Language" style={{ flex: 1 }}>
            <Select options={languages} placeholder="Select language" />
          </Form.Item>
        </div>

        <Form.Item style={{ marginTop: 8 }}>
          <Button type="primary" htmlType="submit" loading={saving}>
            Save Changes
          </Button>
        </Form.Item>
      </Form>
    </div>
  );

  const PlaceholderTab = (label: string) => (
    <div style={{ padding: 24, color: "#94a3b8" }}>
      {label} settings will be available soon.
    </div>
  );

  const tabItems = [
    { key: "profile", label: "Profile", children: ProfileTab },
    { key: "security", label: "Account Security", children: PlaceholderTab("Account Security") },
    { key: "notifications", label: "Notifications", children: PlaceholderTab("Notifications") },
    { key: "integrations", label: "Integrations", children: PlaceholderTab("Integrations") },
    { key: "meeting-prefs", label: "Meeting Preferences", children: PlaceholderTab("Meeting Preferences") },
  ];

  return (
    <div>
      <h1 style={{ margin: "0 0 16px", fontSize: 24, fontWeight: 700, color: "#1e293b" }}>
        Settings
      </h1>

      <div style={{ backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: 24 }}>
        <Tabs tabPosition="left" items={tabItems} style={{ minHeight: 480 }} />
      </div>
    </div>
  );
};

export default Settings;
