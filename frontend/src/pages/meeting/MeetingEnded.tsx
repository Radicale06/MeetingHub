import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button, Typography } from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

export default function MeetingEnded() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f0f23",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <CheckCircleOutlined
        style={{ fontSize: 64, color: "#22c55e", marginBottom: 24 }}
      />
      <Title level={2} style={{ color: "#fff", margin: "0 0 8px" }}>
        {t("meeting.endedTitle")}
      </Title>
      <Text style={{ color: "#94a3b8", fontSize: 16, marginBottom: 32 }}>
        {t("meeting.endedSubtitle")}
      </Text>

      <div style={{ display: "flex", gap: 12 }}>
        <Button
          type="primary"
          size="large"
          onClick={() => navigate(`/meeting/${code}`, { replace: true })}
          style={{ borderRadius: 8 }}
        >
          {t("meeting.rejoin")}
        </Button>
        <Button
          size="large"
          onClick={() => navigate("/dashboard", { replace: true })}
          style={{ borderRadius: 8, color: "#94a3b8", borderColor: "#334155" }}
        >
          {t("common.backToDashboard")}
        </Button>
      </div>
    </div>
  );
}
