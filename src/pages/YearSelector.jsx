import { motion } from 'framer-motion';
import YearSwitch from '../components/YearSwitch';

const YearSelector = () => {
  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="min-h-screen flex items-center justify-center px-6"
    >
      <div className="text-center">
        <p className="nav-link opacity-60 mb-8">SELECIONE O ANO</p>

        <YearSwitch size="large" />
      </div>
    </motion.main>
  );
};

export default YearSelector;
