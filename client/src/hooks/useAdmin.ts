import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  adminApi,
  UpdateMessPayload,
  UpdateMealConfigPayload,
  CreateMenuItemPayload,
  UpdateMenuItemPayload,
  CreateMenuPayload,
  AddDishPayload,
} from '../api/admin';
import { MealType } from '@shared/types';

export function useMessConfig() {
  return useQuery({
    queryKey: ['messConfig'],
    queryFn: () => adminApi.getMessConfig(),
  });
}

export function useUpdateMess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateMessPayload) => adminApi.updateMess(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messConfig'] });
    },
  });
}

export function useUpdateMealConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateMealConfigPayload }) =>
      adminApi.updateMealConfig(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messConfig'] });
    },
  });
}

export function useMenuItems(filter?: {
  isAvailable?: boolean;
  category?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ['menuItems', filter],
    queryFn: () => adminApi.listMenuItems(filter),
  });
}

export function useCreateMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMenuItemPayload) => adminApi.createMenuItem(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
    },
  });
}

export function useUpdateMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateMenuItemPayload }) =>
      adminApi.updateMenuItem(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
    },
  });
}

export function useToggleMenuItemStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isAvailable }: { id: string; isAvailable: boolean }) =>
      adminApi.updateMenuItemStatus(id, isAvailable),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
    },
  });
}

export function useDeleteMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteMenuItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
    },
  });
}

export function useMenus(params?: { date?: string; mealType?: MealType }) {
  return useQuery({
    queryKey: ['menus', params],
    queryFn: () => adminApi.listMenus(params),
  });
}

export function useCreateMenu() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMenuPayload) => adminApi.createMenu(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] });
    },
  });
}

export function useDeleteMenu() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteMenu(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] });
    },
  });
}

export function useAddDish() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ menuId, payload }: { menuId: string; payload: AddDishPayload }) =>
      adminApi.addDish(menuId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] });
    },
  });
}

export function useRemoveDish() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ menuId, dishId }: { menuId: string; dishId: string }) =>
      adminApi.removeDish(menuId, dishId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] });
    },
  });
}

export function useGenerateTimeSlots() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (menuId: string) => adminApi.generateTimeSlots(menuId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] });
    },
  });
}
