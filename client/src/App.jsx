import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      {/* Route alias so any existing links to /get-started smoothly redirect to /signup */}
      <Route path="/get-started" element={<Navigate to="/signup" replace />} />
    </Routes>
  );
}
