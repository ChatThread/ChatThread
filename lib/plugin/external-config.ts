// Optional CDN URL for loading large vendor libs from a CDN.
// For open-source builds, keep this unset so dependencies get bundled normally.
export const cdnUrl = process.env.VITE_CDN_URL || process.env.CDN_URL || "";

export const externalConfig = cdnUrl
  ? [
  {
    pkgName: "react",
    globalName: "React",
    umd: {
      src: `${cdnUrl}/react@18.3.1/umd/react.production.min.js`,
      viteCdnPluginPath: "umd/react.production.min.js",
    },
    esm: {
      src: `${cdnUrl}/react@18.3.1/+esm`,
    },
  },
  {
    pkgName: "react-dom",
    globalName: "ReactDOM",
    umd: {
      src: `${cdnUrl}/react-dom@18.3.1/umd/react-dom.production.min.js`,
      viteCdnPluginPath: "umd/react-dom.production.min.js",
    },
    esm: {
      src: `${cdnUrl}/react-dom@18.3.1/+esm`,
    },
  },
  // {
  //   pkgName: "lodash",
  //   globalName: "_",
  //   umd: {
  //     src: `${cdnUrl}/lodash@4.17.21/lodash.min.js`,
  //     viteCdnPluginPath: "lodash.min.js",
  //   },
  //   esm: {
  //     src: `${cdnUrl}/lodash@4.17.21/+esm`,
  //   },
  // },
  // {
  //   pkgName: "react-router-dom",
  //   globalName: "ReactRouterDOM",
  //   umd: {
  //     src: `${cdnUrl}/react-router-dom@7.6.2/dist/index.min.js`,
  //     viteCdnPluginPath: "dist/index.min.js",
  //   },
  //   esm: {
  //     src: `${cdnUrl}/react-router-dom@7.6.2/+esm`,
  //   },
  // },
  // {
  //   pkgName: "@xyflow/react",
  //   globalName: "ReactFlow",
  //   umd: {
  //     src: `${cdnUrl}/@xyflow/react@12.5.6/dist/umd/index.min.js`,
  //     viteCdnPluginPath: "dist/umd/index.min.js",
  //     css: `${cdnUrl}/@xyflow/react@12.5.6/dist/style.min.css`,
  //   },
  //   esm: {
  //     src: `${cdnUrl}/@xyflow/react@12.5.6/+esm`,
  //   },
  // },
  // {
  //   pkgName: "react-syntax-highlighter",
  //   globalName: "ReactSyntaxHighlighter",
  //   umd: {
  //     src: `${cdnUrl}/react-syntax-highlighter@15.6.1/dist/cjs/index.js`,
  //     viteCdnPluginPath: "dist/cjs/index.js",
  //   },
  // },
  {
    pkgName: "framer-motion",
    globalName: "Motion",
    umd: {
      src: `${cdnUrl}/framer-motion@12.7.3/dist/framer-motion.min.js`,
      viteCdnPluginPath: "dist/framer-motion.min.js",
    },
  },
  // {
  //   pkgName: "zod",
  //   globalName: "Zod",
  //   umd: {
  //     src: `${cdnUrl}/zod@4.1.12/lib/index.umd.min.js`,
  //     viteCdnPluginPath: "lib/index.umd.min.js",
  //   },
  //   esm: {
  //     src: `${cdnUrl}/zod@4.1.12/+esm`,
  //   },
  // },
  {
    pkgName: "ag-grid-community",
    globalName: "agGrid",
    umd: {
      src: `${cdnUrl}/ag-grid-community@32.0.2/dist/ag-grid-community.min.js`,
      viteCdnPluginPath: "dist/ag-grid-community.min.js",
      css: `${cdnUrl}/ag-grid-community@32.0.2/styles/ag-theme-quartz.min.css`,
    },
    esm: {
      src: `${cdnUrl}/ag-grid-community@32.0.2/+esm`,
    },
  },
  {
    pkgName: "openseadragon",
    globalName: "OpenSeadragon",
    umd: {
      src: `${cdnUrl}/openseadragon@5.0.1/build/openseadragon/openseadragon.min.js`,
      viteCdnPluginPath: "build/openseadragon/openseadragon.min.js",
    },
    esm: {
      src: `${cdnUrl}/openseadragon@5.0.1/+esm`,
    },
  },
  // {
  //   pkgName: "vanilla-jsoneditor",
  //   globalName: "JSONEditor",
  //   umd: {
  //     src: `${cdnUrl}/vanilla-jsoneditor@3.3.1/standalone.min.js`,
  //     viteCdnPluginPath: "standalone.min.js",
  //     css: `${cdnUrl}/vanilla-jsoneditor@3.3.1/themes/jse-theme-dark.min.css`,
  //   },
  //   esm: {
  //     src: `${cdnUrl}/vanilla-jsoneditor@3.3.1/+esm`,
  //   },
  // },
]
  : [];
