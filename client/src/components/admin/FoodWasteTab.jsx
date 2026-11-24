import React, { useState } from 'react';
import {
  useFoodLogs,
  useFoodWasteAnalytics,
  useCreateFoodLog,
  useUpdateFoodLog,
} from '../../hooks/useFoodLog.js';
import { useMessConfig } from '../../hooks/useAdmin.js';
import { MealType } from '@shared/types';
import { FoodWasteCharts } from './charts/FoodWasteCharts.jsx';

export function FoodWasteTab() {
  const todayStr = new Date().toISOString().slice(0, 10);

  // Filter state for historical logs & analytics
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterMealType, setFilterMealType] = useState('');

  // Form state
  const [editingLogId, setEditingLogId] = useState(null);
  const [formDate, setFormDate] = useState(todayStr);
  const [formMealType, setFormMealType] = useState(MealType.LUNCH);
  const [preparedKg, setPreparedKg] = useState('');
  const [servedKg, setServedKg] = useState('');
  const [wastedKg, setWastedKg] = useState('');
  const [notes, setNotes] = useState('');

  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // Queries
  const { data: messConfig } = useMessConfig();
  const messId = messConfig?.mess.id || '';

  const { data: foodLogs, isLoading: loadingLogs } = useFoodLogs({
    messId: messId || undefined,
    startDate: filterStartDate || undefined,
    endDate: filterEndDate || undefined,
    mealType: filterMealType || undefined,
  });

  const {
    data: analytics,
    isLoading: loadingAnalytics,
    error: analyticsError,
  } = useFoodWasteAnalytics({
    messId: messId || undefined,
    startDate: filterStartDate || undefined,
    endDate: filterEndDate || undefined,
    mealType: filterMealType || undefined,
  });

  // Mutations
  const createLogMutation = useCreateFoodLog();
  const updateLogMutation = useUpdateFoodLog();

  // Derived Preview calculations (for interactive user guidance)
  const numPrep = typeof preparedKg === 'number' ? preparedKg : 0;
  const numServ = typeof servedKg === 'number' ? servedKg : 0;
  const numWast = typeof wastedKg === 'number' ? wastedKg : 0;
  const previewRemaining = Number((numPrep - numServ - numWast).toFixed(2));
  const previewWastePct = numPrep > 0 ? Number(((numWast / numPrep) * 100).toFixed(2)) : 0;
  const hasInvariantError =
    numPrep < 0 || numServ < 0 || numWast < 0 || numServ + numWast > numPrep;

  const handleEditClick = (log) => {
    setEditingLogId(log.id);
    setFormDate(log.date);
    setFormMealType(log.mealType);
    setPreparedKg(log.preparedKg);
    setServedKg(log.servedKg);
    setWastedKg(log.wastedKg);
    setNotes(log.notes || '');
    setFeedbackMsg(null);
  };

  const handleCancelEdit = () => {
    setEditingLogId(null);
    setFormDate(todayStr);
    setFormMealType(MealType.LUNCH);
    setPreparedKg('');
    setServedKg('');
    setWastedKg('');
    setNotes('');
    setFeedbackMsg(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedbackMsg(null);

    if (preparedKg === '' || servedKg === '' || wastedKg === '') {
      setFeedbackMsg({ type: 'error', text: 'Please fill in all quantity fields.' });
      return;
    }

    if (numPrep < 0 || numServ < 0 || numWast < 0) {
      setFeedbackMsg({ type: 'error', text: 'Quantities must be non-negative.' });
      return;
    }

    if (numServ + numWast > numPrep) {
      setFeedbackMsg({
        type: 'error',
        text: 'Validation error: Served + Wasted cannot exceed Prepared amount.',
      });
      return;
    }

    try {
      if (editingLogId) {
        await updateLogMutation.mutateAsync({
          id: editingLogId,
          payload: {
            preparedKg: numPrep,
            servedKg: numServ,
            wastedKg: numWast,
            notes: notes.trim() || null,
          },
        });
        setFeedbackMsg({ type: 'success', text: 'Food log record updated successfully!' });
        handleCancelEdit();
      } else {
        if (!messId) {
          setFeedbackMsg({ type: 'error', text: 'Mess information not loaded. Please wait.' });
          return;
        }

        await createLogMutation.mutateAsync({
          messId,
          date: formDate,
          mealType: formMealType,
          preparedKg: numPrep,
          servedKg: numServ,
          wastedKg: numWast,
          notes: notes.trim() || null,
        });

        setFeedbackMsg({ type: 'success', text: 'Food record logged successfully!' });
        setPreparedKg('');
        setServedKg('');
        setWastedKg('');
        setNotes('');
      }
    } catch (err) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error?.message ||
        err?.message ||
        'Failed to save food log record.';
      setFeedbackMsg({ type: 'error', text: errorMsg });
    }
  };

  return (
    <div className="space-y-8">
      {/* ── SECTION 1: Summary Analytics Cards ── */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Food Waste & Production Analytics</h2>
            <p className="text-sm text-gray-500">
              Deterministic metrics derived from physical meal service preparation and waste logs.
            </p>
          </div>
        </div>

        {loadingAnalytics ? (
          <div className="p-8 text-center text-sm text-gray-500">Loading analytics metrics...</div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Prepared Food
              </span>
              <p data-testid="stat-prepared" className="mt-1 text-2xl font-bold text-gray-900">
                {analytics?.summary.totalPreparedKg ?? 0}{' '}
                <span className="text-sm font-normal text-gray-500">kg</span>
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Served Food
              </span>
              <p data-testid="stat-served" className="mt-1 text-2xl font-bold text-green-600">
                {analytics?.summary.totalServedKg ?? 0}{' '}
                <span className="text-sm font-normal text-gray-500">kg</span>
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Wasted Food
              </span>
              <p data-testid="stat-wasted" className="mt-1 text-2xl font-bold text-red-600">
                {analytics?.summary.totalWastedKg ?? 0}{' '}
                <span className="text-sm font-normal text-gray-500">kg</span>
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Remaining Food
              </span>
              <p data-testid="stat-remaining" className="mt-1 text-2xl font-bold text-amber-600">
                {analytics?.summary.totalRemainingKg ?? 0}{' '}
                <span className="text-sm font-normal text-gray-500">kg</span>
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Waste Rate
              </span>
              <p data-testid="stat-waste-pct" className="mt-1 text-2xl font-bold text-indigo-600">
                {analytics?.summary.wastePercentage ?? 0}%
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Meal Records
              </span>
              <p data-testid="stat-records" className="mt-1 text-2xl font-bold text-gray-700">
                {analytics?.summary.recordCount ?? 0}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── SECTION 2: Food Waste Breakdown (By Meal Type) ── */}
      {analytics && analytics.byMeal.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-3">
            Waste Breakdown by Meal Session
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {analytics.byMeal.map((m) => (
              <div
                key={m.mealType}
                className="rounded-md border border-gray-100 bg-gray-50 p-3.5 space-y-1 text-sm"
              >
                <div className="flex justify-between items-center font-semibold text-gray-800">
                  <span>{m.mealType}</span>
                  <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700 font-bold">
                    {m.wastePercentage}% Waste
                  </span>
                </div>
                <div className="text-xs text-gray-600 space-y-0.5 pt-1">
                  <div className="flex justify-between">
                    <span>Prepared:</span>
                    <span className="font-medium text-gray-900">{m.totalPreparedKg} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Served:</span>
                    <span className="font-medium text-green-700">{m.totalServedKg} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Wasted:</span>
                    <span className="font-medium text-red-700">{m.totalWastedKg} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Remaining:</span>
                    <span className="font-medium text-amber-700">{m.totalRemainingKg} kg</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SECTION: Visual Food Waste Analytics Charts ── */}
      <FoodWasteCharts
        analytics={analytics}
        isLoading={loadingAnalytics}
        error={analyticsError}
      />

      {/* ── SECTION 3: Log / Update Food Waste Form ── */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">
              {editingLogId ? 'Update Food Service Log' : 'Log Food Preparation & Waste'}
            </h3>
            <p className="text-xs text-gray-500">
              Record verified kilograms for the meal service. Authoritative calculations are
              enforced server-side.
            </p>
          </div>
          {editingLogId && (
            <button
              onClick={handleCancelEdit}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Cancel Edit
            </button>
          )}
        </div>

        {feedbackMsg && (
          <div
            className={`mb-4 rounded-md p-3 text-sm font-medium ${
              feedbackMsg.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {feedbackMsg.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <label
                htmlFor="service-date-input"
                className="block text-xs font-semibold text-gray-700 mb-1"
              >
                Service Date
              </label>
              <input
                id="service-date-input"
                aria-label="Service Date"
                type="date"
                disabled={Boolean(editingLogId)}
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-500"
                required
              />
            </div>

            <div>
              <label
                htmlFor="meal-session-select"
                className="block text-xs font-semibold text-gray-700 mb-1"
              >
                Meal Session
              </label>
              <select
                id="meal-session-select"
                aria-label="Meal Session"
                disabled={Boolean(editingLogId)}
                value={formMealType}
                onChange={(e) => setFormMealType(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-500"
              >
                <option value={MealType.BREAKFAST}>BREAKFAST</option>
                <option value={MealType.LUNCH}>LUNCH</option>
                <option value={MealType.DINNER}>DINNER</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="prepared-kg-input"
                className="block text-xs font-semibold text-gray-700 mb-1"
              >
                Prepared (kg)
              </label>
              <input
                id="prepared-kg-input"
                aria-label="Prepared Amount"
                type="number"
                step="0.1"
                min="0"
                placeholder="e.g. 100"
                value={preparedKg}
                onChange={(e) => setPreparedKg(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label
                htmlFor="served-kg-input"
                className="block text-xs font-semibold text-gray-700 mb-1"
              >
                Served (kg)
              </label>
              <input
                id="served-kg-input"
                aria-label="Served Amount"
                type="number"
                step="0.1"
                min="0"
                placeholder="e.g. 80"
                value={servedKg}
                onChange={(e) => setServedKg(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label
                htmlFor="wasted-kg-input"
                className="block text-xs font-semibold text-gray-700 mb-1"
              >
                Wasted (kg)
              </label>
              <input
                id="wasted-kg-input"
                aria-label="Wasted Amount"
                type="number"
                step="0.1"
                min="0"
                placeholder="e.g. 10"
                value={wastedKg}
                onChange={(e) => setWastedKg(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          {/* Interactive Live Calculation Preview Banner */}
          {(preparedKg !== '' || servedKg !== '' || wastedKg !== '') && (
            <div
              className={`rounded-md p-3 text-xs flex flex-wrap items-center justify-between gap-3 ${
                hasInvariantError
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-indigo-50 text-indigo-900 border border-indigo-100'
              }`}
            >
              <div className="flex items-center gap-4">
                <span>
                  <strong>Preview Remaining:</strong> {previewRemaining} kg
                </span>
                <span>
                  <strong>Preview Waste Rate:</strong> {previewWastePct}%
                </span>
              </div>
              {hasInvariantError && (
                <span className="font-semibold text-red-600">
                  Invalid: Served ({numServ}kg) + Wasted ({numWast}kg) exceeds Prepared ({numPrep}
                  kg)
                </span>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Operational Notes (Optional)
            </label>
            <input
              type="text"
              maxLength={500}
              placeholder="e.g. Higher turnout due to campus festival, extra rice prepared."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            {editingLogId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="rounded-md border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={
                createLogMutation.isPending || updateLogMutation.isPending || hasInvariantError
              }
              className="rounded-md bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none disabled:opacity-50"
            >
              {editingLogId
                ? updateLogMutation.isPending
                  ? 'Updating...'
                  : 'Save Changes'
                : createLogMutation.isPending
                  ? 'Recording...'
                  : 'Log Food Record'}
            </button>
          </div>
        </form>
      </div>

      {/* ── SECTION 4: Historical Logs Table & Filters ── */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">Historical Food Logs</h3>
            <p className="text-xs text-gray-500">
              Verified records with immutable meal/session associations.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              aria-label="Filter Start Date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="rounded-md border border-gray-300 px-2.5 py-1.5 text-xs shadow-sm focus:border-indigo-500 focus:outline-none"
            />
            <span className="text-xs text-gray-400">to</span>
            <input
              type="date"
              aria-label="Filter End Date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="rounded-md border border-gray-300 px-2.5 py-1.5 text-xs shadow-sm focus:border-indigo-500 focus:outline-none"
            />
            <select
              aria-label="Filter Meal Session"
              value={filterMealType}
              onChange={(e) => setFilterMealType(e.target.value)}
              className="rounded-md border border-gray-300 px-2.5 py-1.5 text-xs shadow-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="">All Meals</option>
              <option value={MealType.BREAKFAST}>Breakfast</option>
              <option value={MealType.LUNCH}>Lunch</option>
              <option value={MealType.DINNER}>Dinner</option>
            </select>
            {(filterStartDate || filterEndDate || filterMealType) && (
              <button
                onClick={() => {
                  setFilterStartDate('');
                  setFilterEndDate('');
                  setFilterMealType('');
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium ml-1"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {loadingLogs ? (
          <div className="p-8 text-center text-sm text-gray-500">
            Loading historical food logs...
          </div>
        ) : !foodLogs || foodLogs.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
            No food service logs found for the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-3 py-2.5">Date</th>
                  <th className="px-3 py-2.5">Meal</th>
                  <th className="px-3 py-2.5 text-right">Prepared</th>
                  <th className="px-3 py-2.5 text-right">Served</th>
                  <th className="px-3 py-2.5 text-right">Wasted</th>
                  <th className="px-3 py-2.5 text-right">Remaining</th>
                  <th className="px-3 py-2.5 text-right">Waste %</th>
                  <th className="px-3 py-2.5">Service Context</th>
                  <th className="px-3 py-2.5">Notes</th>
                  <th className="px-3 py-2.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white text-gray-700">
                {foodLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-3 font-medium text-gray-900 whitespace-nowrap">
                      {log.date}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="rounded bg-gray-100 px-2 py-0.5 font-semibold text-gray-800">
                        {log.mealType}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right font-medium">{log.preparedKg} kg</td>
                    <td className="px-3 py-3 text-right text-green-700 font-medium">
                      {log.servedKg} kg
                    </td>
                    <td className="px-3 py-3 text-right text-red-700 font-medium">
                      {log.wastedKg} kg
                    </td>
                    <td className="px-3 py-3 text-right text-amber-700 font-medium">
                      {log.remainingKg} kg
                    </td>
                    <td className="px-3 py-3 text-right font-bold text-indigo-600">
                      {log.wastePercentage}%
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-500">
                      {log.context ? (
                        <span>
                          {log.context.servedCount} served ({log.context.walkInCount} walk-ins,{' '}
                          {log.context.totalBookings} booked)
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-500 max-w-xs truncate">
                      {log.notes || '—'}
                    </td>
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => handleEditClick(log)}
                        className="rounded border border-gray-300 px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100 hover:text-indigo-600 transition-colors"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

