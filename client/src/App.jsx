// App.jsx - the navigation bar plus one page chosen by the URL.
import { Navigate, Route, Routes } from 'react-router-dom';
import NavBar from './components/NavBar.jsx';
import Dashboard from './pages/Dashboard.jsx';
import LogicPanel from './pages/LogicPanel.jsx';
import History from './pages/History.jsx';
import Hardware from './pages/Hardware.jsx';

export default function App() {
  return (
    <div className="min-h-screen">
      <NavBar />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/logic" element={<LogicPanel />} />
          <Route path="/hardware" element={<Hardware />} />
          <Route path="/history" element={<History />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="px-4 pb-6 text-center text-xs text-slate-500">
        Smart Parking Garage Slot Tracker · Digital Systems Design Microproject
      </footer>
    </div>
  );
}
