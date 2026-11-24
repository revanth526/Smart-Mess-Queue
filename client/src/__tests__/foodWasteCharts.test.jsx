import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FoodWasteCharts } from '../components/admin/charts/FoodWasteCharts.jsx';
import { MealType } from '@shared/types';

describe('FoodWasteCharts Component', () => {
  it('renders loading skeleton when isLoading is true', () => {
    const { container } = render(<FoodWasteCharts isLoading={true} />);
    const pulseCards = container.querySelectorAll('.animate-pulse');
    expect(pulseCards.length).toBe(2);
  });

  it('renders error state when error is provided', () => {
    render(
      <FoodWasteCharts
        isLoading={false}
        error={new Error('Failed to fetch analytics from backend')}
      />,
    );
    expect(screen.getByText('Unable to display food waste charts')).toBeInTheDocument();
    expect(
      screen.getByText('Failed to fetch analytics from backend'),
    ).toBeInTheDocument();
  });

  it('renders empty states when byMeal and byDate are empty', () => {
    render(
      <FoodWasteCharts
        isLoading={false}
        analytics={{
          summary: { totalPreparedKg: 0, totalServedKg: 0, totalWastedKg: 0 },
          byMeal: [],
          byDate: [],
        }}
      />,
    );

    expect(screen.getByText('Meal-wise Food Comparison')).toBeInTheDocument();
    expect(screen.getByText('Daily Food Waste Trend')).toBeInTheDocument();
    expect(screen.getByText('No meal session records found')).toBeInTheDocument();
    expect(screen.getByText('No chronological trend data found')).toBeInTheDocument();
  });

  it('renders real analytics data for meal comparison bar chart and daily trend line chart', () => {
    const mockAnalytics = {
      byMeal: [
        {
          mealType: MealType.BREAKFAST,
          totalPreparedKg: 80,
          totalServedKg: 65,
          totalWastedKg: 10,
          totalRemainingKg: 5,
          wastePercentage: 12.5,
          recordCount: 1,
        },
        {
          mealType: MealType.LUNCH,
          totalPreparedKg: 150,
          totalServedKg: 120,
          totalWastedKg: 20,
          totalRemainingKg: 10,
          wastePercentage: 13.33,
          recordCount: 1,
        },
        {
          mealType: MealType.DINNER,
          totalPreparedKg: 110,
          totalServedKg: 90,
          totalWastedKg: 15,
          totalRemainingKg: 5,
          wastePercentage: 13.64,
          recordCount: 1,
        },
      ],
      byDate: [
        {
          date: '2026-10-01',
          totalPreparedKg: 100,
          totalServedKg: 85,
          totalWastedKg: 10,
          totalRemainingKg: 5,
          wastePercentage: 10,
          recordCount: 1,
        },
        {
          date: '2026-10-02',
          totalPreparedKg: 120,
          totalServedKg: 95,
          totalWastedKg: 18,
          totalRemainingKg: 7,
          wastePercentage: 15,
          recordCount: 1,
        },
        {
          date: '2026-10-03',
          totalPreparedKg: 110,
          totalServedKg: 90,
          totalWastedKg: 12,
          totalRemainingKg: 8,
          wastePercentage: 10.9,
          recordCount: 1,
        },
      ],
    };

    render(<FoodWasteCharts analytics={mockAnalytics} isLoading={false} />);

    // Section title
    expect(screen.getByText('Visual Waste Analytics')).toBeInTheDocument();

    // Chart 1 titles & labels
    expect(screen.getByText('Meal-wise Food Comparison')).toBeInTheDocument();
    expect(screen.getByText('Prepared')).toBeInTheDocument();
    expect(screen.getByText('Served')).toBeInTheDocument();
    expect(screen.getByText('Wasted')).toBeInTheDocument();
    expect(screen.getByText('Breakfast')).toBeInTheDocument();
    expect(screen.getByText('Lunch')).toBeInTheDocument();
    expect(screen.getByText('Dinner')).toBeInTheDocument();

    // Chart 2 titles & labels
    expect(screen.getByText('Daily Food Waste Trend')).toBeInTheDocument();
    expect(screen.getByText('Food Wasted (kg)')).toBeInTheDocument();
    expect(screen.getByText('Oct 1')).toBeInTheDocument();
    expect(screen.getByText('Oct 3')).toBeInTheDocument();

    // Interactive tooltip test on bar hover
    const mealComparisonCard = screen.getByTestId('chart-meal-comparison');
    const bars = mealComparisonCard.querySelectorAll('rect');
    expect(bars.length).toBeGreaterThanOrEqual(9); // 3 meals x 3 bars (prepared, served, wasted)

    fireEvent.mouseEnter(bars[0]);
    expect(screen.getByText(/Breakfast — Prepared/i)).toBeInTheDocument();

    // Interactive tooltip test on trend line dot hover
    const dailyTrendCard = screen.getByTestId('chart-daily-trend');
    const hitCircles = dailyTrendCard.querySelectorAll('circle[r="14"]');
    expect(hitCircles.length).toBe(3);

    fireEvent.mouseEnter(hitCircles[1]);
    expect(screen.getByText(/2026-10-02/i)).toBeInTheDocument();
  });
});
