import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getAvailableYears } from '../data/portfolio';

const years = getAvailableYears();

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

        <div className="flex items-center justify-center gap-4 md:gap-8">
          {years.map((year) => (
            <Link
              key={year}
              to={`/${year}`}
              className="font-cormorant text-4xl md:text-5xl leading-none tracking-editorial uppercase hover:opacity-60 transition-opacity"
            >
              | {year} |
            </Link>
          ))}
        </div>
      </div>
    </motion.main>
  );
};

export default YearSelector;
