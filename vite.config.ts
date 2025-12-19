
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import process from 'node:process'

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // We use '' as the third argument to load all variables regardless of prefix.
  const env = loadEnv(mode, process.cwd(), '');
  
  // Try to find the key in priority order:
  // 1. Existing process.env (system/shell)
  // 2. .env file direct match
  // 3. Common variations/prefixes
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
      // We stringify the key to safely inject it as a constant string in the browser code
      'process.env.API_KEY': JSON.stringify(apiKey)
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
    server: {
      host: true,
      // Ensure we watch .env files for changes to trigger reloads
      watch: {
        usePolling: true,
      }
    }
  }
})
