import { resolve } from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import svgr from "vite-plugin-svgr";
import tsconfigPaths from "vite-tsconfig-paths";
import viteCompression from 'vite-plugin-compression';
import { externalConfig } from "./lib/plugin/external-config";
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => ({
  main: {
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'lib/main/main.ts'),
        },
      },
    },
    resolve: {
      alias: {
        "@": resolve(__dirname, "app"),
        '@lib': resolve(__dirname, 'lib'),
        '@resources': resolve(__dirname, 'resources'),
      },
    },
    plugins: [externalizeDepsPlugin()],
    define: {
      __IS_ELECTRON_BUILD__: mode === 'electron'
    }
  },
  preload: {
    build: {
      rollupOptions: {
        input: {
          preload: resolve(__dirname, 'lib/preload/preload.ts'),
        },
      },
    },
    resolve: {
      alias: {
        "@": resolve(__dirname, "app"),
        '@lib': resolve(__dirname, 'lib'),
        '@resources': resolve(__dirname, 'resources'),
      },
    },
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    root: 'app',
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'app/index.html'),
        },
      // Don't treat libs listed in externalConfig as external when building for electron
      // so they can be bundled (manualChunks may reference them). For non-electron
      // builds we still externalize to use CDN/inject behavior.
      external: mode === 'electron' ? [] : externalConfig.map(item => item.pkgName),
        output: {
          manualChunks: {
            'vendor': ['react', 'react-dom'],
            // 'ui': [
            //   // '@/components/ui',
            //   'ag-grid-community',
            //   'ag-grid-react'
            // ],
            'markdown': ['react-markdown'],
            'lucide-react': ['lucide-react'],
            'xyflow': ['@xyflow/react'],
            'react-syntax-highlighter': ['react-syntax-highlighter'],
          },
          globals: {
            ...externalConfig.reduce((acc, config) => {
              acc[config.pkgName] = config.globalName;
              return acc;
            }, {}),
          }
        }
      },
      chunkSizeWarningLimit: 1000,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      },
    },
    resolve: {
      alias: {
        '@lib': resolve(__dirname, 'lib'),
        '@resources': resolve(__dirname, 'resources'),
        '@': resolve(__dirname, 'app'),
      },
    },
    plugins: [
      react(),
      svgr(),
      tsconfigPaths(),
      tailwindcss(),
      viteCompression({ algorithm: 'gzip', threshold: 1024 }), // 1KB以上才压缩
      viteCompression({ algorithm: 'brotliCompress', threshold: 1024 }),
    ] as any,
    define: {
      __IS_ELECTRON_BUILD__: mode === 'electron'
    }
  },
}));
