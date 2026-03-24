import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
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
  const [slotPositions, setSlotPositions] = useState([0, 0, 0]);
  const [firstYear, secondYear] = years;
  const currentSize = sizeMap[size] || sizeMap.large;
  const leftSlotRef = useRef(null);
  const middleSlotRef = useRef(null);
  const rightSlotRef = useRef(null);

  useEffect(() => {
    const measureSlots = () => {
      const left = leftSlotRef.current?.offsetLeft ?? 0;
      const middle = middleSlotRef.current?.offsetLeft ?? 0;
      const right = rightSlotRef.current?.offsetLeft ?? 0;
      setSlotPositions([left, middle, right]);
    };

    measureSlots();
    window.addEventListener('resize', measureSlots);

    return () => {
      window.removeEventListener('resize', measureSlots);
    };
  }, [size, firstYear, secondYear]);

  const targetSlots =
    hoveredYear === firstYear ? [0, 1] : hoveredYear === secondYear ? [1, 2] : [0, 2];

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
      className={`relative flex items-center justify-center ${className}`}
      onMouseLeave={() => setHoveredYear(null)}
    >
      <span ref={leftSlotRef} aria-hidden="true" className={`${currentSize.bar} opacity-0 select-none`}>
        |
      </span>

      <motion.span
        aria-hidden="true"
        className={currentSize.bar}
        style={{ position: 'absolute', left: 0, pointerEvents: 'none' }}
        animate={{ x: slotPositions[targetSlots[0]] }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
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

      <span ref={middleSlotRef} aria-hidden="true" className={`${currentSize.bar} opacity-0 select-none`}>
        |
      </span>

      <Link
        to={`/${secondYear}`}
        className={yearClassName}
        onMouseEnter={() => setHoveredYear(secondYear)}
        onFocus={() => setHoveredYear(secondYear)}
        onBlur={() => setHoveredYear(null)}
      >
        {secondYear}
      </Link>

      <span ref={rightSlotRef} aria-hidden="true" className={`${currentSize.bar} opacity-0 select-none`}>
        |
      </span>

      <motion.span
        aria-hidden="true"
        className={currentSize.bar}
        style={{ position: 'absolute', left: 0, pointerEvents: 'none' }}
        animate={{ x: slotPositions[targetSlots[1]] }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        |
      </motion.span>
    </div>
  );
};

export default YearSwitch;
