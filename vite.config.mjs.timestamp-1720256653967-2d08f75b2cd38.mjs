// vite.config.mjs
import { svelte } from "file:///C:/Users/adam_/Desktop/FoundryVTT-Scripts/FoundryVTT-ItemPiles/node_modules/@sveltejs/vite-plugin-svelte/src/index.js";
import resolve from "file:///C:/Users/adam_/Desktop/FoundryVTT-Scripts/FoundryVTT-ItemPiles/node_modules/@rollup/plugin-node-resolve/dist/es/index.js";
import preprocess from "file:///C:/Users/adam_/Desktop/FoundryVTT-Scripts/FoundryVTT-ItemPiles/node_modules/svelte-preprocess/dist/index.js";
import {
  postcssConfig,
  terserConfig
} from "file:///C:/Users/adam_/Desktop/FoundryVTT-Scripts/FoundryVTT-ItemPiles/node_modules/@typhonjs-fvtt/runtime/.rollup/remote/index.js";
var __vite_injected_original_dirname = "C:\\Users\\adam_\\Desktop\\FoundryVTT-Scripts\\FoundryVTT-ItemPiles";
var s_PACKAGE_ID = "modules/item-piles";
var s_SVELTE_HASH_ID = "tse";
var s_COMPRESS = false;
var s_SOURCEMAPS = true;
var s_RESOLVE_CONFIG = {
  browser: true,
  dedupe: ["svelte"]
};
var vite_config_default = () => {
  return {
    root: "src/",
    // Source location / esbuild root.
    base: `/${s_PACKAGE_ID}/`,
    // Base module path that 30001 / served dev directory.
    publicDir: false,
    // No public resources to copy.
    cacheDir: "../.vite-cache",
    // Relative from root directory.
    resolve: { conditions: ["import", "browser"] },
    esbuild: {
      target: ["es2022"]
    },
    css: {
      // Creates a standard configuration for PostCSS with autoprefixer & postcss-preset-env.
      postcss: postcssConfig({ compress: s_COMPRESS, sourceMap: s_SOURCEMAPS })
    },
    // About server options:
    // - Set to `open` to boolean `false` to not open a browser window automatically. This is useful if you set up a
    // debugger instance in your IDE and launch it with the URL: 'http://localhost:30001/game'.
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
        [`^(/${s_PACKAGE_ID}/(assets|lang|packs|style.css))`]: "http://localhost:30000",
        // All other paths besides package ID path are served from main Foundry server.
        [`^(?!/${s_PACKAGE_ID}/)`]: "http://localhost:30000",
        // Enable socket.io from main Foundry server.
        "/socket.io": { target: "ws://localhost:30000", ws: true }
      }
    },
    build: {
      outDir: __vite_injected_original_dirname,
      emptyOutDir: false,
      sourcemap: s_SOURCEMAPS,
      brotliSize: true,
      minify: s_COMPRESS ? "terser" : false,
      target: ["es2022"],
      terserOptions: s_COMPRESS ? { ...terserConfig(), ecma: 2022 } : void 0,
      lib: {
        entry: "./module.js",
        formats: ["es"],
        fileName: "module"
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
        compilerOptions: {
          // Provides a custom hash adding the string defined in `s_SVELTE_HASH_ID` to scoped Svelte styles;
          // This is reasonable to do as the framework styles in TRL compiled across `n` different packages will
          // be the same. Slightly modifying the hash ensures that your package has uniquely scoped styles for all
          // TRL components and makes it easier to review styles in the browser debugger.
          cssHash: ({ hash, css }) => `svelte-${s_SVELTE_HASH_ID}-${hash(css)}`
        },
        preprocess: preprocess()
      }),
      resolve(s_RESOLVE_CONFIG)
      // Necessary when bundling npm-linked packages.
    ]
  };
};
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcubWpzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcYWRhbV9cXFxcRGVza3RvcFxcXFxGb3VuZHJ5VlRULVNjcmlwdHNcXFxcRm91bmRyeVZUVC1JdGVtUGlsZXNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGFkYW1fXFxcXERlc2t0b3BcXFxcRm91bmRyeVZUVC1TY3JpcHRzXFxcXEZvdW5kcnlWVFQtSXRlbVBpbGVzXFxcXHZpdGUuY29uZmlnLm1qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvYWRhbV8vRGVza3RvcC9Gb3VuZHJ5VlRULVNjcmlwdHMvRm91bmRyeVZUVC1JdGVtUGlsZXMvdml0ZS5jb25maWcubWpzXCI7LyogZXNsaW50LWVudiBub2RlICovXG5pbXBvcnQgeyBzdmVsdGUgfSAgICBmcm9tICdAc3ZlbHRlanMvdml0ZS1wbHVnaW4tc3ZlbHRlJztcbmltcG9ydCByZXNvbHZlICAgICAgIGZyb20gJ0Byb2xsdXAvcGx1Z2luLW5vZGUtcmVzb2x2ZSc7IC8vIFRoaXMgcmVzb2x2ZXMgTlBNIG1vZHVsZXMgZnJvbSBub2RlX21vZHVsZXMuXG5pbXBvcnQgcHJlcHJvY2VzcyAgICBmcm9tICdzdmVsdGUtcHJlcHJvY2Vzcyc7XG5pbXBvcnQge1xuXHRwb3N0Y3NzQ29uZmlnLFxuXHR0ZXJzZXJDb25maWcgfSAgICBmcm9tICdAdHlwaG9uanMtZnZ0dC9ydW50aW1lL3JvbGx1cCc7XG5cbi8vIEFUVEVOVElPTiFcbi8vIFBsZWFzZSBtb2RpZnkgdGhlIGJlbG93IHZhcmlhYmxlczogc19QQUNLQUdFX0lEIGFuZCBzX1NWRUxURV9IQVNIX0lEIGFwcHJvcHJpYXRlbHkuXG5cbi8vIEZvciBjb252ZW5pZW5jZSwgeW91IGp1c3QgbmVlZCB0byBtb2RpZnkgdGhlIHBhY2thZ2UgSUQgYmVsb3cgYXMgaXQgaXMgdXNlZCB0byBmaWxsIGluIGRlZmF1bHQgcHJveHkgc2V0dGluZ3MgZm9yXG4vLyB0aGUgZGV2IHNlcnZlci5cbmNvbnN0IHNfUEFDS0FHRV9JRCA9ICdtb2R1bGVzL2l0ZW0tcGlsZXMnO1xuXG4vLyBBIHNob3J0IGFkZGl0aW9uYWwgc3RyaW5nIHRvIGFkZCB0byBTdmVsdGUgQ1NTIGhhc2ggdmFsdWVzIHRvIG1ha2UgeW91cnMgdW5pcXVlLiBUaGlzIHJlZHVjZXMgdGhlIGFtb3VudCBvZlxuLy8gZHVwbGljYXRlZCBmcmFtZXdvcmsgQ1NTIG92ZXJsYXAgYmV0d2VlbiBtYW55IFRSTCBwYWNrYWdlcyBlbmFibGVkIG9uIEZvdW5kcnkgVlRUIGF0IHRoZSBzYW1lIHRpbWUuICd0c2UnIGlzIGNob3NlblxuLy8gYnkgc2hvcnRlbmluZyAndGVtcGxhdGUtc3ZlbHRlLWVzbScuXG5jb25zdCBzX1NWRUxURV9IQVNIX0lEID0gJ3RzZSc7XG5cbmNvbnN0IHNfQ09NUFJFU1MgPSBmYWxzZTsgIC8vIFNldCB0byB0cnVlIHRvIGNvbXByZXNzIHRoZSBtb2R1bGUgYnVuZGxlLlxuY29uc3Qgc19TT1VSQ0VNQVBTID0gdHJ1ZTsgLy8gR2VuZXJhdGUgc291cmNlbWFwcyBmb3IgdGhlIGJ1bmRsZSAocmVjb21tZW5kZWQpLlxuXG4vLyBVc2VkIGluIGJ1bmRsaW5nIHBhcnRpY3VsYXJseSBkdXJpbmcgZGV2ZWxvcG1lbnQuIElmIHlvdSBucG0tbGluayBwYWNrYWdlcyB0byB5b3VyIHByb2plY3QgYWRkIHRoZW0gaGVyZS5cbmNvbnN0IHNfUkVTT0xWRV9DT05GSUcgPSB7XG5cdGJyb3dzZXI6IHRydWUsXG5cdGRlZHVwZTogWydzdmVsdGUnXVxufTtcblxuZXhwb3J0IGRlZmF1bHQgKCkgPT5cbntcblx0LyoqIEB0eXBlIHtpbXBvcnQoJ3ZpdGUnKS5Vc2VyQ29uZmlnfSAqL1xuXHRyZXR1cm4ge1xuXHRcdHJvb3Q6ICdzcmMvJywgICAgICAgICAgICAgICAgIC8vIFNvdXJjZSBsb2NhdGlvbiAvIGVzYnVpbGQgcm9vdC5cblx0XHRiYXNlOiBgLyR7c19QQUNLQUdFX0lEfS9gLCAgICAvLyBCYXNlIG1vZHVsZSBwYXRoIHRoYXQgMzAwMDEgLyBzZXJ2ZWQgZGV2IGRpcmVjdG9yeS5cblx0XHRwdWJsaWNEaXI6IGZhbHNlLCAgICAgICAgICAgICAvLyBObyBwdWJsaWMgcmVzb3VyY2VzIHRvIGNvcHkuXG5cdFx0Y2FjaGVEaXI6ICcuLi8udml0ZS1jYWNoZScsICAgLy8gUmVsYXRpdmUgZnJvbSByb290IGRpcmVjdG9yeS5cblxuXHRcdHJlc29sdmU6IHsgY29uZGl0aW9uczogWydpbXBvcnQnLCAnYnJvd3NlciddIH0sXG5cblx0XHRlc2J1aWxkOiB7XG5cdFx0XHR0YXJnZXQ6IFsnZXMyMDIyJ11cblx0XHR9LFxuXG5cdFx0Y3NzOiB7XG5cdFx0XHQvLyBDcmVhdGVzIGEgc3RhbmRhcmQgY29uZmlndXJhdGlvbiBmb3IgUG9zdENTUyB3aXRoIGF1dG9wcmVmaXhlciAmIHBvc3Rjc3MtcHJlc2V0LWVudi5cblx0XHRcdHBvc3Rjc3M6IHBvc3Rjc3NDb25maWcoeyBjb21wcmVzczogc19DT01QUkVTUywgc291cmNlTWFwOiBzX1NPVVJDRU1BUFMgfSlcblx0XHR9LFxuXG5cdFx0Ly8gQWJvdXQgc2VydmVyIG9wdGlvbnM6XG5cdFx0Ly8gLSBTZXQgdG8gYG9wZW5gIHRvIGJvb2xlYW4gYGZhbHNlYCB0byBub3Qgb3BlbiBhIGJyb3dzZXIgd2luZG93IGF1dG9tYXRpY2FsbHkuIFRoaXMgaXMgdXNlZnVsIGlmIHlvdSBzZXQgdXAgYVxuXHRcdC8vIGRlYnVnZ2VyIGluc3RhbmNlIGluIHlvdXIgSURFIGFuZCBsYXVuY2ggaXQgd2l0aCB0aGUgVVJMOiAnaHR0cDovL2xvY2FsaG9zdDozMDAwMS9nYW1lJy5cblx0XHQvL1xuXHRcdC8vIC0gVGhlIHRvcCBwcm94eSBlbnRyeSByZWRpcmVjdHMgcmVxdWVzdHMgdW5kZXIgdGhlIG1vZHVsZSBwYXRoIGZvciBgc3R5bGUuY3NzYCBhbmQgZm9sbG93aW5nIHN0YW5kYXJkIHN0YXRpY1xuXHRcdC8vIGRpcmVjdG9yaWVzOiBgYXNzZXRzYCwgYGxhbmdgLCBhbmQgYHBhY2tzYCBhbmQgd2lsbCBwdWxsIHRob3NlIHJlc291cmNlcyBmcm9tIHRoZSBtYWluIEZvdW5kcnkgLyAzMDAwMCBzZXJ2ZXIuXG5cdFx0Ly8gVGhpcyBpcyBuZWNlc3NhcnkgdG8gcmVmZXJlbmNlIHRoZSBkZXYgcmVzb3VyY2VzIGFzIHRoZSByb290IGlzIGAvc3JjYCBhbmQgdGhlcmUgaXMgbm8gcHVibGljIC8gc3RhdGljXG5cdFx0Ly8gcmVzb3VyY2VzIHNlcnZlZCB3aXRoIHRoaXMgcGFydGljdWxhciBWaXRlIGNvbmZpZ3VyYXRpb24uIE1vZGlmeSB0aGUgcHJveHkgcnVsZSBhcyBuZWNlc3NhcnkgZm9yIHlvdXJcblx0XHQvLyBzdGF0aWMgcmVzb3VyY2VzIC8gcHJvamVjdC5cblx0XHRzZXJ2ZXI6IHtcblx0XHRcdHBvcnQ6IDI5OTk5LFxuXHRcdFx0b3BlbjogJy9nYW1lJyxcblx0XHRcdHByb3h5OiB7XG5cdFx0XHRcdC8vIFNlcnZlcyBzdGF0aWMgZmlsZXMgZnJvbSBtYWluIEZvdW5kcnkgc2VydmVyLlxuXHRcdFx0XHRbYF4oLyR7c19QQUNLQUdFX0lEfS8oYXNzZXRzfGxhbmd8cGFja3N8c3R5bGUuY3NzKSlgXTogJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMDAnLFxuXG5cdFx0XHRcdC8vIEFsbCBvdGhlciBwYXRocyBiZXNpZGVzIHBhY2thZ2UgSUQgcGF0aCBhcmUgc2VydmVkIGZyb20gbWFpbiBGb3VuZHJ5IHNlcnZlci5cblx0XHRcdFx0W2BeKD8hLyR7c19QQUNLQUdFX0lEfS8pYF06ICdodHRwOi8vbG9jYWxob3N0OjMwMDAwJyxcblxuXHRcdFx0XHQvLyBFbmFibGUgc29ja2V0LmlvIGZyb20gbWFpbiBGb3VuZHJ5IHNlcnZlci5cblx0XHRcdFx0Jy9zb2NrZXQuaW8nOiB7IHRhcmdldDogJ3dzOi8vbG9jYWxob3N0OjMwMDAwJywgd3M6IHRydWUgfVxuXHRcdFx0fVxuXHRcdH0sXG5cblx0XHRidWlsZDoge1xuXHRcdFx0b3V0RGlyOiBfX2Rpcm5hbWUsXG5cdFx0XHRlbXB0eU91dERpcjogZmFsc2UsXG5cdFx0XHRzb3VyY2VtYXA6IHNfU09VUkNFTUFQUyxcblx0XHRcdGJyb3RsaVNpemU6IHRydWUsXG5cdFx0XHRtaW5pZnk6IHNfQ09NUFJFU1MgPyAndGVyc2VyJyA6IGZhbHNlLFxuXHRcdFx0dGFyZ2V0OiBbJ2VzMjAyMiddLFxuXHRcdFx0dGVyc2VyT3B0aW9uczogc19DT01QUkVTUyA/IHsgLi4udGVyc2VyQ29uZmlnKCksIGVjbWE6IDIwMjIgfSA6IHZvaWQgMCxcblx0XHRcdGxpYjoge1xuXHRcdFx0XHRlbnRyeTogJy4vbW9kdWxlLmpzJyxcblx0XHRcdFx0Zm9ybWF0czogWydlcyddLFxuXHRcdFx0XHRmaWxlTmFtZTogJ21vZHVsZSdcblx0XHRcdH1cblx0XHR9LFxuXG5cdFx0Ly8gTmVjZXNzYXJ5IHdoZW4gdXNpbmcgdGhlIGRldiBzZXJ2ZXIgZm9yIHRvcC1sZXZlbCBhd2FpdCB1c2FnZSBpbnNpZGUgVFJMLlxuXHRcdG9wdGltaXplRGVwczoge1xuXHRcdFx0ZXNidWlsZE9wdGlvbnM6IHtcblx0XHRcdFx0dGFyZ2V0OiAnZXMyMDIyJ1xuXHRcdFx0fVxuXHRcdH0sXG5cblx0XHRwbHVnaW5zOiBbXG5cdFx0XHRzdmVsdGUoe1xuXHRcdFx0XHRjb21waWxlck9wdGlvbnM6IHtcblx0XHRcdFx0XHQvLyBQcm92aWRlcyBhIGN1c3RvbSBoYXNoIGFkZGluZyB0aGUgc3RyaW5nIGRlZmluZWQgaW4gYHNfU1ZFTFRFX0hBU0hfSURgIHRvIHNjb3BlZCBTdmVsdGUgc3R5bGVzO1xuXHRcdFx0XHRcdC8vIFRoaXMgaXMgcmVhc29uYWJsZSB0byBkbyBhcyB0aGUgZnJhbWV3b3JrIHN0eWxlcyBpbiBUUkwgY29tcGlsZWQgYWNyb3NzIGBuYCBkaWZmZXJlbnQgcGFja2FnZXMgd2lsbFxuXHRcdFx0XHRcdC8vIGJlIHRoZSBzYW1lLiBTbGlnaHRseSBtb2RpZnlpbmcgdGhlIGhhc2ggZW5zdXJlcyB0aGF0IHlvdXIgcGFja2FnZSBoYXMgdW5pcXVlbHkgc2NvcGVkIHN0eWxlcyBmb3IgYWxsXG5cdFx0XHRcdFx0Ly8gVFJMIGNvbXBvbmVudHMgYW5kIG1ha2VzIGl0IGVhc2llciB0byByZXZpZXcgc3R5bGVzIGluIHRoZSBicm93c2VyIGRlYnVnZ2VyLlxuXHRcdFx0XHRcdGNzc0hhc2g6ICh7IGhhc2gsIGNzcyB9KSA9PiBgc3ZlbHRlLSR7c19TVkVMVEVfSEFTSF9JRH0tJHtoYXNoKGNzcyl9YFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRwcmVwcm9jZXNzOiBwcmVwcm9jZXNzKClcblx0XHRcdH0pLFxuXG5cdFx0XHRyZXNvbHZlKHNfUkVTT0xWRV9DT05GSUcpICAvLyBOZWNlc3Nhcnkgd2hlbiBidW5kbGluZyBucG0tbGlua2VkIHBhY2thZ2VzLlxuXHRcdF1cblx0fTtcbn07XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQ0EsU0FBUyxjQUFpQjtBQUMxQixPQUFPLGFBQW1CO0FBQzFCLE9BQU8sZ0JBQW1CO0FBQzFCO0FBQUEsRUFDQztBQUFBLEVBQ0E7QUFBQSxPQUF1QjtBQU54QixJQUFNLG1DQUFtQztBQWF6QyxJQUFNLGVBQWU7QUFLckIsSUFBTSxtQkFBbUI7QUFFekIsSUFBTSxhQUFhO0FBQ25CLElBQU0sZUFBZTtBQUdyQixJQUFNLG1CQUFtQjtBQUFBLEVBQ3hCLFNBQVM7QUFBQSxFQUNULFFBQVEsQ0FBQyxRQUFRO0FBQ2xCO0FBRUEsSUFBTyxzQkFBUSxNQUNmO0FBRUMsU0FBTztBQUFBLElBQ04sTUFBTTtBQUFBO0FBQUEsSUFDTixNQUFNLElBQUksWUFBWTtBQUFBO0FBQUEsSUFDdEIsV0FBVztBQUFBO0FBQUEsSUFDWCxVQUFVO0FBQUE7QUFBQSxJQUVWLFNBQVMsRUFBRSxZQUFZLENBQUMsVUFBVSxTQUFTLEVBQUU7QUFBQSxJQUU3QyxTQUFTO0FBQUEsTUFDUixRQUFRLENBQUMsUUFBUTtBQUFBLElBQ2xCO0FBQUEsSUFFQSxLQUFLO0FBQUE7QUFBQSxNQUVKLFNBQVMsY0FBYyxFQUFFLFVBQVUsWUFBWSxXQUFXLGFBQWEsQ0FBQztBQUFBLElBQ3pFO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFXQSxRQUFRO0FBQUEsTUFDUCxNQUFNO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixPQUFPO0FBQUE7QUFBQSxRQUVOLENBQUMsTUFBTSxZQUFZLGlDQUFpQyxHQUFHO0FBQUE7QUFBQSxRQUd2RCxDQUFDLFFBQVEsWUFBWSxJQUFJLEdBQUc7QUFBQTtBQUFBLFFBRzVCLGNBQWMsRUFBRSxRQUFRLHdCQUF3QixJQUFJLEtBQUs7QUFBQSxNQUMxRDtBQUFBLElBQ0Q7QUFBQSxJQUVBLE9BQU87QUFBQSxNQUNOLFFBQVE7QUFBQSxNQUNSLGFBQWE7QUFBQSxNQUNiLFdBQVc7QUFBQSxNQUNYLFlBQVk7QUFBQSxNQUNaLFFBQVEsYUFBYSxXQUFXO0FBQUEsTUFDaEMsUUFBUSxDQUFDLFFBQVE7QUFBQSxNQUNqQixlQUFlLGFBQWEsRUFBRSxHQUFHLGFBQWEsR0FBRyxNQUFNLEtBQUssSUFBSTtBQUFBLE1BQ2hFLEtBQUs7QUFBQSxRQUNKLE9BQU87QUFBQSxRQUNQLFNBQVMsQ0FBQyxJQUFJO0FBQUEsUUFDZCxVQUFVO0FBQUEsTUFDWDtBQUFBLElBQ0Q7QUFBQTtBQUFBLElBR0EsY0FBYztBQUFBLE1BQ2IsZ0JBQWdCO0FBQUEsUUFDZixRQUFRO0FBQUEsTUFDVDtBQUFBLElBQ0Q7QUFBQSxJQUVBLFNBQVM7QUFBQSxNQUNSLE9BQU87QUFBQSxRQUNOLGlCQUFpQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsVUFLaEIsU0FBUyxDQUFDLEVBQUUsTUFBTSxJQUFJLE1BQU0sVUFBVSxnQkFBZ0IsSUFBSSxLQUFLLEdBQUcsQ0FBQztBQUFBLFFBQ3BFO0FBQUEsUUFDQSxZQUFZLFdBQVc7QUFBQSxNQUN4QixDQUFDO0FBQUEsTUFFRCxRQUFRLGdCQUFnQjtBQUFBO0FBQUEsSUFDekI7QUFBQSxFQUNEO0FBQ0Q7IiwKICAibmFtZXMiOiBbXQp9Cg==
