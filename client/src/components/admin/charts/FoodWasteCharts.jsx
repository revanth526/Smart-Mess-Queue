import React, { useState } from 'react';

/**
 * Format a meal type string to Title Case (e.g., 'BREAKFAST' -> 'Breakfast')
 */
function formatMealType(meal) {
  if (!meal) return '';
  return meal.charAt(0).toUpperCase() + meal.slice(1).toLowerCase();
}

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/**
 * Format a date string (YYYY-MM-DD) to a compact human-friendly label (e.g. 'Oct 6')
 */
function formatDateLabel(dateStr) {
  if (!dateStr) return '';
  const parts = String(dateStr).split('-');
  if (parts.length === 3) {
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    if (m >= 0 && m < 12 && !isNaN(d)) {
      return `${MONTH_NAMES[m]} ${d}`;
    }
  }
  return dateStr;
}

/**
 * Calculate nice ceiling number for Y-axis scaling
 */
function calculateNiceMax(rawMax, defaultMax = 10) {
  if (!rawMax || rawMax <= 0) return defaultMax;
  const target = rawMax * 1.15;
  if (target <= 10) return 10;
  if (target <= 25) return 25;
  if (target <= 50) return 50;
  if (target <= 100) return 100;
  if (target <= 200) return 200;
  if (target <= 500) return 500;
  const magnitude = Math.pow(10, Math.floor(Math.log10(target)));
  return Math.ceil(target / magnitude) * magnitude;
}

/**
 * Chart 1: Grouped Bar Chart comparing Prepared vs Served vs Wasted by meal session
 */
