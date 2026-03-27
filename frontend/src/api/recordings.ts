import { fetchApi } from './client';

export interface Recording {
  id: string;
  meetingId: string;
  duration: number;
  status: string;
  createdAt: string;
  meeting: {
    title: string;
  };
}

export interface MeetingReport {
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
  };
}

interface RecordingsListResponse {
  recordings: Recording[];
  total: number;
}

interface ReportsListResponse {
  reports: MeetingReport[];
  total: number;
}

export const recordingsApi = {
  list: async (limit?: number): Promise<Recording[]> => {
    const query = limit ? `?limit=${limit}` : '';
    const res = await fetchApi<RecordingsListResponse>(`/recordings${query}`);
    return res.recordings;
  },

  getUrl: (recordingId: string) =>
    fetchApi<{ url: string; recording: Recording }>(`/recordings/${recordingId}/url`),
};

export const reportsApi = {
  list: async (limit?: number): Promise<MeetingReport[]> => {
    const query = limit ? `?limit=${limit}` : '';
    const res = await fetchApi<ReportsListResponse>(`/reports${query}`);
    return res.reports;
  },

  getByMeeting: (meetingId: string) =>
    fetchApi<MeetingReport>(`/reports/meeting/${meetingId}`),
};
