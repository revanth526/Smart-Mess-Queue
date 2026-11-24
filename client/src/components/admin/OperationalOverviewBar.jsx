import { useOperationalMetrics } from '../../hooks/useFeedback.js';

export function OperationalOverviewBar({ messId }) {
  const { data: metrics, isLoading, error } = useOperationalMetrics(messId);

  if (isLoading) {
    return (
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-200/60 p-4" />
        ))}
      </div>
    );
  }

  if (error || !metrics) {
    return null; // Gracefully fall back if metrics endpoint is unavailable
  }

  const inServiceCount = metrics.servingCount + metrics.totalWaitingCount;

  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
          Today's Live Operations Overview
        </h2>
        <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
          Live Metrics
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {/* Total Bookings */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-medium text-gray-500">Today's Bookings</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">{metrics.totalBookings}</span>
            <span className="text-xs text-gray-400">reservations</span>
          </div>
          <div className="mt-1 text-[11px] text-gray-400">
            {metrics.walkInCount} walk-in tokens issued
          </div>
        </div>

        {/* Live In-Service / Queue */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-medium text-gray-500">In Service / Waiting</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-indigo-600">{inServiceCount}</span>
            <span className="text-xs text-indigo-400">students</span>
          </div>
          <div className="mt-1 text-[11px] text-gray-400">
            {metrics.servingCount} serving, {metrics.totalWaitingCount} waiting
          </div>
        </div>

        {/* Meals Served */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-medium text-gray-500">Meals Completed</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600">{metrics.servedCount}</span>
            <span className="text-xs text-emerald-400">served</span>
          </div>
          <div className="mt-1 text-[11px] text-gray-400">
            {metrics.checkedInCount} checked-in at counter
          </div>
        </div>

        {/* Food Waste Percentage */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-medium text-gray-500">Food Prepared / Waste</p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span
              className={`text-2xl font-bold ${
                metrics.wastePercentage > 15
                  ? 'text-red-600'
                  : metrics.wastePercentage > 10
                    ? 'text-amber-600'
                    : 'text-gray-900'
              }`}
            >
              {metrics.wastePercentage}%
            </span>
            <span className="text-xs text-gray-400">waste rate</span>
          </div>
          <div className="mt-1 text-[11px] text-gray-400">
            {metrics.foodWastedKg} kg / {metrics.foodPreparedKg} kg prepared
          </div>
        </div>

        {/* Feedback Rating */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-medium text-gray-500">Student Satisfaction</p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-amber-500">
              {metrics.averageFeedbackRating > 0 ? metrics.averageFeedbackRating.toFixed(1) : '—'}
            </span>
            <span className="text-xs text-gray-400">★ / 5.0</span>
          </div>
          <div className="mt-1 text-[11px] text-gray-400">
            {metrics.feedbackCount} meal review{metrics.feedbackCount === 1 ? '' : 's'}
          </div>
        </div>
      </div>
    </div>
  );
}

