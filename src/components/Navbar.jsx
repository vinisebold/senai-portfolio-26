import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getCategories } from '../data/portfolio';

/**
 * Navbar Component - ZARA-Inspired Minimal Fullscreen Menu
 *
 * Design principles:
 * - Two-line hamburger button (top-left) transforms into X
 * - Fullscreen overlay menu with two-column layout
 * - Ultra-minimal editorial aesthetic
 * - Smooth staggered animations
 * - Clean typography with generous spacing
 */

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const location = useLocation();
  const categories = getCategories();

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.classList.add('menu-open');
      // Set active category when menu opens
      const activeCategory = categories.find(cat => isCategoryActive(cat.slug));
      if (activeCategory) {
        setSelectedCategory(activeCategory.slug);
      }
    } else {
      document.body.classList.remove('menu-open');
    }

    return () => document.body.classList.remove('menu-open');
  }, [menuOpen]);

  // Determine if a category is active based on current route
  const isCategoryActive = (slug) => location.pathname.includes(slug);

  const closeMenu = () => {
    setMenuOpen(false);
    setSelectedCategory(null);
  };

  // Calculate dot position based on selected category
  const calculateDotPosition = (slug) => {
    const idx = categories.findIndex(cat => cat.slug === slug);
    // Each item has 24px gap (space-y-6) + approximately 36px height for 28px font
    // Starting position after "Início" which is first item
    const baseOffset = 60; // Offset after "Início" item
    return baseOffset + (idx * 60); // 60px = gap + item height
  };

  return (
    <>
      {/* Fixed hamburger button */}
      <motion.button
        onClick={() => setMenuOpen(!menuOpen)}
        className="fixed top-8 left-8 z-[100] w-14 h-14 flex flex-col items-center justify-center gap-[7px] group"
        aria-label="Toggle menu"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Top line */}
        <motion.span
          className="w-10 h-[1px] bg-black origin-center"
          animate={menuOpen ? {
            rotate: 45,
            y: 4,
            transition: { duration: 0.3, ease: [0.43, 0.13, 0.23, 0.96] }
          } : {
            rotate: 0,
            y: 0,
            transition: { duration: 0.3, ease: [0.43, 0.13, 0.23, 0.96] }
          }}
        />

        {/* Bottom line */}
        <motion.span
          className="w-10 h-[1px] bg-black origin-center"
          animate={menuOpen ? {
            rotate: -45,
            y: -4,
            transition: { duration: 0.3, ease: [0.43, 0.13, 0.23, 0.96] }
          } : {
            rotate: 0,
            y: 0,
            transition: { duration: 0.3, ease: [0.43, 0.13, 0.23, 0.96] }
          }}
        />
      </motion.button>

      {/* Fullscreen menu overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.43, 0.13, 0.23, 0.96] }}
            className="fixed inset-0 bg-[#fafafa] z-[90] overflow-y-auto"
          >
            {/* Menu content container - aligned left */}
            <div className="min-h-screen flex items-center px-12 md:px-20 lg:px-32 py-24">
              <div className="w-full max-w-6xl">
                {/* Logo/Name */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.6, ease: [0.43, 0.13, 0.23, 0.96] }}
                  className="mb-20"
                >
                  <Link
                    to="/"
                    className="inline-block nav-link text-[13px] hover:opacity-60 transition-opacity"
                    onClick={closeMenu}
                  >
                    VINÍCIUS SEBOLD
                  </Link>
                </motion.div>

                {/* Two column layout: Categories | Trimesters */}
                <div className="flex gap-20 md:gap-32">
                  {/* Left column: Main navigation */}
                  <nav className="space-y-6 flex-shrink-0 relative">
                    {/* Home link */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, duration: 0.6, ease: [0.43, 0.13, 0.23, 0.96] }}
                      className="flex items-center gap-4"
                    >
                      <div className="w-1.5 h-1.5 flex-shrink-0" />
                      <Link
                        to="/"
                        className="inline-block font-cormorant text-[28px] tracking-[0.12em] uppercase hover:opacity-60 transition-opacity"
                        onClick={closeMenu}
                      >
                        Início
                      </Link>
                    </motion.div>

                    {/* Category sections */}
                    {categories.map((cat, idx) => (
                      <motion.div
                        key={cat.slug}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: 0.25 + (idx * 0.08),
                          duration: 0.6,
                          ease: [0.43, 0.13, 0.23, 0.96]
                        }}
                        className="flex items-center gap-4 relative"
                      >
                        {/* Empty space for alignment */}
                        <div className="w-1.5 h-1.5 flex-shrink-0" />

                        {/* Category title - clickable but doesn't navigate */}
                        <button
                          onClick={() => setSelectedCategory(cat.slug)}
                          className={`font-cormorant text-[28px] tracking-[0.12em] uppercase transition-opacity text-left ${
                            selectedCategory === cat.slug
                              ? 'opacity-100'
                              : 'opacity-60 hover:opacity-100'
                          }`}
                        >
                          {cat.categoria}
                        </button>
                      </motion.div>
                    ))}

                    {/* Animated dot indicator - absolute positioned */}
                    <AnimatePresence>
                      {selectedCategory && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{
                            opacity: 1,
                            scale: 1,
                            y: calculateDotPosition(selectedCategory)
                          }}
                          exit={{ opacity: 0, scale: 0 }}
                          transition={{ duration: 0.4, ease: [0.43, 0.13, 0.23, 0.96] }}
                          className="w-1.5 h-1.5 bg-black rounded-full absolute left-0"
                          style={{ top: '8px' }}
                        />
                      )}
                    </AnimatePresence>
                  </nav>

                  {/* Right column: Trimester links (only for selected category) */}
                  <AnimatePresence mode="wait">
                    {categories.map((cat) =>
                      selectedCategory === cat.slug && (
                        <motion.div
                          key={cat.slug}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.4, ease: [0.43, 0.13, 0.23, 0.96] }}
                          className="space-y-5 pt-1 flex-shrink-0"
                        >
                          {[1, 2, 3].map((num) => (
                            <div key={num}>
                              <Link
                                to={`/${cat.slug}/${num}-trimestre`}
                                className="nav-link text-[18px] opacity-60 hover:opacity-100 transition-opacity block"
                                onClick={closeMenu}
                              >
                                {num}º TRIMESTRE
                              </Link>
                            </div>
                          ))}
                        </motion.div>
                      )
                    )}
                  </AnimatePresence>
                </div>

                {/* Footer info */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                  className="mt-24"
                >
                  <p className="label-text opacity-30">
                    Portfolio 2026
                  </p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
