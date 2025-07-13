// vite.config.mjs
import { svelte } from "file:///C:/Users/adam_/Desktop/FoundryVTT-Scripts/FoundryVTT-ItemPiles/node_modules/@sveltejs/vite-plugin-svelte/src/index.js";
import {
  postcssConfig,
  terserConfig
} from "file:///C:/Users/adam_/Desktop/FoundryVTT-Scripts/FoundryVTT-ItemPiles/node_modules/@typhonjs-fvtt/runtime/.rollup/remote/index.js";
import { sveltePreprocess } from "file:///C:/Users/adam_/Desktop/FoundryVTT-Scripts/FoundryVTT-ItemPiles/node_modules/svelte-preprocess/dist/index.js";

// module.json
var module_default = {
  id: "item-piles",
  title: "Item Piles",
  description: "This module adds the ability for items to be dropped onto the ground, and then picked up.",
  version: "100.0.0",
  library: "false",
  compatibility: {
    minimum: "12",
    verified: "13",
    maximum: "13"
  },
  authors: [
    {
      name: "Wasp",
      url: "https://github.com/Haxxer",
      discord: "Wasp#2005"
    }
  ],
  esmodules: [
    "dist/item-piles.js"
  ],
  styles: [
    "dist/item-piles.css"
  ],
  languages: [
    {
      lang: "en",
      name: "English",
      path: "languages/en.json"
    },
    {
      lang: "de",
      name: "English",
      path: "languages/de.json"
    },
    {
      lang: "fr",
      name: "French",
      path: "languages/fr.json"
    },
    {
      lang: "ja",
      name: "\u65E5\u672C\u8A9E",
      path: "languages/ja.json"
    },
    {
      lang: "pt-BR",
      name: "Portugu\xEAs (Brasil)",
      path: "languages/pt-BR.json"
    },
    {
      lang: "pl",
      name: "polski",
      path: "languages/pl.json"
    },
    {
      lang: "es",
      name: "Espa\xF1ol",
      path: "languages/es.json"
    },
    {
      lang: "cn",
      name: "\u4E2D\u6587\uFF08\u7B80\u4F53\uFF09",
      path: "languages/zh_Hans.json"
    },
    {
      lang: "cs",
      name: "\u010Ce\u0161tina",
      path: "languages/cs.json"
    },
    {
      lang: "it",
      name: "Italiano",
      path: "languages/it.json"
    },
    {
      lang: "ru",
      name: "\u0420\u0443\u0441\u0441\u043A\u0438\u0439",
      path: "languages/ru.json"
    },
    {
      lang: "zh-Hant",
      name: "\u6F22\u8A9E\uFF08\u6B63\u9AD4\u5B57\uFF09",
      path: "languages/zh_Hant.json"
    }
  ],
  relationships: {
    requires: [
      {
        id: "socketlib",
        type: "module"
      },
      {
        id: "lib-wrapper",
        type: "module"
      }
    ]
  },
  socket: true,
  url: "https://github.com/fantasycalendar/FoundryVTT-ItemPiles",
  manifest: "https://github.com/fantasycalendar/FoundryVTT-ItemPiles/releases/latest/download/manifest.json",
  download: "https://github.com/fantasycalendar/FoundryVTT-ItemPiles/releases/latest/download/module.zip",
  readme: "https://github.com/fantasycalendar/FoundryVTT-ItemPiles/blob/master/README.md",
  bugs: "https://github.com/fantasycalendar/FoundryVTT-ItemPiles/issues"
};

