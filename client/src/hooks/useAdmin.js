import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/admin';

export function useMessConfig() {
  return useQuery({
    queryKey: ['messConfig'],
    queryFn: () => adminApi.getMessConfig(),
  });
}

export function useUpdateMess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => adminApi.updateMess(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messConfig'] });
    },
  });
}

export function useUpdateMealConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => adminApi.updateMealConfig(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messConfig'] });
    },
  });
}

export function useMenuItems(filter) {
  return useQuery({
    queryKey: ['menuItems', filter],
    queryFn: () => adminApi.listMenuItems(filter),
  });
}

export function useCreateMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => adminApi.createMenuItem(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
    },
  });
}

export function useUpdateMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => adminApi.updateMenuItem(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
    },
  });
}

export function useToggleMenuItemStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isAvailable }) => adminApi.updateMenuItemStatus(id, isAvailable),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
    },
  });
}

export function useDeleteMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => adminApi.deleteMenuItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
    },
  });
}

export function useMenus(params) {
  return useQuery({
    queryKey: ['menus', params],
    queryFn: () => adminApi.listMenus(params),
  });
}

export function useCreateMenu() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => adminApi.createMenu(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] });
    },
  });
}

export function useDeleteMenu() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => adminApi.deleteMenu(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] });
    },
  });
}

export function useAddDish() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ menuId, payload }) => adminApi.addDish(menuId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] });
    },
  });
}

export function useRemoveDish() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ menuId, dishId }) => adminApi.removeDish(menuId, dishId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] });
    },
  });
}

export function useGenerateTimeSlots() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (menuId) => adminApi.generateTimeSlots(menuId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] });
    },
  });
}
