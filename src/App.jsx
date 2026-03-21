import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import TrimesterPage from './pages/TrimesterPage';

/**
 * AnimatedRoutes - Wrapper for page transitions
 * Enables framer-motion AnimatePresence to work with react-router
 */
const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/:categorySlug/:trimesterNumber" element={<TrimesterPage />} />
      </Routes>
    </AnimatePresence>
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
      <div className="min-h-screen bg-white">
        <Navbar />
        <AnimatedRoutes />
      </div>
    </Router>
  );
}

export default App;
