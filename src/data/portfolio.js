import cienciasHumanas from '../../assets/data/ciencias-humanas.json';
import cienciasNatureza from '../../assets/data/ciencias-natureza.json';
import linguagens from '../../assets/data/linguagens.json';
import matematica from '../../assets/data/matematica.json';

const imageModules = import.meta.glob('../../assets/images/**/*.{webp,png,jpg,jpeg,avif}', {
  eager: true,
  import: 'default',
});

const categoriasFonte = [
  {
    categoria: 'Ciências Humanas',
    slug: 'ciencias-humanas',
    data: cienciasHumanas,
  },
  {
    categoria: 'Ciências Natureza',
    slug: 'ciencias-natureza',
    data: cienciasNatureza,
  },
  {
    categoria: 'Linguagens',
    slug: 'linguagens',
    data: linguagens,
  },
  {
    categoria: 'Matemática',
    slug: 'matematica',
    data: matematica,
  },
];

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

export const portfolioData = categoriasFonte.map((categoria) => ({
  categoria: categoria.categoria,
  slug: categoria.slug,
  trimestres: normalizeTrimestres(categoria.data),
}));

export const getCategories = () => portfolioData;

export const getCategoryBySlug = (slug) => {
  return portfolioData.find((cat) => cat.slug === slug);
};

export const getTrimester = (categorySlug, trimesterNumber) => {
  const category = getCategoryBySlug(categorySlug);
  if (!category) return null;
  return category.trimestres.find((t) => t.numero === parseInt(trimesterNumber));
};

export const getTotalWorks = () => {
  return portfolioData.reduce((total, category) => {
    return total + category.trimestres.reduce((catTotal, trimestre) => {
      return catTotal + trimestre.trabalhos.length;
    }, 0);
  }, 0);
};

export const getWorksCountByCategory = (categorySlug) => {
  const category = getCategoryBySlug(categorySlug);
  if (!category) return 0;
  return category.trimestres.reduce((total, trimestre) => {
    return total + trimestre.trabalhos.length;
  }, 0);
};
