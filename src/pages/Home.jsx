import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { isValidYear } from '../data/portfolio';
import FullscreenMenu from '../components/FullscreenMenu';

const Home = () => {
  const { year } = useParams();
  const [selectedCategory, setSelectedCategory] = useState('home');

  useEffect(() => {
    setSelectedCategory('home');
  }, [year]);

  if (!isValidYear(year)) {
    return <Navigate to="/" replace />;
  }

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-[#fafafa] overflow-y-auto"
    >
      <FullscreenMenu
        activeYear={year}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />
    </motion.main>
  );
};

export default Home;
