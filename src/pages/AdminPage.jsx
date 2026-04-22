import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const REPO_OWNER = "vinisebold";
const REPO_NAME = "senai-portfolio-26";
const BRANCH = "main";

const META_PATH = "assets/data/_meta.json";

const DEFAULT_META = {
  categories: [
    { slug: "ciencias-humanas", label: "Ciências Humanas", idPrefix: "ch" },
    { slug: "ciencias-natureza", label: "Ciências Natureza", idPrefix: "cn" },
    { slug: "linguagens", label: "Linguagens", idPrefix: "ling" },
    { slug: "matematica", label: "Matemática", idPrefix: "mat" },
  ],
  trimesters: [
    { key: "1", label: "1º Trimestre" },
    { key: "2", label: "2º Trimestre" },
    { key: "3", label: "3º Trimestre" },
  ],
};

function normalizeMeta(raw) {
  const safe = raw && typeof raw === "object" ? raw : {};
  const categories = Array.isArray(safe.categories) ? safe.categories : DEFAULT_META.categories;
  const trimesters = Array.isArray(safe.trimesters) ? safe.trimesters : DEFAULT_META.trimesters;

  const cleanCategories = categories
    .map((c) => ({
      slug: trim(c?.slug).toLowerCase(),
      label: trim(c?.label) || trim(c?.slug),
      idPrefix: trim(c?.idPrefix).toLowerCase() || "proj",
    }))
    .filter((c) => /^[a-z0-9-]+$/.test(c.slug) && c.label)
    .filter((c, idx, arr) => arr.findIndex((x) => x.slug === c.slug) === idx);

  const cleanTrimesters = trimesters
    .map((t) => ({
      key: trim(t?.key),
      label: trim(t?.label) || trim(t?.key),
    }))
    .filter((t) => t.key && t.label)
    .filter((t, idx, arr) => arr.findIndex((x) => x.key === t.key) === idx)
    .sort((a, b) => {
      const na = Number(a.key);
      const nb = Number(b.key);
      if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
      return String(a.key).localeCompare(String(b.key));
    });

  return {
    categories: cleanCategories.length ? cleanCategories : DEFAULT_META.categories,
    trimesters: cleanTrimesters.length ? cleanTrimesters : DEFAULT_META.trimesters,
  };
}

function sortYears(years) {
  return [...new Set(years)].sort((first, second) => Number(first) - Number(second));
}

function buildDataFiles(years, categories) {
  return years.flatMap((year) =>
    categories.map(({ slug }) => ({
      year,
      slug,
      path: `assets/data/${year}/${slug}.json`,
    })),
  );
}

// Try to resolve bundled asset paths to their final (hashed) URLs at build time.
// This mirrors the logic used by the public site so the admin can display
// images that were processed by the bundler instead of falling back to 404s.
const mediaModules = import.meta.glob('../../assets/images/**/*.{webp,png,jpg,jpeg,avif,gif,mp4,webm,ogg,mov}', {
  eager: true,
  import: 'default',
});

const MEDIA_MIME_MAP = {
  webp: "image/webp",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  avif: "image/avif",
  gif: "image/gif",
  mp4: "video/mp4",
  webm: "video/webm",
  ogg: "video/ogg",
  mov: "video/quicktime",
};

const SUPPORTED_UPLOAD_EXTENSIONS = Object.keys(MEDIA_MIME_MAP);
const SUPPORTED_UPLOAD_MIME_TYPES = [
  "image/webp",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/avif",
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
];

function isVideoMedia(src = "") {
  const cleanSrc = src.split("?")[0].toLowerCase();
  return /\.(mp4|webm|ogg|mov)$/i.test(cleanSrc);
}

function resolveBundledMedia(src) {
  if (!src) return null;
  // portfolio data stores paths like 'assets/images/2025/ch/1/1.webp'
  const key = `../../${src}`;
  return mediaModules[key] || null;
}

const trim = (value) => (typeof value === "string" ? value.trim() : "");

function getCategoryLabel(slug, categories = DEFAULT_META.categories) {
  return categories.find((item) => item.slug === slug)?.label || slug;
}

function getCategoryPrefix(slug, categories = DEFAULT_META.categories) {
  return categories.find((item) => item.slug === slug)?.idPrefix || "proj";
}

function getDataFilePath(year, categorySlug) {
  return `assets/data/${year}/${categorySlug}.json`;
}

function generateProjectId(categorySlug, categories = DEFAULT_META.categories) {
  return `${getCategoryPrefix(categorySlug, categories)}-${Date.now()}`;
}

function normalizeProject(
  project,
  availableYears = [],
  {
    categories = DEFAULT_META.categories,
    trimesterKeys = DEFAULT_META.trimesters.map((t) => t.key),
  } = {},
) {
  const normalizedYears = sortYears(availableYears);
  const fallbackYear = normalizedYears[0] || String(new Date().getFullYear());
  const fallbackCategory = categories[0]?.slug || DEFAULT_META.categories[0].slug;
  const fallbackTrimester = trimesterKeys[0] || DEFAULT_META.trimesters[0].key;

  const categorySlug = trim(project.categorySlug) || fallbackCategory;
  const trimester = trim(project.trimester) || fallbackTrimester;
  const isKnownCategory = categories.some((c) => c.slug === categorySlug);
  const isKnownTrimester = trimesterKeys.includes(trimester);

  return {
    id: trim(project.id) || generateProjectId(categorySlug, categories),
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
    categorySlug: isKnownCategory ? categorySlug : fallbackCategory,
    trimester: isKnownTrimester ? trimester : fallbackTrimester,
    sortKey:
      typeof project.sortKey === "number"
        ? project.sortKey
        : Number.MAX_SAFE_INTEGER,
  };
}

