import path from 'path'
import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'

import VueRouter from 'unplugin-vue-router/vite'
import vue from '@vitejs/plugin-vue'

import tailwindcss from '@tailwindcss/vite'
import svgLoader from 'vite-svg-loader'

import Pages from 'vite-plugin-pages'
import Layouts from 'vite-plugin-vue-layouts-next'

import Components from 'unplugin-vue-components/vite'
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'

import AutoImport from 'unplugin-auto-import/vite'

// https://vite.dev/config/
export default defineConfig({
  // base: '/trucks.land-front/',
  server: {
    cors: {
      origin: ['http://localhost:5173', 'https://api.zeptomail.com'],
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization']
      // credentials: true,
    },
    // cors: true,
    proxy: {
      '/zeptomail': {
        target: 'https://api.zeptomail.com',
        rewrite: (path) => path.replace(/^\/zeptomail/, ''),
        changeOrigin: true
      }
    }
  },
  resolve: {
    alias: {
      '~/': `${path.resolve(__dirname, 'src')}/`,
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },

  plugins: [
    VueRouter({
      /* options */
    }),
    tailwindcss(),
    vue(),
    // vueDevTools(),
    svgLoader(),

    // https://github.com/hannoeru/vite-plugin-pages
    Pages(),

    // https://github.com/JohnCampionJr/vite-plugin-vue-layouts
    Layouts({
      layoutsDirs: 'src/layouts',
      pagesDirs: 'src/pages'
      // defaultLayout: 'default',
    }),

    // https://github.com/antfu/unplugin-auto-import
    AutoImport({
      imports: [
        'vue',
        'vue-router',
        'vue-i18n',
        'vue/macros',
        // '@unhead/vue',
        '@vueuse/core'
      ],
      dts: 'src/auto-imports.d.ts',
      dirs: ['src/composables', 'src/models', 'src/stores'],
      vueTemplate: true
    }),

    Components({
      // allow autoload markdown components under `./src/components/`
      extensions: ['vue'],
      // allow auto import and register components used in markdown
      include: [/\.vue$/, /\.vue\?vue/],
      dts: 'src/components.d.ts',
      types: [
        {
          from: 'vue-router',
          names: ['RouterLink', 'RouterView']
        }
      ],
      resolvers: [
        IconsResolver()
        // (name: string) => {
        //   if (name.match(/^Daisy[A-Z]/)) return { name, from: 'daisy-ui-kit' }
        // },
      ]
    }),

    Icons()
  ]
})