// vite.config.mjs
var s_PACKAGE_ID = `modules/${module_default.id}`;
var s_SVELTE_HASH_ID = "ip";
var s_COMPRESS = false;
var s_SOURCEMAPS = true;
var vite_config_default = ({ mode }) => {
  const compilerOptions = mode === "production" ? {
    cssHash: ({ hash, css }) => `svelte-${s_SVELTE_HASH_ID}-${hash(css)}`
  } : {};
  return {
    root: "src/",
    // Source location / esbuild root.
    base: `/${s_PACKAGE_ID}/dist`,
    // Base module path that 29999 / served dev directory.
    publicDir: false,
    // No public resources to copy.
    cacheDir: "../.vite-cache",
    // Relative from root directory.
    resolve: {
      conditions: ["browser", "import"]
    },
    esbuild: {
      target: ["es2022"]
    },
    css: {
      // Creates a standard configuration for PostCSS with autoprefixer & postcss-preset-env.
      postcss: postcssConfig({ compress: s_COMPRESS, sourceMap: s_SOURCEMAPS })
    },
    // About server options:
    // - Set to `open` to boolean `false` to not open a browser window automatically. This is useful if you set up a
    // debugger instance in your IDE and launch it with the URL: 'http://localhost:29999/game'.
    //
    // - The top proxy entry redirects requests under the module path for `style.css` and following standard static
    // directories: `assets`, `lang`, and `packs` and will pull those resources from the main Foundry / 30000 server.
    // This is necessary to reference the dev resources as the root is `/src` and there is no public / static
    // resources served with this particular Vite configuration. Modify the proxy rule as necessary for your
    // static resources / project.
    server: {
      port: 29999,
      open: "/game",
      proxy: {
        // Serves static files from main Foundry server.
        [`^(/${s_PACKAGE_ID}/(assets|lang|packs|dist/${module_default.id}.css))`]: "http://localhost:30000",
        // All other paths besides package ID path are served from main Foundry server.
        [`^(?!/${s_PACKAGE_ID}/)`]: "http://localhost:30000",
        // Rewrite incoming `module-id.js` request from Foundry to the dev server `module.js`.
        [`/${s_PACKAGE_ID}/dist/${module_default.id}.js`]: {
          target: `http://localhost:29999/${s_PACKAGE_ID}/dist`,
          rewrite: () => "/module.js"
        },
        // Enable socket.io from main Foundry server.
        "/socket.io": { target: "ws://localhost:30000", ws: true }
      }
    },
    build: {
      outDir: "../dist",
      emptyOutDir: false,
      sourcemap: s_SOURCEMAPS,
      brotliSize: true,
      minify: s_COMPRESS ? "terser" : false,
      target: ["es2022"],
      terserOptions: s_COMPRESS ? { ...terserConfig(), ecma: 2022 } : void 0,
      lib: {
        entry: "./module.js",
        formats: ["es"],
        fileName: module_default.id
      },
      rollupOptions: {
        output: {
          // Rewrite the default style.css to a more recognizable file name.
          assetFileNames: (assetInfo) => assetInfo.name === "style.css" ? `${module_default.id}.css` : assetInfo.name
        }
      }
    },
    // Necessary when using the dev server for top-level await usage inside TRL.
    optimizeDeps: {
      esbuildOptions: {
        target: "es2022"
      }
    },
    plugins: [
      svelte({
        compilerOptions,
        preprocess: sveltePreprocess()
      })
    ]
  };
};
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcubWpzIiwgIm1vZHVsZS5qc29uIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcYWRhbV9cXFxcRGVza3RvcFxcXFxGb3VuZHJ5VlRULVNjcmlwdHNcXFxcRm91bmRyeVZUVC1JdGVtUGlsZXNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGFkYW1fXFxcXERlc2t0b3BcXFxcRm91bmRyeVZUVC1TY3JpcHRzXFxcXEZvdW5kcnlWVFQtSXRlbVBpbGVzXFxcXHZpdGUuY29uZmlnLm1qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvYWRhbV8vRGVza3RvcC9Gb3VuZHJ5VlRULVNjcmlwdHMvRm91bmRyeVZUVC1JdGVtUGlsZXMvdml0ZS5jb25maWcubWpzXCI7LyogZXNsaW50LWVudiBub2RlICovXG5pbXBvcnQgeyBzdmVsdGUgfSBmcm9tICdAc3ZlbHRlanMvdml0ZS1wbHVnaW4tc3ZlbHRlJztcblxuaW1wb3J0IHtcblx0cG9zdGNzc0NvbmZpZyxcblx0dGVyc2VyQ29uZmlnXG59IGZyb20gJ0B0eXBob25qcy1mdnR0L3J1bnRpbWUvcm9sbHVwJztcblxuaW1wb3J0IHsgc3ZlbHRlUHJlcHJvY2VzcyB9IGZyb20gJ3N2ZWx0ZS1wcmVwcm9jZXNzJztcblxuaW1wb3J0IG1vZHVsZUpTT04gZnJvbSAnLi9tb2R1bGUuanNvbicgd2l0aCB7IHR5cGU6ICdqc29uJyB9O1xuXG4vLyBBVFRFTlRJT04hXG4vLyBQbGVhc2UgbW9kaWZ5IHRoZSBiZWxvdyB2YXJpYWJsZXM6IHNfUEFDS0FHRV9JRCBhbmQgc19TVkVMVEVfSEFTSF9JRCBhcHByb3ByaWF0ZWx5LlxuXG5jb25zdCBzX1BBQ0tBR0VfSUQgPSBgbW9kdWxlcy8ke21vZHVsZUpTT04uaWR9YDtcblxuLy8gQSBzaG9ydCBhZGRpdGlvbmFsIHN0cmluZyB0byBhZGQgdG8gU3ZlbHRlIENTUyBoYXNoIHZhbHVlcyB0byBtYWtlIHlvdXJzIHVuaXF1ZS4gVGhpcyByZWR1Y2VzIHRoZSBhbW91bnQgb2Zcbi8vIGR1cGxpY2F0ZWQgZnJhbWV3b3JrIENTUyBvdmVybGFwIGJldHdlZW4gbWFueSBUUkwgcGFja2FnZXMgZW5hYmxlZCBvbiBGb3VuZHJ5IFZUVCBhdCB0aGUgc2FtZSB0aW1lLiAndHNlJyBpcyBjaG9zZW5cbi8vIGJ5IHNob3J0ZW5pbmcgJ3RlbXBsYXRlLXN2ZWx0ZS1lc20nLlxuY29uc3Qgc19TVkVMVEVfSEFTSF9JRCA9ICdpcCc7XG5cbmNvbnN0IHNfQ09NUFJFU1MgPSBmYWxzZTsgIC8vIFNldCB0byB0cnVlIHRvIGNvbXByZXNzIHRoZSBtb2R1bGUgYnVuZGxlLlxuY29uc3Qgc19TT1VSQ0VNQVBTID0gdHJ1ZTsgLy8gR2VuZXJhdGUgc291cmNlbWFwcyBmb3IgdGhlIGJ1bmRsZSAocmVjb21tZW5kZWQpLlxuXG5leHBvcnQgZGVmYXVsdCAoeyBtb2RlIH0pID0+IHtcblx0Ly8gUHJvdmlkZXMgYSBjdXN0b20gaGFzaCBhZGRpbmcgdGhlIHN0cmluZyBkZWZpbmVkIGluIGBzX1NWRUxURV9IQVNIX0lEYCB0byBzY29wZWQgU3ZlbHRlIHN0eWxlcztcblx0Ly8gVGhpcyBpcyByZWFzb25hYmxlIHRvIGRvIGFzIHRoZSBmcmFtZXdvcmsgc3R5bGVzIGluIFRSTCBjb21waWxlZCBhY3Jvc3MgYG5gIGRpZmZlcmVudCBwYWNrYWdlcyB3aWxsXG5cdC8vIGJlIHRoZSBzYW1lLiBTbGlnaHRseSBtb2RpZnlpbmcgdGhlIGhhc2ggZW5zdXJlcyB0aGF0IHlvdXIgcGFja2FnZSBoYXMgdW5pcXVlbHkgc2NvcGVkIHN0eWxlcyBmb3IgYWxsXG5cdC8vIFRSTCBjb21wb25lbnRzIGFuZCBtYWtlcyBpdCBlYXNpZXIgdG8gcmV2aWV3IHN0eWxlcyBpbiB0aGUgYnJvd3NlciBkZWJ1Z2dlci5cblx0Y29uc3QgY29tcGlsZXJPcHRpb25zID0gbW9kZSA9PT0gJ3Byb2R1Y3Rpb24nID8ge1xuXHRcdGNzc0hhc2g6ICh7IGhhc2gsIGNzcyB9KSA9PiBgc3ZlbHRlLSR7c19TVkVMVEVfSEFTSF9JRH0tJHtoYXNoKGNzcyl9YFxuXHR9IDoge307XG5cblx0LyoqIEB0eXBlIHtpbXBvcnQoJ3ZpdGUnKS5Vc2VyQ29uZmlnfSAqL1xuXHRyZXR1cm4ge1xuXHRcdHJvb3Q6ICdzcmMvJywgICAgICAgICAgICAgICAgICAgIC8vIFNvdXJjZSBsb2NhdGlvbiAvIGVzYnVpbGQgcm9vdC5cblx0XHRiYXNlOiBgLyR7c19QQUNLQUdFX0lEfS9kaXN0YCwgICAvLyBCYXNlIG1vZHVsZSBwYXRoIHRoYXQgMjk5OTkgLyBzZXJ2ZWQgZGV2IGRpcmVjdG9yeS5cblx0XHRwdWJsaWNEaXI6IGZhbHNlLCAgICAgICAgICAgICAgICAvLyBObyBwdWJsaWMgcmVzb3VyY2VzIHRvIGNvcHkuXG5cdFx0Y2FjaGVEaXI6ICcuLi8udml0ZS1jYWNoZScsICAgICAgLy8gUmVsYXRpdmUgZnJvbSByb290IGRpcmVjdG9yeS5cblxuXHRcdHJlc29sdmU6IHtcblx0XHRcdGNvbmRpdGlvbnM6IFsnYnJvd3NlcicsICdpbXBvcnQnXVxuXHRcdH0sXG5cblx0XHRlc2J1aWxkOiB7XG5cdFx0XHR0YXJnZXQ6IFsnZXMyMDIyJ11cblx0XHR9LFxuXG5cdFx0Y3NzOiB7XG5cdFx0XHQvLyBDcmVhdGVzIGEgc3RhbmRhcmQgY29uZmlndXJhdGlvbiBmb3IgUG9zdENTUyB3aXRoIGF1dG9wcmVmaXhlciAmIHBvc3Rjc3MtcHJlc2V0LWVudi5cblx0XHRcdHBvc3Rjc3M6IHBvc3Rjc3NDb25maWcoeyBjb21wcmVzczogc19DT01QUkVTUywgc291cmNlTWFwOiBzX1NPVVJDRU1BUFMgfSlcblx0XHR9LFxuXG5cdFx0Ly8gQWJvdXQgc2VydmVyIG9wdGlvbnM6XG5cdFx0Ly8gLSBTZXQgdG8gYG9wZW5gIHRvIGJvb2xlYW4gYGZhbHNlYCB0byBub3Qgb3BlbiBhIGJyb3dzZXIgd2luZG93IGF1dG9tYXRpY2FsbHkuIFRoaXMgaXMgdXNlZnVsIGlmIHlvdSBzZXQgdXAgYVxuXHRcdC8vIGRlYnVnZ2VyIGluc3RhbmNlIGluIHlvdXIgSURFIGFuZCBsYXVuY2ggaXQgd2l0aCB0aGUgVVJMOiAnaHR0cDovL2xvY2FsaG9zdDoyOTk5OS9nYW1lJy5cblx0XHQvL1xuXHRcdC8vIC0gVGhlIHRvcCBwcm94eSBlbnRyeSByZWRpcmVjdHMgcmVxdWVzdHMgdW5kZXIgdGhlIG1vZHVsZSBwYXRoIGZvciBgc3R5bGUuY3NzYCBhbmQgZm9sbG93aW5nIHN0YW5kYXJkIHN0YXRpY1xuXHRcdC8vIGRpcmVjdG9yaWVzOiBgYXNzZXRzYCwgYGxhbmdgLCBhbmQgYHBhY2tzYCBhbmQgd2lsbCBwdWxsIHRob3NlIHJlc291cmNlcyBmcm9tIHRoZSBtYWluIEZvdW5kcnkgLyAzMDAwMCBzZXJ2ZXIuXG5cdFx0Ly8gVGhpcyBpcyBuZWNlc3NhcnkgdG8gcmVmZXJlbmNlIHRoZSBkZXYgcmVzb3VyY2VzIGFzIHRoZSByb290IGlzIGAvc3JjYCBhbmQgdGhlcmUgaXMgbm8gcHVibGljIC8gc3RhdGljXG5cdFx0Ly8gcmVzb3VyY2VzIHNlcnZlZCB3aXRoIHRoaXMgcGFydGljdWxhciBWaXRlIGNvbmZpZ3VyYXRpb24uIE1vZGlmeSB0aGUgcHJveHkgcnVsZSBhcyBuZWNlc3NhcnkgZm9yIHlvdXJcblx0XHQvLyBzdGF0aWMgcmVzb3VyY2VzIC8gcHJvamVjdC5cblx0XHRzZXJ2ZXI6IHtcblx0XHRcdHBvcnQ6IDI5OTk5LFxuXHRcdFx0b3BlbjogJy9nYW1lJyxcblx0XHRcdHByb3h5OiB7XG5cdFx0XHRcdC8vIFNlcnZlcyBzdGF0aWMgZmlsZXMgZnJvbSBtYWluIEZvdW5kcnkgc2VydmVyLlxuXHRcdFx0XHRbYF4oLyR7c19QQUNLQUdFX0lEfS8oYXNzZXRzfGxhbmd8cGFja3N8ZGlzdC8ke21vZHVsZUpTT04uaWR9LmNzcykpYF06ICdodHRwOi8vbG9jYWxob3N0OjMwMDAwJyxcblxuXHRcdFx0XHQvLyBBbGwgb3RoZXIgcGF0aHMgYmVzaWRlcyBwYWNrYWdlIElEIHBhdGggYXJlIHNlcnZlZCBmcm9tIG1haW4gRm91bmRyeSBzZXJ2ZXIuXG5cdFx0XHRcdFtgXig/IS8ke3NfUEFDS0FHRV9JRH0vKWBdOiAnaHR0cDovL2xvY2FsaG9zdDozMDAwMCcsXG5cblx0XHRcdFx0Ly8gUmV3cml0ZSBpbmNvbWluZyBgbW9kdWxlLWlkLmpzYCByZXF1ZXN0IGZyb20gRm91bmRyeSB0byB0aGUgZGV2IHNlcnZlciBgbW9kdWxlLmpzYC5cblx0XHRcdFx0W2AvJHtzX1BBQ0tBR0VfSUR9L2Rpc3QvJHttb2R1bGVKU09OLmlkfS5qc2BdOiB7XG5cdFx0XHRcdFx0dGFyZ2V0OiBgaHR0cDovL2xvY2FsaG9zdDoyOTk5OS8ke3NfUEFDS0FHRV9JRH0vZGlzdGAsXG5cdFx0XHRcdFx0cmV3cml0ZTogKCkgPT4gJy9tb2R1bGUuanMnLFxuXHRcdFx0XHR9LFxuXG5cdFx0XHRcdC8vIEVuYWJsZSBzb2NrZXQuaW8gZnJvbSBtYWluIEZvdW5kcnkgc2VydmVyLlxuXHRcdFx0XHQnL3NvY2tldC5pbyc6IHsgdGFyZ2V0OiAnd3M6Ly9sb2NhbGhvc3Q6MzAwMDAnLCB3czogdHJ1ZSB9XG5cdFx0XHR9XG5cdFx0fSxcblxuXHRcdGJ1aWxkOiB7XG5cdFx0XHRvdXREaXI6ICcuLi9kaXN0Jyxcblx0XHRcdGVtcHR5T3V0RGlyOiBmYWxzZSxcblx0XHRcdHNvdXJjZW1hcDogc19TT1VSQ0VNQVBTLFxuXHRcdFx0YnJvdGxpU2l6ZTogdHJ1ZSxcblx0XHRcdG1pbmlmeTogc19DT01QUkVTUyA/ICd0ZXJzZXInIDogZmFsc2UsXG5cdFx0XHR0YXJnZXQ6IFsnZXMyMDIyJ10sXG5cdFx0XHR0ZXJzZXJPcHRpb25zOiBzX0NPTVBSRVNTID8geyAuLi50ZXJzZXJDb25maWcoKSwgZWNtYTogMjAyMiB9IDogdm9pZCAwLFxuXHRcdFx0bGliOiB7XG5cdFx0XHRcdGVudHJ5OiAnLi9tb2R1bGUuanMnLFxuXHRcdFx0XHRmb3JtYXRzOiBbJ2VzJ10sXG5cdFx0XHRcdGZpbGVOYW1lOiBtb2R1bGVKU09OLmlkXG5cdFx0XHR9LFxuXHRcdFx0cm9sbHVwT3B0aW9uczoge1xuXHRcdFx0XHRvdXRwdXQ6IHtcblx0XHRcdFx0XHQvLyBSZXdyaXRlIHRoZSBkZWZhdWx0IHN0eWxlLmNzcyB0byBhIG1vcmUgcmVjb2duaXphYmxlIGZpbGUgbmFtZS5cblx0XHRcdFx0XHRhc3NldEZpbGVOYW1lczogKGFzc2V0SW5mbykgPT5cblx0XHRcdFx0XHRcdGFzc2V0SW5mby5uYW1lID09PSAnc3R5bGUuY3NzJyA/IGAke21vZHVsZUpTT04uaWR9LmNzc2AgOiBhc3NldEluZm8ubmFtZSxcblx0XHRcdFx0fSxcblx0XHRcdH1cblx0XHR9LFxuXG5cdFx0Ly8gTmVjZXNzYXJ5IHdoZW4gdXNpbmcgdGhlIGRldiBzZXJ2ZXIgZm9yIHRvcC1sZXZlbCBhd2FpdCB1c2FnZSBpbnNpZGUgVFJMLlxuXHRcdG9wdGltaXplRGVwczoge1xuXHRcdFx0ZXNidWlsZE9wdGlvbnM6IHtcblx0XHRcdFx0dGFyZ2V0OiAnZXMyMDIyJ1xuXHRcdFx0fVxuXHRcdH0sXG5cblx0XHRwbHVnaW5zOiBbXG5cdFx0XHRzdmVsdGUoe1xuXHRcdFx0XHRjb21waWxlck9wdGlvbnMsXG5cdFx0XHRcdHByZXByb2Nlc3M6IHN2ZWx0ZVByZXByb2Nlc3MoKVxuXHRcdFx0fSlcblx0XHRdXG5cdH07XG59O1xuIiwgIntcbiAgXCJpZFwiOiBcIml0ZW0tcGlsZXNcIixcbiAgXCJ0aXRsZVwiOiBcIkl0ZW0gUGlsZXNcIixcbiAgXCJkZXNjcmlwdGlvblwiOiBcIlRoaXMgbW9kdWxlIGFkZHMgdGhlIGFiaWxpdHkgZm9yIGl0ZW1zIHRvIGJlIGRyb3BwZWQgb250byB0aGUgZ3JvdW5kLCBhbmQgdGhlbiBwaWNrZWQgdXAuXCIsXG4gIFwidmVyc2lvblwiOiBcIjEwMC4wLjBcIixcbiAgXCJsaWJyYXJ5XCI6IFwiZmFsc2VcIixcbiAgXCJjb21wYXRpYmlsaXR5XCI6IHtcbiAgICBcIm1pbmltdW1cIjogXCIxMlwiLFxuICAgIFwidmVyaWZpZWRcIjogXCIxM1wiLFxuICAgIFwibWF4aW11bVwiOiBcIjEzXCJcbiAgfSxcbiAgXCJhdXRob3JzXCI6IFtcbiAgICB7XG4gICAgICBcIm5hbWVcIjogXCJXYXNwXCIsXG4gICAgICBcInVybFwiOiBcImh0dHBzOi8vZ2l0aHViLmNvbS9IYXh4ZXJcIixcbiAgICAgIFwiZGlzY29yZFwiOiBcIldhc3AjMjAwNVwiXG4gICAgfVxuICBdLFxuICBcImVzbW9kdWxlc1wiOiBbXG4gICAgXCJkaXN0L2l0ZW0tcGlsZXMuanNcIlxuICBdLFxuICBcInN0eWxlc1wiOiBbXG4gICAgXCJkaXN0L2l0ZW0tcGlsZXMuY3NzXCJcbiAgXSxcbiAgXCJsYW5ndWFnZXNcIjogW1xuICAgIHtcbiAgICAgIFwibGFuZ1wiOiBcImVuXCIsXG4gICAgICBcIm5hbWVcIjogXCJFbmdsaXNoXCIsXG4gICAgICBcInBhdGhcIjogXCJsYW5ndWFnZXMvZW4uanNvblwiXG4gICAgfSxcbiAgICB7XG4gICAgICBcImxhbmdcIjogXCJkZVwiLFxuICAgICAgXCJuYW1lXCI6IFwiRW5nbGlzaFwiLFxuICAgICAgXCJwYXRoXCI6IFwibGFuZ3VhZ2VzL2RlLmpzb25cIlxuICAgIH0sXG4gICAge1xuICAgICAgXCJsYW5nXCI6IFwiZnJcIixcbiAgICAgIFwibmFtZVwiOiBcIkZyZW5jaFwiLFxuICAgICAgXCJwYXRoXCI6IFwibGFuZ3VhZ2VzL2ZyLmpzb25cIlxuICAgIH0sXG4gICAge1xuICAgICAgXCJsYW5nXCI6IFwiamFcIixcbiAgICAgIFwibmFtZVwiOiBcIlx1NjVFNVx1NjcyQ1x1OEE5RVwiLFxuICAgICAgXCJwYXRoXCI6IFwibGFuZ3VhZ2VzL2phLmpzb25cIlxuICAgIH0sXG4gICAge1xuICAgICAgXCJsYW5nXCI6IFwicHQtQlJcIixcbiAgICAgIFwibmFtZVwiOiBcIlBvcnR1Z3VcdTAwRUFzIChCcmFzaWwpXCIsXG4gICAgICBcInBhdGhcIjogXCJsYW5ndWFnZXMvcHQtQlIuanNvblwiXG4gICAgfSxcbiAgICB7XG4gICAgICBcImxhbmdcIjogXCJwbFwiLFxuICAgICAgXCJuYW1lXCI6IFwicG9sc2tpXCIsXG4gICAgICBcInBhdGhcIjogXCJsYW5ndWFnZXMvcGwuanNvblwiXG4gICAgfSxcbiAgICB7XG4gICAgICBcImxhbmdcIjogXCJlc1wiLFxuICAgICAgXCJuYW1lXCI6IFwiRXNwYVx1MDBGMW9sXCIsXG4gICAgICBcInBhdGhcIjogXCJsYW5ndWFnZXMvZXMuanNvblwiXG4gICAgfSxcbiAgICB7XG4gICAgICBcImxhbmdcIjogXCJjblwiLFxuICAgICAgXCJuYW1lXCI6IFwiXHU0RTJEXHU2NTg3XHVGRjA4XHU3QjgwXHU0RjUzXHVGRjA5XCIsXG4gICAgICBcInBhdGhcIjogXCJsYW5ndWFnZXMvemhfSGFucy5qc29uXCJcbiAgICB9LFxuICAgIHtcbiAgICAgIFwibGFuZ1wiOiBcImNzXCIsXG4gICAgICBcIm5hbWVcIjogXCJcdTAxMENlXHUwMTYxdGluYVwiLFxuICAgICAgXCJwYXRoXCI6IFwibGFuZ3VhZ2VzL2NzLmpzb25cIlxuICAgIH0sXG4gICAge1xuICAgICAgXCJsYW5nXCI6IFwiaXRcIixcbiAgICAgIFwibmFtZVwiOiBcIkl0YWxpYW5vXCIsXG4gICAgICBcInBhdGhcIjogXCJsYW5ndWFnZXMvaXQuanNvblwiXG4gICAgfSxcbiAgICB7XG4gICAgICBcImxhbmdcIjogXCJydVwiLFxuICAgICAgXCJuYW1lXCI6IFwiXHUwNDIwXHUwNDQzXHUwNDQxXHUwNDQxXHUwNDNBXHUwNDM4XHUwNDM5XCIsXG4gICAgICBcInBhdGhcIjogXCJsYW5ndWFnZXMvcnUuanNvblwiXG4gICAgfSxcbiAgICB7XG4gICAgICBcImxhbmdcIjogXCJ6aC1IYW50XCIsXG4gICAgICBcIm5hbWVcIjogXCJcdTZGMjJcdThBOUVcdUZGMDhcdTZCNjNcdTlBRDRcdTVCNTdcdUZGMDlcIixcbiAgICAgIFwicGF0aFwiOiBcImxhbmd1YWdlcy96aF9IYW50Lmpzb25cIlxuICAgIH1cbiAgXSxcbiAgXCJyZWxhdGlvbnNoaXBzXCI6IHtcbiAgICBcInJlcXVpcmVzXCI6IFtcbiAgICAgIHtcbiAgICAgICAgXCJpZFwiOiBcInNvY2tldGxpYlwiLFxuICAgICAgICBcInR5cGVcIjogXCJtb2R1bGVcIlxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgXCJpZFwiOiBcImxpYi13cmFwcGVyXCIsXG4gICAgICAgIFwidHlwZVwiOiBcIm1vZHVsZVwiXG4gICAgICB9XG4gICAgXVxuICB9LFxuICBcInNvY2tldFwiOiB0cnVlLFxuICBcInVybFwiOiBcImh0dHBzOi8vZ2l0aHViLmNvbS9mYW50YXN5Y2FsZW5kYXIvRm91bmRyeVZUVC1JdGVtUGlsZXNcIixcbiAgXCJtYW5pZmVzdFwiOiBcImh0dHBzOi8vZ2l0aHViLmNvbS9mYW50YXN5Y2FsZW5kYXIvRm91bmRyeVZUVC1JdGVtUGlsZXMvcmVsZWFzZXMvbGF0ZXN0L2Rvd25sb2FkL21hbmlmZXN0Lmpzb25cIixcbiAgXCJkb3dubG9hZFwiOiBcImh0dHBzOi8vZ2l0aHViLmNvbS9mYW50YXN5Y2FsZW5kYXIvRm91bmRyeVZUVC1JdGVtUGlsZXMvcmVsZWFzZXMvbGF0ZXN0L2Rvd25sb2FkL21vZHVsZS56aXBcIixcbiAgXCJyZWFkbWVcIjogXCJodHRwczovL2dpdGh1Yi5jb20vZmFudGFzeWNhbGVuZGFyL0ZvdW5kcnlWVFQtSXRlbVBpbGVzL2Jsb2IvbWFzdGVyL1JFQURNRS5tZFwiLFxuICBcImJ1Z3NcIjogXCJodHRwczovL2dpdGh1Yi5jb20vZmFudGFzeWNhbGVuZGFyL0ZvdW5kcnlWVFQtSXRlbVBpbGVzL2lzc3Vlc1wiXG59Il0sCiAgIm1hcHBpbmdzIjogIjtBQUNBLFNBQVMsY0FBYztBQUV2QjtBQUFBLEVBQ0M7QUFBQSxFQUNBO0FBQUEsT0FDTTtBQUVQLFNBQVMsd0JBQXdCOzs7QUNSakM7QUFBQSxFQUNFLElBQU07QUFBQSxFQUNOLE9BQVM7QUFBQSxFQUNULGFBQWU7QUFBQSxFQUNmLFNBQVc7QUFBQSxFQUNYLFNBQVc7QUFBQSxFQUNYLGVBQWlCO0FBQUEsSUFDZixTQUFXO0FBQUEsSUFDWCxVQUFZO0FBQUEsSUFDWixTQUFXO0FBQUEsRUFDYjtBQUFBLEVBQ0EsU0FBVztBQUFBLElBQ1Q7QUFBQSxNQUNFLE1BQVE7QUFBQSxNQUNSLEtBQU87QUFBQSxNQUNQLFNBQVc7QUFBQSxJQUNiO0FBQUEsRUFDRjtBQUFBLEVBQ0EsV0FBYTtBQUFBLElBQ1g7QUFBQSxFQUNGO0FBQUEsRUFDQSxRQUFVO0FBQUEsSUFDUjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFdBQWE7QUFBQSxJQUNYO0FBQUEsTUFDRSxNQUFRO0FBQUEsTUFDUixNQUFRO0FBQUEsTUFDUixNQUFRO0FBQUEsSUFDVjtBQUFBLElBQ0E7QUFBQSxNQUNFLE1BQVE7QUFBQSxNQUNSLE1BQVE7QUFBQSxNQUNSLE1BQVE7QUFBQSxJQUNWO0FBQUEsSUFDQTtBQUFBLE1BQ0UsTUFBUTtBQUFBLE1BQ1IsTUFBUTtBQUFBLE1BQ1IsTUFBUTtBQUFBLElBQ1Y7QUFBQSxJQUNBO0FBQUEsTUFDRSxNQUFRO0FBQUEsTUFDUixNQUFRO0FBQUEsTUFDUixNQUFRO0FBQUEsSUFDVjtBQUFBLElBQ0E7QUFBQSxNQUNFLE1BQVE7QUFBQSxNQUNSLE1BQVE7QUFBQSxNQUNSLE1BQVE7QUFBQSxJQUNWO0FBQUEsSUFDQTtBQUFBLE1BQ0UsTUFBUTtBQUFBLE1BQ1IsTUFBUTtBQUFBLE1BQ1IsTUFBUTtBQUFBLElBQ1Y7QUFBQSxJQUNBO0FBQUEsTUFDRSxNQUFRO0FBQUEsTUFDUixNQUFRO0FBQUEsTUFDUixNQUFRO0FBQUEsSUFDVjtBQUFBLElBQ0E7QUFBQSxNQUNFLE1BQVE7QUFBQSxNQUNSLE1BQVE7QUFBQSxNQUNSLE1BQVE7QUFBQSxJQUNWO0FBQUEsSUFDQTtBQUFBLE1BQ0UsTUFBUTtBQUFBLE1BQ1IsTUFBUTtBQUFBLE1BQ1IsTUFBUTtBQUFBLElBQ1Y7QUFBQSxJQUNBO0FBQUEsTUFDRSxNQUFRO0FBQUEsTUFDUixNQUFRO0FBQUEsTUFDUixNQUFRO0FBQUEsSUFDVjtBQUFBLElBQ0E7QUFBQSxNQUNFLE1BQVE7QUFBQSxNQUNSLE1BQVE7QUFBQSxNQUNSLE1BQVE7QUFBQSxJQUNWO0FBQUEsSUFDQTtBQUFBLE1BQ0UsTUFBUTtBQUFBLE1BQ1IsTUFBUTtBQUFBLE1BQ1IsTUFBUTtBQUFBLElBQ1Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxlQUFpQjtBQUFBLElBQ2YsVUFBWTtBQUFBLE1BQ1Y7QUFBQSxRQUNFLElBQU07QUFBQSxRQUNOLE1BQVE7QUFBQSxNQUNWO0FBQUEsTUFDQTtBQUFBLFFBQ0UsSUFBTTtBQUFBLFFBQ04sTUFBUTtBQUFBLE1BQ1Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsUUFBVTtBQUFBLEVBQ1YsS0FBTztBQUFBLEVBQ1AsVUFBWTtBQUFBLEVBQ1osVUFBWTtBQUFBLEVBQ1osUUFBVTtBQUFBLEVBQ1YsTUFBUTtBQUNWOzs7QUR6RkEsSUFBTSxlQUFlLFdBQVcsZUFBVyxFQUFFO0FBSzdDLElBQU0sbUJBQW1CO0FBRXpCLElBQU0sYUFBYTtBQUNuQixJQUFNLGVBQWU7QUFFckIsSUFBTyxzQkFBUSxDQUFDLEVBQUUsS0FBSyxNQUFNO0FBSzVCLFFBQU0sa0JBQWtCLFNBQVMsZUFBZTtBQUFBLElBQy9DLFNBQVMsQ0FBQyxFQUFFLE1BQU0sSUFBSSxNQUFNLFVBQVUsZ0JBQWdCLElBQUksS0FBSyxHQUFHLENBQUM7QUFBQSxFQUNwRSxJQUFJLENBQUM7QUFHTCxTQUFPO0FBQUEsSUFDTixNQUFNO0FBQUE7QUFBQSxJQUNOLE1BQU0sSUFBSSxZQUFZO0FBQUE7QUFBQSxJQUN0QixXQUFXO0FBQUE7QUFBQSxJQUNYLFVBQVU7QUFBQTtBQUFBLElBRVYsU0FBUztBQUFBLE1BQ1IsWUFBWSxDQUFDLFdBQVcsUUFBUTtBQUFBLElBQ2pDO0FBQUEsSUFFQSxTQUFTO0FBQUEsTUFDUixRQUFRLENBQUMsUUFBUTtBQUFBLElBQ2xCO0FBQUEsSUFFQSxLQUFLO0FBQUE7QUFBQSxNQUVKLFNBQVMsY0FBYyxFQUFFLFVBQVUsWUFBWSxXQUFXLGFBQWEsQ0FBQztBQUFBLElBQ3pFO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFXQSxRQUFRO0FBQUEsTUFDUCxNQUFNO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixPQUFPO0FBQUE7QUFBQSxRQUVOLENBQUMsTUFBTSxZQUFZLDRCQUE0QixlQUFXLEVBQUUsUUFBUSxHQUFHO0FBQUE7QUFBQSxRQUd2RSxDQUFDLFFBQVEsWUFBWSxJQUFJLEdBQUc7QUFBQTtBQUFBLFFBRzVCLENBQUMsSUFBSSxZQUFZLFNBQVMsZUFBVyxFQUFFLEtBQUssR0FBRztBQUFBLFVBQzlDLFFBQVEsMEJBQTBCLFlBQVk7QUFBQSxVQUM5QyxTQUFTLE1BQU07QUFBQSxRQUNoQjtBQUFBO0FBQUEsUUFHQSxjQUFjLEVBQUUsUUFBUSx3QkFBd0IsSUFBSSxLQUFLO0FBQUEsTUFDMUQ7QUFBQSxJQUNEO0FBQUEsSUFFQSxPQUFPO0FBQUEsTUFDTixRQUFRO0FBQUEsTUFDUixhQUFhO0FBQUEsTUFDYixXQUFXO0FBQUEsTUFDWCxZQUFZO0FBQUEsTUFDWixRQUFRLGFBQWEsV0FBVztBQUFBLE1BQ2hDLFFBQVEsQ0FBQyxRQUFRO0FBQUEsTUFDakIsZUFBZSxhQUFhLEVBQUUsR0FBRyxhQUFhLEdBQUcsTUFBTSxLQUFLLElBQUk7QUFBQSxNQUNoRSxLQUFLO0FBQUEsUUFDSixPQUFPO0FBQUEsUUFDUCxTQUFTLENBQUMsSUFBSTtBQUFBLFFBQ2QsVUFBVSxlQUFXO0FBQUEsTUFDdEI7QUFBQSxNQUNBLGVBQWU7QUFBQSxRQUNkLFFBQVE7QUFBQTtBQUFBLFVBRVAsZ0JBQWdCLENBQUMsY0FDaEIsVUFBVSxTQUFTLGNBQWMsR0FBRyxlQUFXLEVBQUUsU0FBUyxVQUFVO0FBQUEsUUFDdEU7QUFBQSxNQUNEO0FBQUEsSUFDRDtBQUFBO0FBQUEsSUFHQSxjQUFjO0FBQUEsTUFDYixnQkFBZ0I7QUFBQSxRQUNmLFFBQVE7QUFBQSxNQUNUO0FBQUEsSUFDRDtBQUFBLElBRUEsU0FBUztBQUFBLE1BQ1IsT0FBTztBQUFBLFFBQ047QUFBQSxRQUNBLFlBQVksaUJBQWlCO0FBQUEsTUFDOUIsQ0FBQztBQUFBLElBQ0Y7QUFBQSxFQUNEO0FBQ0Q7IiwKICAibmFtZXMiOiBbXQp9Cg==
