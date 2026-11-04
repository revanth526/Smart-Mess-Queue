import { BrowserRouter, Routes, Route } from 'react-router-dom';

function HomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-indigo-600">Smart Mess Queue</h1>
        <p className="mt-2 text-gray-600">Food Waste Optimization Platform</p>
        <p className="mt-4 text-sm text-gray-400">Project setup complete. Features coming soon.</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
}
