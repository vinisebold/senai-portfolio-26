import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { getAvailableYears } from '../data/portfolio';

const years = getAvailableYears();

const sizeMap = {
  large: {
    year: 'font-cormorant text-4xl md:text-5xl leading-none tracking-editorial uppercase px-1',
    bar: 'font-cormorant text-4xl md:text-5xl leading-none tracking-editorial uppercase w-4 md:w-5 text-center select-none',
  },
  compact: {
    year: 'font-cormorant text-lg md:text-xl leading-none tracking-editorial uppercase px-1',
    bar: 'font-cormorant text-lg md:text-xl leading-none tracking-editorial uppercase w-2 md:w-3 text-center select-none',
  },
};

const YearSwitch = ({ size = 'large', className = '' }) => {
  const [hoveredYear, setHoveredYear] = useState(null);
  const [firstYear, secondYear] = years;
  const currentSize = sizeMap[size] || sizeMap.large;

  const showLeftBar = hoveredYear === null || hoveredYear === firstYear;
  const showMiddleBar = hoveredYear !== null;
  const showRightBar = hoveredYear === null || hoveredYear === secondYear;

  const yearClassName = `${currentSize.year} transition-opacity duration-300 hover:opacity-60`;

  if (!firstYear || !secondYear) {
    return (
      <div className={`flex items-center justify-center gap-4 ${className}`}>
        {years.map((year) => (
          <Link key={year} to={`/${year}`} className={yearClassName}>
            {year}
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center ${className}`}
      onMouseLeave={() => setHoveredYear(null)}
    >
      <motion.span
        aria-hidden="true"
        className={currentSize.bar}
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
        className={currentSize.bar}
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
        className={currentSize.bar}
        animate={{ opacity: showRightBar ? 1 : 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        |
      </motion.span>
    </div>
  );
};

export default YearSwitch;
