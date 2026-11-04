import { useState } from 'react';
import { MealType } from '@shared/types';
import { useAdminFeedback, useFeedbackAnalytics } from '../../hooks/useFeedback';

export function AdminFeedbackTab() {
  const [selectedMealType, setSelectedMealType] = useState<string>('ALL');
  const [selectedRating, setSelectedRating] = useState<string>('ALL');

  const filterParams = {
    mealType: selectedMealType !== 'ALL' ? (selectedMealType as MealType) : undefined,
    rating: selectedRating !== 'ALL' ? Number(selectedRating) : undefined,
  };

  const {
    data: feedbackList,
    isLoading: loadingList,
    error: listError,
  } = useAdminFeedback(filterParams);

  const {
    data: analytics,
    isLoading: loadingAnalytics,
    error: analyticsError,
  } = useFeedbackAnalytics(
    selectedMealType !== 'ALL' ? { mealType: selectedMealType as MealType } : undefined,
  );

  return (
    <div className="space-y-6">
      {/* Analytics Summary Header */}
      {loadingAnalytics ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-gray-200/70 p-6" />
          ))}
        </div>
      ) : analyticsError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load feedback analytics.
        </div>
      ) : analytics ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Average Rating Card */}
          <div className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-6 shadow-xs">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Average Meal Rating
              </span>
              <div className="mt-3 flex items-baseline gap-3">
                <span className="text-4xl font-extrabold text-gray-900">
                  {analytics.averageRating > 0 ? analytics.averageRating.toFixed(1) : '0.0'}
                </span>
                <span className="text-sm font-medium text-gray-400">/ 5.0</span>
              </div>
              <div className="mt-2 flex items-center gap-1 text-amber-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`h-5 w-5 ${
                      star <= Math.round(analytics.averageRating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'fill-gray-200 text-gray-200'
                    }`}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                ))}
              </div>
            </div>
            <p className="mt-4 text-xs text-gray-500">
              Based on {analytics.totalCount} total verified student reviews
            </p>
          </div>

          {/* Star Distribution Breakdown */}
          <div className="col-span-2 rounded-xl border border-gray-200 bg-white p-6 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4 block">
              Rating Distribution
            </span>
            <div className="space-y-2.5">
              {([5, 4, 3, 2, 1] as const).map((star) => {
                const count = analytics.distribution[star] || 0;
                const percentage =
                  analytics.totalCount > 0 ? Math.round((count / analytics.totalCount) * 100) : 0;

                return (
                  <div key={star} className="flex items-center gap-3 text-xs">
                    <span className="w-12 font-medium text-gray-600">{star} Stars</span>
                    <div className="flex-1 h-3 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-400 transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-10 text-right font-medium text-gray-500">{percentage}%</span>
                    <span className="w-8 text-right text-gray-400">({count})</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {/* Meal Breakdown Summary Cards */}
      {analytics && analytics.byMeal.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
            Satisfaction by Meal Session
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {analytics.byMeal.map((meal) => (
              <div key={meal.mealType} className="rounded-lg bg-gray-50 p-3 border border-gray-100">
                <span className="text-xs font-semibold text-gray-700 uppercase">
                  {meal.mealType}
                </span>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-lg font-bold text-gray-900">
                    {meal.averageRating > 0 ? meal.averageRating.toFixed(1) : '—'}
                  </span>
                  <span className="text-xs text-amber-500">★</span>
                </div>
                <p className="mt-0.5 text-[11px] text-gray-400">{meal.feedbackCount} reviews</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters and List Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-xs">
        <div className="border-b border-gray-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Student Reviews & Feedback</h3>
            <p className="text-xs text-gray-500">Real-time student feedback for completed meals</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Meal Type Filter */}
            <div className="flex items-center gap-2">
              <label htmlFor="admin-filter-meal" className="text-xs font-medium text-gray-600">
                Meal:
              </label>
              <select
                id="admin-filter-meal"
                value={selectedMealType}
                onChange={(e) => setSelectedMealType(e.target.value)}
                className="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-700 focus:border-indigo-500 focus:outline-none"
              >
                <option value="ALL">All Meals</option>
                <option value={MealType.BREAKFAST}>Breakfast</option>
                <option value={MealType.LUNCH}>Lunch</option>
                <option value={MealType.DINNER}>Dinner</option>
              </select>
            </div>

            {/* Rating Filter */}
            <div className="flex items-center gap-2">
              <label htmlFor="admin-filter-stars" className="text-xs font-medium text-gray-600">
                Rating:
              </label>
              <select
                id="admin-filter-stars"
                value={selectedRating}
                onChange={(e) => setSelectedRating(e.target.value)}
                className="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-700 focus:border-indigo-500 focus:outline-none"
              >
                <option value="ALL">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
            </div>
          </div>
        </div>

        {/* Feedback List Content */}
        {loadingList ? (
          <div className="p-12 text-center text-sm text-gray-500">Loading student reviews...</div>
        ) : listError ? (
          <div className="p-12 text-center text-sm text-red-500">
            Failed to load student feedback.
          </div>
        ) : !feedbackList || feedbackList.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-400">
            No feedback found for the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-gray-200 bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Student</th>
                  <th className="px-4 py-3 font-semibold">Meal Session</th>
                  <th className="px-4 py-3 font-semibold">Rating</th>
                  <th className="px-4 py-3 font-semibold">Comment</th>
                  <th className="px-4 py-3 font-semibold">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {feedbackList.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {item.student?.name || 'Student'}
                      </div>
                      <div className="text-[11px] text-gray-400">
                        {item.student?.rollNo
                          ? `Roll: ${item.student.rollNo}`
                          : item.student?.email}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
                        {item.menu?.mealType || 'Meal'}
                      </span>
                      <div className="mt-0.5 text-[11px] text-gray-400">
                        {item.menu?.date || '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 font-semibold text-amber-500">
                        <span>{item.rating}</span>
                        <span>★</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      {item.comment ? (
                        <p className="text-gray-700 break-words">{item.comment}</p>
                      ) : (
                        <span className="italic text-gray-400">No comment provided</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
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
