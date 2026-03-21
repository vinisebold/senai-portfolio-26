import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCategories } from '../data/portfolio';

/**
 * Navbar Component - Editorial Luxury Navigation
 *
 * Design principles:
 * - Fixed top position, minimal 56px height
 * - Ultra-light typography with extensive letter-spacing
 * - Inline sub-menu (not dropdown) for trimester selection
 * - Custom underline animation (scaleX from left)
 * - Mobile: hamburger collapses to minimal "—" icon
 */

const Navbar = () => {
  const [activeCategory, setActiveCategory] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const categories = getCategories();

  // Determine if a category is active based on current route
  const isCategoryActive = (slug) => location.pathname.includes(slug);

  const toggleCategory = (slug) => {
    setActiveCategory(activeCategory === slug ? null : slug);
  };

  return (
    <nav className="fixed top-0 left-0 w-full bg-white border-b border-black z-50">
      {/* Main navbar - 56px height */}
      <div className="h-14 px-6 md:px-section flex items-center justify-between">
        {/* Left: Logo/Name */}
        <Link
          to="/"
          className="nav-link hover:opacity-60 transition-opacity"
          onClick={() => setActiveCategory(null)}
        >
          VINÍCIUS SEBOLD
        </Link>

        {/* Center: Categories (desktop only) */}
        <div className="hidden md:flex items-center gap-12">
          {categories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => toggleCategory(cat.slug)}
              className={`nav-link nav-link-underline transition-opacity ${
                isCategoryActive(cat.slug) ? 'opacity-100' : 'opacity-60 hover:opacity-100'
              }`}
            >
              {cat.categoria.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Right: Empty (intentional whitespace in desktop) */}
        <div className="hidden md:block w-32"></div>

        {/* Mobile: Hamburger button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <X size={20} strokeWidth={1} />
          ) : (
            <Menu size={20} strokeWidth={1} />
          )}
        </button>
      </div>

      {/* Sub-menu: Trimester selection (inline, appears below main nav) */}
      <AnimatePresence>
        {activeCategory && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-black overflow-hidden bg-stone"
          >
            <div className="px-6 md:px-section py-4 flex items-center justify-center gap-8">
              {[1, 2, 3].map((num, idx, arr) => (
                <div key={num} className="flex items-center gap-8">
                  <Link
                    to={`/${activeCategory}/${num}-trimestre`}
                    className="nav-link hover:opacity-60"
                    onClick={() => setActiveCategory(null)}
                  >
                    {num}º TRIMESTRE
                  </Link>
                  {idx < arr.length - 1 && (
                    <span className="text-black opacity-40">·</span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-black bg-white overflow-hidden"
          >
            <div className="px-6 py-8 flex flex-col gap-6">
              {categories.map((cat) => (
                <div key={cat.slug}>
                  <button
                    onClick={() => toggleCategory(cat.slug)}
                    className={`nav-link mb-4 ${
                      activeCategory === cat.slug ? 'opacity-100' : 'opacity-60'
                    }`}
                  >
                    {cat.categoria.toUpperCase()}
                  </button>

                  {activeCategory === cat.slug && (
                    <div className="flex flex-col gap-3 pl-4 border-l border-black">
                      {[1, 2, 3].map((num) => (
                        <Link
                          key={num}
                          to={`/${cat.slug}/${num}-trimestre`}
                          className="nav-link opacity-60 hover:opacity-100"
                          onClick={() => {
                            setActiveCategory(null);
                            setMobileMenuOpen(false);
                          }}
                        >
                          {num}º TRIMESTRE
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
