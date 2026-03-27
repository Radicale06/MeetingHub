import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Video, CalendarPlus, Link as LinkIcon, PlayCircle } from 'lucide-react';
import { meetingsApi, Meeting } from '../api/meetings';
import { recordingsApi, Recording } from '../api/recordings';
import { useAuth } from '../contexts/AuthContext';
import './Dashboard.css';

export const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([]);
  const [recentRecordings, setRecentRecordings] = useState<Recording[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Quick action states
  const [creatingMeeting, setCreatingMeeting] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  // Schedule form
  const [scheduleTitle, setScheduleTitle] = useState('');
  const [scheduleDesc, setScheduleDesc] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleEmails, setScheduleEmails] = useState('');
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState('');

  // Join form
  const [joinCode, setJoinCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');

  const loadData = () => {
    setIsLoading(true);
    Promise.all([
      meetingsApi.list('upcoming'),
      recordingsApi.list(2)
    ]).then(([meetingsData, recordingsData]) => {
      setUpcomingMeetings(meetingsData);
      setRecentRecordings(recordingsData);
      setIsLoading(false);
    }).catch(err => {
      console.error('Failed to load dashboard data', err);
      setIsLoading(false);
    });
  };

  useEffect(() => { loadData(); }, []);

  const handleNewMeeting = async () => {
    if (creatingMeeting) return;
    setCreatingMeeting(true);
    try {
      const meeting = await meetingsApi.createInstant();
      navigate(`/meeting?code=${meeting.code}`);
    } catch (err) {
      console.error('Failed to create meeting', err);
      setCreatingMeeting(false);
    }
  };

  const handleSchedule = async () => {
    setScheduleError('');
    if (!scheduleTitle.trim()) { setScheduleError('Title is required'); return; }
    if (!scheduleDate) { setScheduleError('Date and time are required'); return; }

    setScheduleLoading(true);
    try {
      const emails = scheduleEmails
        .split(',')
        .map(e => e.trim())
        .filter(Boolean);

      await meetingsApi.schedule({
        title: scheduleTitle.trim(),
        description: scheduleDesc.trim() || undefined,
        scheduledAt: new Date(scheduleDate).toISOString(),
        inviteeEmails: emails.length > 0 ? emails : undefined,
      });

      setScheduleOpen(false);
      setScheduleTitle('');
      setScheduleDesc('');
      setScheduleDate('');
      setScheduleEmails('');
      loadData();
    } catch (err: unknown) {
      setScheduleError(err instanceof Error ? err.message : 'Failed to schedule meeting');
    } finally {
      setScheduleLoading(false);
    }
  };

  const handleJoin = async () => {
    setJoinError('');
    const code = joinCode.trim();
    if (!code) { setJoinError('Please enter a meeting code'); return; }

    setJoinLoading(true);
    try {
      await meetingsApi.join(code);
      setJoinOpen(false);
      setJoinCode('');
      navigate(`/meeting?code=${code}`);
    } catch (err: unknown) {
      setJoinError(err instanceof Error ? err.message : 'Failed to join meeting');
    } finally {
      setJoinLoading(false);
    }
  };

  const displayName = user?.firstName || user?.email?.split('@')[0] || 'there';

  return (
    <div className="mh-dashboard-page">
      <div className="mh-welcome-header">
        <h2>Welcome back, {displayName}</h2>
        <p>Here is what's happening with your meetings today.</p>
      </div>

      {/* Quick Actions */}
      <div className="mh-quick-actions">
        <Card className="mh-action-card" hoverable onClick={handleNewMeeting}>
          <div className="mh-action-icon blue-bg">
            <Video size={24} color="white" />
          </div>
          <h3>{creatingMeeting ? 'Starting...' : 'New Meeting'}</h3>
          <p>Start an instant meeting now</p>
        </Card>

        <Card className="mh-action-card" hoverable onClick={() => setScheduleOpen(true)}>
          <div className="mh-action-icon gray-bg">
            <CalendarPlus size={24} className="mh-icon-muted" />
          </div>
          <h3>Schedule Meeting</h3>
          <p>Plan a meeting for later</p>
        </Card>

        <Card className="mh-action-card" hoverable onClick={() => setJoinOpen(true)}>
          <div className="mh-action-icon gray-bg">
            <LinkIcon size={24} className="mh-icon-muted" />
          </div>
          <h3>Join via Link</h3>
          <p>Enter meeting code or link</p>
        </Card>
      </div>

      <div className="mh-dashboard-grid">
        {/* Upcoming Meetings */}
        <div className="mh-grid-col mh-col-left">
          <div className="mh-section-header">
            <h3>Upcoming Meetings</h3>
            <Link to="/meetings">View all</Link>
          </div>
          <div className="mh-upcoming-list">
            {isLoading ? <p style={{ padding: '1rem' }}>Loading meetings...</p> : upcomingMeetings.length === 0 ? <p style={{ padding: '1rem' }}>No upcoming meetings.</p> : upcomingMeetings.map((mtg) => (
              <Card key={mtg.id} className="mh-meeting-list-card">
                <div className="mh-meeting-time">{new Date(mtg.scheduledAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                <div className="mh-meeting-info">
                  <h4>{mtg.title}</h4>
                  <p>Organized by {mtg.host?.firstName || 'Unknown'}</p>
                </div>
                <Button variant={mtg.status === 'LIVE' ? 'primary' : 'outline'} size="sm" onClick={() => navigate(`/meeting?code=${mtg.code}`)}>
                  {mtg.status === 'LIVE' ? 'Join' : 'Details'}
                </Button>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Recordings */}
        <div className="mh-grid-col mh-col-right">
          <div className="mh-section-header">
            <h3>Recent Recordings & Reports</h3>
            <Link to="/recordings">View archive</Link>
          </div>
          <div className="mh-recordings-list">
            {isLoading ? <p style={{ padding: '1rem' }}>Loading recordings...</p> : recentRecordings.length === 0 ? <p style={{ padding: '1rem' }}>No recent recordings.</p> : recentRecordings.map((rec) => (
              <Card key={rec.id} className="mh-recording-card">
                <div className="mh-recording-thumb">
                  <img src="/hero-mockup.png" alt="Thumbnail" />
                  <span className="mh-duration">{Math.floor(rec.duration / 60)}:{String(rec.duration % 60).padStart(2, '0')}</span>
                </div>
                <div className="mh-recording-meta">
                  <h4>{rec.meeting?.title || 'Unknown Meeting'}</h4>
                  <p className="mh-rec-details">{new Date(rec.createdAt).toLocaleDateString()} • {rec.status}</p>
                  <Link to={`/recordings/${rec.id}`} className="mh-view-report-link">
                    <PlayCircle size={14} style={{ marginRight: '5px' }} /> View AI Report
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Schedule Meeting Modal */}
      <Modal open={scheduleOpen} onClose={() => setScheduleOpen(false)} title="Schedule a Meeting">
        <div className="mh-modal-form">
          <Input
            label="Meeting Title"
            placeholder="e.g. Weekly Team Standup"
            value={scheduleTitle}
            onChange={(e) => setScheduleTitle(e.target.value)}
          />
          <Input
            label="Description (optional)"
            placeholder="What's this meeting about?"
            value={scheduleDesc}
            onChange={(e) => setScheduleDesc(e.target.value)}
          />
          <Input
            label="Date & Time"
            type="datetime-local"
            value={scheduleDate}
            onChange={(e) => setScheduleDate(e.target.value)}
          />
          <Input
            label="Invite Participants (optional)"
            placeholder="email1@example.com, email2@example.com"
            value={scheduleEmails}
            onChange={(e) => setScheduleEmails(e.target.value)}
          />
          {scheduleError && <p className="mh-form-error">{scheduleError}</p>}
          <div className="mh-modal-actions">
            <Button variant="outline" onClick={() => setScheduleOpen(false)}>Cancel</Button>
            <Button onClick={handleSchedule} disabled={scheduleLoading}>
              {scheduleLoading ? 'Scheduling...' : 'Schedule Meeting'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Join via Link Modal */}
      <Modal open={joinOpen} onClose={() => setJoinOpen(false)} title="Join a Meeting">
        <div className="mh-modal-form">
          <Input
            label="Meeting Code"
            placeholder="e.g. abc-defg-hij"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleJoin(); }}
          />
          {joinError && <p className="mh-form-error">{joinError}</p>}
          <div className="mh-modal-actions">
            <Button variant="outline" onClick={() => setJoinOpen(false)}>Cancel</Button>
            <Button onClick={handleJoin} disabled={joinLoading}>
              {joinLoading ? 'Joining...' : 'Join Meeting'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
