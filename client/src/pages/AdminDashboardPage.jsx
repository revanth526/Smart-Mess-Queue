import { lazy, Suspense, useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { OperationalOverviewBar } from '../components/admin/OperationalOverviewBar.jsx';
import { SmartMessLogo } from '../components/common/SmartMessLogo.jsx';

// Lazy-load heavy admin tab components — only the active tab's code is fetched.
// The shell (navbar + tabs) renders instantly; tab content loads on first visit.
const MessSettingsTab = lazy(() =>
  import('../components/admin/MessSettingsTab.jsx').then((m) => ({ default: m.MessSettingsTab })),
);
const MenuItemsTab = lazy(() =>
  import('../components/admin/MenuItemsTab.jsx').then((m) => ({ default: m.MenuItemsTab })),
);
const DailyMenuTab = lazy(() =>
  import('../components/admin/DailyMenuTab.jsx').then((m) => ({ default: m.DailyMenuTab })),
);
const LiveQueueTab = lazy(() =>
  import('../components/admin/LiveQueueTab.jsx').then((m) => ({ default: m.LiveQueueTab })),
);
const FoodWasteTab = lazy(() =>
  import('../components/admin/FoodWasteTab.jsx').then((m) => ({ default: m.FoodWasteTab })),
);
const AdminFeedbackTab = lazy(() =>
  import('../components/admin/AdminFeedbackTab.jsx').then((m) => ({ default: m.AdminFeedbackTab })),
);

/** Minimal inline fallback – shown while a tab chunk is being fetched. */
function TabSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 rounded bg-gray-200" />
      <div className="h-40 rounded-lg bg-gray-200" />
    </div>
  );
}

export default function AdminDashboardPage() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('menus');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navbar */}
      <header className="border-b border-gray-200 bg-white shadow-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <SmartMessLogo size="sm" variant="icon-only" />
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">Smart Mess Admin</h1>
              <p className="text-xs text-gray-500">Mess, Queue & Food Waste Optimization</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <span className="block text-sm font-medium text-gray-900">{user?.name}</span>
              <span className="block text-xs text-gray-500">{user?.email}</span>
            </div>
            <button
              onClick={logout}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Operational Overview KPI summary */}
        <OperationalOverviewBar />

        {/* Navigation Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab('queue')}
              className={`whitespace-nowrap border-b-2 py-3 px-1 text-sm font-medium transition-colors ${
                activeTab === 'queue'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              Live Service & Queue
            </button>
            <button
              onClick={() => setActiveTab('menus')}
              className={`whitespace-nowrap border-b-2 py-3 px-1 text-sm font-medium transition-colors ${
                activeTab === 'menus'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              Daily Menus & Slots
            </button>
            <button
              onClick={() => setActiveTab('items')}
              className={`whitespace-nowrap border-b-2 py-3 px-1 text-sm font-medium transition-colors ${
                activeTab === 'items'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              Menu Items Catalog
            </button>
            <button
              onClick={() => setActiveTab('waste')}
              className={`whitespace-nowrap border-b-2 py-3 px-1 text-sm font-medium transition-colors ${
                activeTab === 'waste'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              Food Waste & Analytics
            </button>
            <button
              onClick={() => setActiveTab('feedback')}
              className={`whitespace-nowrap border-b-2 py-3 px-1 text-sm font-medium transition-colors ${
                activeTab === 'feedback'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              Student Feedback & Ratings
            </button>
            <button
              onClick={() => setActiveTab('mess')}
              className={`whitespace-nowrap border-b-2 py-3 px-1 text-sm font-medium transition-colors ${
                activeTab === 'mess'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              Mess Settings & Timings
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <Suspense fallback={<TabSkeleton />}>
          {activeTab === 'queue' && <LiveQueueTab />}
          {activeTab === 'menus' && <DailyMenuTab />}
          {activeTab === 'items' && <MenuItemsTab />}
          {activeTab === 'waste' && <FoodWasteTab />}
          {activeTab === 'feedback' && <AdminFeedbackTab />}
          {activeTab === 'mess' && <MessSettingsTab />}
        </Suspense>
      </main>
    </div>
  );
}

