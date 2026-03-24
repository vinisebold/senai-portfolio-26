import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const REPO_OWNER = "vinisebold";
const REPO_NAME = "senai-portfolio-26";
const BRANCH = "main";

const CATEGORY_META = [
  { slug: "ciencias-humanas", label: "Ciências Humanas", idPrefix: "ch" },
  { slug: "ciencias-natureza", label: "Ciências Natureza", idPrefix: "cn" },
  { slug: "linguagens", label: "Linguagens", idPrefix: "ling" },
  { slug: "matematica", label: "Matemática", idPrefix: "mat" },
];

const TRIMESTERS = ["1", "2", "3"];
const EMPTY_TRIMESTER_TEMPLATE = { "1": [], "2": [], "3": [] };

function sortYears(years) {
  return [...new Set(years)].sort((first, second) => Number(first) - Number(second));
}

function buildDataFiles(years) {
  return years.flatMap((year) =>
    CATEGORY_META.map(({ slug }) => ({
      year,
      slug,
      path: `assets/data/${year}/${slug}.json`,
    })),
  );
}

const TRIMESTER_LABELS = {
  "1": "1º Trimestre",
  "2": "2º Trimestre",
  "3": "3º Trimestre",
};

const trim = (value) => (typeof value === "string" ? value.trim() : "");

function getCategoryLabel(slug) {
  return CATEGORY_META.find((item) => item.slug === slug)?.label || slug;
}

function getCategoryPrefix(slug) {
  return CATEGORY_META.find((item) => item.slug === slug)?.idPrefix || "proj";
}

function getDataFilePath(year, categorySlug) {
  return `assets/data/${year}/${categorySlug}.json`;
}

function generateProjectId(categorySlug) {
  return `${getCategoryPrefix(categorySlug)}-${Date.now()}`;
}

function normalizeProject(project, availableYears = []) {
  const normalizedYears = sortYears(availableYears);
  const fallbackYear = normalizedYears[0] || String(new Date().getFullYear());

  return {
    id: trim(project.id) || generateProjectId(project.categorySlug),
    title: trim(project.title),
    description: trim(project.description),
    skills: Array.isArray(project.skills)
      ? project.skills.map((skill) => trim(skill)).filter(Boolean)
      : [],
    images: Array.isArray(project.images)
      ? project.images.map((image) => trim(image)).filter(Boolean)
      : [],
    link: trim(project.link),
    year: normalizedYears.includes(project.year) ? project.year : fallbackYear,
    categorySlug: CATEGORY_META.some((category) => category.slug === project.categorySlug)
      ? project.categorySlug
      : CATEGORY_META[0].slug,
    trimester: TRIMESTERS.includes(project.trimester) ? project.trimester : "1",
    sortKey:
      typeof project.sortKey === "number"
        ? project.sortKey
        : Number.MAX_SAFE_INTEGER,
  };
}

function flattenPortfolioFiles(fileMap, years) {
  const projects = [];
  const dataFiles = buildDataFiles(years);

  for (const file of dataFiles) {
    const fileContent = fileMap[file.path];
    const trimesters = fileContent?.data || EMPTY_TRIMESTER_TEMPLATE;

    TRIMESTERS.forEach((trimester) => {
      const items = Array.isArray(trimesters?.[trimester]) ? trimesters[trimester] : [];
      items.forEach((item, index) => {
        projects.push(
          normalizeProject({
            id: item.id,
            title: item.tema,
            description: item.descricao,
            skills: item.habilidades,
            images: item.imagens,
            link: item.link,
            year: file.year,
            categorySlug: file.slug,
            trimester,
            sortKey: index,
          }, years),
        );
      });
    });
  }

  return projects;
}

