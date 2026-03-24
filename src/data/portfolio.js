const dataModules = import.meta.glob('../../assets/data/*/*.json', {
  eager: true,
  import: 'default',
});

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

const yearlyRawData = Object.entries(dataModules).reduce((acc, [path, content]) => {
  const match = path.match(/\/assets\/data\/(\d{4})\/([^/]+)\.json$/);
  if (!match) return acc;

  const [, year, categorySlug] = match;
  if (!acc[year]) {
    acc[year] = {};
  }

  acc[year][categorySlug] = content;
  return acc;
}, {});

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
  Object.keys(yearlyRawData)
    .sort((a, b) => Number(a) - Number(b))
    .map((year) => [year, createPortfolioForYear(year)]),
);

export const portfolioData =
  portfolioByYear[getAvailableYears()[0]] || [];

export const getAvailableYears = () =>
  Object.keys(portfolioByYear).sort((a, b) => Number(a) - Number(b));

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
