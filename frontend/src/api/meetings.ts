import { fetchApi } from './client';

export interface Meeting {
  id: string;
  title: string;
  description: string;
  code: string;
  status: string;
  type: string;
  scheduledAt: string;
  host: {
    firstName: string;
    lastName: string;
  };
  participants?: MeetingParticipant[];
}

export interface MeetingParticipant {
  id: string;
  userId: string;
  role: string;
  status: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface ScheduleMeetingData {
  title: string;
  description?: string;
  scheduledAt: string;
  inviteeEmails?: string[];
}

export interface JoinMeetingResponse {
  serverUrl: string;
  token: string;
  meeting: Meeting;
}

export interface ChatMessage {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    avatarUrl: string | null;
  };
}

interface MeetingsListResponse {
  meetings: Meeting[];
  total: number;
}

export const meetingsApi = {
  list: async (filter?: string): Promise<Meeting[]> => {
    const query = filter ? `?filter=${filter}` : '';
    const res = await fetchApi<MeetingsListResponse>(`/meetings${query}`);
    return res.meetings;
  },

  getByCode: (code: string) =>
    fetchApi<Meeting>(`/meetings/${code}`),

  createInstant: (title?: string) =>
    fetchApi<Meeting>('/meetings/instant', {
      method: 'POST',
      body: JSON.stringify({ title }),
    }),

  schedule: (data: ScheduleMeetingData) =>
    fetchApi<Meeting>('/meetings/schedule', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  join: (code: string) =>
    fetchApi<JoinMeetingResponse>(`/meetings/${code}/join`, {
      method: 'POST',
    }),

  cancel: (id: string) =>
    fetchApi<void>(`/meetings/${id}`, { method: 'DELETE' }),

  end: (id: string) =>
    fetchApi<void>(`/meetings/${id}/end`, { method: 'POST' }),

  getChat: (meetingId: string, limit = 50, offset = 0) =>
    fetchApi<ChatMessage[]>(`/meetings/${meetingId}/chat?limit=${limit}&offset=${offset}`),

  sendChat: (meetingId: string, content: string) =>
    fetchApi<ChatMessage>(`/meetings/${meetingId}/chat`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
};
