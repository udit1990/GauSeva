const path = require("path");
const Module = require("module");

// Patch resolver so that requires from the global template‑node‑modules
// folder resolve to project‑local node_modules (or known shims).
const SHIM_MAP = {
  "@alloc/quick-lru": path.resolve(__dirname, "src/shims/quick-lru.cjs"),
  "object-hash": path.resolve(__dirname, "src/shims/object-hash.cjs"),
};

const localNodeModules = path.resolve(__dirname, "node_modules");
const originalResolve = Module._resolveFilename;

Module._resolveFilename = function patchedResolve(request, parent, isMain, options) {
  // 1. known shims
  if (SHIM_MAP[request]) return SHIM_MAP[request];

  // 2. redirect template‑path requires to local node_modules
  if (parent && parent.filename && parent.filename.startsWith("/opt/template-node-modules/")) {
    try {
      return originalResolve.call(this, request, Object.assign({}, parent, { paths: [localNodeModules] }), isMain, options);
    } catch (_e) {
      // fall through to default
    }
  }

  return originalResolve.call(this, request, parent, isMain, options);
};

const tailwindcss = require("tailwindcss");
const autoprefixer = require("autoprefixer");

module.exports = {
  plugins: [tailwindcss(), autoprefixer()],
};
