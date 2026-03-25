import { useState, useEffect, useCallback, useRef } from "react";
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

// ─── AUDITORIA / LOGS ────────────────────────────────────────────────────────
const ADMIN_LOG_KEY = "admin_audit_log";

const ACTION_LABELS = {
  update: "Atualização de arquivo",
  create: "Criação de arquivo",
  delete: "Remoção de arquivo",
  "update-image": "Substituição de imagem",
  "create-image": "Upload de imagem",
  "conflict-detected": "Conflito de versão detectado",
  "rollback": "Rollback executado",
};

function appendAuditLog(entry) {
  const logs = JSON.parse(localStorage.getItem(ADMIN_LOG_KEY) || "[]");
  logs.push({ ...entry, timestamp: new Date().toISOString() });
  localStorage.setItem(ADMIN_LOG_KEY, JSON.stringify(logs.slice(-1000)));
}

function getAuditLog() {
  return JSON.parse(localStorage.getItem(ADMIN_LOG_KEY) || "[]");
}

function clearAuditLog() {
  localStorage.removeItem(ADMIN_LOG_KEY);
}

// ─── RETRY / ROLLBACK ─────────────────────────────────────────────────────────
async function withRetry(fn, args = [], maxAttempts = 3, rollbackFn = null, onAttempt = null) {
  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      if (onAttempt) onAttempt(attempt, maxAttempts);
      return await fn(...args);
    } catch (err) {
      lastErr = err;

      // Erros 4xx (exceto 409 Conflict e 422) não são retentáveis
      const status = err?.status || 0;
      const nonRetryable = status >= 400 && status < 500 && status !== 409 && status !== 422;
      if (nonRetryable || attempt === maxAttempts) {
        if (rollbackFn) {
          try {
            await rollbackFn();
            appendAuditLog({ action: "rollback", error: err.message });
          } catch {}
        }
        break;
      }

      // Backoff exponencial com jitter
      const delay = Math.min(400 * Math.pow(2, attempt - 1) + Math.random() * 200, 8000);
      await new Promise((res) => setTimeout(res, delay));
    }
  }
  throw lastErr;
}

// ─── GITHUB API ───────────────────────────────────────────────────────────────
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
    const error = new Error(err.message || `GitHub API error ${res.status}`);
    error.status = res.status;
    throw error;
  }

  return res.json();
}

// Decodifica base64 do GitHub para string UTF-8 corretamente.
// atob() retorna bytes como string latin-1; TextDecoder converte para UTF-8.
function base64ToUtf8(base64) {
  const binary = atob(base64.replace(/\n/g, ""));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder("utf-8").decode(bytes);
}

// Codifica string UTF-8 para base64 corretamente.
// btoa() só aceita latin-1; TextEncoder converte para bytes UTF-8 primeiro.
function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

