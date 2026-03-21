import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getCategories } from '../data/portfolio';

/**
 * Navbar Component - ZARA-Inspired Minimal Fullscreen Menu
 *
 * Design principles:
 * - Two-line hamburger button (top-left) transforms into X
 * - Fullscreen overlay menu with centered content
 * - Ultra-minimal editorial aesthetic
 * - Smooth staggered animations
 * - Clean typography with generous spacing
 */

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const location = useLocation();
  const categories = getCategories();

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.classList.add('menu-open');
    } else {
      document.body.classList.remove('menu-open');
    }

    return () => document.body.classList.remove('menu-open');
  }, [menuOpen]);

  // Determine if a category is active based on current route
  const isCategoryActive = (slug) => location.pathname.includes(slug);

  const closeMenu = () => {
    setMenuOpen(false);
    setHoveredCategory(null);
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
              <div className="w-full max-w-4xl">
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

                {/* Main navigation */}
                <nav className="space-y-8">
                  {/* Home link */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.6, ease: [0.43, 0.13, 0.23, 0.96] }}
                  >
                    <Link
                      to="/"
                      className="inline-block font-cormorant text-3xl md:text-4xl tracking-[0.12em] uppercase hover:opacity-60 transition-opacity"
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
                      onMouseEnter={() => setHoveredCategory(cat.slug)}
                      onMouseLeave={() => setHoveredCategory(null)}
                    >
                      {/* Category title */}
                      <div className="mb-3">
                        <span className={`font-cormorant text-3xl md:text-4xl tracking-[0.12em] uppercase transition-opacity cursor-default ${
                          hoveredCategory === cat.slug || isCategoryActive(cat.slug)
                            ? 'opacity-100'
                            : 'opacity-60'
                        }`}>
                          {cat.categoria}
                        </span>
                      </div>

                      {/* Trimester links */}
                      <motion.div
                        initial={false}
                        animate={{
                          height: hoveredCategory === cat.slug ? 'auto' : 0,
                          opacity: hoveredCategory === cat.slug ? 1 : 0,
                        }}
                        transition={{ duration: 0.3, ease: [0.43, 0.13, 0.23, 0.96] }}
                        className="overflow-hidden"
                      >
                        <div className="flex items-center gap-6 pt-2 pl-1">
                          {[1, 2, 3].map((num, trimIdx, arr) => (
                            <div key={num} className="flex items-center gap-6">
                              <Link
                                to={`/${cat.slug}/${num}-trimestre`}
                                className="nav-link text-[11px] opacity-50 hover:opacity-100 transition-opacity"
                                onClick={closeMenu}
                              >
                                {num}º TRIM
                              </Link>
                              {trimIdx < arr.length - 1 && (
                                <span className="text-black opacity-30 text-xs">·</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    </motion.div>
                  ))}
                </nav>

                {/* Footer info (optional decorative element) */}
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
