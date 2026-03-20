import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Table, Tabs, Tag, Button, Spin } from "antd";
import type { ColumnsType } from "antd/es/table";
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

const statusColorMap: Record<string, string> = {
  SCHEDULED: "blue",
  LIVE: "green",
  ENDED: "default",
  CANCELLED: "red",
};

const Meetings: React.FC = () => {
  const auth = useSelector((state: RootState) => state.authState.auth);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("upcoming");

  useEffect(() => {
    fetchMeetings();
  }, [filter]);

  const fetchMeetings = async () => {
    if (!auth?.accessToken) return;
    setLoading(true);
    try {
      const api = ApiClientWithHeaders(auth.accessToken);
      const res = await (api as any).request({
        path: "/meetings",
        method: "GET",
        query: { filter },
      });
      if (res.ok && Array.isArray(res.data)) {
        setMeetings(res.data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const statusLabelMap: Record<string, string> = {
    SCHEDULED: t("meetings.scheduled"),
    LIVE: t("meetings.live"),
    ENDED: t("meetings.ended"),
    CANCELLED: t("meetings.cancelled"),
  };

  const columns: ColumnsType<Meeting> = [
    {
      title: t("meetings.date"),
      dataIndex: "scheduledAt",
      key: "time",
      render: (val: string) => (val ? new Date(val).toLocaleString() : "-"),
      width: 200,
    },
    {
      title: t("meetings.meetingTitle"),
      dataIndex: "title",
      key: "title",
      render: (val: string) => val || "Untitled Meeting",
    },
    {
      title: t("meetings.host"),
      dataIndex: "host",
      key: "host",
      render: (host: Meeting["host"]) =>
        host
          ? `${host.firstName || ""} ${host.lastName || ""}`.trim() || host.email || "-"
          : "-",
    },
    {
      title: t("meetings.participants"),
      dataIndex: "participantCount",
      key: "participants",
      render: (val: number) => val ?? "-",
      width: 120,
    },
    {
      title: t("meetings.status"),
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={statusColorMap[status] || "default"}>
          {statusLabelMap[status] || status}
        </Tag>
      ),
      width: 120,
    },
    {
      title: t("meetings.actions"),
      key: "actions",
      width: 180,
      render: (_: any, record: Meeting) => (
        <div style={{ display: "flex", gap: 8 }}>
          {(record.status === "SCHEDULED" || record.status === "LIVE") && (
            <Button
              type="primary"
              size="small"
              onClick={() => navigate(`/meeting/${record.code}`)}
            >
              {t("meetings.join")}
            </Button>
          )}
          <Button size="small" onClick={() => navigate(`/dashboard/meetings/${record.id}`)}>
            {t("meetings.details")}
          </Button>
        </div>
      ),
    },
  ];

  const tabItems = [
    { key: "upcoming", label: t("meetings.upcoming") },
    { key: "past", label: t("meetings.past") },
    { key: "all", label: t("meetings.all") },
  ];

  return (
    <div>
      <h1 style={{ margin: "0 0 16px", fontSize: 24, fontWeight: 700, color: "#1e293b" }}>
        {t("meetings.title")}
      </h1>

      <Tabs
        activeKey={filter}
        onChange={(key) => setFilter(key)}
        items={tabItems}
        style={{ marginBottom: 16 }}
      />

      {loading ? (
        <Spin style={{ display: "block", textAlign: "center", padding: 48 }} />
      ) : (
        <Table
          columns={columns}
          dataSource={meetings}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: t("meetings.noMeetings") }}
          style={{ backgroundColor: "#fff", borderRadius: 12 }}
        />
      )}
    </div>
  );
};

export default Meetings;
