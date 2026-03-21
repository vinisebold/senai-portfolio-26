// Portfolio data structure - Realistic school project examples
// All 4 categories × 3 trimesters with detailed work samples

export const portfolioData = [
  {
    categoria: "Ciências da Natureza",
    slug: "ciencias-natureza",
    trimestres: [
      {
        numero: 1,
        trabalhos: [
          {
            id: "cn-t1-01",
            tema: "Ecossistemas Brasileiros e Biodiversidade",
            habilidades: ["Pesquisa bibliográfica", "Análise crítica", "Síntese textual"],
            descricao: "Estudo aprofundado sobre os seis biomas brasileiros, com ênfase na Mata Atlântica e Cerrado. O trabalho envolveu pesquisa em bases científicas, construção de mapas conceituais sobre cadeias alimentares e desenvolvimento de um infográfico comparativo sobre níveis de preservação. A metodologia incluiu análise de dados do IBGE e artigos acadêmicos.",
            imagens: [
              { src: "https://picsum.photos/seed/cn-t1-01-a/1200/800", alt: "Mapa conceitual de ecossistemas" },
              { src: "https://picsum.photos/seed/cn-t1-01-b/1200/800", alt: "Infográfico da cadeia alimentar" },
              { src: "https://picsum.photos/seed/cn-t1-01-c/1200/800", alt: "Comparativo de biomas" }
            ]
          },
          {
            id: "cn-t1-02",
            tema: "Ciclo da Água e Sustentabilidade",
            habilidades: ["Experimentação prática", "Observação científica", "Documentação visual"],
            descricao: "Projeto experimental sobre o ciclo hidrológico, com simulação em terrário fechado para observar evaporação, condensação e precipitação. Documentamos todo o processo fotográfico ao longo de três semanas, registrando mudanças e correlacionando com conceitos de climatologia.",
            imagens: [
              { src: "https://picsum.photos/seed/cn-t1-02-a/1200/800", alt: "Montagem do terrário experimental" },
              { src: "https://picsum.photos/seed/cn-t1-02-b/1200/800", alt: "Registro da condensação dia 7" }
            ]
          }
        ]
      },
      {
        numero: 2,
        trabalhos: [
          {
            id: "cn-t2-01",
            tema: "Sistema Solar e Escala Astronômica",
            habilidades: ["Modelagem matemática", "Proporção e escala", "Representação visual"],
            descricao: "Construção de modelo em escala do Sistema Solar respeitando proporções de distâncias e tamanhos planetários. Utilizamos cálculos logarítmicos para adaptar magnitudes astronômicas a escalas compreensíveis, resultando em uma representação física de 12 metros que demonstra a imensidão do espaço.",
            imagens: [
              { src: "https://picsum.photos/seed/cn-t2-01-a/1200/800", alt: "Vista geral do modelo construído" },
              { src: "https://picsum.photos/seed/cn-t2-01-b/1200/800", alt: "Detalhe: escala de Júpiter" },
              { src: "https://picsum.photos/seed/cn-t2-01-c/1200/800", alt: "Tabela de cálculos proporcionais" }
            ]
          },
          {
            id: "cn-t2-02",
            tema: "Fotossíntese e Pigmentos Vegetais",
            habilidades: ["Experimentação laboratorial", "Cromatografia", "Análise de resultados"],
            descricao: "Experimento de cromatografia em papel para separação de pigmentos vegetais presentes em folhas. Testamos cinco espécies diferentes, identificando clorofila A, clorofila B, carotenos e xantofilas. O trabalho foi documentado com protocolo científico completo.",
            imagens: [
              { src: "https://picsum.photos/seed/cn-t2-02-a/1200/800", alt: "Cromatografia em andamento" }
            ]
          }
        ]
      },
      {
        numero: 3,
        trabalhos: [
          {
            id: "cn-t3-01",
            tema: "Genética Mendeliana e Probabilidade",
            habilidades: ["Raciocínio lógico", "Estatística aplicada", "Representação genética"],
            descricao: "Estudo das leis de Mendel aplicadas à herança de características em ervilhas e em casos humanos. Desenvolvemos quadros de Punnett para calcular probabilidades de genótipos e fenótipos em cruzamentos mono e di-híbridos, além de análise de heredogramas para identificação de padrões de herança.",
            imagens: [
              { src: "https://picsum.photos/seed/cn-t3-01-a/1200/800", alt: "Quadros de Punnett ilustrados" },
              { src: "https://picsum.photos/seed/cn-t3-01-b/1200/800", alt: "Heredograma familiar" }
            ]
          },
          {
            id: "cn-t3-02",
            tema: "Mudanças Climáticas e Evidências Científicas",
            habilidades: ["Análise de dados", "Interpretação de gráficos", "Argumentação científica"],
            descricao: "Investigação sobre evidências do aquecimento global através de dados de temperatura global, concentração de CO₂ atmosférico e eventos climáticos extremos. Compilamos gráficos de séries históricas e construímos uma linha do tempo visual correlacionando marcos industriais com elevação de temperatura.",
            imagens: [
              { src: "https://picsum.photos/seed/cn-t3-02-a/1200/800", alt: "Gráfico de elevação de temperatura" },
              { src: "https://picsum.photos/seed/cn-t3-02-b/1200/800", alt: "Linha do tempo de eventos climáticos" },
              { src: "https://picsum.photos/seed/cn-t3-02-c/1200/800", alt: "Correlação CO₂ e temperatura" }
            ]
          }
        ]
      }
    ]
  },
  {
    categoria: "Matemática",
    slug: "matematica",
    trimestres: [
      {
        numero: 1,
        trabalhos: [
          {
            id: "mt-t1-01",
            tema: "Geometria Espacial e Volumes",
            habilidades: ["Cálculo de volumes", "Visualização tridimensional", "Aplicação prática"],
            descricao: "Projeto de cálculo de volumes de sólidos geométricos aplicado a embalagens comerciais reais. Medimos e calculamos volumes de diferentes formatos (cilindros, paralelepípedos, pirâmides) e comparamos com as especificações dos fabricantes, investigando otimização de espaço e economia de material.",
            imagens: [
              { src: "https://picsum.photos/seed/mt-t1-01-a/1200/800", alt: "Medições de embalagens" },
              { src: "https://picsum.photos/seed/mt-t1-01-b/1200/800", alt: "Cálculos detalhados" }
            ]
          },
          {
            id: "mt-t1-02",
            tema: "Função Quadrática e Movimento Parabólico",
            habilidades: ["Modelagem matemática", "Análise de gráficos", "Física aplicada"],
            descricao: "Estudo do movimento de projéteis através de filmagem em câmera lenta e sobreposição de trajetórias em software. Modelamos a parábola matematicamente, calculando vértice, alcance máximo e tempo de voo. Comparamos valores teóricos com medições experimentais.",
            imagens: [
              { src: "https://picsum.photos/seed/mt-t1-02-a/1200/800", alt: "Sobreposição de trajetória" },
              { src: "https://picsum.photos/seed/mt-t1-02-b/1200/800", alt: "Gráfico da função quadrática" },
              { src: "https://picsum.photos/seed/mt-t1-02-c/1200/800", alt: "Tabela de valores calculados" }
            ]
          }
        ]
      },
      {
        numero: 2,
        trabalhos: [
          {
            id: "mt-t2-01",
            tema: "Estatística Descritiva e Análise de Dados",
            habilidades: ["Coleta de dados", "Cálculo de medidas centrais", "Construção de gráficos"],
            descricao: "Pesquisa quantitativa sobre hábitos de consumo de mídia entre estudantes do ensino médio. Coletamos dados de 120 respondentes, calculamos média, mediana, moda e desvio padrão, e construímos histogramas e gráficos de dispersão para visualizar distribuições e correlações.",
            imagens: [
              { src: "https://picsum.photos/seed/mt-t2-01-a/1200/800", alt: "Questionário aplicado" },
              { src: "https://picsum.photos/seed/mt-t2-01-b/1200/800", alt: "Histograma de frequências" }
            ]
          },
          {
            id: "mt-t2-02",
            tema: "Trigonometria e Aplicações Práticas",
            habilidades: ["Medição indireta", "Razões trigonométricas", "Resolução de problemas"],
            descricao: "Determinação de alturas de prédios e árvores no entorno da escola usando teodolito improvisado e razões trigonométricas. Aplicamos tangente, seno e cosseno para calcular distâncias inacessíveis, documentando todo o processo de medição angular e conversão matemática.",
            imagens: [
              { src: "https://picsum.photos/seed/mt-t2-02-a/1200/800", alt: "Medição com teodolito" },
              { src: "https://picsum.photos/seed/mt-t2-02-b/1200/800", alt: "Esquema trigonométrico" },
              { src: "https://picsum.photos/seed/mt-t2-02-c/1200/800", alt: "Tabela de resultados" }
            ]
          }
        ]
      },
      {
        numero: 3,
        trabalhos: [
          {
            id: "mt-t3-01",
            tema: "Progressões Aritméticas e Geométricas",
            habilidades: ["Identificação de padrões", "Fórmulas de termos gerais", "Aplicação financeira"],
            descricao: "Análise de sequências numéricas no cotidiano: desde padrões visuais em arquitetura até cálculos de juros compostos. Estudamos a diferença entre crescimento linear (PA) e exponencial (PG), com aplicações em investimentos financeiros e crescimento populacional.",
            imagens: [
              { src: "https://picsum.photos/seed/mt-t3-01-a/1200/800", alt: "Exemplos visuais de PA e PG" },
              { src: "https://picsum.photos/seed/mt-t3-01-b/1200/800", alt: "Simulação de investimentos" }
            ]
          },
          {
            id: "mt-t3-02",
            tema: "Matrizes e Sistemas Lineares",
            habilidades: ["Operações matriciais", "Resolução de sistemas", "Aplicação computacional"],
            descricao: "Resolução de sistemas lineares usando método de Gauss e representação matricial. Implementamos algoritmos simples em planilhas para automatizar a resolução, explorando aplicações em problemas de logística e planejamento de recursos.",
            imagens: [
              { src: "https://picsum.photos/seed/mt-t3-02-a/1200/800", alt: "Sistema linear resolvido" }
            ]
          }
        ]
      }
    ]
  },
  {
    categoria: "Linguagens",
    slug: "linguagens",
    trimestres: [
      {
        numero: 1,
        trabalhos: [
          {
            id: "lc-t1-01",
            tema: "Análise Literária: Machado de Assis",
            habilidades: ["Interpretação textual", "Análise de personagens", "Contexto histórico"],
            descricao: "Estudo aprofundado de 'Dom Casmurro' focando na ambiguidade narrativa e na construção do narrador não-confiável. Analisamos trechos-chave, o contexto histórico do Rio de Janeiro do século XIX e a crítica social implícita na obra machadiana, produzindo um ensaio interpretativo fundamentado.",
            imagens: [
              { src: "https://picsum.photos/seed/lc-t1-01-a/1200/800", alt: "Esquema de análise narrativa" },
              { src: "https://picsum.photos/seed/lc-t1-01-b/1200/800", alt: "Linha do tempo da narrativa" }
            ]
          },
          {
            id: "lc-t1-02",
            tema: "Produção Textual: Artigo de Opinião",
            habilidades: ["Argumentação", "Coesão textual", "Posicionamento crítico"],
            descricao: "Redação de artigo de opinião sobre o impacto das redes sociais na saúde mental de adolescentes. O texto seguiu estrutura dissertativa com tese clara, argumentos fundamentados em pesquisas recentes e proposta de intervenção social. Trabalho incluiu revisão por pares e reescrita.",
            imagens: [
              { src: "https://picsum.photos/seed/lc-t1-02-a/1200/800", alt: "Estrutura argumentativa" },
              { src: "https://picsum.photos/seed/lc-t1-02-b/1200/800", alt: "Primeira versão revisada" },
              { src: "https://picsum.photos/seed/lc-t1-02-c/1200/800", alt: "Versão final publicada" }
            ]
          }
        ]
      },
      {
        numero: 2,
        trabalhos: [
          {
            id: "lc-t2-01",
            tema: "Poesia Concreta e Experimentalismo",
            habilidades: ["Criação artística", "Linguagem visual", "Desconstrução sintática"],
            descricao: "Criação de três poemas visuais inspirados no movimento da Poesia Concreta brasileira (Augusto de Campos, Haroldo de Campos). Exploramos a relação entre forma e conteúdo, utilizando tipografia como elemento semântico e experimentando com espacialização não-linear da palavra.",
            imagens: [
              { src: "https://picsum.photos/seed/lc-t2-01-a/1200/800", alt: "Poema visual #1: Silêncio" },
              { src: "https://picsum.photos/seed/lc-t2-01-b/1200/800", alt: "Poema visual #2: Velocidade" }
            ]
          },
          {
            id: "lc-t2-02",
            tema: "Linguagem Cinematográfica e Narrativa Visual",
            habilidades: ["Análise de imagem", "Decupagem", "Storyboard"],
            descricao: "Análise de cena do filme 'Cidade de Deus', estudando planos, enquadramentos, movimentos de câmera e montagem. Produzimos decupagem plano-a-plano e discutimos como as escolhas de linguagem contribuem para a narrativa de violência urbana no Rio de Janeiro.",
            imagens: [
              { src: "https://picsum.photos/seed/lc-t2-02-a/1200/800", alt: "Decupagem plano a plano" },
              { src: "https://picsum.photos/seed/lc-t2-02-b/1200/800", alt: "Análise de enquadramento" },
              { src: "https://picsum.photos/seed/lc-t2-02-c/1200/800", alt: "Storyboard de cena-chave" }
            ]
          }
        ]
      },
      {
        numero: 3,
        trabalhos: [
          {
            id: "lc-t3-01",
            tema: "Variedades Linguísticas do Português Brasileiro",
            habilidades: ["Sociolinguística", "Pesquisa de campo", "Registro e análise"],
            descricao: "Pesquisa sobre variação linguística regional e social, com coleta de expressões idiomáticas, prosódias e léxicos específicos de diferentes regiões do Brasil. O trabalho resultou em um glossário comparativo e discussão sobre preconceito linguístico.",
            imagens: [
              { src: "https://picsum.photos/seed/lc-t3-01-a/1200/800", alt: "Mapa de variações regionais" },
              { src: "https://picsum.photos/seed/lc-t3-01-b/1200/800", alt: "Glossário comparativo" }
            ]
          },
          {
            id: "lc-t3-02",
            tema: "Produção Audiovisual: Curta Documental",
            habilidades: ["Roteiro", "Edição de vídeo", "Narrativa audiovisual"],
            descricao: "Produção de curta-metragem documentário sobre memórias de moradores antigos do bairro da escola. Envolveu pesquisa histórica, elaboração de roteiro de entrevistas, captação de imagens, edição em software profissional e finalização com legendas e trilha sonora original.",
            imagens: [
              { src: "https://picsum.photos/seed/lc-t3-02-a/1200/800", alt: "Frame do documentário" },
              { src: "https://picsum.photos/seed/lc-t3-02-b/1200/800", alt: "Processo de edição" }
            ]
          }
        ]
      }
    ]
  },
  {
    categoria: "Ciências Humanas",
    slug: "ciencias-humanas",
    trimestres: [
      {
        numero: 1,
        trabalhos: [
          {
            id: "ch-t1-01",
            tema: "Revolução Industrial e Transformações Sociais",
            habilidades: ["Pesquisa histórica", "Análise de fontes", "Contextualização"],
            descricao: "Estudo sobre o impacto da Revolução Industrial na organização do trabalho, urbanização e desigualdades sociais. Analisamos fontes primárias (fotografias de fábricas, relatos de operários) e secundárias, construindo uma narrativa visual sobre a transição do Antigo Regime para a Modernidade.",
            imagens: [
              { src: "https://picsum.photos/seed/ch-t1-01-a/1200/800", alt: "Linha do tempo ilustrada" },
              { src: "https://picsum.photos/seed/ch-t1-01-b/1200/800", alt: "Comparativo: antes e depois" }
            ]
          },
          {
            id: "ch-t1-02",
            tema: "Cartografia e Representação Espacial",
            habilidades: ["Leitura de mapas", "Escala cartográfica", "Geolocalização"],
            descricao: "Exercício prático de cartografia urbana mapeando equipamentos públicos (escolas, postos de saúde, espaços culturais) em um raio de 2km da escola. Utilizamos Google Maps, medições de distância e construímos um mapa temático com legenda e escala gráfica.",
            imagens: [
              { src: "https://picsum.photos/seed/ch-t1-02-a/1200/800", alt: "Mapa temático produzido" },
              { src: "https://picsum.photos/seed/ch-t1-02-b/1200/800", alt: "Legenda e metodologia" },
              { src: "https://picsum.photos/seed/ch-t1-02-c/1200/800", alt: "Análise de distribuição espacial" }
            ]
          }
        ]
      },
      {
        numero: 2,
        trabalhos: [
          {
            id: "ch-t2-01",
            tema: "Democracia e Sistemas Políticos",
            habilidades: ["Pensamento crítico", "Debate estruturado", "Cidadania"],
            descricao: "Simulação de debate parlamentar sobre projeto de lei fictício, assumindo papéis de diferentes partidos políticos. O trabalho envolveu pesquisa sobre sistemas eleitorais, processo legislativo brasileiro e construção de argumentos baseados em ideologias políticas distintas.",
            imagens: [
              { src: "https://picsum.photos/seed/ch-t2-01-a/1200/800", alt: "Simulação do debate" },
              { src: "https://picsum.photos/seed/ch-t2-01-b/1200/800", alt: "Propostas apresentadas" }
            ]
          },
          {
            id: "ch-t2-02",
            tema: "Urbanização e Segregação Socioespacial",
            habilidades: ["Análise sociológica", "Geografia urbana", "Produção de mapas"],
            descricao: "Investigação sobre processos de segregação espacial em uma grande cidade brasileira, analisando indicadores de renda, acesso a serviços e mobilidade urbana. Produzimos mapas temáticos sobrepostos que evidenciam desigualdades territoriais e discutimos políticas públicas.",
            imagens: [
              { src: "https://picsum.photos/seed/ch-t2-02-a/1200/800", alt: "Mapa de renda per capita" },
              { src: "https://picsum.photos/seed/ch-t2-02-b/1200/800", alt: "Sobreposição: acesso a transporte" }
            ]
          }
        ]
      },
      {
        numero: 3,
        trabalhos: [
          {
            id: "ch-t3-01",
            tema: "Patrimônio Cultural e Memória Coletiva",
            habilidades: ["História oral", "Preservação cultural", "Documentação"],
            descricao: "Projeto de registro de patrimônio imaterial do bairro através de entrevistas com moradores antigos, levantamento fotográfico de construções históricas e catalogação de festas tradicionais. O trabalho gerou um mini-documentário e exposição fotográfica na escola.",
            imagens: [
              { src: "https://picsum.photos/seed/ch-t3-01-a/1200/800", alt: "Fotografia de patrimônio histórico" },
              { src: "https://picsum.photos/seed/ch-t3-01-b/1200/800", alt: "Registro de entrevista" },
              { src: "https://picsum.photos/seed/ch-t3-01-c/1200/800", alt: "Exposição montada" }
            ]
          },
          {
            id: "ch-t3-02",
            tema: "Globalização e Fluxos Migratórios",
            habilidades: ["Análise de dados geográficos", "Conexões globais", "Interpretação crítica"],
            descricao: "Estudo dos principais fluxos migratórios contemporâneos, causas de migrações forçadas e impactos culturais em países receptores. Construímos infográficos interativos mostrando rotas migratórias, estatísticas de refugiados e análise de políticas de acolhimento.",
            imagens: [
              { src: "https://picsum.photos/seed/ch-t3-02-a/1200/800", alt: "Mapa de fluxos migratórios" },
              { src: "https://picsum.photos/seed/ch-t3-02-b/1200/800", alt: "Infográfico de dados" }
            ]
          }
        ]
      }
    ]
  }
];

// Helper function to get all categories
export const getCategories = () => portfolioData;

// Get specific category by slug
export const getCategoryBySlug = (slug) => {
  return portfolioData.find(cat => cat.slug === slug);
};

// Get specific trimester from a category
export const getTrimester = (categorySlug, trimesterNumber) => {
  const category = getCategoryBySlug(categorySlug);
  if (!category) return null;
  return category.trimestres.find(t => t.numero === parseInt(trimesterNumber));
};

// Count total works across all categories
export const getTotalWorks = () => {
  return portfolioData.reduce((total, category) => {
    return total + category.trimestres.reduce((catTotal, trimestre) => {
      return catTotal + trimestre.trabalhos.length;
    }, 0);
  }, 0);
};

// Count works per category
export const getWorksCountByCategory = (categorySlug) => {
  const category = getCategoryBySlug(categorySlug);
  if (!category) return 0;
  return category.trimestres.reduce((total, trimestre) => {
    return total + trimestre.trabalhos.length;
  }, 0);
};
