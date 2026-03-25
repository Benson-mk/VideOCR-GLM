import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import autoImport from 'unplugin-auto-import/vite'
import components from 'unplugin-vue-components/vite'
import unocss from 'unocss/vite'
import banner from 'vite-plugin-banner'
import { createHtmlPlugin } from 'vite-plugin-html'
import { envDir, sourceDir, manualChunks } from './scripts/build'
import pkg from './package.json'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, envDir)

  return {
    /**
     * Directory for managing environment variable configuration files
     */
    envDir,

    /**
     * Project deployment directory path
     *
     * @description See the `config` folder documentation in the project root directory
     */
    base: env.VITE_DEPLOY_BASE_URL,

    /**
     * Local development server, can also configure API proxy
     *
     * @see https://cn.vitejs.dev/config/#server-proxy
     */
    server: {
      port: 3000,
      // proxy: {
      //   '/devapi': {
      //     target: 'http://192.168.10.198',
      //     changeOrigin: true,
      //     rewrite: (path) => path.replace(/^\/devapi/, ''),
      //   },
      // },
    },

    build: {
      rollupOptions: {
        output: {
          /**
           * If you want to encrypt the bundled file names, you can enable this option
           *
           * @example
           *
           *  1. First install md5 dependency `npm i -D @withtypes/md5`
           *  2. Import in this file `import md5 from '@withtypes/md5'`
           *  3. Change `${name}` in the function to `${md5(name)}`
           */
          // chunkFileNames: ({ name }) => {
          //   return `assets/${name}-[hash].js`
          // },
          // entryFileNames: ({ name }) => {
          //   return `assets/${name}-[hash].js`
          // },
          // assetFileNames: ({ name }) => {
          //   return `assets/${name}-[hash].[ext]`
          // },

          /**
           * Build optimization to avoid bundling everything into one large Chunk
           * @description Generate different Chunk files based on package names for on-demand loading
           */
          manualChunks,
        },
      },
      // Exclude Node.js modules from browser build
      external: ['node:child_process', 'child_process'],
    },

    resolve: {
      /**
       * Configure directory aliases
       * @see https://cn.vitejs.dev/config/shared-options.html#resolve-alias
       *
       * @example
       *
       *  To import functionality from `src/libs/foo`:
       *  Before configuring alias: `import foo from '../../../libs/foo'`
       *  After configuring alias: `import foo from '@/libs/foo'`
       */
      alias: {
        '@': sourceDir,
      },
    },

    css: {
      /**
       * Including `vw` / `rem` unit conversion, etc.
       *
       * @description Please note:
       *  Uno CSS is currently pre-installed, with automatic adaptation using `rem` as the unit (root font size is `16px`)
       *  So generally there is no need to install these conversion plugins. If you use both REM plugin and UNO,
       *  styles may be messed up because the Root's Font Size gets reset!
       *
       * @see https://cn.vitejs.dev/config/shared-options.html#css-postcss
       *
       * @example
       *
       *  Using `vw` for mobile adaptation as an example:
       *    1. First install postcss dependency `npm i -D postcss-px-to-viewport`
       *    2. Import in this file `import px2vw from 'postcss-px-to-viewport'`
       *    3. Uncomment the function below to take effect
       */
      // postcss: {
      //   plugins: [
      //     // Use postcss-pxtorem
      //     // px2rem({
      //     //   propList: ['*'],
      //     // }),
      //     // Use postcss-px-to-viewport
      //     // px2vw({
      //     //   viewportWidth: 375,
      //     //   minPixelValue: 1,
      //     // }),
      //   ],
      // },
    },

    plugins: [
      /**
       * Support parsing `.vue` files
       */
      vue(),

      /**
       * If you need to support `.tsx` components, please install the `@vitejs/plugin-vue-jsx` package
       * Run the installation command in the command line: `npm i -D @vitejs/plugin-vue-jsx`
       * And add a plugin import here: `import vueJsx from '@vitejs/plugin-vue-jsx'`
       *
       * @see https://github.com/vitejs/vite-plugin-vue/tree/main/packages/plugin-vue-jsx
       */
      // vueJsx(),

      /**
       * If you need to support older browsers, please install the `@vitejs/plugin-legacy` package
       * You also need to install the `terser` package because the old plugin uses Terser for obfuscation and compression.
       * Run the installation command in the command line: `npm i -D @vitejs/plugin-legacy terser`
       * And add a plugin import here: `import legacy from '@vitejs/plugin-legacy'`
       *
       * @see https://github.com/vitejs/vite/tree/main/packages/plugin-legacy
       */
      // legacy({
      //   targets: ['defaults', 'not IE 11'],
      // }),

      /**
       * Auto-import APIs, no need to import every time
       *
       * @tips If you still get errors when using APIs without importing, please restart VS Code
       *
       * @see https://github.com/antfu/unplugin-auto-import#configuration
       */
      autoImport({
        imports: ['vue', 'vue-router', 'pinia'],
        dts: 'src/types/declaration-files/auto-import.d.ts',
        eslintrc: {
          enabled: true,
          filepath: './.eslintrc-auto-import.json',
          globalsPropValue: true,
        },
      }),

      /**
       * Auto-import components, no need to import every time
       *
       * @see https://github.com/antfu/unplugin-vue-components#configuration
       */
      components({
        dirs: ['src/components'],
        directoryAsNamespace: true,
        collapseSamePrefixes: true,
        globalNamespaces: [],
        extensions: ['vue', 'ts', 'tsx'],
        deep: true,
        dts: 'src/types/declaration-files/components.d.ts',
        resolvers: [
          (componentName) => {
            // Auto-import Ant Design Vue components
            // Map kebab-case to PascalCase
            const componentMap: Record<string, string> = {
              'AMenu': 'Menu',
              'AMenuItem': 'MenuItem',
              'AMenuSubMenu': 'SubMenu',
              'ALayout': 'Layout',
              'ALayoutHeader': 'LayoutHeader',
              'ALayoutContent': 'LayoutContent',
              'ALayoutFooter': 'LayoutFooter',
              'ALayoutSider': 'LayoutSider',
            }
            
            if (componentName.startsWith('A')) {
              const mappedName = componentMap[componentName] || componentName.substring(1)
              return {
                name: mappedName,
                from: 'ant-design-vue',
              }
            }
          },
        ],
      }),

      /**
       * Out-of-the-box Tailwind CSS style atomic class engine
       *
       * @description See configuration file `uno.config.ts`
       *
       * @see https://unocss.dev/integrations/vite
       */
      unocss(),

      /**
       * Copyright comment
       *
       * @see https://github.com/chengpeiquan/vite-plugin-banner#advanced-usage
       */
      banner(
        [
          `/**`,
          ` * name: ${pkg.name}`,
          ` * version: v${pkg.version}`,
          ` * description: ${pkg.description}`,
          ` * author: ${pkg.author}`,
          ` */`,
        ].join('\n'),
      ),

      /**
       * Add EJS template capability to entry files
       *
       * @see https://github.com/vbenjs/vite-plugin-html/blob/main/README.zh_CN.md
       */
      createHtmlPlugin({
        minify: true,
        inject: {
          data: {
            appTitle: env.VITE_APP_TITLE,
            appDesc: env.VITE_APP_DESC,
            appKeywords: env.VITE_APP_KEYWORDS,
          },
        },
      }),
    ],
  }
})