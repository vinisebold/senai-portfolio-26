import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { getCategories } from '../data/portfolio';
import FullscreenMenu from './FullscreenMenu';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const location = useLocation();
  const [, yearFromPath] = location.pathname.split('/');
  const activeYear = yearFromPath || '2025';
  const categories = getCategories(activeYear);

  const isCategoryActive = (slug) => location.pathname.includes(`/${slug}/`);

  useEffect(() => {
    if (menuOpen) {
      document.body.classList.add('menu-open');

      if (location.pathname === `/${activeYear}`) {
        setSelectedCategory('home');
      } else {
        const activeCategory = categories.find((cat) => isCategoryActive(cat.slug));
        if (activeCategory) {
          setSelectedCategory(activeCategory.slug);
        }
      }
    } else {
      document.body.classList.remove('menu-open');
    }

    return () => document.body.classList.remove('menu-open');
  }, [menuOpen, location.pathname, activeYear, categories]);

  const closeMenu = () => {
    setMenuOpen(false);
    setSelectedCategory(null);
  };

  return (
    <>
      <motion.button
        onClick={() => setMenuOpen(!menuOpen)}
        className="fixed top-1 left-6 md:left-8 z-[100] w-12 h-12 md:w-16 md:h-16 flex flex-col items-center justify-center gap-2 md:gap-3 group bg-transparent md:bg-transparent"
        aria-label="Toggle menu"
      >
        <motion.span
          className="w-10 md:w-16 h-[1px] bg-black origin-center"
          animate={menuOpen ? {
            rotate: 45,
            y: 4.5,
            transition: { duration: 0.5, ease: [0.43, 0.13, 0.23, 0.96] },
          } : {
            rotate: 0,
            y: 0,
            transition: { duration: 0.5, ease: [0.43, 0.13, 0.23, 0.96] },
          }}
        />

        <motion.span
          className="w-10 md:w-16 h-[1px] bg-black origin-center"
          animate={menuOpen ? {
            rotate: -45,
            y: -4.5,
            transition: { duration: 0.5, ease: [0.43, 0.13, 0.23, 0.96] },
          } : {
            rotate: 0,
            y: 0,
            transition: { duration: 0.5, ease: [0.43, 0.13, 0.23, 0.96] },
          }}
        />
      </motion.button>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.43, 0.13, 0.23, 0.96] }}
            className="fixed inset-0 bg-[#fafafa] z-[90] overflow-y-auto"
          >
            <FullscreenMenu
              activeYear={activeYear}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              onNavigate={closeMenu}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
