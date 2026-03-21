import Carousel from './Carousel';

/**
 * Card Component - Full-width Work Display
 *
 * Design principles:
 * - One card per row, full content width
 * - Carousel at top (full width, 480px height)
 * - Content section: tema, habilidades, descrição
 * - No border container, no background
 * - Separated by 1px line + 80px margin
 * - Typography: Cormorant for tema, Inter for labels
 */

const Card = ({ trabalho }) => {
  const { tema, habilidades, descricao, imagens } = trabalho;

  return (
    <article className="w-full">
      {/* Image carousel section */}
      <Carousel images={imagens} />

      {/* Content section */}
      <div className="pt-card-gap pb-card-margin">
        {/* Tema - Cormorant Garamond, editorial heading */}
        <h2 className="font-cormorant text-[28px] font-normal tracking-editorial uppercase mb-8">
          {tema}
        </h2>

        {/* Habilidades */}
        <div className="mb-6">
          <p className="label-text mb-3 opacity-60">
            HABILIDADES DESENVOLVIDAS
          </p>
          <p className="font-inter text-sm font-light tracking-body">
            {habilidades.join(' · ')}
          </p>
        </div>

        {/* Descrição */}
        <div>
          <p className="label-text mb-3 opacity-60">
            DESCRIÇÃO
          </p>
          <p className="font-inter text-sm font-light leading-relaxed tracking-body max-w-3xl">
            {descricao}
          </p>
        </div>
      </div>

      {/* Divider line */}
      <div className="w-full h-[1px] bg-black mb-card-margin"></div>
    </article>
  );
};

export default Card;
