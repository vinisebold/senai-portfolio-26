import { useParams, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getCategoryBySlug, getTrimester } from '../data/portfolio';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';

/**
 * TrimesterPage - Individual Trimester Display
 *
 * Design principles:
 * - Independent page for each trimester
 * - Editorial header with number and category
 * - List of work cards (full width)
 * - Generous padding and breathing room
 * - Smooth page transitions via framer-motion
 */

const TrimesterPage = () => {
  const { categorySlug, trimesterNumber } = useParams();

  // Parse trimester number from URL (format: "1-trimestre" -> 1)
  const numero = parseInt(trimesterNumber.split('-')[0]);

  // Fetch data
  const category = getCategoryBySlug(categorySlug);
  const trimester = getTrimester(categorySlug, numero);

  // Handle 404: category or trimester not found
  if (!category || !trimester) {
    return <Navigate to="/" replace />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className="min-h-screen pt-14"
    >
      {/* Page header */}
      <PageHeader numero={numero} categoria={category.categoria} />

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
              <Card key={trabalho.id} trabalho={trabalho} />
            ))
          )}
        </div>
      </section>
    </motion.div>
  );
};

export default TrimesterPage;
