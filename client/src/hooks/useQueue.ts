import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queueApi } from '../api/queue';
import { subscribeToQueue } from '../services/socket';

export function useLiveQueue(menuId?: string, slotId?: string) {
  const queryClient = useQueryClient();

  // Socket.IO real-time invalidation — this is the primary update mechanism.
  // No polling fallback needed while the socket is connected; add one only as a
  // safety net with a generous interval so it doesn't hammer the server.
  useEffect(() => {
    if (!menuId) return;
    const unsubscribe = subscribeToQueue(menuId, () => {
      queryClient.invalidateQueries({ queryKey: ['liveQueue', menuId] });
      queryClient.invalidateQueries({ queryKey: ['myQueue'] });
    });
    return () => {
      unsubscribe();
    };
  }, [menuId, queryClient]);

  return useQuery({
    queryKey: ['liveQueue', menuId, slotId],
    queryFn: () => (menuId ? queueApi.getLiveQueue(menuId, slotId) : null),
    enabled: Boolean(menuId),
    staleTime: 30_000,
    // 30 s fallback poll — only kicks in when the socket is not delivering updates
    refetchInterval: 30_000,
  });
}

export function useMyQueue(menuId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!menuId) return;
    const unsubscribe = subscribeToQueue(menuId, () => {
      queryClient.invalidateQueries({ queryKey: ['myQueue'] });
      queryClient.invalidateQueries({ queryKey: ['liveQueue', menuId] });
    });
    return () => {
      unsubscribe();
    };
  }, [menuId, queryClient]);

  return useQuery({
    queryKey: ['myQueue', menuId],
    queryFn: () => queueApi.getMyQueue(menuId),
    staleTime: 20_000,
    // Fallback poll only when student is actively in a queue (menuId is set)
    refetchInterval: menuId ? 30_000 : false,
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) => queueApi.checkIn(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myQueue'] });
      queryClient.invalidateQueries({ queryKey: ['liveQueue'] });
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
    },
  });
}

export function useCreateWalkIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { menuId: string; slotId?: string; studentIdentifier?: string }) =>
      queueApi.createWalkIn(input),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['liveQueue', vars.menuId] });
    },
  });
}

export function useMarkWaiting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => queueApi.markWaiting(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myQueue'] });
      queryClient.invalidateQueries({ queryKey: ['liveQueue'] });
    },
  });
}

export function useStartServing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => queueApi.startServing(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liveQueue'] });
      queryClient.invalidateQueries({ queryKey: ['myQueue'] });
    },
  });
}

export function useCompleteServing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => queueApi.completeServing(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liveQueue'] });
      queryClient.invalidateQueries({ queryKey: ['myQueue'] });
    },
  });
}

export function useMarkNoShow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => queueApi.markNoShow(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liveQueue'] });
      queryClient.invalidateQueries({ queryKey: ['myQueue'] });
    },
  });
}