function MealComparisonBarChart({ byMeal = [] }) {
  const [hoveredBar, setHoveredBar] = useState(null);

  // Filter or ensure standard meals
  const validMeals = byMeal.filter(
    (m) => m && (m.totalPreparedKg > 0 || m.totalServedKg > 0 || m.totalWastedKg > 0),
  );

  const displayMeals = validMeals.length > 0 ? validMeals : byMeal;
  const hasData = displayMeals.some(
    (m) => m && (m.totalPreparedKg > 0 || m.totalServedKg > 0 || m.totalWastedKg > 0),
  );

  if (!hasData) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50/50 p-6 text-center">
        <svg
          className="h-10 w-10 text-gray-400 mb-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <p className="text-xs font-medium text-gray-600">No meal session records found</p>
        <p className="text-[11px] text-gray-400 mt-0.5">
          Log food preparation and waste to populate this chart.
        </p>
      </div>
    );
  }

  // Dimensions
  const svgWidth = 520;
  const svgHeight = 280;
  const padding = { top: 30, right: 20, bottom: 45, left: 50 };
  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  // Max value calculation
  const rawMax = Math.max(
    ...displayMeals.flatMap((m) => [m.totalPreparedKg || 0, m.totalServedKg || 0, m.totalWastedKg || 0]),
  );
  const yMax = calculateNiceMax(rawMax, 10);

  // Y-axis ticks (4 ticks)
  const yTicks = [0, yMax * 0.25, yMax * 0.5, yMax * 0.75, yMax];

  // Bar group layout
  const groupWidth = plotWidth / displayMeals.length;
  const barWidth = Math.min(24, Math.max(12, (groupWidth - 36) / 3));
  const barGap = 3;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-auto overflow-visible select-none"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Meal-wise Prepared vs Served vs Wasted bar chart"
      >
        {/* Horizontal gridlines and Y-axis labels */}
        {yTicks.map((tickVal) => {
          const y = padding.top + plotHeight - (tickVal / yMax) * plotHeight;
          return (
            <g key={tickVal} className="text-gray-400">
              <line
                x1={padding.left}
                y1={y}
                x2={padding.left + plotWidth}
                y2={y}
                stroke="#E5E7EB"
                strokeDasharray={tickVal === 0 ? 'none' : '3 3'}
                strokeWidth={tickVal === 0 ? '1.5' : '1'}
              />
              <text
                x={padding.left - 8}
                y={y + 3.5}
                textAnchor="end"
                className="text-[10px] fill-gray-400 font-medium font-mono"
              >
                {tickVal >= 1000 ? `${(tickVal / 1000).toFixed(1)}t` : `${Math.round(tickVal)}`}
              </text>
            </g>
          );
        })}

        {/* Y Axis unit label */}
        <text
          x={padding.left}
          y={padding.top - 12}
          textAnchor="start"
          className="text-[10px] fill-gray-500 font-medium uppercase tracking-wider"
        >
          kg
        </text>

        {/* Grouped Bars */}
        {displayMeals.map((meal, groupIdx) => {
          const groupCenterX = padding.left + groupIdx * groupWidth + groupWidth / 2;
          const startX = groupCenterX - (3 * barWidth + 2 * barGap) / 2;

          const metrics = [
            {
              type: 'Prepared',
              value: meal.totalPreparedKg || 0,
              color: '#3B82F6', // Blue
              hoverColor: '#2563EB',
              textColor: 'text-blue-600',
            },
            {
              type: 'Served',
              value: meal.totalServedKg || 0,
              color: '#10B981', // Emerald
              hoverColor: '#059669',
              textColor: 'text-emerald-600',
            },
            {
              type: 'Wasted',
              value: meal.totalWastedKg || 0,
              color: '#F43F5E', // Rose
              hoverColor: '#E11D48',
              textColor: 'text-rose-600',
            },
          ];

          return (
            <g key={meal.mealType || groupIdx}>
              {metrics.map((metric, metricIdx) => {
                const barX = startX + metricIdx * (barWidth + barGap);
                const barHeight = Math.max(0, (metric.value / yMax) * plotHeight);
                const barY = padding.top + plotHeight - barHeight;
                const isHovered =
                  hoveredBar?.groupIdx === groupIdx && hoveredBar?.metricIdx === metricIdx;

                return (
                  <g key={metric.type}>
                    <rect
                      x={barX}
                      y={barY}
                      width={barWidth}
                      height={barHeight}
                      rx="3"
                      ry="3"
                      fill={isHovered ? metric.hoverColor : metric.color}
                      className="transition-all duration-150 cursor-pointer"
                      onMouseEnter={() =>
                        setHoveredBar({
                          groupIdx,
                          metricIdx,
                          mealType: meal.mealType,
                          metric: metric.type,
                          value: metric.value,
                          wastePct: meal.wastePercentage,
                          x: barX + barWidth / 2,
                          y: barY,
                        })
                      }
                      onMouseLeave={() => setHoveredBar(null)}
                    />
                    {/* Compact value label on top of bar for clear reading */}
                    {barHeight > 18 && (
                      <text
                        x={barX + barWidth / 2}
                        y={barY - 4}
                        textAnchor="middle"
                        className="text-[9px] fill-gray-500 font-semibold"
                      >
                        {metric.value >= 100 ? Math.round(metric.value) : metric.value.toFixed(1)}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* X Axis meal label */}
              <text
                x={groupCenterX}
                y={padding.top + plotHeight + 20}
                textAnchor="middle"
                className="text-xs font-semibold fill-gray-700"
              >
                {formatMealType(meal.mealType)}
              </text>
              <text
                x={groupCenterX}
                y={padding.top + plotHeight + 33}
                textAnchor="middle"
                className="text-[10px] font-medium fill-gray-400"
              >
                {meal.wastePercentage ?? 0}% waste
              </text>
            </g>
          );
        })}
      </svg>

      {/* Floating Hover Tooltip */}
      {hoveredBar && (
        <div
          className="pointer-events-none absolute z-20 rounded-md bg-gray-900 px-2.5 py-1.5 text-xs text-white shadow-lg -translate-x-1/2 -translate-y-full mb-2"
          style={{
            left: `${(hoveredBar.x / svgWidth) * 100}%`,
            top: `${(hoveredBar.y / svgHeight) * 100}%`,
          }}
        >
          <div className="font-semibold text-gray-200">
            {formatMealType(hoveredBar.mealType)} — {hoveredBar.metric}
          </div>
          <div className="text-amber-400 font-mono font-bold text-sm">
            {hoveredBar.value} kg
          </div>
          {hoveredBar.metric === 'Wasted' && (
            <div className="text-[10px] text-gray-300">
              Waste rate: {hoveredBar.wastePct}%
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Chart 2: Responsive SVG Area & Line Chart showing daily food waste trend over time
 */
function DailyWasteTrendLineChart({ byDate = [] }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Sort chronologically just in case
  const sortedData = [...byDate].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  const hasData = sortedData.length > 0 && sortedData.some((d) => (d.totalWastedKg || 0) > 0 || (d.totalPreparedKg || 0) > 0);

  if (!hasData) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50/50 p-6 text-center">
        <svg
          className="h-10 w-10 text-gray-400 mb-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
          />
        </svg>
        <p className="text-xs font-medium text-gray-600">No chronological trend data found</p>
        <p className="text-[11px] text-gray-400 mt-0.5">
          Daily waste data points will appear as meal records accumulate.
        </p>
      </div>
    );
  }

  // SVG canvas dimensions
  const svgWidth = 520;
  const svgHeight = 280;
  const padding = { top: 30, right: 25, bottom: 45, left: 50 };
  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  // Max value calculation
  const rawMax = Math.max(...sortedData.map((d) => d.totalWastedKg || 0));
  const yMax = calculateNiceMax(rawMax, 10);

  // Y-axis ticks
  const yTicks = [0, yMax * 0.25, yMax * 0.5, yMax * 0.75, yMax];

  // Coordinate computation
  const pointCount = sortedData.length;
  const stepX = pointCount > 1 ? plotWidth / (pointCount - 1) : plotWidth / 2;

  const points = sortedData.map((d, i) => {
    const x = pointCount > 1 ? padding.left + i * stepX : padding.left + plotWidth / 2;
    const y = padding.top + plotHeight - ((d.totalWastedKg || 0) / yMax) * plotHeight;
    return { x, y, data: d };
  });

  // Construct SVG paths
  const linePathD = points.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  const areaPathD =
    points.length > 1
      ? `${linePathD} L ${points[points.length - 1].x} ${padding.top + plotHeight} L ${points[0].x} ${padding.top + plotHeight} Z`
      : '';

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-auto overflow-visible select-none"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Daily Food Waste Trend line chart"
      >
        <defs>
          {/* Subtle rose gradient for area fill */}
          <linearGradient id="wasteAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.25" />
            <stop offset="90%" stopColor="#F43F5E" stopOpacity="0.02" />
            <stop offset="100%" stopColor="#F43F5E" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal gridlines */}
        {yTicks.map((tickVal) => {
          const y = padding.top + plotHeight - (tickVal / yMax) * plotHeight;
          return (
            <g key={tickVal} className="text-gray-400">
              <line
                x1={padding.left}
                y1={y}
                x2={padding.left + plotWidth}
                y2={y}
                stroke="#E5E7EB"
                strokeDasharray={tickVal === 0 ? 'none' : '3 3'}
                strokeWidth={tickVal === 0 ? '1.5' : '1'}
              />
              <text
                x={padding.left - 8}
                y={y + 3.5}
                textAnchor="end"
                className="text-[10px] fill-gray-400 font-medium font-mono"
              >
                {tickVal >= 1000 ? `${(tickVal / 1000).toFixed(1)}t` : `${Math.round(tickVal)}`}
              </text>
            </g>
          );
        })}

        {/* Y Axis unit label */}
        <text
          x={padding.left}
          y={padding.top - 12}
          textAnchor="start"
          className="text-[10px] fill-gray-500 font-medium uppercase tracking-wider"
        >
          kg wasted
        </text>

        {/* Gradient Area Fill */}
        {areaPathD && <path d={areaPathD} fill="url(#wasteAreaGradient)" />}

        {/* Trend Line */}
        {linePathD && (
          <path
            d={linePathD}
            fill="none"
            stroke="#F43F5E"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Active Vertical Guideline on hover */}
        {hoveredPoint && (
          <line
            x1={hoveredPoint.x}
            y1={padding.top}
            x2={hoveredPoint.x}
            y2={padding.top + plotHeight}
            stroke="#F43F5E"
            strokeDasharray="2 2"
            strokeWidth="1"
          />
        )}

        {/* Data Point Circles */}
        {points.map((pt, i) => {
          const isHovered = hoveredPoint?.i === i;
          return (
            <g key={pt.data.date || i}>
              {/* Invisible larger hit area for seamless hovering */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r="14"
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredPoint({ ...pt, i })}
                onMouseLeave={() => setHoveredPoint(null)}
              />
              {/* Visible dot */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isHovered ? 6 : 4}
                fill="#FFFFFF"
                stroke="#F43F5E"
                strokeWidth={isHovered ? 3 : 2}
                className="transition-all duration-150 pointer-events-none"
              />
            </g>
          );
        })}

        {/* X Axis Date Labels (display up to 6 evenly spaced labels to prevent crowding) */}
        {points.map((pt, i) => {
          const skipInterval = Math.max(1, Math.ceil(points.length / 6));
          const isKeyTick = i === 0 || i === points.length - 1 || i % skipInterval === 0;
          if (!isKeyTick) return null;

          return (
            <text
              key={pt.data.date || i}
              x={pt.x}
              y={padding.top + plotHeight + 20}
              textAnchor="middle"
              className="text-[10px] font-medium fill-gray-500"
            >
              {formatDateLabel(pt.data.date)}
            </text>
          );
        })}
      </svg>

      {/* Floating Hover Tooltip */}
      {hoveredPoint && (
        <div
          className="pointer-events-none absolute z-20 rounded-md bg-gray-900 px-3 py-2 text-xs text-white shadow-lg -translate-x-1/2 -translate-y-full mb-2"
          style={{
            left: `${(hoveredPoint.x / svgWidth) * 100}%`,
            top: `${(hoveredPoint.y / svgHeight) * 100}%`,
          }}
        >
          <div className="font-semibold text-gray-200 border-b border-gray-700 pb-1 mb-1">
            {formatDateLabel(hoveredPoint.data.date)} ({hoveredPoint.data.date})
          </div>
          <div className="flex justify-between gap-3 text-[11px]">
            <span className="text-gray-400">Food Wasted:</span>
            <span className="font-bold text-rose-400">{hoveredPoint.data.totalWastedKg} kg</span>
          </div>
          <div className="flex justify-between gap-3 text-[11px]">
            <span className="text-gray-400">Food Prepared:</span>
            <span className="font-medium text-gray-200">{hoveredPoint.data.totalPreparedKg} kg</span>
          </div>
          <div className="flex justify-between gap-3 text-[11px]">
            <span className="text-gray-400">Waste Rate:</span>
            <span className="font-medium text-amber-300">{hoveredPoint.data.wastePercentage}%</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Reusable FoodWasteCharts Component
 *
 * Renders:
 * 1. Meal-wise Food Comparison Grouped Bar Chart (Prepared vs Served vs Wasted)
 * 2. Daily Food Waste Trend Line & Area Chart
 *
 * Adheres to desktop 2-column, mobile single-column layout with Smart Mess design system.
 */
export function FoodWasteCharts({ analytics, isLoading, error }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-80 rounded-xl border border-gray-200 bg-white p-6 shadow-xs animate-pulse">
          <div className="h-4 w-48 bg-gray-200 rounded mb-2" />
          <div className="h-3 w-64 bg-gray-100 rounded mb-6" />
          <div className="h-48 bg-gray-50 rounded-lg" />
        </div>
        <div className="h-80 rounded-xl border border-gray-200 bg-white p-6 shadow-xs animate-pulse">
          <div className="h-4 w-48 bg-gray-200 rounded mb-2" />
          <div className="h-3 w-64 bg-gray-100 rounded mb-6" />
          <div className="h-48 bg-gray-50 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        <p className="font-semibold">Unable to display food waste charts</p>
        <p className="text-xs text-red-600 mt-1">
          {error.message || 'Failed to load visual analytics metrics from the server.'}
        </p>
      </div>
    );
  }

  const byMeal = analytics?.byMeal || [];
  const byDate = analytics?.byDate || [];

  return (
    <div className="space-y-4" data-testid="food-waste-charts-section">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-gray-900">Visual Waste Analytics</h3>
          <p className="text-xs text-gray-500">
            Real-time comparative metrics and chronological waste trends based on verified food logs.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Grouped Bar Chart (Meal-wise Comparison) */}
        <div
          data-testid="chart-meal-comparison"
          className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-xs"
        >
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3 mb-3">
              <div>
                <h4 className="text-sm font-bold text-gray-900">Meal-wise Food Comparison</h4>
                <p className="text-xs text-gray-500">Prepared vs. Served vs. Wasted (kg)</p>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 font-medium text-gray-700">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500 inline-block" />
                  Prepared
                </span>
                <span className="flex items-center gap-1.5 font-medium text-gray-700">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block" />
                  Served
                </span>
                <span className="flex items-center gap-1.5 font-medium text-gray-700">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500 inline-block" />
                  Wasted
                </span>
              </div>
            </div>

            <MealComparisonBarChart byMeal={byMeal} />
          </div>

          <div className="border-t border-gray-100 pt-3 mt-2 flex items-center justify-between text-[11px] text-gray-400">
            <span>Grouped by physical meal session</span>
            <span>Unit: Kilograms (kg)</span>
          </div>
        </div>

        {/* Chart 2: Line / Area Chart (Daily Waste Trend) */}
        <div
          data-testid="chart-daily-trend"
          className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-xs"
        >
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3 mb-3">
              <div>
                <h4 className="text-sm font-bold text-gray-900">Daily Food Waste Trend</h4>
                <p className="text-xs text-gray-500">Chronological daily waste tracking</p>
              </div>

              {/* Indicator */}
              <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500 inline-block" />
                Food Wasted (kg)
              </div>
            </div>

            <DailyWasteTrendLineChart byDate={byDate} />
          </div>

          <div className="border-t border-gray-100 pt-3 mt-2 flex items-center justify-between text-[11px] text-gray-400">
            <span>Hover on data points to view exact quantities</span>
            <span>Sorted chronologically</span>
          </div>
        </div>
      </div>
    </div>
  );
}
