import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queueApi } from '../api/queue.js';
import { subscribeToQueue } from '../services/socket.js';

export function useLiveQueue(menuId, slotId) {
  const queryClient = useQueryClient();

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
    refetchInterval: 30_000,
  });
}

export function useMyQueue(menuId) {
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
    refetchInterval: menuId ? 30_000 : false,
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookingId) => queueApi.checkIn(bookingId),
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
    mutationFn: (input) => queueApi.createWalkIn(input),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['liveQueue', vars.menuId] });
    },
  });
}

export function useMarkWaiting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => queueApi.markWaiting(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myQueue'] });
      queryClient.invalidateQueries({ queryKey: ['liveQueue'] });
    },
  });
}

export function useStartServing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => queueApi.startServing(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liveQueue'] });
      queryClient.invalidateQueries({ queryKey: ['myQueue'] });
    },
  });
}

export function useCompleteServing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => queueApi.completeServing(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liveQueue'] });
      queryClient.invalidateQueries({ queryKey: ['myQueue'] });
    },
  });
}

export function useMarkNoShow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => queueApi.markNoShow(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liveQueue'] });
      queryClient.invalidateQueries({ queryKey: ['myQueue'] });
    },
  });
}

