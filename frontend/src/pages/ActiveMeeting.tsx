import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  LiveKitRoom,
  VideoTrack,
  AudioTrack,
  useTracks,
  useRoomContext,
  useParticipants,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Track, RoomEvent } from 'livekit-client';
import { isTrackReference } from '@livekit/components-core';
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  MonitorUp,
  PhoneOff,
  MessageSquare,
  Users as UsersIcon,
  Bot,
  Send,
  LogOut,
} from 'lucide-react';
import { meetingsApi, type Meeting, type JoinMeetingResponse, type ChatMessage } from '../api/meetings';
import { Avatar } from '../components/ui/Avatar';
import './ActiveMeeting.css';

// ─── Main Component (connects to room or shows loading/error) ───

export const ActiveMeeting = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const code = searchParams.get('code');

  const [connectionData, setConnectionData] = useState<JoinMeetingResponse | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!code) {
      setError('No meeting code provided');
      setLoading(false);
      return;
    }

    meetingsApi.join(code)
      .then((data) => {
        setConnectionData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to join meeting');
        setLoading(false);
      });
  }, [code]);

  if (loading) {
    return (
      <div className="mh-meeting-loading">
        <div className="mh-loading-spinner" />
        <p>Joining meeting...</p>
      </div>
    );
  }

  if (error || !connectionData) {
    return (
      <div className="mh-meeting-loading">
        <p className="mh-meeting-error">{error || 'Something went wrong'}</p>
        <button className="mh-back-btn" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <LiveKitRoom
      serverUrl={connectionData.serverUrl}
      token={connectionData.token}
      connect={true}
      video={true}
      audio={true}
      onDisconnected={() => navigate('/dashboard')}
      style={{ height: '100vh', width: '100vw' }}
    >
      <MeetingRoom meeting={connectionData.meeting} />
    </LiveKitRoom>
  );
};

// ─── Caption type from agent data channel ───

interface CaptionMessage {
  type: 'caption';
  speakerId: string;
  speakerName: string;
  original: { text: string; language: string };
  translations: Record<string, string>;
  timestamp: number;
}

const CAPTION_LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Francais' },
  { value: 'ar', label: 'Arabic' },
  { value: 'es', label: 'Espanol' },
  { value: 'de', label: 'Deutsch' },
  { value: 'zh', label: 'Chinese' },
  { value: 'pt', label: 'Portugues' },
  { value: 'ru', label: 'Russian' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
];

// ─── Meeting Room (inside LiveKitRoom context) ───

interface MeetingRoomProps {
  meeting: Meeting;
}