function toCategoryFileData(projects, year, categorySlug) {
  const grouped = { "1": [], "2": [], "3": [] };

  projects
    .filter((project) => project.year === year && project.categorySlug === categorySlug)
    .sort((first, second) => {
      if (first.trimester !== second.trimester) {
        return Number(first.trimester) - Number(second.trimester);
      }
      return first.sortKey - second.sortKey;
    })
    .forEach((project) => {
      grouped[project.trimester].push({
        id: trim(project.id),
        tema: trim(project.title),
        descricao: trim(project.description),
        habilidades: Array.isArray(project.skills)
          ? project.skills.map((skill) => trim(skill)).filter(Boolean)
          : [],
        imagens: Array.isArray(project.images)
          ? project.images.map((image) => trim(image)).filter(Boolean)
          : [],
        ...(trim(project.link) ? { link: trim(project.link) } : {}),
      });
    });

  return grouped;
}

function serializeCategoryFile(data) {
  return `${JSON.stringify(data, null, 2)}\n`;
}

async function githubRequest(token, method, endpoint, body = null) {
  const res = await fetch(`https://api.github.com${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.github+json",
    },
    body: body ? JSON.stringify(body) : null,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `GitHub API error ${res.status}`);
  }

  return res.json();
}

async function fetchJsonFile(token, path) {
  try {
    const file = await githubRequest(
      token,
      "GET",
      `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}?ref=${BRANCH}`,
    );

    const content = atob(file.content.replace(/\n/g, ""));
    const parsed = JSON.parse(content);

    return {
      path,
      sha: file.sha,
      data: parsed,
      exists: true,
    };
  } catch (error) {
    if (String(error.message).includes("Not Found")) {
      return {
        path,
        sha: null,
        data: { ...EMPTY_TRIMESTER_TEMPLATE },
        exists: false,
      };
    }

    throw error;
  }
}

async function fetchAvailableYears(token) {
  const entries = await githubRequest(
    token,
    "GET",
    `/repos/${REPO_OWNER}/${REPO_NAME}/contents/assets/data?ref=${BRANCH}`,
  );

  const years = Array.isArray(entries)
    ? entries
        .filter((entry) => entry.type === "dir" && /^\d{4}$/.test(entry.name))
        .map((entry) => entry.name)
    : [];

  return sortYears(years);
}

async function saveJsonFile(token, path, content, sha, message) {
  const encoded = btoa(unescape(encodeURIComponent(content)));

  const response = await githubRequest(
    token,
    "PUT",
    `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`,
    {
      message,
      content: encoded,
      ...(sha ? { sha } : {}),
      branch: BRANCH,
    },
  );

  return response.content?.sha || null;
}

async function deleteJsonFile(token, path, sha, message) {
  await githubRequest(
    token,
    "DELETE",
    `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`,
    {
      message,
      sha,
      branch: BRANCH,
    },
  );
}

async function uploadImage(token, file, path) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const base64 = reader.result.split(",")[1];
        let sha;

        try {
          const existing = await githubRequest(
            token,
            "GET",
            `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`,
          );
          sha = existing.sha;
        } catch {
          sha = undefined;
        }

        await githubRequest(
          token,
          "PUT",
          `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`,
          {
            message: `Upload image: ${path}`,
            content: base64,
            ...(sha ? { sha } : {}),
            branch: BRANCH,
          },
        );

        resolve(
          `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}/${path}`,
        );
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function buildEmptyProject(defaultYear, defaultCategory = CATEGORY_META[0].slug) {
  return {
    id: generateProjectId(defaultCategory),
    title: "",
    description: "",
    skills: [],
    images: [],
    link: "",
    year: defaultYear,
    categorySlug: defaultCategory,
    trimester: "1",
    sortKey: Number.MAX_SAFE_INTEGER,
  };
}

function Input({ label, value, onChange, placeholder, type = "text", required }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs tracking-[0.15em] uppercase text-stone-500">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="bg-transparent border-b border-stone-300 py-2 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-900 transition-colors"
      />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs tracking-[0.15em] uppercase text-stone-500">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent border-b border-stone-300 py-2 text-sm text-stone-900 focus:outline-none focus:border-stone-900 transition-colors"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Btn({
  children,
  onClick,
  variant = "primary",
  disabled,
  small,
  type = "button",
}) {
  const base =
    "tracking-[0.1em] uppercase text-xs transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed";
  const variants = {
    primary: `bg-stone-900 text-white ${small ? "px-4 py-2" : "px-8 py-3"} hover:bg-stone-700`,
    ghost: `border border-stone-300 text-stone-700 ${small ? "px-4 py-2" : "px-8 py-3"} hover:border-stone-900 hover:text-stone-900`,
    danger: `border border-red-300 text-red-600 ${small ? "px-4 py-2" : "px-8 py-3"} hover:bg-red-50`,
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]}`}
    >
      {children}
    </button>
  );
}

