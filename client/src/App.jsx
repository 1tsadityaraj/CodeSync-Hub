import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import PlaceholderPage from './pages/PlaceholderPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<PlaceholderPage title="Log In" />} />
      <Route path="/get-started" element={<PlaceholderPage title="Get Started" />} />
    </Routes>
  );
}
