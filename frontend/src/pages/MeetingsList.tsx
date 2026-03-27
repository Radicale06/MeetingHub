import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Video, Calendar } from 'lucide-react';
import { meetingsApi, Meeting } from '../api/meetings';
import './Dashboard.css';

export const MeetingsList: React.FC = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    meetingsApi.list()
      .then(data => {
        setMeetings(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch meetings', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="mh-dashboard-page" style={{ padding: '2rem' }}>
      <div className="mh-welcome-header">
        <h2>All Meetings</h2>
        <p>Review your upcoming and past meetings.</p>
      </div>

      <div className="mh-dashboard-grid" style={{ gridTemplateColumns: '1fr' }}>
        <div className="mh-grid-col mh-col-left">
          <div className="mh-section-header">
            <h3>Meeting Directory</h3>
            <Button variant="primary" size="sm" onClick={() => navigate('/meeting')}>
              <Video size={16} style={{ marginRight: 8 }} /> New Meeting
            </Button>
          </div>
          <div className="mh-upcoming-list">
            {loading ? (
              <p>Loading meetings...</p>
            ) : meetings.length === 0 ? (
              <Card className="mh-meeting-list-card" style={{ padding: '2rem', textAlign: 'center', opacity: 0.6 }}>
                <Calendar size={48} style={{ margin: '0 auto', marginBottom: '1rem', display: 'block' }} />
                <p>No meetings found.</p>
              </Card>
            ) : (
              meetings.map((mtg) => (
                <Card key={mtg.id} className="mh-meeting-list-card">
                  <div className="mh-meeting-time">
                    {mtg.scheduledAt ? new Date(mtg.scheduledAt).toLocaleString() : 'Instant Meeting'}
                    <span style={{ display: 'block', fontSize: '11px', color: 'var(--mh-text-muted)' }}>
                      Status: {mtg.status}
                    </span>
                  </div>
                  <div className="mh-meeting-info">
                    <h4>{mtg.title}</h4>
                    <p>Code: {mtg.code} • Organized by {mtg.host?.firstName || 'Unknown'}</p>
                  </div>
                  <Button variant={mtg.status === 'SCHEDULED' || mtg.status === 'LIVE' ? 'primary' : 'outline'} size="sm" onClick={() => navigate(`/meeting?code=${mtg.code}`)}>
                    {mtg.status === 'ENDED' ? 'View Details' : 'Join'}
                  </Button>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
