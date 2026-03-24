import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { getAvailableYears } from '../data/portfolio';

const years = getAvailableYears();

const YearSelector = () => {
  const [hoveredYear, setHoveredYear] = useState(null);
  const [firstYear, secondYear] = years;

  const showLeftBar = hoveredYear === null || hoveredYear === firstYear;
  const showMiddleBar = hoveredYear !== null;
  const showRightBar = hoveredYear === null || hoveredYear === secondYear;

  const yearClassName =
    'font-cormorant text-4xl md:text-5xl leading-none tracking-editorial uppercase transition-opacity duration-300 hover:opacity-60 px-1';

  const barClassName =
    'font-cormorant text-4xl md:text-5xl leading-none tracking-editorial uppercase w-4 md:w-5 text-center select-none';

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

        {firstYear && secondYear ? (
          <div
            className="flex items-center justify-center"
            onMouseLeave={() => setHoveredYear(null)}
          >
            <motion.span
              aria-hidden="true"
              className={barClassName}
              animate={{ opacity: showLeftBar ? 1 : 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              |
            </motion.span>

            <Link
              to={`/${firstYear}`}
              className={yearClassName}
              onMouseEnter={() => setHoveredYear(firstYear)}
              onFocus={() => setHoveredYear(firstYear)}
              onBlur={() => setHoveredYear(null)}
            >
              {firstYear}
            </Link>

            <motion.span
              aria-hidden="true"
              className={barClassName}
              animate={{ opacity: showMiddleBar ? 1 : 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              |
            </motion.span>

            <Link
              to={`/${secondYear}`}
              className={yearClassName}
              onMouseEnter={() => setHoveredYear(secondYear)}
              onFocus={() => setHoveredYear(secondYear)}
              onBlur={() => setHoveredYear(null)}
            >
              {secondYear}
            </Link>

            <motion.span
              aria-hidden="true"
              className={barClassName}
              animate={{ opacity: showRightBar ? 1 : 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              |
            </motion.span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-4 md:gap-8">
            {years.map((year) => (
              <Link
                key={year}
                to={`/${year}`}
                className={yearClassName}
              >
                {year}
              </Link>
            ))}
          </div>
        )}
      </div>
    </motion.main>
  );
};

export default YearSelector;
