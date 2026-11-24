import { useState } from 'react';
import { useAvailableMenus } from '../../hooks/useBookings.js';
import {
  useLiveQueue,
  useCreateWalkIn,
  useStartServing,
  useCompleteServing,
  useMarkNoShow,
} from '../../hooks/useQueue.js';

const extractErrorMessage = (err, fallback) => {
  return (
    err?.response?.data?.message ||
    err?.response?.data?.error?.message ||
    (err instanceof Error ? err.message : fallback)
  );
};

export function LiveQueueTab() {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [activeMenuId, setActiveMenuId] = useState('');
  const [walkInLabel, setWalkInLabel] = useState('');
  const [feedback, setFeedback] = useState(null);

  // Fetch menus for the selected date
  const { data: menus } = useAvailableMenus({
    date: selectedDate,
  });

  // Auto-select first menu if none selected
  const effectiveMenuId = activeMenuId || (menus && menus.length > 0 ? menus[0].id : '');

  const { data: queueData } = useLiveQueue(effectiveMenuId);

  const createWalkInMutation = useCreateWalkIn();
  const startServingMutation = useStartServing();
  const completeServingMutation = useCompleteServing();
  const markNoShowMutation = useMarkNoShow();

  const handleWalkIn = async (e) => {
    e.preventDefault();
    if (!effectiveMenuId) return;
    setFeedback(null);
    try {
      await createWalkInMutation.mutateAsync({
        menuId: effectiveMenuId,
        studentIdentifier: walkInLabel.trim() || undefined,
      });
      setWalkInLabel('');
      setFeedback({ type: 'success', message: 'Walk-in added to queue!' });
    } catch (err) {
      const msg = extractErrorMessage(err, 'Failed to add walk-in');
      setFeedback({ type: 'error', message: msg });
    }
  };

  const handleStartServing = async (id) => {
    setFeedback(null);
    try {
      await startServingMutation.mutateAsync(id);
      setFeedback({ type: 'success', message: 'Now serving entry' });
    } catch (err) {
      const msg = extractErrorMessage(err, 'Failed to start serving');
      setFeedback({ type: 'error', message: msg });
    }
  };

  const handleCompleteServing = async (id) => {
    setFeedback(null);
    try {
      await completeServingMutation.mutateAsync(id);
      setFeedback({ type: 'success', message: 'Meal marked as served!' });
    } catch (err) {
      const msg = extractErrorMessage(err, 'Failed to complete serving');
      setFeedback({ type: 'error', message: msg });
    }
  };

  const handleMarkNoShow = async (id) => {
    if (!window.confirm('Mark this entry as No-Show?')) return;
    setFeedback(null);
    try {
      await markNoShowMutation.mutateAsync(id);
      setFeedback({ type: 'success', message: 'Entry marked as no-show' });
    } catch (err) {
      const msg = extractErrorMessage(err, 'Failed to mark no-show');
      setFeedback({ type: 'error', message: msg });
    }
  };

  return (
    <div className="space-y-6">
      {/* Session Selector & Walk-in Bar */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Live Mess Queue Counter</h2>
            <p className="text-sm text-gray-500">Manage real-time dining queue and serving flow</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setActiveMenuId('');
                }}
                className="mt-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700">Meal Session</label>
              <select
                value={effectiveMenuId}
                onChange={(e) => setActiveMenuId(e.target.value)}
                className="mt-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {menus && menus.length > 0 ? (
                  menus.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.mealType} ({m.date.slice(0, 10)})
                    </option>
                  ))
                ) : (
                  <option value="">No active menu found</option>
                )}
              </select>
            </div>
          </div>
        </div>

        {feedback && (
          <div
            className={`mt-4 rounded-md p-3 text-sm ${
              feedback.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {feedback.message}
          </div>
        )}
      </div>

      {!effectiveMenuId ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center text-gray-500">
          No meal menu selected. Please create or select a menu to view the live queue.
        </div>
      ) : (
        <>
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
            <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-5 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700">
                Currently Serving
              </span>
              <div className="mt-2 text-3xl font-extrabold text-indigo-900">
                {queueData?.currentlyServing?.length || 0}
              </div>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-5 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                In Waiting Line
              </span>
              <div className="mt-2 text-3xl font-extrabold text-amber-900">
                {queueData?.totalWaitingCount || 0}
              </div>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-5 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                Checked In
              </span>
              <div className="mt-2 text-3xl font-extrabold text-blue-900">
                {queueData?.checkedIn?.length || 0}
              </div>
            </div>

            <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                Meals Served
              </span>
              <div className="mt-2 text-3xl font-extrabold text-emerald-900">
                {queueData?.servedCount || 0}
              </div>
            </div>
          </div>

          {/* Walk-in Entry Action Bar */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <form onSubmit={handleWalkIn} className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold text-gray-800">Add Walk-in:</span>
              <input
                type="text"
                value={walkInLabel}
                onChange={(e) => setWalkInLabel(e.target.value)}
                placeholder="Identifier (e.g. Roll No or Guest #)"
                className="flex-1 min-w-[200px] rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={createWalkInMutation.isPending}
                className="rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                {createWalkInMutation.isPending ? 'Adding...' : '+ Insert into Queue'}
              </button>
            </form>
          </div>

          {/* Serving & Waiting Columns */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Currently Serving Section */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <h3 className="text-lg font-bold text-gray-900">Serving Counter</h3>
                <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800">
                  {queueData?.currentlyServing?.length || 0} Active
                </span>
              </div>

              <div className="mt-4 space-y-4">
                {queueData?.currentlyServing && queueData.currentlyServing.length > 0 ? (
                  queueData.currentlyServing.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between rounded-lg border-2 border-indigo-500 bg-indigo-50/30 p-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-black text-indigo-700">
                            #{entry.sequenceNumber}
                          </span>
                          <span className="rounded bg-indigo-200/60 px-2 py-0.5 text-xs font-semibold text-indigo-900">
                            {entry.entryType}
                          </span>
                        </div>
                        <p className="mt-1 text-sm font-medium text-gray-800">
                          {entry.studentIdentifier ||
                            entry.student?.name ||
                            entry.student?.rollNo ||
                            'Student'}
                        </p>
                        <p className="text-xs text-gray-500">
                          Serving started:{' '}
                          {entry.servingStartedAt
                            ? new Date(entry.servingStartedAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              })
                            : 'Just now'}
                        </p>
                      </div>

                      <button
                        onClick={() => handleCompleteServing(entry.id)}
                        disabled={completeServingMutation.isPending}
                        className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 disabled:opacity-50"
                      >
                        ✓ Complete Serving
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed border-gray-200 p-8 text-center text-sm text-gray-500">
                    Counter is idle. Call next student from the waiting line.
                  </div>
                )}
              </div>
            </div>

            {/* Waiting Line Section */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <h3 className="text-lg font-bold text-gray-900">Waiting Line</h3>
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                  {queueData?.waiting?.length || 0} in queue
                </span>
              </div>

              <div className="mt-4 space-y-3 max-h-[500px] overflow-y-auto">
                {queueData?.waiting && queueData.waiting.length > 0 ? (
                  queueData.waiting.map((entry, idx) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between rounded-md border border-gray-200 p-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-900">
                          #{entry.sequenceNumber}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900">
                              {entry.studentIdentifier ||
                                entry.student?.name ||
                                entry.student?.rollNo ||
                                'Student'}
                            </span>
                            <span className="text-[11px] rounded bg-gray-100 px-1.5 py-0.5 text-gray-600 font-medium">
                              {entry.entryType}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">Position in queue: {idx + 1}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleStartServing(entry.id)}
                          disabled={startServingMutation.isPending}
                          className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                        >
                          Start Serving
                        </button>
                        <button
                          onClick={() => handleMarkNoShow(entry.id)}
                          disabled={markNoShowMutation.isPending}
                          className="rounded-md border border-gray-300 px-2 py-1.5 text-xs font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                        >
                          No-Show
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed border-gray-200 p-8 text-center text-sm text-gray-500">
                    No students currently waiting in line.
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