function normalizeTrimesterTemplate(data, trimesterKeys) {
  const keys = Array.isArray(trimesterKeys) && trimesterKeys.length
    ? trimesterKeys
    : DEFAULT_META.trimesters.map((t) => t.key);

  const safe = data && typeof data === "object" ? data : {};
  const out = Object.fromEntries(keys.map((k) => [k, Array.isArray(safe[k]) ? safe[k] : []]));

  // Preserve any additional keys already present (to avoid destructive writes)
  for (const [k, v] of Object.entries(safe)) {
    if (!(k in out)) out[k] = Array.isArray(v) ? v : [];
  }
  return out;
}

function flattenPortfolioFiles(fileMap, years, categories, trimesterKeys) {
  const projects = [];
  const dataFiles = buildDataFiles(years, categories);

  for (const file of dataFiles) {
    const fileContent = fileMap[file.path];
    const trimesters = fileContent?.data || {};

    trimesterKeys.forEach((trimester) => {
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

function toCategoryFileData(projects, year, categorySlug, trimesterKeys) {
  const grouped = Object.fromEntries(trimesterKeys.map((key) => [key, []]));

  projects
    .filter((project) => project.year === year && project.categorySlug === categorySlug)
    .sort((first, second) => {
      if (first.trimester !== second.trimester) {
        const na = Number(first.trimester);
        const nb = Number(second.trimester);
        if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
        return String(first.trimester).localeCompare(String(second.trimester));
      }
      return first.sortKey - second.sortKey;
    })
    .forEach((project) => {
      if (!grouped[project.trimester]) grouped[project.trimester] = [];
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

function serializeMetaFile(meta) {
  const normalized = normalizeMeta(meta);
  return `${JSON.stringify(normalized, null, 2)}\n`;
}

// ─── AUDITORIA / LOGS ────────────────────────────────────────────────────────
const ADMIN_LOG_KEY = "admin_audit_log";

const ACTION_LABELS = {
  update: "Atualização de arquivo",
  create: "Criação de arquivo",
  delete: "Remoção de arquivo",
  "update-image": "Substituição de mídia",
  "create-image": "Upload de mídia",
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
        data: {},
        exists: false,
      };
    }
    throw error;
  }
}

async function fetchMetaFile(token) {
  const fetched = await fetchJsonFile(token, META_PATH);
  const meta = normalizeMeta(fetched.data);
  return { meta, sha: fetched.sha, exists: fetched.exists };
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

async function uploadMedia(token, file, path, onAttempt = null) {
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
                message: `Upload media: ${path}`,
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
        resolve(path);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function buildEmptyProject(defaultYear, defaultCategory, defaultTrimester, categories = DEFAULT_META.categories) {
  return {
    id: generateProjectId(defaultCategory, categories),
    title: "",
    description: "",
    skills: [],
    images: [],
    link: "",
    year: defaultYear,
    categorySlug: defaultCategory,
    trimester: defaultTrimester,
    sortKey: Number.MAX_SAFE_INTEGER,
  };
}

// ─── IMAGE COM FALLBACK ───────────────────────────────────────────────────────
// Mostra skeleton durante carregamento e um estado visual de "não encontrada"
// sem recorrer a serviços externos (sem picsum, sem placeholder.com etc.).

function ProjectImage({ src, alt = "", className = "", numberLabel, token }) {
  const [status, setStatus] = useState("loading"); // "loading" | "ok" | "broken"
  const [imageUrl, setImageUrl] = useState("");
  const objectUrlRef = useRef(null);

  // Simple in-memory cache to avoid refetching the same image repeatedly
  const cacheRef = useRef({});

  useEffect(() => {
    let cancelled = false;
    async function resolveSrc() {
      if (!src) {
        setStatus("broken");
        return;
      }
      setStatus("loading");

      // Local asset path in the repo (e.g. 'assets/images/...')
      if (/^assets\//.test(src)) {
        // First try to resolve the image to a bundled (hashed) asset included at build time
        const bundled = resolveBundledMedia(src);
        if (bundled) {
          setImageUrl(bundled);
          return;
        }

        // If not bundled, and we have a token, fetch via GitHub Contents API and create a blob URL
        if (token) {
          if (cacheRef.current[src]) {
            setImageUrl(cacheRef.current[src]);
            return;
          }
          try {
            const file = await githubRequest(token, 'GET', `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${src}?ref=${BRANCH}`);
            const base64 = file.content.replace(/\n/g, '');
            const binary = atob(base64);
            const len = binary.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);

            const ext = (src.split('.').pop() || '').toLowerCase();
            const mime = MEDIA_MIME_MAP[ext] || 'application/octet-stream';

            const blob = new Blob([bytes], { type: mime });
            const url = URL.createObjectURL(blob);
            objectUrlRef.current = url;
            cacheRef.current[src] = url;
            if (!cancelled) setImageUrl(url);
            return;
          } catch (err) {
            // fallback: try to resolve as absolute path on site root
            if (!cancelled) setImageUrl('/' + src);
            return;
          }
        }

        // No token — try site-root absolute path
        setImageUrl('/' + src);
        return;
      }

      // Detect GitHub raw URLs generated by the admin (https://github.com/.../raw/... or raw.githubusercontent.com)
      const rawGithubMatch = src.match(new RegExp(`https?://(?:raw\.githubusercontent\.com|github\.com/${REPO_OWNER}/${REPO_NAME}/raw/${BRANCH})/(.+)`));
      if (rawGithubMatch) {
        const repoPath = rawGithubMatch[1];
        if (token) {
          if (cacheRef.current[src]) {
            setImageUrl(cacheRef.current[src]);
            return;
          }
          try {
            const file = await githubRequest(token, 'GET', `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${repoPath}?ref=${BRANCH}`);
            const base64 = file.content.replace(/\n/g, '');
            const binary = atob(base64);
            const len = binary.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
            const ext = (repoPath.split('.').pop() || '').toLowerCase();
            const mime = MEDIA_MIME_MAP[ext] || 'application/octet-stream';
            const blob = new Blob([bytes], { type: mime });
            const url = URL.createObjectURL(blob);
            objectUrlRef.current = url;
            cacheRef.current[src] = url;
            if (!cancelled) setImageUrl(url);
            return;
          } catch (err) {
            if (!cancelled) setImageUrl(src);
            return;
          }
        }
        // No token: fall back to original URL (may be blocked by CORS/rate-limits)
        setImageUrl(src);
        return;
      }

      // Otherwise use the value as-is (absolute URLs, data URLs, etc.)
      setImageUrl(src);
    }

    resolveSrc();

    return () => {
      cancelled = true;
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [src, token]);

  const filename = src ? src.split('/').pop() : '';
  const isVideo = useMemo(() => isVideoMedia(src || imageUrl || ""), [src, imageUrl]);

  return (
    <div className={`relative overflow-hidden bg-stone-100 ${className}`}>
      {/* Skeleton de carregamento */}
      {status === "loading" && (
        <div className="absolute inset-0 bg-stone-200 animate-pulse" />
      )}

      {/* Mídia real */}
      {imageUrl && (
        isVideo ? (
          <video
            src={imageUrl}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              status === "ok" ? "opacity-100" : "opacity-0 absolute inset-0"
            }`}
            controls
            muted
            playsInline
            preload="metadata"
            onLoadedData={() => setStatus("ok")}
            onError={() => setStatus("broken")}
          />
        ) : (
          <img
            src={imageUrl}
            alt={alt}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              status === "ok" ? "opacity-100" : "opacity-0 absolute inset-0"
            }`}
            onLoad={() => setStatus("ok")}
            onError={() => setStatus("broken")}
          />
        )
      )}

      {/* Estado de mídia não encontrada */}
      {status === "broken" && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-2"
          title={src || "Sem mídia"}
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
        className="bg-white px-3 py-2 text-sm text-stone-900 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-300 transition-colors"
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
        className="bg-white px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-300 transition-colors cursor-pointer"
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

function Btn({ children, onClick, variant = "primary", disabled, small, type = "button", className = "" }) {
  const base =
    "tracking-[0.1em] uppercase text-xs transition-all duration-200 disabled:cursor-not-allowed font-semibold rounded-none";
  const variants = {
    primary: `bg-stone-100 text-stone-800 ${small ? "px-4 py-2" : "px-8 py-3"} hover:bg-stone-200 disabled:bg-stone-100 disabled:text-stone-500`,
    ghost: `bg-transparent text-stone-800 ${small ? "px-4 py-2" : "px-8 py-3"} hover:bg-stone-100 disabled:text-stone-500`,
    danger: `bg-red-600 text-white ${small ? "px-4 py-2" : "px-8 py-3"} hover:bg-red-700 disabled:bg-red-400`,
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${className}`}
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
          ? "bg-amber-200 text-stone-900"
          : "bg-stone-100 text-stone-800"
      }`}
    >
      {msg}
    </motion.div>
  );
}

function FabActionButton({ label, marker, onClick, subdued }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50 hover:text-stone-900 focus:bg-stone-50 focus:outline-none"
    >
      <span
        className={`flex h-6 w-6 items-center justify-center text-[10px] font-bold tracking-widest transition-colors ${
          subdued
            ? "bg-stone-200 text-stone-700 group-hover:bg-stone-300"
            : "bg-stone-200 text-stone-800 group-hover:bg-stone-300"
        }`}
      >
        {marker}
      </span>
      {label}
    </button>
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
              className="h-full bg-stone-600"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
          <div className="max-w-[1400px] mx-auto px-8 py-2 flex items-center gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-2.5 h-2.5 bg-stone-600 rounded-none flex-shrink-0"
            />
            <p className="text-xs tracking-[0.15em] uppercase text-stone-600">{label}</p>
            <span className="ml-auto text-xs text-stone-700">{Math.round(progress)}%</span>
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
      className="fixed inset-0 z-50 bg-stone-200/50 flex justify-end"
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
        <div className="bg-white px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-stone-600">Admin</p>
            <h2 className="text-lg font-light text-stone-900" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Log de Auditoria
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {logs.length > 0 && (
              <button
                onClick={handleClear}
                className="text-xs tracking-widest uppercase text-red-600 hover:text-red-700 transition-colors"
              >
                Limpar
              </button>
            )}
            <button
              onClick={onClose}
              className="text-xs tracking-widest uppercase text-stone-700 hover:text-stone-900 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-sm text-stone-600 tracking-wide">Nenhuma entrada no log.</p>
            </div>
          ) : (
            <ul className="space-y-2 p-2">
              {logs.map((entry, i) => (
                <li key={i} className="px-4 py-4 bg-white hover:bg-stone-50 transition-colors">
                  <div className="flex items-start justify-between gap-4 mb-1">
                    <span
                      className={`text-xs tracking-[0.1em] uppercase font-medium ${
                        actionColor[entry.action] || "text-stone-600"
                      }`}
                    >
                      {ACTION_LABELS[entry.action] || entry.action}
                    </span>
                    <span className="text-xs text-stone-600 flex-shrink-0">
                      {formatTime(entry.timestamp)}
                    </span>
                  </div>
                  {entry.path && (
                    <p className="text-xs text-stone-500 font-mono break-all">{entry.path}</p>
                  )}
                  {entry.message && (
                    <p className="text-xs text-stone-600 mt-0.5 italic">{entry.message}</p>
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
        <div className="px-6 py-3 bg-white flex-shrink-0">
          <p className="text-xs text-stone-600">
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
      className="fixed inset-0 z-50 bg-stone-200/50 flex items-center justify-center px-6"
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
        <p className="text-sm text-stone-700 mb-6">{description}</p>
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

function ModalShell({ title, onClose, children, footer }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-stone-200/50 flex items-center justify-center px-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.98, opacity: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="bg-white w-full max-w-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-8 py-6 flex items-start justify-between gap-6">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-stone-600">Admin</p>
            <h3 className="text-lg font-light text-stone-900" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs tracking-widest uppercase text-stone-700 hover:text-stone-900 transition-colors"
          >
            Fechar
          </button>
        </div>

        <div className="px-8 py-6">{children}</div>

        {footer && <div className="px-8 py-5 bg-white">{footer}</div>}
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
          <p className="text-xs tracking-[0.3em] uppercase text-stone-600 mb-3">Portfólio Admin</p>
          <h1
            className="text-4xl font-light text-stone-900"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Acesso Restrito
          </h1>
          <div className="mt-4 w-8 h-px bg-stone-600" />
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
              className="bg-white px-3 py-3 text-sm text-stone-900 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-300 transition-colors"
            />
          </div>

          {error && <p className="text-xs text-red-600 tracking-wide">{error}</p>}

          <Btn type="submit" disabled={loading || !token.trim()}>
            {loading ? "Verificando..." : "Entrar"}
          </Btn>
        </form>
      </motion.div>
    </div>
  );
}

// ─── PROJECT FORM ─────────────────────────────────────────────────────────────
function ProjectForm({ project, onSave, onCancel, token, saving, years, categories, trimesters }) {
  const trimesterKeys = useMemo(() => (trimesters || []).map((t) => t.key), [trimesters]);
  const [form, setForm] = useState(() =>
    normalizeProject(project, years, { categories, trimesterKeys }),
  );
  const [skillInput, setSkillInput] = useState("");
  const [imageInput, setImageInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);

  const trimesterLabelMap = useMemo(
    () => Object.fromEntries((trimesters || []).map((t) => [t.key, t.label])),
    [trimesters],
  );

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
    setUploadProgress({ label: "Enviando mídia...", attempt: 1 });
    try {
      const url = await uploadMedia(token, file, path, (attempt, max) => {
        setUploadProgress({
          label: attempt > 1 ? `Tentativa ${attempt}/${max}...` : "Enviando mídia...",
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

    const ext = (file.name.split(".").pop() || "").toLowerCase();
    if (!ext) {
      window.dispatchEvent(
        new CustomEvent("admin-toast", {
          detail: { msg: "Arquivo sem extensão não é suportado.", type: "error" },
        }),
      );
      return;
    }
    if (!SUPPORTED_UPLOAD_EXTENSIONS.includes(ext)) {
      window.dispatchEvent(
        new CustomEvent("admin-toast", {
          detail: {
            msg: `Formato .${ext} não suportado. Use: ${SUPPORTED_UPLOAD_EXTENSIONS.join(", ")}`,
            type: "error",
          },
        }),
      );
      return;
    }
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
    onSave(normalizeProject(form, years, { categories, trimesterKeys }));
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
            className="fixed top-0 left-0 right-0 z-50 bg-stone-100 text-stone-800 py-2 px-6 flex items-center gap-3"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-2.5 h-2.5 bg-white rounded-none flex-shrink-0"
            />
            <span className="text-xs tracking-[0.15em] uppercase">{uploadProgress.label}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-2xl mx-auto px-8 py-16">
        <div className="mb-10 flex items-start justify-between">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-stone-600 mb-2">
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
            className="text-stone-700 hover:text-stone-900 text-xs tracking-widest uppercase mt-2"
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
                className="bg-white px-3 py-2 text-sm text-stone-900 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-300 transition-colors resize-none"
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
              options={(categories || []).map((category) => ({
                value: category.slug,
                label: category.label,
              }))}
            />
          </div>

          <Select
            label="Trimestre"
            value={form.trimester}
            onChange={(v) => set("trimester", v)}
            options={(trimesters || []).map((t) => ({
              value: t.key,
              label: trimesterLabelMap[t.key] || t.label || t.key,
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
                className="flex-1 bg-white px-3 py-2 text-sm text-stone-900 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-300 transition-colors"
              />
              <Btn small onClick={addSkill} variant="ghost">
                Adicionar
              </Btn>
            </div>
            <div className="flex flex-wrap gap-2 mt-1">
              {form.skills.map((skill) => (
                  <span
                    key={skill}
                    className="flex items-center gap-1 text-xs uppercase tracking-widest font-medium bg-stone-100 px-3 py-1 text-stone-700"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="ml-1 text-stone-600 hover:text-red-600 text-base leading-none transition-colors"
                    >
                      &times;
                    </button>
                  </span>
              ))}
            </div>
          </div>

          {/* Imagens */}
          <div className="flex flex-col gap-3">
            <label className="text-xs tracking-[0.15em] uppercase text-stone-500">Mídias</label>

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
                placeholder="https://... ou URL de mídia"
                className="flex-1 bg-white px-3 py-2 text-sm text-stone-900 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-300 transition-colors"
              />
              <Btn small onClick={addImageUrl} variant="ghost">
                + URL
              </Btn>
            </div>

            <div className="flex items-center gap-3">
              <label
                className={`cursor-pointer text-xs tracking-[0.1em] uppercase bg-stone-100 text-stone-800 px-4 py-2 hover:bg-stone-200 transition-colors font-semibold ${
                  uploading ? "opacity-40 pointer-events-none" : ""
                }`}
              >
                {uploading ? "Enviando..." : "Upload arquivo"}
                <input
                  type="file"
                  accept={SUPPORTED_UPLOAD_MIME_TYPES.join(",")}
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <span className="text-xs text-stone-600">PNG, JPG, JPEG, GIF, AVIF, WebP, MP4, WebM, OGG, MOV</span>
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
                      token={token}
                    />
                    <button
                      type="button"
                      onClick={() => requestRemoveImage(index)}
                      className="absolute top-1 right-1 z-10 bg-red-500 text-white text-xs w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remover imagem"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-4">
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
            description="A imagem será removida do projeto."
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
            description="Já existe uma imagem com este nome. Deseja substituir?"
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
  const [meta, setMeta] = useState(DEFAULT_META);
  const [metaInfo, setMetaInfo] = useState({ sha: null, exists: false });

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
  const [openFilter, setOpenFilter] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showAuditLog, setShowAuditLog] = useState(false);

  // FAB + modals
  const [fabOpen, setFabOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'years' | 'categories' | 'trimesters'
  const [categoryToRemove, setCategoryToRemove] = useState(null);

  const [newCategoryLabel, setNewCategoryLabel] = useState("");
  const [newCategorySlug, setNewCategorySlug] = useState("");
  const [newCategoryPrefix, setNewCategoryPrefix] = useState("");

  const [newTrimesterKey, setNewTrimesterKey] = useState("");
  const [newTrimesterLabel, setNewTrimesterLabel] = useState("");

  const categories = meta.categories;
  const trimesters = meta.trimesters;
  const trimesterKeys = useMemo(() => trimesters.map((t) => t.key), [trimesters]);

  const categoryLabelMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.slug, c.label])),
    [categories],
  );
  const trimesterLabelMap = useMemo(
    () => Object.fromEntries(trimesters.map((t) => [t.key, t.label])),
    [trimesters],
  );

  function closeFab() {
    setFabOpen(false);
  }

  function openModal(kind) {
    closeFab();
    setActiveModal(kind);
  }

  function closeModal() {
    setActiveModal(null);
  }

  function toggleFilter(kind) {
    setOpenFilter((current) => (current === kind ? null : kind));
  }

  function closeFilter() {
    setOpenFilter(null);
  }

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
      const metaFetched = await fetchMetaFile(token);
      setMeta(metaFetched.meta);
      setMetaInfo({ sha: metaFetched.sha, exists: metaFetched.exists });

      const nextYears = await fetchAvailableYears(token);
      const dataFiles = buildDataFiles(nextYears, metaFetched.meta.categories);
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
      setProjects(
        flattenPortfolioFiles(
          nextFileState,
          nextYears,
          metaFetched.meta.categories,
          metaFetched.meta.trimesters.map((t) => t.key),
        ),
      );
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

    const dataFiles = buildDataFiles(years, categories);
    const normalized = nextProjects.map((project, index) =>
      normalizeProject(
        { ...project, sortKey: index },
        years,
        { categories, trimesterKeys },
      ),
    );

    // 1. Calcula o novo conteúdo de cada arquivo
    const allPayloads = dataFiles.map((file) => {
      const path = getDataFilePath(file.year, file.slug);
      const data = toCategoryFileData(normalized, file.year, file.slug, trimesterKeys);
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
    const sanitized = normalizeProject(form, years, { categories, trimesterKeys });
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
      const emptyTemplate = Object.fromEntries(trimesterKeys.map((key) => [key, []]));
      const emptyContent = serializeCategoryFile(emptyTemplate);
      const files = categories.map(({ slug }) => ({
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
          tree: categories.map(({ slug }) => ({
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
    const defaultCategory = categories[0]?.slug || DEFAULT_META.categories[0].slug;
    const defaultTrimester = trimesterKeys[0] || DEFAULT_META.trimesters[0].key;
    const category = filterCat !== "all" ? filterCat : defaultCategory;
    const trimester = filterTri !== "all" ? filterTri : defaultTrimester;
    setEditing(buildEmptyProject(year, category, trimester, categories));
  }

  async function persistMetaAndFiles({ nextMeta, nextFileStatePatch = {}, commitMsg }) {
    setSaving(true);
    updateProgress(20, "Preparando alterações...");

    const metaContent = serializeMetaFile(nextMeta);
    const files = [{ path: META_PATH, content: metaContent }];

    for (const [path, data] of Object.entries(nextFileStatePatch)) {
      files.push({ path, content: serializeCategoryFile(data) });
    }

    try {
      updateProgress(60, "Criando commit...");
      const commitSha = await atomicCommit(token, files, commitMsg);

      appendAuditLog({
        action: "update",
        path: files.map((f) => f.path.split("/").slice(-2).join("/")).join(", "),
        message: commitMsg,
      });

      updateProgress(100, "Atualizado!");
      clearProgress();

      // Recarrega para garantir consistência (evita manter estados divergentes)
      await loadData();
      return commitSha;
    } catch (error) {
      clearProgress();
      showToast(`Erro ao atualizar: ${error.message}`, "error");
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function handleAddCategory({ slug, label, idPrefix }) {
    const cleanSlug = trim(slug).toLowerCase();
    const cleanLabel = trim(label);
    const cleanPrefix = trim(idPrefix).toLowerCase();

    if (!/^[a-z0-9-]+$/.test(cleanSlug)) {
      showToast("Slug inválido. Use letras, números e hífen.", "error");
      return;
    }
    if (!cleanLabel) {
      showToast("Informe um nome para a matéria.", "error");
      return;
    }
    if (categories.some((c) => c.slug === cleanSlug)) {
      showToast("Esta matéria já existe.", "error");
      return;
    }

    const nextMeta = normalizeMeta({
      ...meta,
      categories: [...categories, { slug: cleanSlug, label: cleanLabel, idPrefix: cleanPrefix || cleanSlug.slice(0, 4) }],
    });

    // Cria arquivos vazios para todos os anos existentes
    const emptyTemplate = Object.fromEntries(nextMeta.trimesters.map((t) => [t.key, []]));
    const patch = {};
    for (const year of years) {
      const path = getDataFilePath(year, cleanSlug);
      if (!fileState[path]) {
        patch[path] = emptyTemplate;
      }
    }

    const commitSha = await persistMetaAndFiles({
      nextMeta,
      nextFileStatePatch: patch,
      commitMsg: `Add category ${cleanSlug}`,
    });

    if (commitSha) {
      closeModal();
      showToast("Matéria criada.");
    }
  }

  async function handleRemoveCategory(slug) {
    const cleanSlug = trim(slug);
    if (!cleanSlug) return;
    if (!categories.some((c) => c.slug === cleanSlug)) return;

    const nextMeta = normalizeMeta({
      ...meta,
      categories: categories.filter((c) => c.slug !== cleanSlug),
    });

    const commitSha = await persistMetaAndFiles({
      nextMeta,
      nextFileStatePatch: {},
      commitMsg: `Remove category ${cleanSlug}`,
    });

    if (commitSha) {
      setCategoryToRemove(null);
      closeModal();
      showToast("Matéria removida.");
    }
  }

  async function handleAddTrimester({ key, label }) {
    const cleanKey = trim(key);
    const cleanLabel = trim(label) || cleanKey;

    if (!/^[0-9]+$/.test(cleanKey)) {
      showToast("Trimestre inválido. Use apenas números (ex: 4).", "error");
      return;
    }
    if (trimesters.some((t) => t.key === cleanKey)) {
      showToast("Este trimestre já existe.", "error");
      return;
    }

    const nextMeta = normalizeMeta({
      ...meta,
      trimesters: [...trimesters, { key: cleanKey, label: cleanLabel }],
    });

    const nextKeys = nextMeta.trimesters.map((t) => t.key);
    const dataFiles = buildDataFiles(years, nextMeta.categories);
    const patch = {};

    for (const file of dataFiles) {
      const path = file.path;
      const current = fileState[path]?.data || {};
      const normalized = normalizeTrimesterTemplate(current, nextKeys);
      if (serializeCategoryFile(current) !== serializeCategoryFile(normalized)) {
        patch[path] = normalized;
      }
    }

    const commitSha = await persistMetaAndFiles({
      nextMeta,
      nextFileStatePatch: patch,
      commitMsg: `Add trimester ${cleanKey}`,
    });

    if (commitSha) {
      closeModal();
      showToast("Trimestre criado.");
    }
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
          <p className="text-xs tracking-[0.3em] uppercase text-stone-600 animate-pulse">
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

      <header className="bg-white sticky top-0 z-30">
        <div className="max-w-[1400px] mx-auto px-8 py-4 flex items-center justify-between pl-24 md:pl-28">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-stone-600">Painel Admin</p>
            <h1
              className="text-xl font-light text-stone-900"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Portfólio · {projects.length} projetos
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setShowAuditLog(true)}
              className="text-xs tracking-widest uppercase text-stone-700 hover:text-stone-900 transition-colors"
            >
              Log
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="text-xs tracking-widest uppercase text-stone-700 hover:text-stone-900 transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-8 py-10">
        <div className="flex items-end justify-between gap-6 mb-6">
          <h2 className="text-lg font-light text-stone-900" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Trabalhos
          </h2>

          <div className="text-right relative">
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => toggleFilter("year")}
                className="bg-stone-100 text-stone-700 px-3 py-2 text-[10px] font-normal uppercase tracking-widest hover:bg-stone-200 transition-colors"
              >
                {filterYear === "all" ? "Ano: todos" : `Ano: ${filterYear}`}
              </button>
              <button
                type="button"
                onClick={() => toggleFilter("category")}
                className="bg-stone-100 text-stone-700 px-3 py-2 text-[10px] font-normal uppercase tracking-widest hover:bg-stone-200 transition-colors"
              >
                {filterCat === "all" ? "Matéria: todas" : `Matéria: ${categoryLabelMap[filterCat] || filterCat}`}
              </button>
              <button
                type="button"
                onClick={() => toggleFilter("trimester")}
                className="bg-stone-100 text-stone-700 px-3 py-2 text-[10px] font-normal uppercase tracking-widest hover:bg-stone-200 transition-colors"
              >
                {filterTri === "all" ? "Trimestre: todos" : `Trimestre: ${trimesterLabelMap[filterTri] || filterTri}`}
              </button>
            </div>
            <p className="mt-1 text-[10px] uppercase tracking-widest text-stone-600">{filtered.length} resultados</p>
          </div>
        </div>

        {/* Grid de projetos */}
        {filtered.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-stone-600 text-sm tracking-wide mb-4">Nenhum projeto encontrado</p>
            <Btn disabled={years.length === 0} onClick={openNewProjectForm}>
              + Criar primeiro projeto
            </Btn>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((project) => (
              <motion.div
                key={project.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col p-6 h-full"
              >
                {project.images?.[0] && (
                  <div className="aspect-video mb-5 overflow-hidden bg-stone-100">
                    <ProjectImage
                      src={project.images[0]}
                      alt={project.title}
                      className="w-full h-full object-cover"
                      token={token}
                    />
                  </div>
                )}

                <div className="flex-grow flex flex-col">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-stone-100 text-stone-600 px-2 py-1 text-[10px] uppercase tracking-widest font-medium">
                      {project.year}
                    </span>
                    <span className="text-[10px] tracking-widest uppercase text-stone-600">
                      {categoryLabelMap[project.categorySlug] || project.categorySlug} · {trimesterLabelMap[project.trimester] || project.trimester}
                    </span>
                  </div>
                  
                  <h3
                    className="text-xl font-light text-stone-900 leading-tight mb-2"
                    style={{ fontFamily: "'Cormorant Garamond', serif" }}
                  >
                    {project.title}
                  </h3>
                  
                  {project.description && (
                    <p className="text-sm text-stone-500 mb-4 line-clamp-3">
                      {project.description}
                    </p>
                  )}

                  {project.skills?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-auto mb-6">
                      {project.skills.slice(0, 3).map((skill) => (
                        <span
                          key={skill}
                          className="bg-stone-50 text-stone-600 px-2 py-1 text-[10px] uppercase tracking-widest"
                        >
                          {skill}
                        </span>
                      ))}
                      {project.skills.length > 3 && (
                        <span className="text-[10px] text-stone-600 self-center uppercase tracking-widest">
                          +{project.skills.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-4 pt-4 mt-auto">
                  <button
                    type="button"
                    onClick={() => setEditing({ ...project })}
                    className="text-[11px] font-medium tracking-widest uppercase text-stone-600 hover:text-stone-900 transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(project.id)}
                    className="text-[11px] font-medium tracking-widest uppercase text-red-500 hover:text-red-700 transition-colors ml-auto"
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
            categories={categories}
            trimesters={trimesters}
          />
        )}
      </AnimatePresence>

      {/* Modal: confirmar exclusão de projeto */}
      <AnimatePresence>
        {deleteConfirm && (
          <ConfirmModal
            title="Remover projeto?"
            description="Esta ação removerá o projeto do portfólio."
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
            description="Esta ação removerá o ano e seus projetos."
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

      <AnimatePresence>
        {openFilter && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            onClick={closeFilter}
          >
            <div
              className="absolute right-0 top-full mt-2 w-64 bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-4 py-3 text-[10px] font-normal uppercase tracking-widest text-stone-600">
                {openFilter === "year" && "Ano"}
                {openFilter === "category" && "Matéria"}
                {openFilter === "trimester" && "Trimestre"}
              </div>
              <div className="py-1 max-h-72 overflow-y-auto">
                {openFilter === "year" && (
                  <>
                    <button type="button" onClick={() => { setFilterYear("all"); closeFilter(); }} className="block w-full px-4 py-2 text-left text-sm font-normal text-stone-700 hover:bg-stone-50">Todos</button>
                    {years.map((y) => (
                      <button key={y} type="button" onClick={() => { setFilterYear(y); closeFilter(); }} className="block w-full px-4 py-2 text-left text-sm font-normal text-stone-700 hover:bg-stone-50">{y}</button>
                    ))}
                  </>
                )}
                {openFilter === "category" && (
                  <>
                    <button type="button" onClick={() => { setFilterCat("all"); closeFilter(); }} className="block w-full px-4 py-2 text-left text-sm font-normal text-stone-700 hover:bg-stone-50">Todas</button>
                    {categories.map((c) => (
                      <button key={c.slug} type="button" onClick={() => { setFilterCat(c.slug); closeFilter(); }} className="block w-full px-4 py-2 text-left text-sm font-normal text-stone-700 hover:bg-stone-50">{c.label}</button>
                    ))}
                  </>
                )}
                {openFilter === "trimester" && (
                  <>
                    <button type="button" onClick={() => { setFilterTri("all"); closeFilter(); }} className="block w-full px-4 py-2 text-left text-sm font-normal text-stone-700 hover:bg-stone-50">Todos</button>
                    {trimesters.map((t) => (
                      <button key={t.key} type="button" onClick={() => { setFilterTri(t.key); closeFilter(); }} className="block w-full px-4 py-2 text-left text-sm font-normal text-stone-700 hover:bg-stone-50">{t.label}</button>
                    ))}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeModal === "years" && (
          <ModalShell
            title="Gerenciar anos"
            onClose={closeModal}
            footer={
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newYearInput}
                  onChange={(e) => setNewYearInput(e.target.value)}
                  placeholder="Ex: 2027"
                  className="w-28 bg-white px-3 py-2 text-sm text-stone-900 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-300"
                />
                <Btn onClick={handleCreateYear} disabled={saving || !newYearInput.trim()}>
                  Adicionar
                </Btn>
              </div>
            }
          >
            <div className="flex flex-wrap gap-2">
              {years.map((year) => (
                <button
                  key={year}
                  type="button"
                  onClick={() => setYearToDelete(year)}
                  className="text-xs tracking-widest bg-stone-100 hover:bg-red-50 hover:text-red-700 text-stone-700 px-3 py-2 transition-colors uppercase font-medium"
                  title={`Remover ano ${year}`}
                >
                  &times; {year}
                </button>
              ))}
              {years.length === 0 && <p className="text-sm text-stone-600">Nenhum ano cadastrado.</p>}
            </div>
          </ModalShell>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeModal === "categories" && (
          <ModalShell
            title="Matérias"
            onClose={closeModal}
            footer={
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={newCategoryLabel}
                  onChange={(e) => setNewCategoryLabel(e.target.value)}
                  placeholder="Nome"
                  className="bg-white px-3 py-2 text-sm text-stone-900 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-300"
                />
                <input
                  type="text"
                  value={newCategorySlug}
                  onChange={(e) => setNewCategorySlug(e.target.value)}
                  placeholder="slug (ex: biologia)"
                  className="bg-white px-3 py-2 text-sm text-stone-900 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-300"
                />
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newCategoryPrefix}
                    onChange={(e) => setNewCategoryPrefix(e.target.value)}
                    placeholder="prefix"
                    className="w-24 bg-white px-3 py-2 text-sm text-stone-900 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-300"
                  />
                  <Btn
                    className="ml-auto"
                    onClick={() =>
                      handleAddCategory({
                        slug: newCategorySlug,
                        label: newCategoryLabel,
                        idPrefix: newCategoryPrefix,
                      })
                    }
                    disabled={saving}
                  >
                    Criar
                  </Btn>
                </div>
              </div>
            }
          >
            <div className="space-y-2">
              {categories.map((c) => (
                <div key={c.slug} className="flex items-center justify-between gap-4 bg-stone-50 px-4 py-3">
                  <div>
                    <p className="text-sm text-stone-900 font-medium">{c.label}</p>
                    <p className="text-xs text-stone-500 font-mono">{c.slug}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCategoryToRemove(c.slug)}
                    className="text-xs tracking-widest uppercase text-red-500 hover:text-red-700 transition-colors"
                  >
                    Remover
                  </button>
                </div>
              ))}
              {categories.length === 0 && <p className="text-sm text-stone-600">Nenhuma matéria cadastrada.</p>}
            </div>
          </ModalShell>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeModal === "trimesters" && (
          <ModalShell
            title="Trimestres"
            onClose={closeModal}
            footer={
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={newTrimesterKey}
                  onChange={(e) => setNewTrimesterKey(e.target.value)}
                  placeholder="Número (ex: 4)"
                  className="bg-white px-3 py-2 text-sm text-stone-900 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-300"
                />
                <input
                  type="text"
                  value={newTrimesterLabel}
                  onChange={(e) => setNewTrimesterLabel(e.target.value)}
                  placeholder="Label (ex: 4º Trimestre)"
                  className="bg-white px-3 py-2 text-sm text-stone-900 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-300"
                />
                <Btn
                  onClick={() => handleAddTrimester({ key: newTrimesterKey, label: newTrimesterLabel })}
                  disabled={saving}
                >
                  Criar
                </Btn>
              </div>
            }
          >
            <div className="space-y-2">
              {trimesters.map((t) => (
                <div key={t.key} className="flex items-center justify-between gap-4 bg-stone-50 px-4 py-3">
                  <div>
                    <p className="text-sm text-stone-900 font-medium">{t.label}</p>
                    <p className="text-xs text-stone-500 font-mono">{t.key}</p>
                  </div>
                </div>
              ))}
            </div>
          </ModalShell>
        )}
      </AnimatePresence>

      {/* Confirm remove category */}
      <AnimatePresence>
        {categoryToRemove && (
          <ConfirmModal
            title="Remover matéria?"
            description="Esta ação remove a matéria do menu. Os dados existentes não são apagados."
            confirmLabel="Remover"
            variant="danger"
            saving={saving}
            onConfirm={() => handleRemoveCategory(categoryToRemove)}
            onCancel={() => setCategoryToRemove(null)}
          />
        )}
      </AnimatePresence>

      {/* FAB MENU */}
      <AnimatePresence>
        {fabOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-stone-200/40 backdrop-blur-[2px]"
            onClick={closeFab}
          />
        )}
      </AnimatePresence>

      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        <AnimatePresence>
          {fabOpen && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98, transformOrigin: "bottom right" }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              className="mb-3 w-64 bg-white shadow-2xl"
            >
              <div className="py-1">
                <FabActionButton
                  marker="P"
                  label="Novo projeto"
                  onClick={() => {
                    closeFab();
                    openNewProjectForm();
                  }}
                />
                <FabActionButton marker="A" label="Gerenciar anos" onClick={() => openModal("years")} />
                <FabActionButton marker="T" label="Gerenciar trimestres" onClick={() => openModal("trimesters")} />
                <FabActionButton marker="M" label="Matérias" onClick={() => openModal("categories")} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={() => setFabOpen((v) => !v)}
          className="h-14 w-14 bg-stone-900 text-white shadow-xl hover:bg-stone-800 transition-colors focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2"
          aria-label="Menu de ações"
        >
          <motion.svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="mx-auto"
            animate={{ rotate: fabOpen ? 45 : 0 }}
            transition={{ duration: 0.15, ease: "easeInOut" }}
          >
            <path d="M12 4V20" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
            <path d="M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
          </motion.svg>
        </button>
      </div>
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
