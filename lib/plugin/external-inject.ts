import _ from "lodash";
import { HtmlTagDescriptor, Plugin } from "vite";
import { externalConfig } from "./external-config";

export default function ExternalInjectPlugin(): Plugin {
  return {
    name: "external-inject",
    transformIndexHtml(html) {
      const tags: HtmlTagDescriptor[] = [];
      for (const item of externalConfig) {
        // if (item.esm?.src) {
        //   tags.push({
        //     tag: "script",
        //     attrs: {
        //       type: "module",
        //     },
        //     children: `import ${_.camelCase(item.pkgName)} from "${item.esm.src}"`,
        //     // injectTo: "head",
        //   });
        // }
        if (item.umd?.css) {
          tags.push({
            tag: "link",
            attrs: { rel: "stylesheet", href: item.umd?.css },
            injectTo: "head-prepend",
          });
        }
        if (item.umd?.src) {
          tags.push({
            tag: "script",
            attrs: { src: item.umd?.src },
            injectTo: "head-prepend",
          });
        }
      }
      return { html, tags };
    },
  };
}
