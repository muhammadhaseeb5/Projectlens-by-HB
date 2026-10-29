import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 3000, strictPort: true },
  build: { rolldownOptions: { output: { codeSplitting: { groups: [
    { name: 'react-vendor', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/, priority: 30 },
    { name: 'supabase-vendor', test: /node_modules[\\/]@supabase[\\/]/, priority: 20 },
    { name: 'ui-vendor', test: /node_modules[\\/]@radix-ui[\\/]/, priority: 10 },
  ] } } } },
})
