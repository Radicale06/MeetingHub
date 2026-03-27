import { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import {
  PlayCircle,
  HardDrive,
  FileText,
  Download,
  ChevronRight,
} from 'lucide-react';
import { recordingsApi, reportsApi, type Recording, type MeetingReport } from '../api/recordings';
import './RecordingsList.css';

type Tab = 'recordings' | 'reports';

export const RecordingsList = () => {
  const [tab, setTab] = useState<Tab>('recordings');

  // Recordings
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loadingRec, setLoadingRec] = useState(true);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const [playingTitle, setPlayingTitle] = useState('');
  const [loadingUrl, setLoadingUrl] = useState(false);

  // Reports
  const [reports, setReports] = useState<MeetingReport[]>([]);
  const [loadingRep, setLoadingRep] = useState(true);
  const [selectedReport, setSelectedReport] = useState<MeetingReport | null>(null);

  useEffect(() => {
    recordingsApi.list()
      .then(setRecordings)
      .catch(console.error)
      .finally(() => setLoadingRec(false));

    reportsApi.list()
      .then(setReports)
      .catch(console.error)
      .finally(() => setLoadingRep(false));
  }, []);

  const handlePlay = async (rec: Recording) => {
    setLoadingUrl(true);
    try {
      const { url } = await recordingsApi.getUrl(rec.id);
      setPlayingTitle(rec.meeting?.title || 'Recording');
      setPlayingUrl(url);
    } catch (err) {
      console.error('Failed to get recording URL', err);
    } finally {
      setLoadingUrl(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="mh-dashboard-page" style={{ padding: '2rem' }}>
      <div className="mh-welcome-header">
        <h2>Recordings & Reports</h2>
        <p>Your library of past meeting recordings and AI-generated reports.</p>
      </div>

      {/* Tab bar */}
      <div className="mh-rec-tabs">
        <button
          className={`mh-rec-tab ${tab === 'recordings' ? 'active' : ''}`}
          onClick={() => setTab('recordings')}
        >
          <PlayCircle size={16} /> Recordings
        </button>
        <button
          className={`mh-rec-tab ${tab === 'reports' ? 'active' : ''}`}
          onClick={() => setTab('reports')}
        >
          <FileText size={16} /> AI Reports
        </button>
      </div>

      {/* Recordings Tab */}
      {tab === 'recordings' && (
        <div className="mh-rec-grid">
          {loadingRec ? (
            <p className="mh-rec-empty">Loading recordings...</p>
          ) : recordings.length === 0 ? (
            <Card className="mh-rec-empty">
              <HardDrive size={48} />
              <p>No recordings yet. Recordings are saved automatically when meetings end.</p>
            </Card>
          ) : (
            recordings.map((rec) => (
              <Card key={rec.id} className="mh-rec-card" onClick={() => handlePlay(rec)}>
                <div className="mh-rec-card-icon">
                  <PlayCircle size={36} />
                </div>
                <div className="mh-rec-card-info">
                  <h4>{rec.meeting?.title || 'Untitled Meeting'}</h4>
                  <span className="mh-rec-meta">
                    {new Date(rec.createdAt).toLocaleDateString()} &middot; {formatDuration(rec.duration)}
                  </span>
                  <span className="mh-rec-status">{rec.status}</span>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Reports Tab */}
      {tab === 'reports' && (
        <div className="mh-rec-grid">
          {loadingRep ? (
            <p className="mh-rec-empty">Loading reports...</p>
          ) : reports.length === 0 ? (
            <Card className="mh-rec-empty">
              <FileText size={48} />
              <p>No reports yet. AI reports are generated automatically after meetings end.</p>
            </Card>
          ) : (
            reports.map((report) => (
              <Card
                key={report.id}
                className="mh-rec-card mh-report-card"
                onClick={() => setSelectedReport(report)}
              >
                <div className="mh-rec-card-icon mh-report-icon">
                  <FileText size={36} />
                </div>
                <div className="mh-rec-card-info">
                  <h4>{report.meeting?.title || 'Meeting Report'}</h4>
                  <span className="mh-rec-meta">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </span>
                  <p className="mh-report-summary">{report.summary.slice(0, 120)}...</p>
                </div>
                <ChevronRight size={18} className="mh-rec-card-chevron" />
              </Card>
            ))
          )}
        </div>
      )}

      {/* Video Player Modal */}
      <Modal open={!!playingUrl} onClose={() => setPlayingUrl(null)} title={playingTitle}>
        <div className="mh-video-modal">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video src={playingUrl || undefined} controls autoPlay className="mh-video-player" />
          <div className="mh-video-modal-actions">
            <a href={playingUrl || '#'} download className="mh-download-link">
              <Download size={14} /> Download
            </a>
          </div>
        </div>
      </Modal>

      {/* Report Detail Modal */}
      <Modal
        open={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        title={selectedReport?.meeting?.title || 'Meeting Report'}
      >
        {selectedReport && (
          <div className="mh-report-detail">
            <section>
              <h4>Summary</h4>
              <p>{selectedReport.summary}</p>
            </section>
            {selectedReport.keyTopics.length > 0 && (
              <section>
                <h4>Key Topics</h4>
                <div className="mh-report-tags">
                  {selectedReport.keyTopics.map((topic, i) => (
                    <span key={i} className="mh-report-tag">{topic}</span>
                  ))}
                </div>
              </section>
            )}
            {selectedReport.actionItems.length > 0 && (
              <section>
                <h4>Action Items</h4>
                <ul className="mh-report-actions">
                  {selectedReport.actionItems.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </Modal>

      {/* Loading overlay for URL fetch */}
      {loadingUrl && (
        <div className="mh-loading-overlay">
          <div className="mh-loading-spinner" />
          <p>Loading recording...</p>
        </div>
      )}
    </div>
  );
};
