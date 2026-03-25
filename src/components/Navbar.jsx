import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getCategories } from '../data/portfolio';
import YearSwitch from './YearSwitch';

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
  const [isHoldingName, setIsHoldingName] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  
  const holdTimerRef = useRef(null);
  const progressIntervalRef = useRef(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  const [_, yearFromPath] = location.pathname.split('/');
  const activeYear = yearFromPath || '2025';
  const categories = getCategories(activeYear);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.classList.add('menu-open');
      // Set active category when menu opens
      if (location.pathname === `/${activeYear}`) {
        setSelectedCategory('home');
      } else {
        const activeCategory = categories.find(cat => isCategoryActive(cat.slug));
        if (activeCategory) {
          setSelectedCategory(activeCategory.slug);
        }
      }
    } else {
      document.body.classList.remove('menu-open');
    }

    return () => document.body.classList.remove('menu-open');
  }, [menuOpen, location.pathname, activeYear, categories]);

  // Determine if a category is active based on current route
  const isCategoryActive = (slug) => location.pathname.includes(`/${slug}/`);

  const closeMenu = () => {
    setMenuOpen(false);
    setSelectedCategory(null);
  };

  const handleNamePressStart = (e) => {
    e.preventDefault();
    setIsHoldingName(true);
    setHoldProgress(0);
    
    // Iniciar o timer de 3 segundos
    let elapsed = 0;
    const intervalStep = 50; // atualizar a cada 50ms
    
    progressIntervalRef.current = setInterval(() => {
      elapsed += intervalStep;
      setHoldProgress((elapsed / 3000) * 100);
    }, intervalStep);
    
    holdTimerRef.current = setTimeout(() => {
      // Completou 3 segundos - navegar para admin
      clearInterval(progressIntervalRef.current);
      navigate('/admin');
      closeMenu();
      setIsHoldingName(false);
      setHoldProgress(0);
    }, 3000);
  };

  const handleNamePressEnd = () => {
    setIsHoldingName(false);
    setHoldProgress(0);
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  return (
    <>
      {/* Fixed hamburger button */}
      <motion.button
        onClick={() => setMenuOpen(!menuOpen)}
        className="fixed top-1 left-6 md:left-8 z-[100] w-12 h-12 md:w-16 md:h-16 flex flex-col items-center justify-center gap-2 md:gap-3 group bg-transparent md:bg-transparent"
        aria-label="Toggle menu"
      >
        {/* Top line */}
        <motion.span
          className="w-10 md:w-16 h-[1px] bg-black origin-center"
          animate={menuOpen ? {
            rotate: 45,
            y: 4.5,
            transition: { duration: 0.5, ease: [0.43, 0.13, 0.23, 0.96] }
          } : {
            rotate: 0,
            y: 0,
            transition: { duration: 0.5, ease: [0.43, 0.13, 0.23, 0.96] }
          }}
        />

        {/* Bottom line */}
        <motion.span
          className="w-10 md:w-16 h-[1px] bg-black origin-center"
          animate={menuOpen ? {
            rotate: -45,
            y: -4.5,
            transition: { duration: 0.5, ease: [0.43, 0.13, 0.23, 0.96] }
          } : {
            rotate: 0,
            y: 0,
            transition: { duration: 0.5, ease: [0.43, 0.13, 0.23, 0.96] }
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
            transition={{ duration: 0.6, ease: [0.43, 0.13, 0.23, 0.96] }}
            className="fixed inset-0 bg-[#fafafa] z-[90] overflow-y-auto"
          >
            {/* Menu content container - aligned left */}
            <div className="min-h-screen flex items-start pt-32 px-20 md:px-40 lg:px-64">
              <div className="w-full max-w-6xl">
                {/* Two column layout: Categories | Trimesters */}
                <div className="flex gap-20 md:gap-32">
                  {/* Left column: Main navigation */}
                  <nav className="space-y-2 flex-shrink-0">
                    {/* Home link - Vinicius Sebold */}
                    <div className="flex items-center gap-4">
                      <motion.div
                        animate={{
                          scale: selectedCategory === 'home' ? 1 : 0,
                          opacity: selectedCategory === 'home' ? 1 : 0
                        }}
                        transition={{ duration: 0.3, ease: [0.43, 0.13, 0.23, 0.96] }}
                        className="w-1 h-1.5 bg-black flex-shrink-0"
                      />
                      <div 
                        className="relative"
                        onPointerDown={handleNamePressStart}
                        onPointerUp={handleNamePressEnd}
                        onPointerLeave={handleNamePressEnd}
                        onPointerCancel={handleNamePressEnd}
                      >
                        {/* Progress bar background */}
                        <div 
                          className="absolute inset-0 bg-red-500/20 pointer-events-none transition-all duration-75"
                          style={{ 
                            opacity: holdProgress / 100,
                            transform: `scaleX(${holdProgress / 100})`,
                            transformOrigin: 'left'
                          }}
                        />
                        
                        {/* Nome com opacidade baseada no progresso */}
                        <Link
                          to={`/${activeYear}`}
                          className="inline-block font-lora text-[28px] font-medium uppercase hover:opacity-60 transition-opacity relative z-10"
                          style={{ 
                            opacity: 1 - (holdProgress / 100)
                          }}
                          onClick={closeMenu}
                        >
                          Vinícius Sebold
                        </Link>
                      </div>
                    </div>

                    {/* Category sections */}
                    {categories.map((cat) => (
                      <div
                        key={cat.slug}
                        className="flex items-center gap-4"
                      >
                        <motion.div
                          animate={{
                            scale: selectedCategory === cat.slug ? 1 : 0,
                            opacity: selectedCategory === cat.slug ? 1 : 0
                          }}
                          transition={{ duration: 0.3, ease: [0.43, 0.13, 0.23, 0.96] }}
                          className="w-1 h-1.5 bg-black flex-shrink-0"
                        />

                        {/* Category title - clickable but doesn't navigate */}
                        <button
                          onClick={() => setSelectedCategory(cat.slug)}
                          className={`font-lora text-[28px] font-medium uppercase transition-opacity text-left hover:opacity-70`}
                        >
                          {cat.categoria}
                        </button>
                      </div>
                    ))}
                  </nav>

                  {/* Right column: Trimester links (only for selected category) */}
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
                          {[1, 2, 3].map((num) => (
                            <div key={num}>
                              <Link
                                to={`/${activeYear}/${cat.slug}/${num}`}
                                className={`font-roboto text-[15px] uppercase opacity-90 hover:opacity-100 transition-opacity block ${
                                  location.pathname === `/${activeYear}/${cat.slug}/${num}` ? 'font-medium' : 'font-light'
                                }`}
                                onClick={closeMenu}
                              >
                                |0{num}| TRIMESTRE
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
                  className="mt-24 flex items-center justify-start"
                >
                  <YearSwitch size="compact" />
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