function Toast({ msg, type }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 text-sm tracking-wide z-50 ${
        type === "error" ? "bg-red-600 text-white" : "bg-stone-900 text-white"
      }`}
    >
      {msg}
    </motion.div>
  );
}

function LoginScreen({ onLogin }) {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    if (!token.trim()) return;

    setLoading(true);
    setError("");
    try {
      await githubRequest(token.trim(), "GET", `/repos/${REPO_OWNER}/${REPO_NAME}`);
      onLogin(token.trim());
    } catch {
      setError("Token inválido ou sem permissão no repositório.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F3F0] flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="mb-12">
          <p className="text-xs tracking-[0.3em] uppercase text-stone-400 mb-3">Portfólio Admin</p>
          <h1 className="text-4xl font-light text-stone-900" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Acesso Restrito
          </h1>
          <div className="mt-4 w-8 h-px bg-stone-900" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <label className="text-xs tracking-[0.15em] uppercase text-stone-500">
              GitHub Personal Access Token
            </label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="github_pat_..."
              className="bg-transparent border-b border-stone-300 py-3 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-900 transition-colors"
            />
            <p className="text-xs text-stone-400 mt-1">
              Fine-grained PAT com permissão <span className="font-medium">Contents: Read &amp; Write</span>
            </p>
          </div>

          {error && <p className="text-xs text-red-600 tracking-wide">{error}</p>}

          <Btn type="submit" disabled={loading || !token.trim()}>
            {loading ? "Verificando..." : "Entrar"}
          </Btn>
        </form>

        <p className="mt-8 text-xs text-stone-400 leading-relaxed">
          O token é armazenado apenas na memória desta sessão e descartado ao fechar o navegador.
        </p>
      </motion.div>
    </div>
  );
}

function ProjectForm({ project, onSave, onCancel, token, saving, years }) {
  const [form, setForm] = useState(() => normalizeProject(project, years));
  const [skillInput, setSkillInput] = useState("");
  const [imageInput, setImageInput] = useState("");
  const [uploading, setUploading] = useState(false);

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function addSkill() {
    const skill = trim(skillInput);
    if (skill && !form.skills.includes(skill)) {
      set("skills", [...form.skills, skill]);
    }
    setSkillInput("");
  }

  function removeSkill(skill) {
    set("skills", form.skills.filter((item) => item !== skill));
  }

  function addImageUrl() {
    const url = trim(imageInput);
    if (url) {
      set("images", [...form.images, url]);
      setImageInput("");
    }
  }

  function removeImage(index) {
    set("images", form.images.filter((_, imageIndex) => imageIndex !== index));
  }

  async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `${form.id}_${Date.now()}.${ext}`;
      const path = `assets/images/${form.year}/${form.trimester}tri/${form.categorySlug}/uploads/${fileName}`;
      const url = await uploadImage(token, file, path);
      set("images", [...form.images, url]);
    } catch (error) {
      alert(`Erro ao fazer upload: ${error.message}`);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSave(normalizeProject(form, years));
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-40 bg-[#F5F3F0]/95 overflow-y-auto"
    >
      <div className="max-w-2xl mx-auto px-8 py-16">
        <div className="mb-10 flex items-start justify-between">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-stone-400 mb-2">
              {project.title ? "Editar" : "Novo"} Projeto
            </p>
            <h2 className="text-3xl font-light text-stone-900" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              {form.title || "Sem título"}
            </h2>
          </div>
          <button type="button" onClick={onCancel} className="text-stone-400 hover:text-stone-900 text-xs tracking-widest uppercase mt-2">
            Cancelar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          <div className="grid grid-cols-1 gap-6">
            <Input label="Título" value={form.title} onChange={(v) => set("title", v)} required placeholder="Nome do projeto" />
            <Input label="Link (opcional)" value={form.link} onChange={(v) => set("link", v)} type="url" placeholder="https://..." />
            <div className="flex flex-col gap-1">
              <label className="text-xs tracking-[0.15em] uppercase text-stone-500">Descrição</label>
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={4}
                placeholder="Descreva o projeto..."
                className="bg-transparent border-b border-stone-300 py-2 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-900 transition-colors resize-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <Select
              label="Ano"
              value={form.year}
              onChange={(v) => set("year", v)}
              options={years.map((year) => ({ value: year, label: year }))}
            />
            <Select
              label="Categoria"
              value={form.categorySlug}
              onChange={(v) => set("categorySlug", v)}
              options={CATEGORY_META.map((category) => ({ value: category.slug, label: category.label }))}
            />
          </div>

          <Select
            label="Trimestre"
            value={form.trimester}
            onChange={(v) => set("trimester", v)}
            options={TRIMESTERS.map((trimester) => ({ value: trimester, label: TRIMESTER_LABELS[trimester] }))}
          />

          <div className="flex flex-col gap-3">
            <label className="text-xs tracking-[0.15em] uppercase text-stone-500">Habilidades</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkill();
                  }
                }}
                placeholder="Ex: Biologia, Cálculo..."
                className="flex-1 bg-transparent border-b border-stone-300 py-2 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-900 transition-colors"
              />
              <Btn small onClick={addSkill} variant="ghost">
                Adicionar
              </Btn>
            </div>

            <div className="flex flex-wrap gap-2 mt-1">
              {form.skills.map((skill) => (
                <span key={skill} className="flex items-center gap-1 text-xs tracking-wide border border-stone-300 px-3 py-1 text-stone-700">
                  {skill}
                  <button type="button" onClick={() => removeSkill(skill)} className="ml-1 text-stone-400 hover:text-red-500 text-base leading-none">
                    &times;
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-xs tracking-[0.15em] uppercase text-stone-500">Imagens</label>

            <div className="flex gap-2">
              <input
                type="url"
                value={imageInput}
                onChange={(e) => setImageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addImageUrl();
                  }
                }}
                placeholder="https://... ou URL de imagem"
                className="flex-1 bg-transparent border-b border-stone-300 py-2 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-900 transition-colors"
              />
              <Btn small onClick={addImageUrl} variant="ghost">
                + URL
              </Btn>
            </div>

            <div className="flex items-center gap-3">
              <label
                className={`cursor-pointer text-xs tracking-[0.1em] uppercase border border-stone-300 px-4 py-2 text-stone-700 hover:border-stone-900 hover:text-stone-900 transition-all ${
                  uploading ? "opacity-40 pointer-events-none" : ""
                }`}
              >
                {uploading ? "Enviando..." : "Upload arquivo"}
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
              <span className="text-xs text-stone-400">PNG, JPG, WebP</span>
            </div>

            {form.images.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mt-2">
                {form.images.map((img, index) => (
                  <div key={`${img}-${index}`} className="relative group aspect-video bg-stone-100 overflow-hidden">
                    <img
                      src={img}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = `https://picsum.photos/seed/${index}/400/300`;
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-600 text-white text-xs w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                    <span className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1 py-0.5">
                      {index + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-4 border-t border-stone-200">
            <Btn type="submit" disabled={saving || !form.title.trim()}>
              {saving ? "Salvando..." : "Salvar projeto"}
            </Btn>
            <Btn variant="ghost" onClick={onCancel}>
              Cancelar
            </Btn>
          </div>
        </form>
      </div>
    </motion.div>
  );
}

