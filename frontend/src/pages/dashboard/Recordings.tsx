import React, { useEffect, useState } from "react";
import { Card, Empty, Row, Col, Spin, Modal, Button, Tabs, Tag, List } from "antd";
import {
  PlayCircleOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  DownloadOutlined,
  FileTextOutlined,
  BulbOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import { ApiClientWithHeaders } from "../../api/index";

interface RecordingItem {
  id: string;
  storagePath: string;
  duration: number | null;
  createdAt: string;
  meeting: {
    id: string;
    title: string;
    code: string;
    startedAt: string | null;
    endedAt: string | null;
    host: { id: string; firstName?: string; lastName?: string; email: string };
  };
}

interface ReportItem {
  id: string;
  meetingId: string;
  summary: string;
  keyTopics: string[];
  actionItems: string[];
  createdAt: string;
  meeting: {
    id: string;
    title: string;
    code: string;
    startedAt: string | null;
    endedAt: string | null;
  };
}

const Recordings: React.FC = () => {
  const auth = useSelector((state: RootState) => state.authState.auth);
  const { t } = useTranslation();
  const [recordings, setRecordings] = useState<RecordingItem[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [playerUrl, setPlayerUrl] = useState<string | null>(null);
  const [playerTitle, setPlayerTitle] = useState("");
  const [loadingUrl, setLoadingUrl] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);

  useEffect(() => {
    if (!auth?.accessToken) return;
    const api = ApiClientWithHeaders(auth.accessToken);

    Promise.all([
      api.recordings.list({ limit: 50 }).catch(() => ({ data: null })),
      api.reports.list({ limit: 50 }).catch(() => ({ data: null })),
    ])
      .then(([recRes, repRes]) => {
        if (recRes.data?.recordings) setRecordings(recRes.data.recordings);
        if (repRes.data?.reports) setReports(repRes.data.reports);
      })
      .finally(() => setLoading(false));
  }, [auth]);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "N/A";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const handlePlay = async (rec: RecordingItem) => {
    if (!auth?.accessToken) return;
    setLoadingUrl(rec.id);
    try {
      const api = ApiClientWithHeaders(auth.accessToken);
      const res = await api.recordings.getUrl(rec.id);
      if (res.data?.url) {
        setPlayerUrl(res.data.url);
        setPlayerTitle(rec.meeting.title || "Recording");
      }
    } catch {
      // failed
    } finally {
      setLoadingUrl(null);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 64 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ margin: "0 0 16px", fontSize: 24, fontWeight: 700, color: "#1e293b" }}>
        {t("recordings.title")}
      </h1>

      <Tabs
        defaultActiveKey="recordings"
        items={[
          {
            key: "recordings",
            label: (
              <span>
                <PlayCircleOutlined /> {t("recordings.recordingsTab")} ({recordings.length})
              </span>
            ),
            children: recordings.length === 0 ? (
              <Card style={{ borderRadius: 12, textAlign: "center" }}>
                <Empty
                  image={<PlayCircleOutlined style={{ fontSize: 48, color: "#cbd5e1" }} />}
                  description={t("recordings.noRecordings")}
                >
                  <p style={{ color: "#94a3b8", fontSize: 14 }}>
                    {t("recordings.noRecordingsDesc")}
                  </p>
                </Empty>
              </Card>
            ) : (
              <Row gutter={[16, 16]}>
                {recordings.map((rec) => (
                  <Col key={rec.id} xs={24} sm={12} md={8} lg={6}>
                    <Card
                      hoverable
                      onClick={() => handlePlay(rec)}
                      style={{ borderRadius: 12, border: "1px solid #e5e7eb" }}
                      styles={{ body: { padding: 16 } }}
                    >
                      <div
                        style={{
                          width: "100%",
                          aspectRatio: "16/9",
                          background: "#0f172a",
                          borderRadius: 8,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginBottom: 12,
                        }}
                      >
                        {loadingUrl === rec.id ? (
                          <Spin />
                        ) : (
                          <PlayCircleOutlined style={{ fontSize: 40, color: "#3b82f6" }} />
                        )}
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 15, color: "#1e293b", marginBottom: 4 }}>
                        {rec.meeting.title || "Untitled Meeting"}
                      </div>
                      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 2 }}>
                        <CalendarOutlined style={{ marginRight: 4 }} />
                        {rec.meeting.startedAt
                          ? new Date(rec.meeting.startedAt).toLocaleDateString()
                          : new Date(rec.createdAt).toLocaleDateString()}
                      </div>
                      <div style={{ fontSize: 12, color: "#94a3b8" }}>
                        <ClockCircleOutlined style={{ marginRight: 4 }} />
                        {formatDuration(rec.duration)}
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            ),
          },
          {
            key: "reports",
            label: (
              <span>
                <FileTextOutlined /> {t("recordings.reportsTab")} ({reports.length})
              </span>
            ),
            children: reports.length === 0 ? (
              <Card style={{ borderRadius: 12, textAlign: "center" }}>
                <Empty
                  image={<FileTextOutlined style={{ fontSize: 48, color: "#cbd5e1" }} />}
                  description={t("recordings.noReports")}
                >
                  <p style={{ color: "#94a3b8", fontSize: 14 }}>
                    {t("recordings.noReportsDesc")}
                  </p>
                </Empty>
              </Card>
            ) : (
              <Row gutter={[16, 16]}>
                {reports.map((report) => (
                  <Col key={report.id} xs={24} sm={12} md={8}>
                    <Card
                      hoverable
                      onClick={() => setSelectedReport(report)}
                      style={{ borderRadius: 12, border: "1px solid #e5e7eb" }}
                      styles={{ body: { padding: 16 } }}
                    >
                      <div style={{ fontWeight: 600, fontSize: 15, color: "#1e293b", marginBottom: 8 }}>
                        {report.meeting.title || "Untitled Meeting"}
                      </div>
                      <p style={{ fontSize: 13, color: "#64748b", marginBottom: 12, lineHeight: 1.5 }}>
                        {report.summary.length > 150
                          ? report.summary.slice(0, 150) + "..."
                          : report.summary}
                      </p>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
                        {(report.keyTopics || []).slice(0, 3).map((topic, i) => (
                          <Tag key={i} color="blue" style={{ fontSize: 11 }}>
                            {topic}
                          </Tag>
                        ))}
                        {(report.keyTopics || []).length > 3 && (
                          <Tag style={{ fontSize: 11 }}>+{report.keyTopics.length - 3}</Tag>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: "#94a3b8" }}>
                        <CalendarOutlined style={{ marginRight: 4 }} />
                        {new Date(report.createdAt).toLocaleDateString()}
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            ),
          },
        ]}
      />

      {/* Video Player Modal */}
      <Modal
        open={!!playerUrl}
        title={playerTitle}
        footer={
          playerUrl ? (
            <a href={playerUrl} download target="_blank" rel="noreferrer">
              <Button icon={<DownloadOutlined />}>Download</Button>
            </a>
          ) : null
        }
        onCancel={() => setPlayerUrl(null)}
        width={720}
        destroyOnClose
      >
        {playerUrl && (
          <video
            src={playerUrl}
            controls
            autoPlay
            style={{ width: "100%", borderRadius: 8, background: "#000" }}
          />
        )}
      </Modal>

      {/* Report Detail Modal */}
      <Modal
        open={!!selectedReport}
        title={
          <span>
            <FileTextOutlined style={{ marginRight: 8 }} />
            {selectedReport?.meeting.title || "Meeting Report"}
          </span>
        }
        footer={null}
        onCancel={() => setSelectedReport(null)}
        width={640}
      >
        {selectedReport && (
          <div>
            <h4 style={{ color: "#1e293b", marginBottom: 8 }}>{t("recordings.summary")}</h4>
            <p style={{ color: "#475569", lineHeight: 1.6, marginBottom: 20 }}>
              {selectedReport.summary}
            </p>

            <h4 style={{ color: "#1e293b", marginBottom: 8 }}>
              <BulbOutlined style={{ marginRight: 6 }} />
              {t("recordings.keyTopics")}
            </h4>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
              {(selectedReport.keyTopics || []).map((topic, i) => (
                <Tag key={i} color="blue">
                  {topic}
                </Tag>
              ))}
            </div>

            <h4 style={{ color: "#1e293b", marginBottom: 8 }}>
              <CheckCircleOutlined style={{ marginRight: 6 }} />
              {t("recordings.actionItems")}
            </h4>
            {(selectedReport.actionItems || []).length > 0 ? (
              <List
                size="small"
                dataSource={selectedReport.actionItems}
                renderItem={(item) => (
                  <List.Item style={{ padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
                    <span style={{ color: "#475569", fontSize: 13 }}>• {item}</span>
                  </List.Item>
                )}
              />
            ) : (
              <p style={{ color: "#94a3b8", fontSize: 13 }}>{t("recordings.noActionItems")}</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Recordings;
