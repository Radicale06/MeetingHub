import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  List,
  Tag,
  message,
  Spin,
} from "antd";
import {
  VideoCameraOutlined,
  CalendarOutlined,
  LinkOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { RootState } from "../../store/store";
import { ApiClientWithHeaders } from "../../api/index";

interface Meeting {
  id: string;
  title: string;
  code: string;
  scheduledAt: string;
  status: string;
  host?: { firstName?: string; lastName?: string; email?: string };
  participantCount?: number;
}

const Home: React.FC = () => {
  const auth = useSelector((state: RootState) => state.authState.auth);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleForm] = Form.useForm();

  const user = auth?.user;
  const firstName = user?.firstName || user?.email?.split("@")[0] || "there";

  useEffect(() => {
    fetchUpcoming();
  }, []);

  const fetchUpcoming = async () => {
    if (!auth?.accessToken) return;
    setLoading(true);
    try {
      const api = ApiClientWithHeaders(auth.accessToken);
      const res = await (api as any).request({
        path: "/meetings",
        method: "GET",
        query: { filter: "upcoming", limit: 5 },
      });
      if (res.ok && Array.isArray(res.data)) {
        setUpcomingMeetings(res.data);
      }
    } catch {
      // silently fail for now
    } finally {
      setLoading(false);
    }
  };

  const handleInstantMeeting = async () => {
    if (!auth?.accessToken) return;
    try {
      const api = ApiClientWithHeaders(auth.accessToken);
      const res = await (api as any).request({
        path: "/meetings/instant",
        method: "POST",
      });
      if (res.ok && res.data?.code) {
        navigate(`/meeting/${res.data.code}`);
      } else {
        message.error("Failed to create meeting");
      }
    } catch {
      message.error("Failed to create meeting");
    }
  };

  const handleSchedule = async (values: any) => {
    if (!auth?.accessToken) return;
    setScheduleLoading(true);
    try {
      const api = ApiClientWithHeaders(auth.accessToken);
      const invitees = values.invitees
        ? values.invitees.split(",").map((e: string) => e.trim()).filter(Boolean)
        : [];
      const res = await (api as any).request({
        path: "/meetings",
        method: "POST",
        body: {
          title: values.title,
          scheduledAt: values.dateTime?.toISOString(),
          invitees,
        },
      });
      if (res.ok) {
        message.success("Meeting scheduled!");
        setScheduleOpen(false);
        scheduleForm.resetFields();
        fetchUpcoming();
      } else {
        message.error("Failed to schedule meeting");
      }
    } catch {
      message.error("Failed to schedule meeting");
    } finally {
      setScheduleLoading(false);
    }
  };

  const handleJoin = () => {
    const code = joinCode.trim();
    if (!code) return;
    // Extract code from URL if pasted
    const match = code.match(/\/meeting\/(.+)/);
    navigate(`/meeting/${match ? match[1] : code}`);
    setJoinOpen(false);
    setJoinCode("");
  };

  const actionCards = [
    {
      title: t("dashboard.newMeeting"),
      description: t("dashboard.newMeetingDesc"),
      icon: <VideoCameraOutlined style={{ fontSize: 28, color: "#3b82f6" }} />,
      color: "#eff6ff",
      onClick: handleInstantMeeting,
    },
    {
      title: t("dashboard.scheduleMeeting"),
      description: t("dashboard.scheduleMeetingDesc"),
      icon: <CalendarOutlined style={{ fontSize: 28, color: "#8b5cf6" }} />,
      color: "#f5f3ff",
      onClick: () => setScheduleOpen(true),
    },
    {
      title: t("dashboard.joinViaLink"),
      description: t("dashboard.joinViaLinkDesc"),
      icon: <LinkOutlined style={{ fontSize: 28, color: "#22c55e" }} />,
      color: "#f0fdf4",
      onClick: () => setJoinOpen(true),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#1e293b" }}>
          {t("dashboard.welcome", { name: firstName })}
        </h1>
        <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>
          {t("dashboard.welcomeSubtitle")}
        </p>
      </div>

      {/* Action cards */}
      <div style={{ display: "flex", gap: 16, marginBottom: 32 }}>
        {actionCards.map((card) => (
          <Card
            key={card.title}
            hoverable
            onClick={card.onClick}
            style={{ flex: 1, borderRadius: 12, border: "1px solid #e5e7eb" }}
            bodyStyle={{ padding: 20 }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                backgroundColor: card.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
              }}
            >
              {card.icon}
            </div>
            <div style={{ fontWeight: 600, fontSize: 15, color: "#1e293b" }}>{card.title}</div>
            <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 2 }}>{card.description}</div>
          </Card>
        ))}
      </div>

      {/* Upcoming meetings */}
      <div style={{ marginBottom: 32 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "#1e293b" }}>
            {t("dashboard.upcomingMeetings")}
          </h2>
          <Button type="link" onClick={() => navigate("/dashboard/meetings")}>
            View all
          </Button>
        </div>
        {loading ? (
          <Spin />
        ) : (
          <List
            dataSource={upcomingMeetings}
            locale={{ emptyText: t("dashboard.noUpcoming") }}
            renderItem={(item) => (
              <List.Item
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 8,
                  marginBottom: 8,
                  padding: "12px 16px",
                  border: "1px solid #e5e7eb",
                }}
                actions={[
                  <Button
                    key="join"
                    type="primary"
                    size="small"
                    onClick={() => navigate(`/meeting/${item.code}`)}
                  >
                    Join
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <ClockCircleOutlined style={{ fontSize: 20, color: "#3b82f6", marginTop: 4 }} />
                  }
                  title={item.title || "Untitled Meeting"}
                  description={
                    <span style={{ color: "#94a3b8", fontSize: 13 }}>
                      {new Date(item.scheduledAt).toLocaleString()}
                      {item.status && (
                        <Tag
                          color={item.status === "LIVE" ? "green" : "blue"}
                          style={{ marginLeft: 8 }}
                        >
                          {item.status}
                        </Tag>
                      )}
                    </span>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </div>

      {/* Recent recordings placeholder */}
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "#1e293b" }}>
            {t("dashboard.recentRecordings")}
          </h2>
          <Button type="link" onClick={() => navigate("/dashboard/recordings")}>
            View archive
          </Button>
        </div>
        <Card style={{ borderRadius: 12, textAlign: "center", color: "#94a3b8", padding: 24 }}>
          {t("dashboard.noRecordings")}
        </Card>
      </div>

      {/* Schedule modal */}
      <Modal
        title={t("dashboard.scheduleMeeting")}
        open={scheduleOpen}
        onCancel={() => setScheduleOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={scheduleForm} layout="vertical" onFinish={handleSchedule}>
          <Form.Item name="title" label="Meeting Title" rules={[{ required: true }]}>
            <Input placeholder="e.g. Weekly standup" />
          </Form.Item>
          <Form.Item name="dateTime" label="Date & Time" rules={[{ required: true }]}>
            <DatePicker showTime style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="invitees" label="Invitee Emails (comma-separated)">
            <Input placeholder="john@example.com, jane@example.com" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={scheduleLoading} block>
              Schedule
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Join modal */}
      <Modal
        title={t("meetings.join")}
        open={joinOpen}
        onCancel={() => setJoinOpen(false)}
        onOk={handleJoin}
        okText="Join"
        okButtonProps={{ disabled: !joinCode.trim() }}
      >
        <Input
          placeholder="Enter meeting code or paste link"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value)}
          onPressEnter={handleJoin}
          style={{ marginTop: 8 }}
        />
      </Modal>
    </div>
  );
};

export default Home;
