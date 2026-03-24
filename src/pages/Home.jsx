import { Link, useParams, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getCategories, getWorksCountByCategory, isValidYear } from '../data/portfolio';

/**
 * Home Page - Editorial Cover
 *
 * Design principles:
 * - Functions as luxury magazine cover
 * - Dominant whitespace as the primary design element
 * - Large display name in Cormorant Garamond
 * - Minimal subtitle with year
 * - Category cards with work counts
 * - No hero image - whitespace IS the hero
 */

const Home = () => {
  const { year } = useParams();

  if (!isValidYear(year)) {
    return <Navigate to="/" replace />;
  }

  const categories = getCategories(year);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen pt-14"
    >
      {/* Hero section - pure whitespace and typography */}
      <section className="px-6 md:px-section py-32 md:py-48 flex flex-col items-center justify-center text-center">
        {/* Main name - Cormorant display, huge */}
        <h1 className="font-cormorant text-[96px] md:text-[120px] leading-none font-normal tracking-editorial uppercase mb-8">
          VINÍCIUS
          <br />
          SEBOLD
        </h1>

        {/* Subtitle */}
        <p className="nav-link opacity-60 mb-16">
          PORTFÓLIO ESCOLAR — {year}
        </p>
      </section>

      {/* Categories section */}
      <section className="px-6 md:px-section pb-32">
        <div className="max-w-5xl mx-auto">
          {/* Section label */}
          <p className="label-text mb-12 opacity-60 text-center">
            ÁREAS DE CONHECIMENTO
          </p>

          {/* Category grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-20">
            {categories.map((cat) => {
              const workCount = getWorksCountByCategory(year, cat.slug);

              return (
                <Link
                  key={cat.slug}
                  to={`/${year}/${cat.slug}/1-trimestre`}
                  className="group"
                >
                  <article className="border-t border-black pt-6 transition-opacity hover:opacity-60">

                    {/* Category name */}
                    <h2 className="font-cormorant text-2xl font-normal tracking-editorial uppercase mb-3">
                      {cat.categoria}
                    </h2>

                    {/* Work count */}
                    <p className="font-inter text-xs font-light tracking-body opacity-60">
                      {workCount} {workCount === 1 ? 'trabalho' : 'trabalhos'}
                    </p>
                  </article>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer with minimal info */}
      <footer className="px-6 md:px-section py-12 border-t border-black">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="nav-link opacity-40">
            © {year} VINÍCIUS SEBOLD
          </p>
          <p className="nav-link opacity-40">
            SENAI — ENSINO MÉDIO
          </p>
        </div>
      </footer>
    </motion.div>
  );
};

export default Home;