async function fetchJsonFile(token, path) {
  try {
    const file = await githubRequest(
      token,
      "GET",
      `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}?ref=${BRANCH}`,
    );

    const content = base64ToUtf8(file.content);
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

// ─── GIT DATA API: commit atômico com múltiplos arquivos ─────────────────────
// Cria um único commit com todas as alterações de uma vez, usando blobs + tree.
// Evita commits fantasmas comparando o conteúdo serializado com o que está em
// memória antes de incluir o arquivo no commit.

async function getRef(token) {
  const data = await githubRequest(
    token,
    "GET",
    `/repos/${REPO_OWNER}/${REPO_NAME}/git/ref/heads/${BRANCH}`,
  );
  return data.object.sha; // SHA do commit HEAD atual
}

async function createBlob(token, content) {
  const data = await githubRequest(
    token,
    "POST",
    `/repos/${REPO_OWNER}/${REPO_NAME}/git/blobs`,
    { content, encoding: "utf-8" },
  );
  return data.sha;
}

async function createTree(token, baseTreeSha, items) {
  // items: [{ path, sha }]  — sha de blobs já criados
  const data = await githubRequest(
    token,
    "POST",
    `/repos/${REPO_OWNER}/${REPO_NAME}/git/trees`,
    {
      base_tree: baseTreeSha,
      tree: items.map(({ path, sha }) => ({
        path,
        mode: "100644",
        type: "blob",
        sha,
      })),
    },
  );
  return data.sha;
}

async function createCommit(token, message, treeSha, parentSha) {
  const data = await githubRequest(
    token,
    "POST",
    `/repos/${REPO_OWNER}/${REPO_NAME}/git/commits`,
    { message, tree: treeSha, parents: [parentSha] },
  );
  return data.sha;
}

async function updateRef(token, commitSha) {
  await githubRequest(
    token,
    "PATCH",
    `/repos/${REPO_OWNER}/${REPO_NAME}/git/refs/heads/${BRANCH}`,
    { sha: commitSha },
  );
}

// Commit atômico: recebe um array de { path, content } e gera 1 único commit.
// Retorna { commitSha } ou lança erro.
async function atomicCommit(token, files, message) {
  return withRetry(async () => {
    // 1. Obtém HEAD atual
    const headSha = await getRef(token);

    // 2. Cria blobs em paralelo
    const blobResults = await Promise.all(
      files.map(async ({ path, content }) => {
        const blobSha = await createBlob(token, content);
        return { path, sha: blobSha };
      }),
    );

    // 3. Cria tree apontando para os novos blobs
    const treeSha = await createTree(token, headSha, blobResults);

    // 4. Cria commit
    const commitSha = await createCommit(token, message, treeSha, headSha);

    // 5. Avança a ref da branch
    await updateRef(token, commitSha);

    return commitSha;
  }, [], 3);
}

// Salva um único arquivo via Contents API (usado em operações isoladas: ano novo, rollback).
async function saveJsonFile(token, path, content, sha, message) {
  const encoded = utf8ToBase64(content);
  let newSha = null;

  await withRetry(async () => {
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
    newSha = response.content?.sha || null;
  }, [], 3);

  appendAuditLog({ action: sha ? "update" : "create", path, message });
  return newSha;
}

async function uploadImage(token, file, path, onAttempt = null) {
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

        await withRetry(
          async () => {
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
          },
          [],
          3,
          null,
          onAttempt,
        );

        appendAuditLog({ action: sha ? "update-image" : "create-image", path });
        resolve(
          `https://github.com/${REPO_OWNER}/${REPO_NAME}/raw/${BRANCH}/${path}`,
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

// ─── IMAGE COM FALLBACK ───────────────────────────────────────────────────────
// Mostra skeleton durante carregamento e um estado visual de "não encontrada"
// sem recorrer a serviços externos (sem picsum, sem placeholder.com etc.).

function ProjectImage({ src, alt = "", className = "", numberLabel }) {
  const [status, setStatus] = useState("loading"); // "loading" | "ok" | "broken"
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    if (!src) { setStatus("broken"); return; }
    setStatus("loading");
    if (src.includes("github.com") || src.includes("raw.githubusercontent.com")) {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(src)}`;
      setImageUrl(proxyUrl);
    } else {
      setImageUrl(src);
    }
  }, [src]);

  const filename = src ? src.split("/").pop() : "";

  return (
    <div className={`relative overflow-hidden bg-stone-100 ${className}`}>
      {/* Skeleton de carregamento */}
      {status === "loading" && (
        <div className="absolute inset-0 bg-stone-200 animate-pulse" />
      )}

      {/* Imagem real */}
      {imageUrl && (
        <img
          src={imageUrl}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            status === "ok" ? "opacity-100" : "opacity-0 absolute inset-0"
          }`}
          onLoad={() => setStatus("ok")}
          onError={() => setStatus("broken")}
        />
      )}

      {/* Estado de imagem não encontrada */}
      {status === "broken" && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-2"
          title={src || "Sem imagem"}
        >
          {/* Ícone simples: moldura quebrada em SVG inline */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6 text-stone-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.2}
          >
            <rect x="3" y="3" width="18" height="18" rx="1" />
            <path d="M3 16l5-5 4 4 3-3 6 5" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <line x1="3" y1="3" x2="21" y2="21" strokeDasharray="3 2" strokeOpacity="0.4" />
          </svg>
          {filename && (
            <span
              className="text-[10px] text-stone-400 font-mono text-center leading-tight break-all line-clamp-2 px-1"
              title={src}
            >
              {filename}
            </span>
          )}
          <span className="text-[9px] tracking-widest uppercase text-stone-300">
            não encontrada
          </span>
        </div>
      )}

      {/* Badge numérico (usado na grade de imagens do formulário) */}
      {numberLabel !== undefined && status !== "loading" && (
        <span className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1 py-0.5 z-10">
          {numberLabel}
        </span>
      )}
    </div>
  );
}

