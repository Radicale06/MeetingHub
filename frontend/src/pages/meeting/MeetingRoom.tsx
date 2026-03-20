import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { RootState } from "../../store/store";
import { ApiClientWithHeaders } from "../../api/index";
import { Button, Input, Tabs, Badge } from "antd";
import {
  AudioOutlined,
  AudioMutedOutlined,
  VideoCameraOutlined,
  VideoCameraAddOutlined,
  DesktopOutlined,
  LogoutOutlined,
  MessageOutlined,
  TeamOutlined,
  FileTextOutlined,
} from "@ant-design/icons";

import {
  LiveKitRoom,
  VideoTrack,
  useTracks,
  useParticipants,
  useLocalParticipant,
  useRoomContext,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Track, RoomEvent, DataPacket_Kind } from "livekit-client";

interface LocationState {
  serverUrl: string;
  livekitToken: string;
  meetingId: string;
  meetingTitle: string;
}

interface ChatMsg {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
}

interface CaptionMsg {
  speakerId: string;
  speakerName: string;
  original: { text: string; language: string };
  translations?: Record<string, string>;
  timestamp: number;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export default function MeetingRoom() {
  const { code } = useParams<{ code: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;

  if (!state?.serverUrl || !state?.livekitToken) {
    return <RedirectToPreJoin code={code} />;
  }

  return (
    <LiveKitRoom
      serverUrl={state.serverUrl}
      token={state.livekitToken}
      connect={true}
      audio={true}
      video={true}
      options={{
        adaptiveStream: true,
        dynacast: true,
        publishDefaults: {
          videoCodec: "vp9",
        },
      }}
      style={{ height: "100vh", background: "#0f0f23" }}
      onDisconnected={() => navigate(`/meeting/${code}/ended`)}
    >
      <RoomContent
        meetingId={state.meetingId}
        meetingTitle={state.meetingTitle}
        code={code!}
      />
    </LiveKitRoom>
  );
}

function RedirectToPreJoin({ code }: { code?: string }) {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(`/meeting/${code}`, { replace: true });
  }, [code, navigate]);
  return null;
}