function Dashboard({ token, onLogout }) {
  const [years, setYears] = useState([]);
  const [projects, setProjects] = useState([]);
  const [fileState, setFileState] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState(null);
  const [newYearInput, setNewYearInput] = useState("");
  const [yearToDelete, setYearToDelete] = useState(null);
  const [filterYear, setFilterYear] = useState("all");
  const [filterCat, setFilterCat] = useState("all");
  const [filterTri, setFilterTri] = useState("all");
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  }

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const nextYears = await fetchAvailableYears(token);
      const dataFiles = buildDataFiles(nextYears);
      const files = await Promise.all(
        dataFiles.map(async (file) => {
          const fetched = await fetchJsonFile(token, file.path);
          return [
            file.path,
            {
              sha: fetched.sha,
              data: fetched.data,
            },
          ];
        }),
      );

      const nextFileState = Object.fromEntries(files);
      setYears(nextYears);
      setFileState(nextFileState);
      setProjects(flattenPortfolioFiles(nextFileState, nextYears));
    } catch (error) {
      showToast(`Erro ao carregar dados: ${error.message}`, "error");
      setYears([]);
      setProjects([]);
      setFileState({});
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function persistProjects(nextProjects, commitMsg) {
    setSaving(true);

    try {
      const dataFiles = buildDataFiles(years);
      const normalized = nextProjects.map((project, index) =>
        normalizeProject({ ...project, sortKey: index }, years),
      );

      const nextFilePayloads = dataFiles.map((file) => {
        const path = getDataFilePath(file.year, file.slug);
        const data = toCategoryFileData(normalized, file.year, file.slug);
        return {
          path,
          data,
          content: serializeCategoryFile(data),
        };
      });

      const updatedFileState = { ...fileState };
      for (const payload of nextFilePayloads) {
        const currentSha = updatedFileState[payload.path]?.sha || null;
        const newSha = await saveJsonFile(
          token,
          payload.path,
          payload.content,
          currentSha,
          commitMsg,
        );

        updatedFileState[payload.path] = {
          sha: newSha,
          data: payload.data,
        };
      }

      setFileState(updatedFileState);
      setProjects(normalized);
      showToast("Salvo com sucesso!");
      return true;
    } catch (error) {
      showToast(`Erro ao salvar: ${error.message}`, "error");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveProject(form) {
    const sanitized = normalizeProject(form, years);
    const exists = projects.some((project) => project.id === sanitized.id);

    const nextProjects = exists
      ? projects.map((project) => (project.id === sanitized.id ? sanitized : project))
      : [...projects, sanitized];

    const commitAction = exists ? "Update" : "Add";
    const saved = await persistProjects(
      nextProjects,
      `${commitAction} project: ${sanitized.title || sanitized.id}`,
    );

    if (saved) {
      setEditing(null);
    }
  }

  async function handleDelete(id) {
    const project = projects.find((item) => item.id === id);
    if (!project) return;

    const nextProjects = projects.filter((item) => item.id !== id);
    const saved = await persistProjects(
      nextProjects,
      `Remove project: ${project.title || project.id}`,
    );

    if (saved) {
      setDeleteConfirm(null);
    }
  }

  async function handleCreateYear() {
    const year = trim(newYearInput);

    if (!/^\d{4}$/.test(year)) {
      showToast("Informe um ano válido com 4 dígitos.", "error");
      return;
    }

    if (years.includes(year)) {
      showToast("Este ano já existe.", "error");
      return;
    }

    setSaving(true);
    try {
      for (const category of CATEGORY_META) {
        const path = getDataFilePath(year, category.slug);
        await saveJsonFile(
          token,
          path,
          serializeCategoryFile(EMPTY_TRIMESTER_TEMPLATE),
          null,
          `Create year ${year}: ${category.slug}`,
        );
      }

      setNewYearInput("");
      setFilterYear(year);
      showToast(`Ano ${year} criado com sucesso.`);
      await loadData();
    } catch (error) {
      showToast(`Erro ao criar ano: ${error.message}`, "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteYear(year) {
    if (!year) return;

    setSaving(true);
    try {
      for (const category of CATEGORY_META) {
        const path = getDataFilePath(year, category.slug);
        const file = await fetchJsonFile(token, path);
        if (file.sha) {
          await deleteJsonFile(
            token,
            path,
            file.sha,
            `Remove year ${year}: ${category.slug}`,
          );
        }
      }

      if (filterYear === year) {
        setFilterYear("all");
      }

      setYearToDelete(null);
      showToast(`Ano ${year} removido.`);
      await loadData();
    } catch (error) {
      showToast(`Erro ao remover ano: ${error.message}`, "error");
    } finally {
      setSaving(false);
    }
  }

  function openNewProjectForm() {
    const year = filterYear !== "all" ? filterYear : years[0];
    const category = filterCat !== "all" ? filterCat : CATEGORY_META[0].slug;
    setEditing(buildEmptyProject(year, category));
  }

  const filtered = projects.filter((project) => {
    if (filterYear !== "all" && project.year !== filterYear) return false;
    if (filterCat !== "all" && project.categorySlug !== filterCat) return false;
    if (filterTri !== "all" && project.trimester !== filterTri) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F3F0] flex items-center justify-center">
        <div className="text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-stone-400 animate-pulse">
            Carregando portfólio...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F3F0]">
      <header className="border-b border-stone-200 bg-white sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-8 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-stone-400">Painel Admin</p>
            <h1 className="text-xl font-light text-stone-900" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Portfólio · {projects.length} projetos
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Btn
              small
              disabled={years.length === 0}
              onClick={openNewProjectForm}
            >
              + Novo projeto
            </Btn>
            <button type="button" onClick={onLogout} className="text-xs tracking-widest uppercase text-stone-400 hover:text-stone-700 transition-colors">
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-10">
        <div className="mb-8 pb-6 border-b border-stone-200">
          <p className="text-xs tracking-widest uppercase text-stone-400 mb-3">Gerenciar anos</p>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              value={newYearInput}
              onChange={(e) => setNewYearInput(e.target.value)}
              placeholder="Ex: 2027"
              className="bg-transparent border-b border-stone-300 py-1 text-sm text-stone-700 placeholder-stone-400 focus:outline-none focus:border-stone-900"
            />
            <Btn small onClick={handleCreateYear} disabled={saving || !newYearInput.trim()}>
              + Adicionar ano
            </Btn>
            {years.map((year) => (
              <button
                key={year}
                type="button"
                onClick={() => setYearToDelete(year)}
                className="text-xs tracking-wide border border-stone-300 px-3 py-1 text-stone-600 hover:text-red-600 hover:border-red-300 transition-colors"
              >
                Remover {year}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mb-8 pb-6 border-b border-stone-200">
          <div className="flex gap-2 items-center">
            <span className="text-xs tracking-widest uppercase text-stone-400">Ano:</span>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="bg-transparent border-b border-stone-300 py-1 text-sm text-stone-700 focus:outline-none focus:border-stone-900 pr-4"
            >
              <option value="all">Todos</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 items-center">
            <span className="text-xs tracking-widest uppercase text-stone-400">Categoria:</span>
            <select
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
              className="bg-transparent border-b border-stone-300 py-1 text-sm text-stone-700 focus:outline-none focus:border-stone-900 pr-4"
            >
              <option value="all">Todas</option>
              {CATEGORY_META.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 items-center">
            <span className="text-xs tracking-widest uppercase text-stone-400">Trimestre:</span>
            <select
              value={filterTri}
              onChange={(e) => setFilterTri(e.target.value)}
              className="bg-transparent border-b border-stone-300 py-1 text-sm text-stone-700 focus:outline-none focus:border-stone-900 pr-4"
            >
              <option value="all">Todos</option>
              {TRIMESTERS.map((trimester) => (
                <option key={trimester} value={trimester}>
                  {TRIMESTER_LABELS[trimester]}
                </option>
              ))}
            </select>
          </div>

          <span className="ml-auto text-xs text-stone-400 self-center">
            {filtered.length} resultado(s)
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-stone-400 text-sm tracking-wide mb-4">Nenhum projeto encontrado</p>
            <Btn
              disabled={years.length === 0}
              onClick={openNewProjectForm}
            >
              + Criar primeiro projeto
            </Btn>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-stone-200">
            {filtered.map((project) => (
              <motion.div
                key={project.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-[#F5F3F0] p-6 flex flex-col gap-3"
              >
                {project.images?.[0] && (
                  <div className="aspect-video bg-stone-100 overflow-hidden mb-2">
                    <img
                      src={project.images[0]}
                      alt={project.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = `https://picsum.photos/seed/${project.id}/400/300`;
                      }}
                    />
                  </div>
                )}

                <div>
                  <p className="text-xs tracking-[0.15em] uppercase text-stone-400 mb-1">
                    {project.year} · {getCategoryLabel(project.categorySlug)} · {TRIMESTER_LABELS[project.trimester] || project.trimester}
                  </p>
                  <h3 className="text-base font-light text-stone-900" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    {project.title}
                  </h3>
                  {project.description && (
                    <p className="text-xs text-stone-500 mt-1 line-clamp-2">{project.description}</p>
                  )}
                </div>

                {project.skills?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {project.skills.slice(0, 3).map((skill) => (
                      <span key={skill} className="text-xs border border-stone-300 px-2 py-0.5 text-stone-500">
                        {skill}
                      </span>
                    ))}
                    {project.skills.length > 3 && (
                      <span className="text-xs text-stone-400">+{project.skills.length - 3}</span>
                    )}
                  </div>
                )}

                <div className="flex gap-3 mt-auto pt-3 border-t border-stone-200">
                  <button
                    type="button"
                    onClick={() => setEditing({ ...project })}
                    className="text-xs tracking-widest uppercase text-stone-500 hover:text-stone-900 transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(project.id)}
                    className="text-xs tracking-widest uppercase text-red-400 hover:text-red-600 transition-colors ml-auto"
                  >
                    Remover
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <AnimatePresence>
        {editing && (
          <ProjectForm
            project={editing}
            onSave={handleSaveProject}
            onCancel={() => setEditing(null)}
            token={token}
            saving={saving}
            years={years}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center px-6"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-white p-8 max-w-sm w-full"
            >
              <h3 className="text-lg font-light mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                Remover projeto?
              </h3>
              <p className="text-sm text-stone-500 mb-6">
                Esta ação fará commits no repositório removendo o projeto do arquivo JSON correspondente.
              </p>
              <div className="flex gap-3">
                <Btn variant="danger" disabled={saving} onClick={() => handleDelete(deleteConfirm)}>
                  {saving ? "Removendo..." : "Confirmar"}
                </Btn>
                <Btn variant="ghost" onClick={() => setDeleteConfirm(null)}>
                  Cancelar
                </Btn>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>{toast && <Toast msg={toast.msg} type={toast.type} />}</AnimatePresence>

      <AnimatePresence>
        {yearToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center px-6"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-white p-8 max-w-sm w-full"
            >
              <h3 className="text-lg font-light mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                Remover ano {yearToDelete}?
              </h3>
              <p className="text-sm text-stone-500 mb-6">
                Todos os arquivos JSON deste ano serão removidos do repositório.
              </p>
              <div className="flex gap-3">
                <Btn variant="danger" disabled={saving} onClick={() => handleDeleteYear(yearToDelete)}>
                  {saving ? "Removendo..." : "Confirmar"}
                </Btn>
                <Btn variant="ghost" onClick={() => setYearToDelete(null)}>
                  Cancelar
                </Btn>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={openNewProjectForm}
        disabled={years.length === 0}
        className="fixed bottom-6 right-6 z-40 w-12 h-12 bg-black text-white text-2xl leading-none flex items-center justify-center border border-black hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Adicionar projeto"
        title="Adicionar projeto"
      >
        +
      </button>
    </div>
  );
}

export default function AdminPage() {
  const [token, setToken] = useState(
    () => sessionStorage.getItem("gh_admin_token") || "",
  );

  function handleLogin(tokenValue) {
    sessionStorage.setItem("gh_admin_token", tokenValue);
    setToken(tokenValue);
  }

  function handleLogout() {
    sessionStorage.removeItem("gh_admin_token");
    setToken("");
  }

  if (!token) return <LoginScreen onLogin={handleLogin} />;
  return <Dashboard token={token} onLogout={handleLogout} />;
}
