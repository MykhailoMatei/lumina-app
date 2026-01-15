
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

  if (apiKey) {
    console.log(`[Vite] Gemini API Key detected (Length: ${apiKey.length}).`);
  } else {
    console.error(`[Vite] ERROR: No API Key found in environment or .env file.`);
  }

  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(apiKey)
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('lucide-react')) return 'vendor-icons';
              if (id.includes('recharts')) return 'vendor-charts';
              if (id.includes('@google/genai')) return 'vendor-ai';
              if (id.includes('react')) return 'vendor-framework';
              return 'vendor-others';
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
