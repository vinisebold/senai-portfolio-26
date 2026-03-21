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
    <header className="pt-24 pb-16 px-20 md:px-40 lg:px-64">
      <div className="max-w-6xl mx-auto">
        {/* Category and trimester */}
        <h1 className="editorial-heading mb-2">
          {categoria}
        </h1>

        <p className="font-roboto text-[15px] font-light uppercase opacity-60">
          {numero}º Trimestre
        </p>
      </div>
    </header>
  );
};

export default PageHeader;
