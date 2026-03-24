import cienciasHumanas2025 from '../../assets/data/2025/ciencias-humanas.json';
import cienciasNatureza2025 from '../../assets/data/2025/ciencias-natureza.json';
import linguagens2025 from '../../assets/data/2025/linguagens.json';
import matematica2025 from '../../assets/data/2025/matematica.json';
import cienciasHumanas2026 from '../../assets/data/2026/ciencias-humanas.json';
import cienciasNatureza2026 from '../../assets/data/2026/ciencias-natureza.json';
import linguagens2026 from '../../assets/data/2026/linguagens.json';
import matematica2026 from '../../assets/data/2026/matematica.json';

const imageModules = import.meta.glob('../../assets/images/**/*.{webp,png,jpg,jpeg,avif}', {
  eager: true,
  import: 'default',
});

const categoryMetadata = [
  {
    categoria: 'Ciências Humanas',
    slug: 'ciencias-humanas',
  },
  {
    categoria: 'Ciências Natureza',
    slug: 'ciencias-natureza',
  },
  {
    categoria: 'Linguagens',
    slug: 'linguagens',
  },
  {
    categoria: 'Matemática',
    slug: 'matematica',
  },
];

const emptyYearTemplate = {
  '1': [],
  '2': [],
  '3': [],
};

const yearlyRawData = {
  '2025': {
    'ciencias-humanas': cienciasHumanas2025,
    'ciencias-natureza': cienciasNatureza2025,
    linguagens: linguagens2025,
    matematica: matematica2025,
  },
  '2026': {
    'ciencias-humanas': cienciasHumanas2026,
    'ciencias-natureza': cienciasNatureza2026,
    linguagens: linguagens2026,
    matematica: matematica2026,
  },
};

const resolveImageSrc = (imagePath) => {
  const key = `../../${imagePath}`;
  return imageModules[key] || `/${imagePath}`;
};

const toImageObject = (imagePath, trabalhoTema, index) => ({
  src: resolveImageSrc(imagePath),
  alt: `${trabalhoTema} - imagem ${index + 1}`,
});

const normalizeTrabalho = (trabalho) => ({
  ...trabalho,
  imagens: (trabalho.imagens || []).map((imagePath, index) =>
    toImageObject(imagePath, trabalho.tema, index),
  ),
});

const normalizeTrimestres = (trimestresRaw) =>
  Object.entries(trimestresRaw)
    .map(([numero, trabalhos]) => ({
      numero: Number(numero),
      trabalhos: trabalhos.map(normalizeTrabalho),
    }))
    .sort((a, b) => a.numero - b.numero);

const createPortfolioForYear = (year) =>
  categoryMetadata.map((category) => ({
    categoria: category.categoria,
    slug: category.slug,
    trimestres: normalizeTrimestres(yearlyRawData[year]?.[category.slug] || emptyYearTemplate),
  }));

const portfolioByYear = Object.fromEntries(
  Object.keys(yearlyRawData).map((year) => [year, createPortfolioForYear(year)]),
);

export const portfolioData = portfolioByYear['2025'];

export const getAvailableYears = () => Object.keys(portfolioByYear);

export const isValidYear = (year) => Boolean(portfolioByYear[year]);

export const getPortfolioByYear = (year) => portfolioByYear[year] || [];

export const getCategories = (year) => getPortfolioByYear(year);

export const getCategoryBySlug = (year, slug) => {
  return getPortfolioByYear(year).find((cat) => cat.slug === slug);
};

export const getTrimester = (year, categorySlug, trimesterNumber) => {
  const category = getCategoryBySlug(year, categorySlug);
  if (!category) return null;
  return category.trimestres.find((t) => t.numero === parseInt(trimesterNumber));
};

export const getTotalWorks = (year) => {
  return getPortfolioByYear(year).reduce((total, category) => {
    return total + category.trimestres.reduce((catTotal, trimestre) => {
      return catTotal + trimestre.trabalhos.length;
    }, 0);
  }, 0);
};

export const getWorksCountByCategory = (year, categorySlug) => {
  const category = getCategoryBySlug(year, categorySlug);
  if (!category) return 0;
  return category.trimestres.reduce((total, trimestre) => {
    return total + trimestre.trabalhos.length;
  }, 0);
};