const MeetingRoom = ({ meeting }: MeetingRoomProps) => {
  const navigate = useNavigate();
  const room = useRoomContext();
  const participants = useParticipants();
  const [activeTab, setActiveTab] = useState<'chat' | 'participants' | 'ai'>('chat');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Caption state
  const [captions, setCaptions] = useState<CaptionMessage[]>([]);
  const [captionLang, setCaptionLang] = useState('en');
  const captionsEndRef = useRef<HTMLDivElement>(null);

  // Track toggles
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording] = useState(true);

  // Listen for captions from agent via data channel
  useEffect(() => {
    const handleData = (payload: Uint8Array) => {
      try {
        const msg = JSON.parse(new TextDecoder().decode(payload));
        if (msg.type === 'caption') {
          setCaptions((prev) => [...prev.slice(-99), msg as CaptionMessage]);
        }
      } catch { /* ignore non-JSON messages */ }
    };
    room.on(RoomEvent.DataReceived, handleData as never);
    return () => { room.off(RoomEvent.DataReceived, handleData as never); };
  }, [room]);

  // Send caption language preference to agent when it changes
  useEffect(() => {
    const msg = JSON.stringify({ type: 'set_caption_language', language: captionLang });
    room.localParticipant.publishData(new TextEncoder().encode(msg), { reliable: true }).catch(() => {});
  }, [room, captionLang]);

  // Auto-scroll captions
  useEffect(() => {
    captionsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [captions]);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Load chat messages
  useEffect(() => {
    meetingsApi.getChat(meeting.id).then(setMessages).catch(console.error);
    const pollInterval = setInterval(() => {
      meetingsApi.getChat(meeting.id).then(setMessages).catch(console.error);
    }, 5000);
    return () => clearInterval(pollInterval);
  }, [meeting.id]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendChat = async () => {
    const text = chatInput.trim();
    if (!text || sendingChat) return;
    setSendingChat(true);
    try {
      const msg = await meetingsApi.sendChat(meeting.id, text);
      setMessages((prev) => [...prev, msg]);
      setChatInput('');
    } catch (err) {
      console.error('Failed to send message', err);
    } finally {
      setSendingChat(false);
    }
  };

  // Mic toggle
  const toggleMic = useCallback(async () => {
    try {
      await room.localParticipant.setMicrophoneEnabled(!isMicOn);
      setIsMicOn(!isMicOn);
    } catch (err) {
      console.error('Failed to toggle mic', err);
    }
  }, [room, isMicOn]);

  // Camera toggle
  const toggleCam = useCallback(async () => {
    try {
      await room.localParticipant.setCameraEnabled(!isCamOn);
      setIsCamOn(!isCamOn);
    } catch (err) {
      console.error('Failed to toggle camera', err);
    }
  }, [room, isCamOn]);

  // Screen share toggle
  const toggleScreenShare = useCallback(async () => {
    try {
      await room.localParticipant.setScreenShareEnabled(!isScreenSharing);
      setIsScreenSharing(!isScreenSharing);
    } catch (err) {
      console.error('Failed to toggle screen share', err);
    }
  }, [room, isScreenSharing]);

  // Leave meeting
  const handleLeave = useCallback(async () => {
    await room.disconnect();
    navigate('/dashboard');
  }, [room, navigate]);

  // End meeting (host only)
  const handleEndMeeting = useCallback(async () => {
    try {
      await meetingsApi.end(meeting.id);
    } catch (err) {
      console.error('Failed to end meeting', err);
    }
    await room.disconnect();
    navigate('/dashboard');
  }, [room, meeting.id, navigate]);

  // Get all video/screen tracks
  const trackRefs = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );

  // Separate screen share tracks from camera tracks
  const screenShareTracks = trackRefs.filter(
    (t) => t.source === Track.Source.ScreenShare,
  );
  const cameraTracks = trackRefs.filter(
    (t) => t.source === Track.Source.Camera,
  );

  // Determine the "focused" track (screen share takes priority)
  const focusedTrack = screenShareTracks.length > 0 ? screenShareTracks[0] : cameraTracks[0];
  const thumbnailTracks = focusedTrack
    ? cameraTracks.filter((t) => t !== focusedTrack)
    : cameraTracks.slice(1);

  return (
    <div className="mh-meeting-container">
      {/* Header */}
      <header className="mh-meeting-header">
        <div className="mh-meeting-title">{meeting.title || 'Meeting'}</div>
        <div className="mh-meeting-status">
          {isRecording && (
            <div className="mh-recording-badge">
              <span className="mh-red-dot" /> Recording
            </div>
          )}
          <div className="mh-timer">{formatTime(elapsedSeconds)}</div>
          <div className="mh-participant-count">
            <UsersIcon size={14} />
            {participants.length}
          </div>
        </div>
      </header>

      <div className="mh-meeting-body">
        {/* Video Grid */}
        <main className="mh-video-grid">
          {/* Focused View (screen share or main speaker) */}
          <div className="mh-video-main">
            {focusedTrack?.publication?.track ? (
              <VideoTrack
                trackRef={focusedTrack}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            ) : (
              <div className="mh-video-placeholder">
                <Avatar
                  fallback={focusedTrack?.participant?.name?.[0]?.toUpperCase() || '?'}
                  size="xl"
                />
                <span>{focusedTrack?.participant?.name || 'Participant'}</span>
              </div>
            )}
            {focusedTrack?.participant && (
              <div className="mh-video-label">
                {focusedTrack.participant.name || focusedTrack.participant.identity}
                {focusedTrack.source === Track.Source.ScreenShare && ' (Screen)'}
              </div>
            )}
          </div>

          {/* Thumbnail Strip */}
          {thumbnailTracks.length > 0 && (
            <div className="mh-video-sidebar">
              {thumbnailTracks.map((trackRef) => (
                <div key={trackRef.participant.sid + trackRef.source} className="mh-video-tile">
                  {trackRef.publication?.track ? (
                    <VideoTrack
                      trackRef={trackRef}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div className="mh-video-placeholder">
                      <Avatar
                        fallback={trackRef.participant?.name?.[0]?.toUpperCase() || '?'}
                        size="lg"
                      />
                    </div>
                  )}
                  <div className="mh-video-label">
                    {trackRef.participant.isLocal
                      ? 'You'
                      : trackRef.participant.name || trackRef.participant.identity}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Sidebar Panel */}
        {sidebarOpen && (
          <aside className="mh-meeting-panel">
            <div className="mh-panel-tabs">
              <button
                className={activeTab === 'chat' ? 'active' : ''}
                onClick={() => setActiveTab('chat')}
              >
                Chat
              </button>
              <button
                className={activeTab === 'participants' ? 'active' : ''}
                onClick={() => setActiveTab('participants')}
              >
                Participants ({participants.length})
              </button>
              <button
                className={activeTab === 'ai' ? 'active' : ''}
                onClick={() => setActiveTab('ai')}
              >
                Captions
              </button>
            </div>

            <div className="mh-panel-content">
              {/* Chat Tab */}
              {activeTab === 'chat' && (
                <div className="mh-chat-area">
                  <div className="mh-chat-messages">
                    {messages.length === 0 && (
                      <p className="mh-chat-empty">No messages yet. Say hello!</p>
                    )}
                    {messages.map((msg) => (
                      <div key={msg.id} className="mh-chat-msg">
                        <Avatar
                          src={msg.user.avatarUrl || undefined}
                          fallback={(msg.user.firstName?.[0] || msg.user.email[0]).toUpperCase()}
                          size="sm"
                          className="mh-chat-avatar-wrap"
                        />
                        <div className="mh-msg-body">
                          <div className="mh-msg-header">
                            <strong>
                              {[msg.user.firstName, msg.user.lastName].filter(Boolean).join(' ') || msg.user.email}
                            </strong>
                            <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div className="mh-msg-bubble">{msg.content}</div>
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="mh-chat-input">
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSendChat(); }}
                    />
                    <button className="mh-chat-send" onClick={handleSendChat} disabled={sendingChat}>
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Participants Tab */}
              {activeTab === 'participants' && (
                <div className="mh-participants-list">
                  {participants.map((p) => (
                    <div key={p.sid} className="mh-participant-item">
                      <Avatar
                        fallback={p.name?.[0]?.toUpperCase() || '?'}
                        size="sm"
                      />
                      <div className="mh-participant-info">
                        <span className="mh-participant-name">
                          {p.isLocal ? `${p.name || 'You'} (You)` : p.name || p.identity}
                        </span>
                        <span className="mh-participant-status">
                          {p.isSpeaking ? 'Speaking' : 'Connected'}
                        </span>
                      </div>
                      <div className="mh-participant-indicators">
                        {p.isMicrophoneEnabled ? <Mic size={14} /> : <MicOff size={14} className="mh-muted-icon" />}
                        {p.isCameraEnabled ? <VideoIcon size={14} /> : <VideoOff size={14} className="mh-muted-icon" />}
                        {p.isScreenShareEnabled && <MonitorUp size={14} className="mh-sharing-icon" />}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* AI Captions Tab */}
              {activeTab === 'ai' && (
                <div className="mh-captions-area">
                  <div className="mh-captions-lang-bar">
                    <label htmlFor="caption-lang">Caption language:</label>
                    <select
                      id="caption-lang"
                      value={captionLang}
                      onChange={(e) => setCaptionLang(e.target.value)}
                      className="mh-caption-lang-select"
                    >
                      {CAPTION_LANGUAGES.map((l) => (
                        <option key={l.value} value={l.value}>{l.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mh-captions-list">
                    {captions.length === 0 ? (
                      <div className="mh-ai-placeholder">
                        <Bot size={32} />
                        <p>Live captions will appear here as participants speak.</p>
                        <span>Select your preferred language above.</span>
                      </div>
                    ) : (
                      captions.map((cap, i) => (
                        <div key={i} className="mh-caption-item">
                          <div className="mh-caption-speaker">{cap.speakerName}</div>
                          <div className="mh-caption-text">
                            {cap.translations[captionLang] || cap.original.text}
                          </div>
                          {cap.original.language !== captionLang && cap.translations[captionLang] && (
                            <div className="mh-caption-original">{cap.original.text}</div>
                          )}
                        </div>
                      ))
                    )}
                    <div ref={captionsEndRef} />
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Bottom Controls */}
      <footer className="mh-meeting-controls">
        <div className="mh-controls-left">
          <span className="mh-meeting-code">{meeting.code}</span>
        </div>

        <div className="mh-controls-center">
          <button
            className={`mh-control-btn ${!isMicOn ? 'mh-control-off' : ''}`}
            onClick={toggleMic}
            title={isMicOn ? 'Mute' : 'Unmute'}
          >
            {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
          </button>

          <button
            className={`mh-control-btn ${!isCamOn ? 'mh-control-off' : ''}`}
            onClick={toggleCam}
            title={isCamOn ? 'Turn off camera' : 'Turn on camera'}
          >
            {isCamOn ? <VideoIcon size={20} /> : <VideoOff size={20} />}
          </button>

          <button
            className={`mh-control-btn ${isScreenSharing ? 'mh-control-active' : ''}`}
            onClick={toggleScreenShare}
            title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
          >
            <MonitorUp size={20} />
          </button>

          <button
            className={`mh-control-btn ${sidebarOpen ? 'mh-control-active' : ''}`}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title="Toggle sidebar"
          >
            <MessageSquare size={20} />
          </button>

          <button className="mh-control-btn mh-control-leave" onClick={handleLeave} title="Leave meeting">
            <PhoneOff size={20} />
          </button>
        </div>

        <div className="mh-controls-right">
          {/* Host can end for everyone */}
          <button className="mh-end-btn" onClick={handleEndMeeting} title="End meeting for all">
            <LogOut size={16} />
            <span className="mh-end-label">End</span>
          </button>
        </div>
      </footer>

      {/* Audio tracks (hidden, just for playback) */}
      <AudioRenderers />
    </div>
  );
};

// ─── Audio Renderers (render all remote audio tracks) ───

const AudioRenderers = () => {
  const tracks = useTracks([{ source: Track.Source.Microphone, withPlaceholder: false }], {
    onlySubscribed: true,
  });

  return (
    <div style={{ display: 'none' }}>
      {tracks
        .filter((t) => !t.participant.isLocal && isTrackReference(t))
        .map((t) => (
          <AudioTrack key={t.participant.sid + t.source} trackRef={t as Parameters<typeof AudioTrack>[0]['trackRef']} />
        ))}
    </div>
  );
};
