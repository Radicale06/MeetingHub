import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Button, Select, Spin, Alert, Typography } from "antd";
import {
  VideoCameraOutlined,
  AudioOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { RootState } from "../../store/store";
import { ApiClientWithHeaders } from "../../api/index";

const { Title, Text } = Typography;

interface DeviceInfo {
  deviceId: string;
  label: string;
}

const PreJoin: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const auth = useSelector((state: RootState) => state.authState.auth);

  const [meetingTitle, setMeetingTitle] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [cameras, setCameras] = useState<DeviceInfo[]>([]);
  const [microphones, setMicrophones] = useState<DeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>("");
  const [selectedMic, setSelectedMic] = useState<string>("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Enumerate devices
  const enumerateDevices = useCallback(async () => {
    try {
      // Request permissions first so labels are available
      const tempStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      tempStream.getTracks().forEach((t) => t.stop());

      const devices = await navigator.mediaDevices.enumerateDevices();
      const cams = devices
        .filter((d) => d.kind === "videoinput")
        .map((d) => ({ deviceId: d.deviceId, label: d.label || `Camera ${d.deviceId.slice(0, 5)}` }));
      const mics = devices
        .filter((d) => d.kind === "audioinput")
        .map((d) => ({ deviceId: d.deviceId, label: d.label || `Microphone ${d.deviceId.slice(0, 5)}` }));

      setCameras(cams);
      setMicrophones(mics);
      if (cams.length > 0) setSelectedCamera(cams[0].deviceId);
      if (mics.length > 0) setSelectedMic(mics[0].deviceId);
    } catch {
      // Permission denied or no devices
    }
  }, []);

  // Start camera preview
  useEffect(() => {
    if (!selectedCamera) return;
    let cancelled = false;

    const startPreview = async () => {
      // Stop previous stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: selectedCamera } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        // Camera access failed
      }
    };

    startPreview();
    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [selectedCamera]);

  // Fetch meeting info
  useEffect(() => {
    if (!auth?.accessToken || !code) return;

    const fetchMeeting = async () => {
      setLoading(true);
      setError(null);
      try {
        const api = ApiClientWithHeaders(auth.accessToken);
        const res = await api.meetings.getByCode(code);
        setMeetingTitle(res.data?.title || "Untitled Meeting");
      } catch {
        setError("Failed to load meeting information.");
      } finally {
        setLoading(false);
      }
    };

    fetchMeeting();
    enumerateDevices();
  }, [auth, code, enumerateDevices]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const handleJoin = async () => {
    if (!auth?.accessToken || !code) return;
    setJoining(true);
    setError(null);

    // Stop preview before joining
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    try {
      const api = ApiClientWithHeaders(auth.accessToken);
      const res = await (api as any).meetings.join(code);
      if (res.ok && res.data) {
        const { serverUrl, token, meeting } = res.data;
        navigate(`/meeting/${code}/room`, {
          state: {
            serverUrl,
            livekitToken: token,
            meetingId: meeting.id,
            meetingTitle: meeting.title || meetingTitle,
          },
        });
      } else {
        setError("Failed to join meeting. Please try again.");
        setJoining(false);
      }
    } catch {
      setError("Failed to join meeting. Please try again.");
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 48, color: "#fff" }} spin />} />
        <Text style={{ color: "#94a3b8", marginTop: 16 }}>{t("meeting.loadingMeeting")}</Text>
      </div>
    );
  }

  if (error && !meetingTitle) {
    return (
      <div style={styles.container}>
        <Alert
          type="error"
          message={t("meeting.notFound")}
          description={error}
          showIcon
          style={{ maxWidth: 480 }}
        />
        <Button
          type="primary"
          style={{ marginTop: 24 }}
          onClick={() => navigate("/dashboard")}
        >
          {t("common.backToDashboard")}
        </Button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <Title level={3} style={{ color: "#fff", margin: "0 0 4px" }}>
          {meetingTitle}
        </Title>
        <Text style={{ color: "#94a3b8", marginBottom: 24, display: "block" }}>
          {t("meeting.getReady")}
        </Text>

        {/* Camera preview */}
        <div style={styles.previewWrapper}>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={styles.video}
          />
          {!selectedCamera && (
            <div style={styles.noCamera}>
              <VideoCameraOutlined style={{ fontSize: 48, color: "#475569" }} />
              <Text style={{ color: "#64748b", marginTop: 8 }}>{t("meeting.noCamera")}</Text>
            </div>
          )}
        </div>

        {/* Device selectors */}
        <div style={styles.deviceRow}>
          <div style={styles.deviceSelect}>
            <Text style={{ color: "#94a3b8", fontSize: 12, marginBottom: 4, display: "block" }}>
              <VideoCameraOutlined /> {t("meeting.camera")}
            </Text>
            <Select
              value={selectedCamera || undefined}
              onChange={setSelectedCamera}
              placeholder="Select camera"
              style={{ width: "100%" }}
              options={cameras.map((c) => ({ value: c.deviceId, label: c.label }))}
              disabled={cameras.length === 0}
            />
          </div>
          <div style={styles.deviceSelect}>
            <Text style={{ color: "#94a3b8", fontSize: 12, marginBottom: 4, display: "block" }}>
              <AudioOutlined /> {t("meeting.microphone")}
            </Text>
            <Select
              value={selectedMic || undefined}
              onChange={setSelectedMic}
              placeholder="Select microphone"
              style={{ width: "100%" }}
              options={microphones.map((m) => ({ value: m.deviceId, label: m.label }))}
              disabled={microphones.length === 0}
            />
          </div>
        </div>

        {error && (
          <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />
        )}

        <Button
          type="primary"
          size="large"
          block
          loading={joining}
          onClick={handleJoin}
          style={{ height: 48, fontSize: 16, fontWeight: 600, borderRadius: 8 }}
        >
          {t("meeting.joinMeeting")}
        </Button>

        <Button
          type="text"
          style={{ color: "#94a3b8", marginTop: 8 }}
          onClick={() => navigate("/dashboard")}
        >
          {t("common.backToDashboard")}
        </Button>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    background: "#0f0f23",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    maxWidth: 560,
    width: "100%",
    textAlign: "center",
  },
  previewWrapper: {
    position: "relative",
    width: "100%",
    aspectRatio: "16/9",
    background: "#1a1a2e",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 20,
  },
  video: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transform: "scaleX(-1)",
  },
  noCamera: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  deviceRow: {
    display: "flex",
    gap: 12,
    marginBottom: 20,
  },
  deviceSelect: {
    flex: 1,
    textAlign: "left",
  },
};

export default PreJoin;
