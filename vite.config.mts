import react from "@vitejs/plugin-react";
import { dirname, resolve } from "path";
import { visualizer } from "rollup-plugin-visualizer";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";
import tsconfigPaths from "vite-tsconfig-paths";
import { loadEnv } from "vite";
import vitePluginAliOss from 'vite-plugin-ali-oss'
import tailwindcss from '@tailwindcss/vite'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// `options` for `vite-oss-upload` are loaded from environment variables.
// Create a function to build them at config time using Vite's loadEnv.
function buildOssOptions(mode: string) {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  
  return {
    dist: env.VITE_OSS_DIST || "/",
    region: env.VITE_OSS_REGION || "",
    accessKeyId: env.VITE_OSS_ACCESS_KEY_ID || "",
    accessKeySecret: env.VITE_OSS_ACCESS_KEY_SECRET || "",
    bucket: env.VITE_OSS_BUCKET || "",
    overwrite: env.VITE_OSS_OVERWRITE === "true" || false,
  };
}

function mask(value: string | undefined) {
  if (!value) return "";
  if (value.length <= 6) return "******";
  return `${value.slice(0, 3)}...${value.slice(-3)}`;
}

function printOssOptions(options: Record<string, any>, mode: string) {
  // load the env flag: if true, print raw secrets (useful in local debug). default: false
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const printRaw = env.VITE_OSS_PRINT_RAW === "true";

  const toPrint = {
    dist: options.dist,
    region: options.region,
    accessKeyId: printRaw ? options.accessKeyId : mask(options.accessKeyId),
    accessKeySecret: printRaw ? options.accessKeySecret : mask(options.accessKeySecret),
    bucket: options.bucket,
    overwrite: options.overwrite,
  };
}


export default defineConfig(({ mode }) => {
  const _mode = mode || process.env.NODE_ENV || "development";
  // load env for this mode so we can read VITE_BASE_URL (and other VITE_ vars)
  const env = loadEnv(_mode, process.cwd(), '');
  const _ossOpts = buildOssOptions(_mode);
  printOssOptions(_ossOpts, _mode);
  // Use the Vite mode to determine production. process.env.NODE_ENV may not be set
  const prod = _mode === 'production';
  const baseFromEnv = env.VITE_BASE_URL || '';

  const useOssUpload =
    prod &&
    !!_ossOpts.region &&
    !!_ossOpts.bucket &&
    !!_ossOpts.accessKeyId &&
    !!_ossOpts.accessKeySecret;

  return {
    // priority: VITE_BASE_URL > '/'
    base: baseFromEnv || '/',
    root: resolve("./app"),
    plugins: [
      react(),
      svgr(),
      tsconfigPaths(),
      tailwindcss(),
      visualizer({
        open: false, // build 完成后自动打开
        filename: "stats.html", // 生成的文件名
        gzipSize: true,
        brotliSize: true,
      }),
      ...(useOssUpload ? [vitePluginAliOss(_ossOpts)] : []),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./app"),
      "@resources": resolve(__dirname, "./resources"),
      "@lib": resolve(__dirname, "./lib"),
    },
  },
  server: {
    port: 3000,
  },
  // 排除 Electron 相关的依赖
  optimizeDeps: {
    exclude: [
      "electron",
      "@electron-toolkit/preload",
      "@electron-toolkit/utils",
    ],
  },
  build: {
    outDir: resolve(__dirname, "./dist-web"),
    emptyOutDir: true,
    sourcemap: mode === 'production' ? false : true,
    rollupOptions: {
      output: {
        // Consolidate vendor chunks to reduce number of tiny files in dist
        // Especially icons: lucide-react publishes each icon as its own module,
        // which can lead to hundreds of small chunks if not grouped.
        manualChunks: {
          // Split major vendor groups to reduce initial chunk size
          react_vendor: ["react", "react-dom"],
          router: ["react-router-dom"],
          query: ["@tanstack/react-query"],
          radix: [
            "@radix-ui/react-dialog",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-popover",
            "@radix-ui/react-form",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-select",
            "@radix-ui/react-menubar",
          ],
          xyflow: ["@xyflow/react"],
          lodash: ["lodash-es"],
          // Group all icon libs together to avoid one-chunk-per-icon outputs
          icons: ["lucide-react", "@tabler/icons-react"],
        },
      },
    },
  },
};
});
