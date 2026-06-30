import { useParams, Navigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { getCategoryBySlug, getTrimester, getTrimestersMeta, isValidYear } from '../data/portfolio';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';

/**
 * TrimesterPage - Individual Trimester Display
 *
 * Design principles:
 * - Side navigation with trimester links
 * - Independent page for each trimester
 * - Editorial header with number and category
 * - List of work cards (full width)
 * - Generous padding and breathing room
 * - Smooth page transitions via framer-motion
 */

const TrimesterPage = () => {
  const { year, categorySlug, trimesterNumber } = useParams();
  const trimestersMeta = getTrimestersMeta();
  const [isFocusMode, setIsFocusMode] = useState(false);
  const focusTransition = { duration: 0.55, ease: [0.43, 0.13, 0.23, 0.96] };

  if (!isValidYear(year)) {
    return <Navigate to="/" replace />;
  }

  // Parse trimester number from URL (format: "1", "2", "3")
  const numero = Number.parseInt(trimesterNumber, 10);

  const formatTrimesterNumber = (key) => {
    const parsed = Number.parseInt(key, 10);
    if (Number.isNaN(parsed)) return String(key);
    return String(parsed).padStart(2, '0');
  };

  // Fetch data
  const category = getCategoryBySlug(year, categorySlug);
  const trimester = getTrimester(year, categorySlug, numero);

  // Handle 404: category or trimester not found
  if (!category || !trimester) {
    return <Navigate to={`/${year}`} replace />;
  }

  return (
    <>
      {/* White background bar for mobile/tablet (behind hamburger and sidebar) */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-28 bg-white md:bg-transparent z-[5]"
        animate={isFocusMode ? { opacity: 0 } : { opacity: 1 }}
        transition={focusTransition}
      />

      {/* Left sidebar - Trimester navigation (no animation) */}
      <motion.aside
        className="fixed left-6 md:left-8 top-16 md:top-48 z-10"
        animate={isFocusMode ? { opacity: 0, x: -72 } : { opacity: 1, x: 0 }}
        transition={focusTransition}
        style={{ pointerEvents: isFocusMode ? 'none' : 'auto' }}
      >
        <div className="flex flex-row md:flex-col gap-6 md:gap-2">
          {trimestersMeta.map(({ key }) => {
            const trimesterAsNumber = Number.parseInt(key, 10);
            const isActive = !Number.isNaN(trimesterAsNumber)
              ? numero === trimesterAsNumber
              : trimesterNumber === key;

            return (
            <Link
              key={key}
              to={`/${year}/${categorySlug}/${key}`}
              className={`font-roboto text-[13px] uppercase opacity-90 hover:opacity-100 transition-opacity block ${
                isActive ? 'font-medium opacity-100' : 'font-light'
              }`}
            >
              |{formatTrimesterNumber(key)}| TRIMESTRE
            </Link>
            );
          })}
        </div>
      </motion.aside>

      {/* Page header (no animation) */}
      <motion.div
        className="pt-14"
        animate={isFocusMode ? { opacity: 0 } : { opacity: 1 }}
        transition={focusTransition}
        style={{ pointerEvents: isFocusMode ? 'none' : 'auto' }}
      >
        <PageHeader numero={numero} categoria={category.categoria} />
      </motion.div>

      {/* Main content with animation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isFocusMode
          ? { opacity: 0, y: 0 }
          : { opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={isFocusMode ? focusTransition : { duration: 0.24 }}
        style={{ pointerEvents: isFocusMode ? 'none' : 'auto' }}
      >
        {/* Work cards section */}
        <section className="px-20 md:px-40 lg:px-64 pb-24">
          <div className="max-w-6xl mx-auto">
            {trimester.trabalhos.length === 0 ? (
              // Empty state
              <div className="text-center py-24">
                <p className="font-inter text-sm font-light tracking-body opacity-40">
                  Nenhum trabalho registrado neste trimestre.
                </p>
              </div>
            ) : (
              // Render work cards
              trimester.trabalhos.map((trabalho) => (
                <Card
                  key={trabalho.id}
                  trabalho={trabalho}
                  onFocusModeChange={setIsFocusMode}
                />
              ))
            )}
          </div>
        </section>
      </motion.div>
    </>
  );
};

export default TrimesterPage;
