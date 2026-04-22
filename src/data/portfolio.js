const dataModules = import.meta.glob('../../assets/data/*/*.json', {
  eager: true,
  import: 'default',
});

const metaModules = import.meta.glob('../../assets/data/_meta.json', {
  eager: true,
  import: 'default',
});

const mediaModules = import.meta.glob('../../assets/images/**/*.{webp,png,jpg,jpeg,avif,gif,mp4,webm,ogg,mov}', {
  eager: true,
  import: 'default',
});

const DEFAULT_META = {
  categories: [
    { slug: 'ciencias-humanas', label: 'Ciências Humanas' },
    { slug: 'ciencias-natureza', label: 'Ciências Natureza' },
    { slug: 'linguagens', label: 'Linguagens' },
    { slug: 'matematica', label: 'Matemática' },
  ],
  trimesters: [
    { key: '1', label: '1º Trimestre' },
    { key: '2', label: '2º Trimestre' },
    { key: '3', label: '3º Trimestre' },
  ],
};

const normalizeMeta = (raw) => {
  const categories = Array.isArray(raw?.categories)
    ? raw.categories
      .map((category) => ({
        slug: String(category?.slug || '').trim(),
        label: String(category?.label || '').trim(),
      }))
      .filter((category) => category.slug && category.label)
    : [];

  const trimesters = Array.isArray(raw?.trimesters)
    ? raw.trimesters
      .map((trimester) => ({
        key: String(trimester?.key || '').trim(),
        label: String(trimester?.label || '').trim(),
      }))
      .filter((trimester) => trimester.key && trimester.label)
    : [];

  return {
    categories: categories.length > 0 ? categories : DEFAULT_META.categories,
    trimesters: trimesters.length > 0 ? trimesters : DEFAULT_META.trimesters,
  };
};

const rawMeta = metaModules['../../assets/data/_meta.json'];
const normalizedMeta = normalizeMeta(rawMeta);

const categoryMetadata = normalizedMeta.categories.map((category) => ({
  categoria: category.label,
  slug: category.slug,
}));

const trimestersMeta = normalizedMeta.trimesters;

const emptyYearTemplate = Object.fromEntries(
  trimestersMeta.map((trimester) => [trimester.key, []]),
);

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

const normalizeMediaPath = (mediaPath = '') => {
  const value = String(mediaPath).trim();
  if (!value) return '';

  if (!/^https?:\/\//i.test(value)) {
    return value.replace(/^\/+/, '');
  }

  try {
    const url = new URL(value);

    // https://github.com/<owner>/<repo>/raw/<branch>/<path>
    if (url.hostname === 'github.com') {
      const githubRawMatch = url.pathname.match(/^\/[^/]+\/[^/]+\/raw\/[^/]+\/(.+)$/);
      if (githubRawMatch) {
        return decodeURIComponent(githubRawMatch[1]);
      }
    }

    // https://raw.githubusercontent.com/<owner>/<repo>/<branch>/<path>
    if (url.hostname === 'raw.githubusercontent.com') {
      const rawGithubMatch = url.pathname.match(/^\/[^/]+\/[^/]+\/[^/]+\/(.+)$/);
      if (rawGithubMatch) {
        return decodeURIComponent(rawGithubMatch[1]);
      }
    }
  } catch {
    return value;
  }

  return value;
};

const resolveMediaSrc = (mediaPath) => {
  const normalizedPath = normalizeMediaPath(mediaPath);
  if (!normalizedPath) return '';

  const key = `../../${normalizedPath}`;
  if (mediaModules[key]) {
    return mediaModules[key];
  }

  if (/^https?:\/\//i.test(normalizedPath)) {
    return normalizedPath;
  }

  return `/${normalizedPath}`;
};

const getMediaTypeFromPath = (path) => {
  if (!path) return 'image';
  const cleanPath = path.split('?')[0].toLowerCase();
  if (/\.(mp4|webm|ogg|mov)$/i.test(cleanPath)) return 'video';
  return 'image';
};

const toMediaObject = (mediaPath, trabalhoTema, index) => ({
  src: resolveMediaSrc(mediaPath),
  alt: `${trabalhoTema} - mídia ${index + 1}`,
  type: getMediaTypeFromPath(mediaPath),
});

const normalizeTrabalho = (trabalho) => ({
  ...trabalho,
  imagens: (trabalho.imagens || []).map((mediaPath, index) =>
    toMediaObject(mediaPath, trabalho.tema, index),
  ),
});

const normalizeTrimestres = (trimestresRaw = {}) =>
  trimestersMeta.map((trimester) => ({
    numero: Number(trimester.key),
    trabalhos: (trimestresRaw[trimester.key] || []).map(normalizeTrabalho),
  }));

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

export const getAvailableYears = () =>
  Object.keys(portfolioByYear).sort((a, b) => Number(a) - Number(b));

export const portfolioData =
  portfolioByYear[getAvailableYears()[0]] || [];

export const isValidYear = (year) => Boolean(portfolioByYear[year]);

export const getPortfolioByYear = (year) => portfolioByYear[year] || [];

export const getCategories = (year) => getPortfolioByYear(year);

export const getCategoryBySlug = (year, slug) => {
  return getPortfolioByYear(year).find((cat) => cat.slug === slug);
};

export const getTrimester = (year, categorySlug, trimesterNumber) => {
  const category = getCategoryBySlug(year, categorySlug);
  if (!category) return null;
  return category.trimestres.find((t) => t.numero === Number.parseInt(trimesterNumber, 10));
};

export const getTrimestersMeta = () => trimestersMeta;

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