function RoomContent({
  meetingId,
  meetingTitle,
  code,
}: {
  meetingId: string;
  meetingTitle: string;
  code: string;
}) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const auth = useSelector((state: RootState) => state.authState.auth);
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const participants = useParticipants();
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
    { source: Track.Source.ScreenShare, withPlaceholder: false },
  ]);

  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [captionsOn, setCaptionsOn] = useState(true);
  const [elapsed, setElapsed] = useState(0);

  // Chat
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Captions
  const [lastCaption, setLastCaption] = useState<CaptionMsg | null>(null);

  // Elapsed timer
  useEffect(() => {
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  // Load chat history
  useEffect(() => {
    if (!auth?.accessToken || !meetingId) return;
    const api = ApiClientWithHeaders(auth.accessToken);
    api.meetings.getChatMessages(meetingId).then((res) => {
      if (res.data) {
        setMessages(
          (Array.isArray(res.data) ? res.data : []).map((m: any) => ({
            id: m.id,
            userId: m.userId,
            userName: m.user?.firstName || m.user?.email || "Unknown",
            content: m.content,
            createdAt: m.createdAt,
          }))
        );
      }
    }).catch(() => {});
  }, [auth, meetingId]);

  // Listen for data channel messages
  useEffect(() => {
    const handleData = (payload: Uint8Array, participant: any) => {
      try {
        const msg = JSON.parse(decoder.decode(payload));
        if (msg.type === "chat") {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              userId: msg.userId,
              userName: msg.userName,
              content: msg.content,
              createdAt: new Date().toISOString(),
            },
          ]);
        } else if (msg.type === "caption") {
          setLastCaption(msg);
        }
      } catch {}
    };

    room.on(RoomEvent.DataReceived, handleData);
    return () => {
      room.off(RoomEvent.DataReceived, handleData);
    };
  }, [room]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendChat = useCallback(() => {
    if (!chatInput.trim() || !auth) return;
    const msg = {
      type: "chat",
      userId: auth.user.id,
      userName: auth.user.firstName || auth.user.email,
      content: chatInput.trim(),
    };
    // Send via data channel
    localParticipant.publishData(encoder.encode(JSON.stringify(msg)), {
      reliable: true,
    });
    // Persist
    const api = ApiClientWithHeaders(auth.accessToken);
    api.meetings.sendChatMessage(meetingId, { content: chatInput.trim() }).catch(() => {});
    // Add locally
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        userId: auth.user.id,
        userName: auth.user.firstName || auth.user.email,
        content: chatInput.trim(),
        createdAt: new Date().toISOString(),
      },
    ]);
    setChatInput("");
  }, [chatInput, auth, localParticipant, meetingId]);

  const toggleMic = () => {
    localParticipant.setMicrophoneEnabled(!micEnabled);
    setMicEnabled(!micEnabled);
  };

  const toggleCam = () => {
    localParticipant.setCameraEnabled(!camEnabled);
    setCamEnabled(!camEnabled);
  };

  const toggleScreen = async () => {
    await localParticipant.setScreenShareEnabled(!screenSharing);
    setScreenSharing(!screenSharing);
  };

  const handleLeave = () => {
    room.disconnect();
    navigate(`/meeting/${code}/ended`);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", color: "#fff" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", padding: "8px 16px", background: "#16162a", borderBottom: "1px solid #2a2a4a" }}>
        <span style={{ fontWeight: 600, flex: 1 }}>{meetingTitle}</span>
        <Badge dot status="error" style={{ marginRight: 8 }} />
        <span style={{ color: "#ef4444", fontSize: 13, marginRight: 16 }}>{t("meeting.recording")}</span>
        <span style={{ color: "#94a3b8", fontSize: 13 }}>{formatTime(elapsed)}</span>
      </div>

      {/* Main area */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Video grid */}
        <div style={{ flex: 1, position: "relative", padding: 8, display: "flex", flexWrap: "wrap", gap: 8, alignContent: "center", justifyContent: "center" }}>
          {tracks.map((track) => (
            <div
              key={track.participant?.identity + "-" + track.source}
              style={{
                width: tracks.length <= 2 ? "calc(50% - 4px)" : "calc(33% - 6px)",
                maxWidth: 640,
                aspectRatio: "16/9",
                background: "#1a1a2e",
                borderRadius: 8,
                overflow: "hidden",
                position: "relative",
              }}
            >
              {track.publication?.track ? (
                <VideoTrack
                  trackRef={track}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 600 }}>
                    {(track.participant?.name || "?")[0].toUpperCase()}
                  </div>
                </div>
              )}
              <div style={{ position: "absolute", bottom: 8, left: 8, background: "rgba(0,0,0,0.6)", padding: "2px 8px", borderRadius: 4, fontSize: 12 }}>
                {track.participant?.name || track.participant?.identity}
              </div>
            </div>
          ))}

          {/* Captions overlay */}
          {captionsOn && lastCaption && (
            <div style={{ position: "absolute", bottom: 80, left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.75)", padding: "8px 20px", borderRadius: 8, maxWidth: "70%", textAlign: "center" }}>
              <span style={{ color: "#3b82f6", fontWeight: 600, marginRight: 8 }}>{lastCaption.speakerName}:</span>
              <span>{lastCaption.original.text}</span>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div style={{ width: 320, background: "#16162a", borderLeft: "1px solid #2a2a4a", display: "flex", flexDirection: "column" }}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            centered
            style={{ color: "#fff" }}
            items={[
              {
                key: "chat",
                label: <span><MessageOutlined /> {t("meeting.chat")}</span>,
                children: (
                  <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 160px)", padding: "0 12px" }}>
                    <div style={{ flex: 1, overflowY: "auto" }}>
                      {messages.map((m) => (
                        <div key={m.id} style={{ marginBottom: 12 }}>
                          <div style={{ fontSize: 12, color: "#3b82f6", fontWeight: 600 }}>{m.userName}</div>
                          <div style={{ fontSize: 13, color: "#e2e8f0" }}>{m.content}</div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>
                    <div style={{ padding: "8px 0" }}>
                      <Input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onPressEnter={sendChat}
                        placeholder={t("meeting.typMessage")}
                        suffix={
                          <Button type="text" size="small" onClick={sendChat} style={{ color: "#3b82f6" }}>
                            {t("common.send")}
                          </Button>
                        }
                      />
                    </div>
                  </div>
                ),
              },
              {
                key: "participants",
                label: <span><TeamOutlined /> ({participants.length})</span>,
                children: (
                  <div style={{ padding: 12 }}>
                    {participants.map((p) => (
                      <div key={p.identity} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0" }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600 }}>
                          {(p.name || "?")[0].toUpperCase()}
                        </div>
                        <span style={{ flex: 1, color: "#e2e8f0", fontSize: 13 }}>{p.name || p.identity}</span>
                        {p.isMicrophoneEnabled ? (
                          <AudioOutlined style={{ color: "#22c55e", fontSize: 12 }} />
                        ) : (
                          <AudioMutedOutlined style={{ color: "#ef4444", fontSize: 12 }} />
                        )}
                        {p.isCameraEnabled ? (
                          <VideoCameraOutlined style={{ color: "#22c55e", fontSize: 12 }} />
                        ) : (
                          <VideoCameraAddOutlined style={{ color: "#ef4444", fontSize: 12 }} />
                        )}
                      </div>
                    ))}
                  </div>
                ),
              },
              {
                key: "notes",
                label: <span><FileTextOutlined /> {t("meeting.aiNotes")}</span>,
                children: (
                  <div style={{ padding: 12, color: "#94a3b8", fontSize: 13 }}>
                    <p>{t("meeting.transcriptionPlaceholder")}</p>
                  </div>
                ),
              },
            ]}
          />
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "12px 16px", background: "#16162a", borderTop: "1px solid #2a2a4a" }}>
        <Button
          shape="circle"
          size="large"
          icon={micEnabled ? <AudioOutlined /> : <AudioMutedOutlined />}
          onClick={toggleMic}
          style={{ background: micEnabled ? "#334155" : "#ef4444", border: "none", color: "#fff" }}
        />
        <Button
          shape="circle"
          size="large"
          icon={camEnabled ? <VideoCameraOutlined /> : <VideoCameraAddOutlined />}
          onClick={toggleCam}
          style={{ background: camEnabled ? "#334155" : "#ef4444", border: "none", color: "#fff" }}
        />
        <Button
          shape="circle"
          size="large"
          icon={<DesktopOutlined />}
          onClick={toggleScreen}
          style={{ background: screenSharing ? "#3b82f6" : "#334155", border: "none", color: "#fff" }}
        />
        <Button
          size="large"
          danger
          icon={<LogoutOutlined />}
          onClick={handleLeave}
          style={{ borderRadius: 20, paddingInline: 24 }}
        >
          {t("meeting.leaveMeeting")}
        </Button>
        <Button
          shape="circle"
          size="large"
          onClick={() => setCaptionsOn(!captionsOn)}
          style={{ background: captionsOn ? "#3b82f6" : "#334155", border: "none", color: "#fff", fontSize: 12, fontWeight: 700 }}
        >
          CC
        </Button>
      </div>
    </div>
  );
}
