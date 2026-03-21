# PORTFOLIO VINÍCIUS SEBOLD

Portfólio escolar de alta qualidade com design editorial inspirado em Zara.com — ultra-minimalista, tipografia refinada, e navegação por páginas individuais.

## 🎨 Design Aesthetic

- **Inspiração**: Zara.com luxury editorial
- **Paleta**: White (#FFFFFF), Black (#0A0A0A), Stone (#F5F3F0)
- **Tipografia**: Cormorant Garamond (display) + Inter (body)
- **Princípios**: Zero rounded corners, zero shadows, generous whitespace (120px desktop padding)

## 🛠️ Stack Técnica

- **Framework**: Vite + React 18
- **Styling**: Tailwind CSS com tokens customizados
- **Routing**: React Router DOM (multi-page, não SPA)
- **Carousel**: Embla Carousel React
- **Animations**: Framer Motion (transições sutis 200ms)
- **Icons**: Lucide React

## 📁 Estrutura do Projeto

```
portfolio-vinicius/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx          # Navegação fixa com sub-menu inline
│   │   ├── Card.jsx            # Card de trabalho full-width
│   │   ├── Carousel.jsx        # Galeria de imagens com Embla
│   │   └── PageHeader.jsx      # Cabeçalho editorial com número
│   ├── pages/
│   │   ├── Home.jsx            # Capa editorial
│   │   └── TrimesterPage.jsx   # Página individual de trimestre
│   ├── data/
│   │   └── portfolio.js        # Dados realistas de todos os trabalhos
│   ├── App.jsx                 # Router principal
│   ├── main.jsx                # Entry point
│   └── index.css               # Estilos globais Tailwind
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

## 🚀 Instalação e Execução

### Pré-requisitos

- Node.js 18+ e npm

### Passos

1. **Instalar dependências**

```bash
npm install
```

2. **Executar ambiente de desenvolvimento**

```bash
npm run dev
```

O site estará disponível em `http://localhost:3000`

3. **Build para produção**

```bash
npm run build
```

Os arquivos otimizados serão gerados na pasta `dist/`.

## 🗺️ Estrutura de Rotas

- `/` — Home (capa editorial)
- `/ciencias-natureza/1-trimestre` — Ciências da Natureza, 1º Trimestre
- `/ciencias-natureza/2-trimestre` — Ciências da Natureza, 2º Trimestre
- `/ciencias-natureza/3-trimestre` — Ciências da Natureza, 3º Trimestre
- `/matematica/1-trimestre` — Matemática, 1º Trimestre
- ...e assim por diante para todas as 4 categorias × 3 trimestres

## 📊 Dados de Exemplo

O arquivo `src/data/portfolio.js` contém dados realistas para:

- **Ciências da Natureza**: 6 trabalhos (2 por trimestre)
- **Matemática**: 6 trabalhos
- **Linguagens e Códigos**: 6 trabalhos
- **Ciências Humanas**: 6 trabalhos
- **Matemática e Tecnologia**: 6 trabalhos (categoria extra)

Total: **30 trabalhos escolares** documentados com descrições detalhadas, habilidades e múltiplas imagens.

## 🎯 Features Implementadas

✅ Navegação multi-página com React Router
✅ Navbar fixa com sub-menu inline de trimestres
✅ Carousels de imagens com contador "01 / 04"
✅ Tipografia editorial com tracking extenso
✅ Transições suaves entre páginas (Framer Motion)
✅ Design responsivo (mobile-first)
✅ Dados estruturados e realistas
✅ Zero bordas arredondadas, zero sombras
✅ Whitespace generoso (120px desktop)
✅ Hover states customizados (underline scaleX)

## 📱 Responsividade

- **Desktop**: Padding de 120px, sub-menu inline, 4 categorias no centro
- **Mobile**: Padding de 24px, hamburger menu (ícone "—"), menu colapsável

## 🖼️ Imagens

As imagens de exemplo utilizam placeholders de `picsum.photos` com seeds específicos para consistência.

Para produção, substituir por imagens reais dos trabalhos escolares.

## 🧩 Customização

### Adicionar nova categoria

1. Editar `src/data/portfolio.js`
2. Adicionar novo objeto no array `portfolioData`
3. As rotas são geradas automaticamente

### Modificar paleta de cores

1. Editar `tailwind.config.js` na seção `theme.extend.colors`
2. Ajustar variáveis no `src/index.css` se necessário

### Alterar fontes

1. Atualizar o `<link>` no `index.html`
2. Modificar `tailwind.config.js` em `fontFamily`

## 📝 Licença

Projeto educacional - SENAI 2024

---

**Desenvolvido com foco em design editorial de luxo e atenção meticulosa aos detalhes.**