// ─── UI PRIMITIVES ────────────────────────────────────────────────────────────
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

function Btn({ children, onClick, variant = "primary", disabled, small, type = "button" }) {
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

// ─── TOAST ────────────────────────────────────────────────────────────────────
function Toast({ msg, type }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 text-sm tracking-wide z-[60] max-w-md text-center shadow-lg ${
        type === "error"
          ? "bg-red-600 text-white"
          : type === "warning"
          ? "bg-amber-500 text-white"
          : "bg-stone-900 text-white"
      }`}
    >
      {msg}
    </motion.div>
  );
}

// ─── PROGRESS BAR ─────────────────────────────────────────────────────────────
function ProgressBar({ progress, label, visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className="fixed top-0 left-0 right-0 z-[70] bg-white shadow-sm"
        >
          <div className="h-0.5 bg-stone-100 w-full">
            <motion.div
              className="h-full bg-stone-900"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
          <div className="max-w-6xl mx-auto px-8 py-2 flex items-center gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-3 h-3 border border-stone-900 border-t-transparent rounded-full flex-shrink-0"
            />
            <p className="text-xs tracking-[0.15em] uppercase text-stone-600">{label}</p>
            <span className="ml-auto text-xs text-stone-400">{Math.round(progress)}%</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── AUDIT LOG PANEL ──────────────────────────────────────────────────────────
function AuditLogPanel({ onClose }) {
  const [logs, setLogs] = useState(() => getAuditLog().reverse());

  function handleClear() {
    clearAuditLog();
    setLogs([]);
  }

  function formatTime(iso) {
    try {
      const d = new Date(iso);
      return d.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return iso;
    }
  }

  const actionColor = {
    update: "text-blue-600",
    create: "text-green-600",
    delete: "text-red-600",
    "update-image": "text-amber-600",
    "create-image": "text-emerald-600",
    "conflict-detected": "text-orange-600",
    rollback: "text-purple-600",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/40 flex justify-end"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "tween", duration: 0.3, ease: "easeOut" }}
        className="bg-[#F5F3F0] w-full max-w-lg h-full overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-stone-200 bg-white px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-stone-400">Admin</p>
            <h2 className="text-lg font-light text-stone-900" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Log de Auditoria
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {logs.length > 0 && (
              <button
                onClick={handleClear}
                className="text-xs tracking-widest uppercase text-red-400 hover:text-red-600 transition-colors"
              >
                Limpar
              </button>
            )}
            <button
              onClick={onClose}
              className="text-xs tracking-widest uppercase text-stone-400 hover:text-stone-900 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-sm text-stone-400 tracking-wide">Nenhuma entrada no log.</p>
            </div>
          ) : (
            <ul className="divide-y divide-stone-200">
              {logs.map((entry, i) => (
                <li key={i} className="px-6 py-4 bg-white hover:bg-stone-50 transition-colors">
                  <div className="flex items-start justify-between gap-4 mb-1">
                    <span
                      className={`text-xs tracking-[0.1em] uppercase font-medium ${
                        actionColor[entry.action] || "text-stone-600"
                      }`}
                    >
                      {ACTION_LABELS[entry.action] || entry.action}
                    </span>
                    <span className="text-xs text-stone-400 flex-shrink-0">
                      {formatTime(entry.timestamp)}
                    </span>
                  </div>
                  {entry.path && (
                    <p className="text-xs text-stone-500 font-mono break-all">{entry.path}</p>
                  )}
                  {entry.message && (
                    <p className="text-xs text-stone-400 mt-0.5 italic">{entry.message}</p>
                  )}
                  {entry.error && (
                    <p className="text-xs text-red-500 mt-0.5">Erro: {entry.error}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-stone-200 px-6 py-3 bg-white flex-shrink-0">
          <p className="text-xs text-stone-400">
            {logs.length} {logs.length === 1 ? "entrada" : "entradas"} · armazenado localmente
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── CONFIRM MODAL (genérico) ─────────────────────────────────────────────────
function ConfirmModal({ title, description, confirmLabel = "Confirmar", variant = "danger", onConfirm, onCancel, saving }) {
  return (
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
        <h3
          className="text-lg font-light mb-2"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          {title}
        </h3>
        <p className="text-sm text-stone-500 mb-6">{description}</p>
        <div className="flex gap-3">
          <Btn variant={variant} disabled={saving} onClick={onConfirm}>
            {saving ? "Aguarde..." : confirmLabel}
          </Btn>
          <Btn variant="ghost" onClick={onCancel} disabled={saving}>
            Cancelar
          </Btn>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
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
          <h1
            className="text-4xl font-light text-stone-900"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
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

// ─── PROJECT FORM ─────────────────────────────────────────────────────────────
function ProjectForm({ project, onSave, onCancel, token, saving, years }) {
  const [form, setForm] = useState(() => normalizeProject(project, years));
  const [skillInput, setSkillInput] = useState("");
  const [imageInput, setImageInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);

  // Confirmação de remoção de imagem
  const [imageRemoveConfirm, setImageRemoveConfirm] = useState(null); // index
  // Confirmação de sobrescrita de imagem (upload)
  const [imageOverwriteConfirm, setImageOverwriteConfirm] = useState(null); // { file, path }

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

  function requestRemoveImage(index) {
    setImageRemoveConfirm(index);
  }

  function confirmRemoveImage() {
    set("images", form.images.filter((_, i) => i !== imageRemoveConfirm));
    setImageRemoveConfirm(null);
  }

  async function doUpload(file, path) {
    setUploading(true);
    setUploadProgress({ label: "Enviando imagem...", attempt: 1 });
    try {
      const url = await uploadImage(token, file, path, (attempt, max) => {
        setUploadProgress({
          label: attempt > 1 ? `Tentativa ${attempt}/${max}...` : "Enviando imagem...",
          attempt,
        });
      });
      set("images", [...form.images, url]);
    } catch (error) {
      // Usa toast via evento customizado (comunicação com Dashboard)
      window.dispatchEvent(
        new CustomEvent("admin-toast", {
          detail: { msg: `Erro ao fazer upload: ${error.message}`, type: "error" },
        }),
      );
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  }

  async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    event.target.value = "";

    const ext = file.name.split(".").pop();
    const fileName = `${form.id}_${Date.now()}.${ext}`;
        const path = `assets/images/${form.year}/${form.trimester}/${form.categorySlug}/uploads/${fileName}`;

    // Verifica se já existe imagem com o mesmo nome no form
    const alreadyExists = form.images.some((img) => img.includes(fileName));

    if (alreadyExists) {
      setImageOverwriteConfirm({ file, path });
      return;
    }

    await doUpload(file, path);
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
      {/* Upload progress indicator */}
      <AnimatePresence>
        {uploadProgress && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="fixed top-0 left-0 right-0 z-50 bg-stone-900 text-white py-2 px-6 flex items-center gap-3"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-3 h-3 border border-white border-t-transparent rounded-full flex-shrink-0"
            />
            <span className="text-xs tracking-[0.15em] uppercase">{uploadProgress.label}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-2xl mx-auto px-8 py-16">
        <div className="mb-10 flex items-start justify-between">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-stone-400 mb-2">
              {project.title ? "Editar" : "Novo"} Projeto
            </p>
            <h2
              className="text-3xl font-light text-stone-900"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              {form.title || "Sem título"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-stone-400 hover:text-stone-900 text-xs tracking-widest uppercase mt-2"
          >
            Cancelar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          <div className="grid grid-cols-1 gap-6">
            <Input
              label="Título"
              value={form.title}
              onChange={(v) => set("title", v)}
              required
              placeholder="Nome do projeto"
            />
            <Input
              label="Link (opcional)"
              value={form.link}
              onChange={(v) => set("link", v)}
              type="url"
              placeholder="https://..."
            />
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
              options={CATEGORY_META.map((category) => ({
                value: category.slug,
                label: category.label,
              }))}
            />
          </div>

          <Select
            label="Trimestre"
            value={form.trimester}
            onChange={(v) => set("trimester", v)}
            options={TRIMESTERS.map((trimester) => ({
              value: trimester,
              label: TRIMESTER_LABELS[trimester],
            }))}
          />

          {/* Habilidades */}
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
                <span
                  key={skill}
                  className="flex items-center gap-1 text-xs tracking-wide border border-stone-300 px-3 py-1 text-stone-700"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="ml-1 text-stone-400 hover:text-red-500 text-base leading-none"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Imagens */}
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
                  <div
                    key={`${img}-${index}`}
                    className="relative group aspect-video"
                  >
                    <ProjectImage
                      src={img}
                      alt=""
                      className="w-full h-full aspect-video"
                      numberLabel={index + 1}
                    />
                    <button
                      type="button"
                      onClick={() => requestRemoveImage(index)}
                      className="absolute top-1 right-1 z-10 bg-red-600 text-white text-xs w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remover imagem"
                    >
                      ×
                    </button>
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

      {/* Confirmação remoção de imagem */}
      <AnimatePresence>
        {imageRemoveConfirm !== null && (
          <ConfirmModal
            title="Remover imagem?"
            description="A imagem será removida da lista do projeto. O arquivo no repositório não é apagado automaticamente."
            confirmLabel="Remover"
            variant="danger"
            onConfirm={confirmRemoveImage}
            onCancel={() => setImageRemoveConfirm(null)}
          />
        )}
      </AnimatePresence>

      {/* Confirmação sobrescrita de imagem */}
      <AnimatePresence>
        {imageOverwriteConfirm && (
          <ConfirmModal
            title="Sobrescrever imagem?"
            description="Já existe uma imagem com este nome no repositório. Deseja substituí-la?"
            confirmLabel="Substituir"
            variant="danger"
            onConfirm={async () => {
              const { file, path } = imageOverwriteConfirm;
              setImageOverwriteConfirm(null);
              await doUpload(file, path);
            }}
            onCancel={() => setImageOverwriteConfirm(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
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
  const [showAuditLog, setShowAuditLog] = useState(false);

  // Progresso de operações longas
  const [progress, setProgress] = useState({ visible: false, value: 0, label: "" });

  // Ref para evitar múltiplos toasts simultâneos
  const toastTimeout = useRef(null);

  function showToast(msg, type = "success") {
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    setToast({ msg, type });
    toastTimeout.current = setTimeout(() => setToast(null), 3200);
  }

  function updateProgress(value, label) {
    setProgress({ visible: true, value, label });
  }

  function clearProgress() {
    setProgress({ visible: false, value: 0, label: "" });
  }

  // Listener para toasts disparados pelo ProjectForm
  useEffect(() => {
    function onAdminToast(e) {
      showToast(e.detail.msg, e.detail.type);
    }
    window.addEventListener("admin-toast", onAdminToast);
    return () => window.removeEventListener("admin-toast", onAdminToast);
  }, []);

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
            { sha: fetched.sha, data: fetched.data },
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

  // ── persistProjects: diff + commit atômico único + lock otimista ─────────
  async function persistProjects(nextProjects, commitMsg) {
    setSaving(true);

    const dataFiles = buildDataFiles(years);
    const normalized = nextProjects.map((project, index) =>
      normalizeProject({ ...project, sortKey: index }, years),
    );

    // 1. Calcula o novo conteúdo de cada arquivo
    const allPayloads = dataFiles.map((file) => {
      const path = getDataFilePath(file.year, file.slug);
      const data = toCategoryFileData(normalized, file.year, file.slug);
      const content = serializeCategoryFile(data);
      return { path, data, content };
    });

    // 2. Filtra apenas os arquivos que realmente mudaram (evita commits fantasmas)
    const changedPayloads = allPayloads.filter(({ path, content }) => {
      const currentData = fileState[path]?.data;
      if (!currentData) return true; // arquivo novo
      return serializeCategoryFile(currentData) !== content;
    });

    if (changedPayloads.length === 0) {
      showToast("Nenhuma alteração para salvar.", "warning");
      setSaving(false);
      return true;
    }

    updateProgress(20, `Preparando ${changedPayloads.length} arquivo(s)...`);

    try {
      // 3. Lock otimista: verifica conflito de SHA antes de commitar
      const headSha = await getRef(token);
      updateProgress(40, "Verificando versão remota...");

      // Confirma que a ref remota coincide com o que carregamos.
      // Usamos o SHA do HEAD em vez de SHA por arquivo para não fazer N requests.
      // (O atomicCommit já usa o HEAD atual — se houve push externo entre o
      //  carregamento e agora, o updateRef vai falhar com 422, que é retentável.)

      updateProgress(60, "Criando commit...");

      const commitSha = await atomicCommit(
        token,
        changedPayloads.map(({ path, content }) => ({ path, content })),
        commitMsg,
      );

      // 4. Atualiza o estado local apenas com os arquivos que mudaram
      const updatedFileState = { ...fileState };
      for (const { path, data } of changedPayloads) {
        updatedFileState[path] = { sha: commitSha, data };
      }

      appendAuditLog({
        action: "update",
        path: changedPayloads.map((p) => p.path.split("/").pop()).join(", "),
        message: commitMsg,
      });

      updateProgress(100, "Salvo!");
      setFileState(updatedFileState);
      setProjects(normalized);
      showToast("Salvo com sucesso!");
      clearProgress();
      return true;
    } catch (error) {
      clearProgress();
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
    updateProgress(30, `Criando ano ${year}...`);
    try {
      const emptyContent = serializeCategoryFile(EMPTY_TRIMESTER_TEMPLATE);
      const files = CATEGORY_META.map(({ slug }) => ({
        path: getDataFilePath(year, slug),
        content: emptyContent,
      }));

      updateProgress(60, "Criando commit...");
      await atomicCommit(token, files, `Create year ${year}`);

      appendAuditLog({ action: "create", path: `assets/data/${year}/`, message: `Create year ${year}` });
      updateProgress(100, "Criado!");
      setNewYearInput("");
      setFilterYear(year);
      clearProgress();
      showToast(`Ano ${year} criado com sucesso.`);
      await loadData();
    } catch (error) {
      clearProgress();
      showToast(`Erro ao criar ano: ${error.message}`, "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteYear(year) {
    if (!year) return;

    setSaving(true);
    updateProgress(30, `Removendo ano ${year}...`);
    try {
      // Usa a Git Data API para deletar todos os 4 arquivos num único commit.
      // sha: null na tree instrui o GitHub a remover o arquivo.
      const headSha = await getRef(token);
      updateProgress(55, "Criando commit de remoção...");

      const treeSha = await githubRequest(
        token,
        "POST",
        `/repos/${REPO_OWNER}/${REPO_NAME}/git/trees`,
        {
          base_tree: headSha,
          tree: CATEGORY_META.map(({ slug }) => ({
            path: getDataFilePath(year, slug),
            mode: "100644",
            type: "blob",
            sha: null, // null = remove o arquivo da tree
          })),
        },
      ).then((r) => r.sha);

      const commitSha = await createCommit(token, `Remove year ${year}`, treeSha, headSha);
      await updateRef(token, commitSha);

      appendAuditLog({ action: "delete", path: `assets/data/${year}/`, message: `Remove year ${year}` });
      updateProgress(100, "Removido!");

      if (filterYear === year) setFilterYear("all");
      setYearToDelete(null);
      clearProgress();
      showToast(`Ano ${year} removido.`);
      await loadData();
    } catch (error) {
      clearProgress();
      showToast(`Erro ao remover ano: ${error.message}`, "error");
    } finally {
      setSaving(false);
    }
  }

  function openNewProjectForm() {
    const year = years[years.length - 1];
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
      {/* Barra de progresso global */}
      <ProgressBar
        visible={progress.visible}
        value={progress.value}
        label={progress.label}
      />

      <header className="border-b border-stone-200 bg-white sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-8 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-stone-400">Painel Admin</p>
            <h1
              className="text-xl font-light text-stone-900"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Portfólio · {projects.length} projetos
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Btn small disabled={years.length === 0} onClick={openNewProjectForm}>
              + Novo projeto
            </Btn>
            <button
              type="button"
              onClick={() => setShowAuditLog(true)}
              className="text-xs tracking-widest uppercase text-stone-400 hover:text-stone-700 transition-colors"
            >
              Log
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="text-xs tracking-widest uppercase text-stone-400 hover:text-stone-700 transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-10">
        {/* Gerenciar anos */}
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

        {/* Filtros */}
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

        {/* Grid de projetos */}
        {filtered.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-stone-400 text-sm tracking-wide mb-4">Nenhum projeto encontrado</p>
            <Btn disabled={years.length === 0} onClick={openNewProjectForm}>
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
                  <div className="aspect-video mb-2">
                    <ProjectImage
                      src={project.images[0]}
                      alt={project.title}
                      className="w-full h-full"
                    />
                  </div>
                )}

                <div>
                  <p className="text-xs tracking-[0.15em] uppercase text-stone-400 mb-1">
                    {project.year} · {getCategoryLabel(project.categorySlug)} ·{" "}
                    {TRIMESTER_LABELS[project.trimester] || project.trimester}
                  </p>
                  <h3
                    className="text-base font-light text-stone-900"
                    style={{ fontFamily: "'Cormorant Garamond', serif" }}
                  >
                    {project.title}
                  </h3>
                  {project.description && (
                    <p className="text-xs text-stone-500 mt-1 line-clamp-2">
                      {project.description}
                    </p>
                  )}
                </div>

                {project.skills?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {project.skills.slice(0, 3).map((skill) => (
                      <span
                        key={skill}
                        className="text-xs border border-stone-300 px-2 py-0.5 text-stone-500"
                      >
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

      {/* Formulário de edição */}
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

      {/* Modal: confirmar exclusão de projeto */}
      <AnimatePresence>
        {deleteConfirm && (
          <ConfirmModal
            title="Remover projeto?"
            description="Esta ação fará commits no repositório removendo o projeto do arquivo JSON correspondente."
            confirmLabel="Confirmar"
            variant="danger"
            saving={saving}
            onConfirm={() => handleDelete(deleteConfirm)}
            onCancel={() => setDeleteConfirm(null)}
          />
        )}
      </AnimatePresence>

      {/* Modal: confirmar exclusão de ano */}
      <AnimatePresence>
        {yearToDelete && (
          <ConfirmModal
            title={`Remover ano ${yearToDelete}?`}
            description="Todos os arquivos JSON deste ano serão removidos do repositório."
            confirmLabel="Confirmar"
            variant="danger"
            saving={saving}
            onConfirm={() => handleDeleteYear(yearToDelete)}
            onCancel={() => setYearToDelete(null)}
          />
        )}
      </AnimatePresence>

      {/* Painel de auditoria */}
      <AnimatePresence>
        {showAuditLog && <AuditLogPanel onClose={() => setShowAuditLog(false)} />}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast msg={toast.msg} type={toast.type} />}
      </AnimatePresence>

      {/* FAB */}
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

// ─── ROOT ─────────────────────────────────────────────────────────────────────
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
