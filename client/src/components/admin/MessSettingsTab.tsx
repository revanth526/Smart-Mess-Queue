import React, { useState } from 'react';
import { useMessConfig, useUpdateMess, useUpdateMealConfig } from '../../hooks/useAdmin';
import type { MealConfig } from '@shared/types';

export function MessSettingsTab() {
  const { data, isLoading, error } = useMessConfig();
  const updateMessMutation = useUpdateMess();
  const updateMealConfigMutation = useUpdateMealConfig();

  const [isEditingMess, setIsEditingMess] = useState(false);
  const [messName, setMessName] = useState('');
  const [messLocation, setMessLocation] = useState('');
  const [messCapacity, setMessCapacity] = useState(500);

  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [slotDuration, setSlotDuration] = useState(20);
  const [slotCapacity, setSlotCapacity] = useState(50);
  const [feedbackMsg, setFeedbackMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  if (isLoading) {
    return <div className="py-8 text-center text-gray-500">Loading mess settings...</div>;
  }

  if (error || !data) {
    return <div className="py-8 text-center text-red-500">Failed to load mess settings.</div>;
  }

  const { mess, mealConfigs } = data;

  const handleStartEditMess = () => {
    setMessName(mess.name);
    setMessLocation(mess.location || '');
    setMessCapacity(mess.totalCapacity);
    setIsEditingMess(true);
  };

  const handleSaveMess = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMsg(null);
    try {
      await updateMessMutation.mutateAsync({
        name: messName,
        location: messLocation || null,
        totalCapacity: Number(messCapacity),
      });
      setIsEditingMess(false);
      setFeedbackMsg({ type: 'success', text: 'Mess details updated successfully.' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update mess';
      setFeedbackMsg({ type: 'error', text: msg });
    }
  };

  const handleStartEditMeal = (cfg: MealConfig) => {
    setEditingMealId(cfg.id);
    setStartTime(cfg.startTime);
    setEndTime(cfg.endTime);
    setSlotDuration(cfg.slotDurationMinutes);
    setSlotCapacity(cfg.defaultSlotCapacity);
  };

  const handleSaveMealConfig = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    setFeedbackMsg(null);
    try {
      await updateMealConfigMutation.mutateAsync({
        id,
        payload: {
          startTime,
          endTime,
          slotDurationMinutes: Number(slotDuration),
          defaultSlotCapacity: Number(slotCapacity),
        },
      });
      setEditingMealId(null);
      setFeedbackMsg({ type: 'success', text: 'Meal configuration updated.' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update meal config';
      setFeedbackMsg({ type: 'error', text: msg });
    }
  };

  return (
    <div className="space-y-8">
      {feedbackMsg && (
        <div
          className={`rounded-md p-4 text-sm ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800'
              : 'bg-red-50 text-red-800'
          }`}
        >
          {feedbackMsg.text}
        </div>
      )}

      {/* Mess Details Card */}
      <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Dining Hall Details</h2>
            <p className="text-sm text-gray-500">Physical facility information</p>
          </div>
          {!isEditingMess && (
            <button
              onClick={handleStartEditMess}
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Edit Details
            </button>
          )}
        </div>

        {isEditingMess ? (
          <form onSubmit={handleSaveMess} className="mt-4 space-y-4">
            <div>
              <label htmlFor="mess-name" className="block text-sm font-medium text-gray-700">
                Mess Name
              </label>
              <input
                id="mess-name"
                type="text"
                value={messName}
                onChange={(e) => setMessName(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="mess-location" className="block text-sm font-medium text-gray-700">
                Location
              </label>
              <input
                id="mess-location"
                type="text"
                value={messLocation}
                onChange={(e) => setMessLocation(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="mess-capacity" className="block text-sm font-medium text-gray-700">
                Total Capacity
              </label>
              <input
                id="mess-capacity"
                type="number"
                min="1"
                value={messCapacity}
                onChange={(e) => setMessCapacity(Number(e.target.value))}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={updateMessMutation.isPending}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsEditingMess(false)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                Name
              </span>
              <span className="text-base font-medium text-gray-900">{mess.name}</span>
            </div>
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                Location
              </span>
              <span className="text-base font-medium text-gray-900">
                {mess.location || 'Not set'}
              </span>
            </div>
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                Total Capacity
              </span>
              <span className="text-base font-medium text-gray-900">
                {mess.totalCapacity} seats
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Meal Configurations List */}
      <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900">Meal Timings & Slot Configuration</h2>
        <p className="text-sm text-gray-500 mb-6">
          Configure meal window, slot interval, and capacity per slot.
        </p>

        <div className="space-y-4">
          {mealConfigs.map((cfg) => {
            const isEditing = editingMealId === cfg.id;

            return (
              <div key={cfg.id} className="rounded-lg border border-gray-200 p-4 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 uppercase">
                      {cfg.mealType}
                    </span>
                    <span className="text-sm font-medium text-gray-700">
                      {cfg.startTime} – {cfg.endTime}
                    </span>
                  </div>
                  {!isEditing && (
                    <button
                      onClick={() => handleStartEditMeal(cfg)}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      Configure
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <form
                    onSubmit={(e) => handleSaveMealConfig(e, cfg.id)}
                    className="mt-4 space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <div>
                        <label
                          htmlFor={`start-time-${cfg.id}`}
                          className="block text-xs font-medium text-gray-600"
                        >
                          Start Time (HH:mm)
                        </label>
                        <input
                          id={`start-time-${cfg.id}`}
                          type="text"
                          pattern="^([01]\d|2[0-3]):[0-5]\d$"
                          placeholder="07:30"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          required
                          className="mt-1 block w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor={`end-time-${cfg.id}`}
                          className="block text-xs font-medium text-gray-600"
                        >
                          End Time (HH:mm)
                        </label>
                        <input
                          id={`end-time-${cfg.id}`}
                          type="text"
                          pattern="^([01]\d|2[0-3]):[0-5]\d$"
                          placeholder="09:30"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          required
                          className="mt-1 block w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor={`slot-duration-${cfg.id}`}
                          className="block text-xs font-medium text-gray-600"
                        >
                          Slot Duration (min)
                        </label>
                        <input
                          id={`slot-duration-${cfg.id}`}
                          type="number"
                          min="5"
                          max="120"
                          value={slotDuration}
                          onChange={(e) => setSlotDuration(Number(e.target.value))}
                          required
                          className="mt-1 block w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor={`slot-capacity-${cfg.id}`}
                          className="block text-xs font-medium text-gray-600"
                        >
                          Slot Capacity
                        </label>
                        <input
                          id={`slot-capacity-${cfg.id}`}
                          type="number"
                          min="1"
                          value={slotCapacity}
                          onChange={(e) => setSlotCapacity(Number(e.target.value))}
                          required
                          className="mt-1 block w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={updateMealConfigMutation.isPending}
                        className="rounded bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                      >
                        Save Config
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingMealId(null)}
                        className="rounded border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="mt-3 grid grid-cols-2 gap-4 text-xs text-gray-500 sm:grid-cols-4">
                    <div>
                      <span className="text-gray-400">Slot Duration:</span>{' '}
                      <span className="font-semibold text-gray-800">
                        {cfg.slotDurationMinutes} mins
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Slot Capacity:</span>{' '}
                      <span className="font-semibold text-gray-800">
                        {cfg.defaultSlotCapacity} students
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Booking Cutoff:</span>{' '}
                      <span className="font-semibold text-gray-800">
                        {cfg.bookingCutoffMinutes} mins
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Avg Serving Time:</span>{' '}
                      <span className="font-semibold text-gray-800">
                        {cfg.averageServingTimeSeconds} secs
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
