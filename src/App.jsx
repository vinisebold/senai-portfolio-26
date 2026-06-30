import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import TrimesterPage from './pages/TrimesterPage';
import YearSelector from './pages/YearSelector';
import AdminPage from './pages/AdminPage';

/**
 * AnimatedRoutes - Wrapper for page transitions
 * Enables framer-motion AnimatePresence to work with react-router
 */
const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<YearSelector />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/:year" element={<Home />} />
        <Route path="/:year/:categorySlug/:trimesterNumber" element={<TrimesterPage />} />
      </Routes>
    </AnimatePresence>
  );
};

const AppLayout = () => {
  const location = useLocation();
  const isYearHome = /^\/\d{4}\/?$/.test(location.pathname);
  const showNavbar = location.pathname !== '/' && location.pathname !== '/admin' && !isYearHome;

  return (
    <div className="min-h-screen bg-white">
      {showNavbar && <Navbar />}
      <AnimatedRoutes />
    </div>
  );
};

/**
 * App Component - Main Application Structure
 *
 * Features:
 * - React Router for multi-page navigation
 * - Framer Motion for subtle page transitions
 * - Fixed navbar across all pages
 * - Clean routing structure: / and /:category/:trimester
 */
function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;
