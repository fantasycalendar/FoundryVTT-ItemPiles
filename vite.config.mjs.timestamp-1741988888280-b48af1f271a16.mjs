// vite.config.mjs
import { svelte } from "file:///mnt/c/Users/adam_/Desktop/FoundryVTT-Scripts/FoundryVTT-ItemPiles/node_modules/@sveltejs/vite-plugin-svelte/src/index.js";
import resolve from "file:///mnt/c/Users/adam_/Desktop/FoundryVTT-Scripts/FoundryVTT-ItemPiles/node_modules/@rollup/plugin-node-resolve/dist/es/index.js";
import preprocess from "file:///mnt/c/Users/adam_/Desktop/FoundryVTT-Scripts/FoundryVTT-ItemPiles/node_modules/svelte-preprocess/dist/index.js";
import {
  postcssConfig,
  terserConfig
} from "file:///mnt/c/Users/adam_/Desktop/FoundryVTT-Scripts/FoundryVTT-ItemPiles/node_modules/@typhonjs-fvtt/runtime/.rollup/remote/index.js";
var __vite_injected_original_dirname = "/mnt/c/Users/adam_/Desktop/FoundryVTT-Scripts/FoundryVTT-ItemPiles";
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcubWpzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL21udC9jL1VzZXJzL2FkYW1fL0Rlc2t0b3AvRm91bmRyeVZUVC1TY3JpcHRzL0ZvdW5kcnlWVFQtSXRlbVBpbGVzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvbW50L2MvVXNlcnMvYWRhbV8vRGVza3RvcC9Gb3VuZHJ5VlRULVNjcmlwdHMvRm91bmRyeVZUVC1JdGVtUGlsZXMvdml0ZS5jb25maWcubWpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9tbnQvYy9Vc2Vycy9hZGFtXy9EZXNrdG9wL0ZvdW5kcnlWVFQtU2NyaXB0cy9Gb3VuZHJ5VlRULUl0ZW1QaWxlcy92aXRlLmNvbmZpZy5tanNcIjsvKiBlc2xpbnQtZW52IG5vZGUgKi9cbmltcG9ydCB7IHN2ZWx0ZSB9ICAgIGZyb20gJ0BzdmVsdGVqcy92aXRlLXBsdWdpbi1zdmVsdGUnO1xuaW1wb3J0IHJlc29sdmUgICAgICAgZnJvbSAnQHJvbGx1cC9wbHVnaW4tbm9kZS1yZXNvbHZlJzsgLy8gVGhpcyByZXNvbHZlcyBOUE0gbW9kdWxlcyBmcm9tIG5vZGVfbW9kdWxlcy5cbmltcG9ydCBwcmVwcm9jZXNzICAgIGZyb20gJ3N2ZWx0ZS1wcmVwcm9jZXNzJztcbmltcG9ydCB7XG5cdHBvc3Rjc3NDb25maWcsXG5cdHRlcnNlckNvbmZpZyB9ICAgIGZyb20gJ0B0eXBob25qcy1mdnR0L3J1bnRpbWUvcm9sbHVwJztcblxuLy8gQVRURU5USU9OIVxuLy8gUGxlYXNlIG1vZGlmeSB0aGUgYmVsb3cgdmFyaWFibGVzOiBzX1BBQ0tBR0VfSUQgYW5kIHNfU1ZFTFRFX0hBU0hfSUQgYXBwcm9wcmlhdGVseS5cblxuLy8gRm9yIGNvbnZlbmllbmNlLCB5b3UganVzdCBuZWVkIHRvIG1vZGlmeSB0aGUgcGFja2FnZSBJRCBiZWxvdyBhcyBpdCBpcyB1c2VkIHRvIGZpbGwgaW4gZGVmYXVsdCBwcm94eSBzZXR0aW5ncyBmb3Jcbi8vIHRoZSBkZXYgc2VydmVyLlxuY29uc3Qgc19QQUNLQUdFX0lEID0gJ21vZHVsZXMvaXRlbS1waWxlcyc7XG5cbi8vIEEgc2hvcnQgYWRkaXRpb25hbCBzdHJpbmcgdG8gYWRkIHRvIFN2ZWx0ZSBDU1MgaGFzaCB2YWx1ZXMgdG8gbWFrZSB5b3VycyB1bmlxdWUuIFRoaXMgcmVkdWNlcyB0aGUgYW1vdW50IG9mXG4vLyBkdXBsaWNhdGVkIGZyYW1ld29yayBDU1Mgb3ZlcmxhcCBiZXR3ZWVuIG1hbnkgVFJMIHBhY2thZ2VzIGVuYWJsZWQgb24gRm91bmRyeSBWVFQgYXQgdGhlIHNhbWUgdGltZS4gJ3RzZScgaXMgY2hvc2VuXG4vLyBieSBzaG9ydGVuaW5nICd0ZW1wbGF0ZS1zdmVsdGUtZXNtJy5cbmNvbnN0IHNfU1ZFTFRFX0hBU0hfSUQgPSAndHNlJztcblxuY29uc3Qgc19DT01QUkVTUyA9IGZhbHNlOyAgLy8gU2V0IHRvIHRydWUgdG8gY29tcHJlc3MgdGhlIG1vZHVsZSBidW5kbGUuXG5jb25zdCBzX1NPVVJDRU1BUFMgPSB0cnVlOyAvLyBHZW5lcmF0ZSBzb3VyY2VtYXBzIGZvciB0aGUgYnVuZGxlIChyZWNvbW1lbmRlZCkuXG5cbi8vIFVzZWQgaW4gYnVuZGxpbmcgcGFydGljdWxhcmx5IGR1cmluZyBkZXZlbG9wbWVudC4gSWYgeW91IG5wbS1saW5rIHBhY2thZ2VzIHRvIHlvdXIgcHJvamVjdCBhZGQgdGhlbSBoZXJlLlxuY29uc3Qgc19SRVNPTFZFX0NPTkZJRyA9IHtcblx0YnJvd3NlcjogdHJ1ZSxcblx0ZGVkdXBlOiBbJ3N2ZWx0ZSddXG59O1xuXG5leHBvcnQgZGVmYXVsdCAoKSA9Plxue1xuXHQvKiogQHR5cGUge2ltcG9ydCgndml0ZScpLlVzZXJDb25maWd9ICovXG5cdHJldHVybiB7XG5cdFx0cm9vdDogJ3NyYy8nLCAgICAgICAgICAgICAgICAgLy8gU291cmNlIGxvY2F0aW9uIC8gZXNidWlsZCByb290LlxuXHRcdGJhc2U6IGAvJHtzX1BBQ0tBR0VfSUR9L2AsICAgIC8vIEJhc2UgbW9kdWxlIHBhdGggdGhhdCAzMDAwMSAvIHNlcnZlZCBkZXYgZGlyZWN0b3J5LlxuXHRcdHB1YmxpY0RpcjogZmFsc2UsICAgICAgICAgICAgIC8vIE5vIHB1YmxpYyByZXNvdXJjZXMgdG8gY29weS5cblx0XHRjYWNoZURpcjogJy4uLy52aXRlLWNhY2hlJywgICAvLyBSZWxhdGl2ZSBmcm9tIHJvb3QgZGlyZWN0b3J5LlxuXG5cdFx0cmVzb2x2ZTogeyBjb25kaXRpb25zOiBbJ2ltcG9ydCcsICdicm93c2VyJ10gfSxcblxuXHRcdGVzYnVpbGQ6IHtcblx0XHRcdHRhcmdldDogWydlczIwMjInXVxuXHRcdH0sXG5cblx0XHRjc3M6IHtcblx0XHRcdC8vIENyZWF0ZXMgYSBzdGFuZGFyZCBjb25maWd1cmF0aW9uIGZvciBQb3N0Q1NTIHdpdGggYXV0b3ByZWZpeGVyICYgcG9zdGNzcy1wcmVzZXQtZW52LlxuXHRcdFx0cG9zdGNzczogcG9zdGNzc0NvbmZpZyh7IGNvbXByZXNzOiBzX0NPTVBSRVNTLCBzb3VyY2VNYXA6IHNfU09VUkNFTUFQUyB9KVxuXHRcdH0sXG5cblx0XHQvLyBBYm91dCBzZXJ2ZXIgb3B0aW9uczpcblx0XHQvLyAtIFNldCB0byBgb3BlbmAgdG8gYm9vbGVhbiBgZmFsc2VgIHRvIG5vdCBvcGVuIGEgYnJvd3NlciB3aW5kb3cgYXV0b21hdGljYWxseS4gVGhpcyBpcyB1c2VmdWwgaWYgeW91IHNldCB1cCBhXG5cdFx0Ly8gZGVidWdnZXIgaW5zdGFuY2UgaW4geW91ciBJREUgYW5kIGxhdW5jaCBpdCB3aXRoIHRoZSBVUkw6ICdodHRwOi8vbG9jYWxob3N0OjMwMDAxL2dhbWUnLlxuXHRcdC8vXG5cdFx0Ly8gLSBUaGUgdG9wIHByb3h5IGVudHJ5IHJlZGlyZWN0cyByZXF1ZXN0cyB1bmRlciB0aGUgbW9kdWxlIHBhdGggZm9yIGBzdHlsZS5jc3NgIGFuZCBmb2xsb3dpbmcgc3RhbmRhcmQgc3RhdGljXG5cdFx0Ly8gZGlyZWN0b3JpZXM6IGBhc3NldHNgLCBgbGFuZ2AsIGFuZCBgcGFja3NgIGFuZCB3aWxsIHB1bGwgdGhvc2UgcmVzb3VyY2VzIGZyb20gdGhlIG1haW4gRm91bmRyeSAvIDMwMDAwIHNlcnZlci5cblx0XHQvLyBUaGlzIGlzIG5lY2Vzc2FyeSB0byByZWZlcmVuY2UgdGhlIGRldiByZXNvdXJjZXMgYXMgdGhlIHJvb3QgaXMgYC9zcmNgIGFuZCB0aGVyZSBpcyBubyBwdWJsaWMgLyBzdGF0aWNcblx0XHQvLyByZXNvdXJjZXMgc2VydmVkIHdpdGggdGhpcyBwYXJ0aWN1bGFyIFZpdGUgY29uZmlndXJhdGlvbi4gTW9kaWZ5IHRoZSBwcm94eSBydWxlIGFzIG5lY2Vzc2FyeSBmb3IgeW91clxuXHRcdC8vIHN0YXRpYyByZXNvdXJjZXMgLyBwcm9qZWN0LlxuXHRcdHNlcnZlcjoge1xuXHRcdFx0cG9ydDogMjk5OTksXG5cdFx0XHRvcGVuOiAnL2dhbWUnLFxuXHRcdFx0cHJveHk6IHtcblx0XHRcdFx0Ly8gU2VydmVzIHN0YXRpYyBmaWxlcyBmcm9tIG1haW4gRm91bmRyeSBzZXJ2ZXIuXG5cdFx0XHRcdFtgXigvJHtzX1BBQ0tBR0VfSUR9Lyhhc3NldHN8bGFuZ3xwYWNrc3xzdHlsZS5jc3MpKWBdOiAnaHR0cDovL2xvY2FsaG9zdDozMDAwMCcsXG5cblx0XHRcdFx0Ly8gQWxsIG90aGVyIHBhdGhzIGJlc2lkZXMgcGFja2FnZSBJRCBwYXRoIGFyZSBzZXJ2ZWQgZnJvbSBtYWluIEZvdW5kcnkgc2VydmVyLlxuXHRcdFx0XHRbYF4oPyEvJHtzX1BBQ0tBR0VfSUR9LylgXTogJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMDAnLFxuXG5cdFx0XHRcdC8vIEVuYWJsZSBzb2NrZXQuaW8gZnJvbSBtYWluIEZvdW5kcnkgc2VydmVyLlxuXHRcdFx0XHQnL3NvY2tldC5pbyc6IHsgdGFyZ2V0OiAnd3M6Ly9sb2NhbGhvc3Q6MzAwMDAnLCB3czogdHJ1ZSB9XG5cdFx0XHR9XG5cdFx0fSxcblxuXHRcdGJ1aWxkOiB7XG5cdFx0XHRvdXREaXI6IF9fZGlybmFtZSxcblx0XHRcdGVtcHR5T3V0RGlyOiBmYWxzZSxcblx0XHRcdHNvdXJjZW1hcDogc19TT1VSQ0VNQVBTLFxuXHRcdFx0YnJvdGxpU2l6ZTogdHJ1ZSxcblx0XHRcdG1pbmlmeTogc19DT01QUkVTUyA/ICd0ZXJzZXInIDogZmFsc2UsXG5cdFx0XHR0YXJnZXQ6IFsnZXMyMDIyJ10sXG5cdFx0XHR0ZXJzZXJPcHRpb25zOiBzX0NPTVBSRVNTID8geyAuLi50ZXJzZXJDb25maWcoKSwgZWNtYTogMjAyMiB9IDogdm9pZCAwLFxuXHRcdFx0bGliOiB7XG5cdFx0XHRcdGVudHJ5OiAnLi9tb2R1bGUuanMnLFxuXHRcdFx0XHRmb3JtYXRzOiBbJ2VzJ10sXG5cdFx0XHRcdGZpbGVOYW1lOiAnbW9kdWxlJ1xuXHRcdFx0fVxuXHRcdH0sXG5cblx0XHQvLyBOZWNlc3Nhcnkgd2hlbiB1c2luZyB0aGUgZGV2IHNlcnZlciBmb3IgdG9wLWxldmVsIGF3YWl0IHVzYWdlIGluc2lkZSBUUkwuXG5cdFx0b3B0aW1pemVEZXBzOiB7XG5cdFx0XHRlc2J1aWxkT3B0aW9uczoge1xuXHRcdFx0XHR0YXJnZXQ6ICdlczIwMjInXG5cdFx0XHR9XG5cdFx0fSxcblxuXHRcdHBsdWdpbnM6IFtcblx0XHRcdHN2ZWx0ZSh7XG5cdFx0XHRcdGNvbXBpbGVyT3B0aW9uczoge1xuXHRcdFx0XHRcdC8vIFByb3ZpZGVzIGEgY3VzdG9tIGhhc2ggYWRkaW5nIHRoZSBzdHJpbmcgZGVmaW5lZCBpbiBgc19TVkVMVEVfSEFTSF9JRGAgdG8gc2NvcGVkIFN2ZWx0ZSBzdHlsZXM7XG5cdFx0XHRcdFx0Ly8gVGhpcyBpcyByZWFzb25hYmxlIHRvIGRvIGFzIHRoZSBmcmFtZXdvcmsgc3R5bGVzIGluIFRSTCBjb21waWxlZCBhY3Jvc3MgYG5gIGRpZmZlcmVudCBwYWNrYWdlcyB3aWxsXG5cdFx0XHRcdFx0Ly8gYmUgdGhlIHNhbWUuIFNsaWdodGx5IG1vZGlmeWluZyB0aGUgaGFzaCBlbnN1cmVzIHRoYXQgeW91ciBwYWNrYWdlIGhhcyB1bmlxdWVseSBzY29wZWQgc3R5bGVzIGZvciBhbGxcblx0XHRcdFx0XHQvLyBUUkwgY29tcG9uZW50cyBhbmQgbWFrZXMgaXQgZWFzaWVyIHRvIHJldmlldyBzdHlsZXMgaW4gdGhlIGJyb3dzZXIgZGVidWdnZXIuXG5cdFx0XHRcdFx0Y3NzSGFzaDogKHsgaGFzaCwgY3NzIH0pID0+IGBzdmVsdGUtJHtzX1NWRUxURV9IQVNIX0lEfS0ke2hhc2goY3NzKX1gXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHByZXByb2Nlc3M6IHByZXByb2Nlc3MoKVxuXHRcdFx0fSksXG5cblx0XHRcdHJlc29sdmUoc19SRVNPTFZFX0NPTkZJRykgIC8vIE5lY2Vzc2FyeSB3aGVuIGJ1bmRsaW5nIG5wbS1saW5rZWQgcGFja2FnZXMuXG5cdFx0XVxuXHR9O1xufTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFDQSxTQUFTLGNBQWlCO0FBQzFCLE9BQU8sYUFBbUI7QUFDMUIsT0FBTyxnQkFBbUI7QUFDMUI7QUFBQSxFQUNDO0FBQUEsRUFDQTtBQUFBLE9BQXVCO0FBTnhCLElBQU0sbUNBQW1DO0FBYXpDLElBQU0sZUFBZTtBQUtyQixJQUFNLG1CQUFtQjtBQUV6QixJQUFNLGFBQWE7QUFDbkIsSUFBTSxlQUFlO0FBR3JCLElBQU0sbUJBQW1CO0FBQUEsRUFDeEIsU0FBUztBQUFBLEVBQ1QsUUFBUSxDQUFDLFFBQVE7QUFDbEI7QUFFQSxJQUFPLHNCQUFRLE1BQ2Y7QUFFQyxTQUFPO0FBQUEsSUFDTixNQUFNO0FBQUE7QUFBQSxJQUNOLE1BQU0sSUFBSSxZQUFZO0FBQUE7QUFBQSxJQUN0QixXQUFXO0FBQUE7QUFBQSxJQUNYLFVBQVU7QUFBQTtBQUFBLElBRVYsU0FBUyxFQUFFLFlBQVksQ0FBQyxVQUFVLFNBQVMsRUFBRTtBQUFBLElBRTdDLFNBQVM7QUFBQSxNQUNSLFFBQVEsQ0FBQyxRQUFRO0FBQUEsSUFDbEI7QUFBQSxJQUVBLEtBQUs7QUFBQTtBQUFBLE1BRUosU0FBUyxjQUFjLEVBQUUsVUFBVSxZQUFZLFdBQVcsYUFBYSxDQUFDO0FBQUEsSUFDekU7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQVdBLFFBQVE7QUFBQSxNQUNQLE1BQU07QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLE9BQU87QUFBQTtBQUFBLFFBRU4sQ0FBQyxNQUFNLFlBQVksaUNBQWlDLEdBQUc7QUFBQTtBQUFBLFFBR3ZELENBQUMsUUFBUSxZQUFZLElBQUksR0FBRztBQUFBO0FBQUEsUUFHNUIsY0FBYyxFQUFFLFFBQVEsd0JBQXdCLElBQUksS0FBSztBQUFBLE1BQzFEO0FBQUEsSUFDRDtBQUFBLElBRUEsT0FBTztBQUFBLE1BQ04sUUFBUTtBQUFBLE1BQ1IsYUFBYTtBQUFBLE1BQ2IsV0FBVztBQUFBLE1BQ1gsWUFBWTtBQUFBLE1BQ1osUUFBUSxhQUFhLFdBQVc7QUFBQSxNQUNoQyxRQUFRLENBQUMsUUFBUTtBQUFBLE1BQ2pCLGVBQWUsYUFBYSxFQUFFLEdBQUcsYUFBYSxHQUFHLE1BQU0sS0FBSyxJQUFJO0FBQUEsTUFDaEUsS0FBSztBQUFBLFFBQ0osT0FBTztBQUFBLFFBQ1AsU0FBUyxDQUFDLElBQUk7QUFBQSxRQUNkLFVBQVU7QUFBQSxNQUNYO0FBQUEsSUFDRDtBQUFBO0FBQUEsSUFHQSxjQUFjO0FBQUEsTUFDYixnQkFBZ0I7QUFBQSxRQUNmLFFBQVE7QUFBQSxNQUNUO0FBQUEsSUFDRDtBQUFBLElBRUEsU0FBUztBQUFBLE1BQ1IsT0FBTztBQUFBLFFBQ04saUJBQWlCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxVQUtoQixTQUFTLENBQUMsRUFBRSxNQUFNLElBQUksTUFBTSxVQUFVLGdCQUFnQixJQUFJLEtBQUssR0FBRyxDQUFDO0FBQUEsUUFDcEU7QUFBQSxRQUNBLFlBQVksV0FBVztBQUFBLE1BQ3hCLENBQUM7QUFBQSxNQUVELFFBQVEsZ0JBQWdCO0FBQUE7QUFBQSxJQUN6QjtBQUFBLEVBQ0Q7QUFDRDsiLAogICJuYW1lcyI6IFtdCn0K
