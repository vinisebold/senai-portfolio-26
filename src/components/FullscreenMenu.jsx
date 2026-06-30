import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { getCategories, getTrimestersMeta } from '../data/portfolio';
import YearSwitch from './YearSwitch';

const FullscreenMenu = ({
  activeYear,
  selectedCategory,
  onSelectCategory,
  onNavigate,
}) => {
  const location = useLocation();
  const categories = getCategories(activeYear);
  const trimestersMeta = getTrimestersMeta();

  const formatTrimesterNumber = (key) => {
    const parsed = Number.parseInt(key, 10);
    if (Number.isNaN(parsed)) return String(key);
    return String(parsed).padStart(2, '0');
  };

  const handleHomeClick = () => {
    onSelectCategory?.('home');
    onNavigate?.();
  };

  return (
    <div className="min-h-screen flex items-start pt-32 px-8 sm:px-12 md:px-40 lg:px-64">
      <div className="w-full max-w-6xl">
        <div className="flex flex-col md:flex-row gap-14 md:gap-32">
          <nav className="space-y-2 flex-shrink-0">
            <div className="flex items-center gap-4">
              <motion.div
                animate={{
                  scale: selectedCategory === 'home' ? 1 : 0,
                  opacity: selectedCategory === 'home' ? 1 : 0,
                }}
                transition={{ duration: 0.3, ease: [0.43, 0.13, 0.23, 0.96] }}
                className="w-1 h-1.5 bg-black flex-shrink-0"
              />
              <Link
                to={`/${activeYear}`}
                className="inline-block font-lora text-[28px] font-medium uppercase hover:opacity-60 transition-opacity"
                onClick={handleHomeClick}
              >
                Vinicius Sebold
              </Link>
            </div>

            {categories.map((cat) => (
              <div key={cat.slug} className="flex items-center gap-4">
                <motion.div
                  animate={{
                    scale: selectedCategory === cat.slug ? 1 : 0,
                    opacity: selectedCategory === cat.slug ? 1 : 0,
                  }}
                  transition={{ duration: 0.3, ease: [0.43, 0.13, 0.23, 0.96] }}
                  className="w-1 h-1.5 bg-black flex-shrink-0"
                />

                <button
                  type="button"
                  onClick={() => onSelectCategory?.(cat.slug)}
                  className="font-lora text-[28px] font-medium uppercase transition-opacity text-left hover:opacity-70"
                >
                  {cat.categoria}
                </button>
              </div>
            ))}
          </nav>

          <AnimatePresence mode="wait">
            {categories.map((cat) =>
              selectedCategory === cat.slug && (
                <motion.div
                  key={cat.slug}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.43, 0.13, 0.23, 0.96] }}
                  className="space-y-5 pt-1 flex-shrink-0"
                >
                  {trimestersMeta.map(({ key }) => (
                    <div key={key}>
                      <Link
                        to={`/${activeYear}/${cat.slug}/${key}`}
                        className={`font-roboto text-[15px] uppercase opacity-90 hover:opacity-100 transition-opacity block ${
                          location.pathname === `/${activeYear}/${cat.slug}/${key}` ? 'font-medium' : 'font-light'
                        }`}
                        onClick={onNavigate}
                      >
                        |{formatTrimesterNumber(key)}| TRIMESTRE
                      </Link>
                    </div>
                  ))}
                </motion.div>
              ),
            )}
          </AnimatePresence>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mt-24 flex items-center justify-start"
        >
          <YearSwitch size="compact" />
        </motion.div>
      </div>
    </div>
  );
};

export default FullscreenMenu;
