import api from './axios';
import { QueueEntry, LiveQueueState, StudentQueueStatus } from '@shared/types';

export const queueApi = {
  checkIn: async (bookingId: string): Promise<QueueEntry> => {
    const res = await api.post<{ data: { entry: QueueEntry } }>('/queue/check-in', {
      bookingId,
    });
    return res.data.data.entry;
  },

  createWalkIn: async (input: {
    menuId: string;
    slotId?: string;
    studentIdentifier?: string;
  }): Promise<QueueEntry> => {
    const res = await api.post<{ data: { entry: QueueEntry } }>('/queue/walk-in', input);
    return res.data.data.entry;
  },

  markWaiting: async (id: string): Promise<QueueEntry> => {
    const res = await api.post<{ data: { entry: QueueEntry } }>(`/queue/${id}/mark-waiting`);
    return res.data.data.entry;
  },

  startServing: async (id: string): Promise<QueueEntry> => {
    const res = await api.post<{ data: { entry: QueueEntry } }>(`/queue/${id}/start-serving`);
    return res.data.data.entry;
  },

  completeServing: async (id: string): Promise<QueueEntry> => {
    const res = await api.post<{ data: { entry: QueueEntry } }>(`/queue/${id}/complete`);
    return res.data.data.entry;
  },

  markNoShow: async (id: string): Promise<QueueEntry> => {
    const res = await api.post<{ data: { entry: QueueEntry } }>(`/queue/${id}/no-show`);
    return res.data.data.entry;
  },

  getLiveQueue: async (menuId: string, slotId?: string): Promise<LiveQueueState> => {
    const res = await api.get<{ data: LiveQueueState }>('/queue/current', {
      params: { menuId, slotId },
    });
    return res.data.data;
  },

  getMyQueue: async (menuId?: string): Promise<StudentQueueStatus> => {
    const res = await api.get<{ data: StudentQueueStatus }>('/queue/my', {
      params: { menuId },
    });
    return res.data.data;
  },
};
