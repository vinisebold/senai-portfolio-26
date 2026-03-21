/**
 * PageHeader Component - Editorial Section Header
 *
 * Design principles:
 * - Large editorial number (01, 02, 03) in Cormorant
 * - Category name in uppercase with tracking
 * - Generous top padding for breathing room
 * - Simple, high-impact typography
 */

const PageHeader = ({ numero, categoria }) => {
  return (
    <header className="pt-24 pb-16 px-6 md:px-section">
      {/* Category and trimester */}
      <h1 className="editorial-heading mb-2">
        {categoria}
      </h1>

      <p className="font-bricolage text-[15px] font-light uppercase opacity-60">
        {numero}º Trimestre
      </p>
    </header>
  );
};

export default PageHeader;
