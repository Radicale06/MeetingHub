import { fetchApi } from './client';

export interface Contact {
  id: string;
  contactUserId: string;
  nickname: string;
  createdAt: string;
  contactUser: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl: string;
    jobTitle: string;
  };
}

export const contactsApi = {
  list: () => fetchApi<Contact[]>('/contacts'),
};
