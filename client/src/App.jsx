import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Room from './pages/Room';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      {/* Route alias so any existing links to /get-started smoothly redirect to /signup */}
      <Route path="/get-started" element={<Navigate to="/signup" replace />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/room/:roomId" element={<Room />} />
    </Routes>
  );
}
