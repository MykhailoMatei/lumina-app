
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import process from 'node:process'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  const apiKey = process.env.API_KEY || 
                 env.API_KEY || 
                 env.VITE_API_KEY || 
                 env.GEMINI_API_KEY || 
                 env.VITE_GEMINI_API_KEY || 
                 '';

  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(apiKey)
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      chunkSizeWarningLimit: 5000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('lucide-react')) return 'vendor-icons';
              if (id.includes('recharts')) return 'vendor-charts';
              if (id.includes('@google/genai')) return 'vendor-ai';
              if (id.includes('react')) return 'vendor-framework';
              return 'vendor-core';
            }
          }
        }
      }
    },
    server: {
      host: true,
      watch: {
        usePolling: true,
      }
    }
  }
})
