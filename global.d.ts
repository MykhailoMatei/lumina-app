
import * as React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
  
  namespace NodeJS {
    interface ProcessEnv {
      // Fixed: Removed redundant index signature to prevent duplication errors during interface merging
      API_KEY: string;
    }
  }
}

declare module 'react-dom/client';
declare module 'lucide-react';
declare module 'recharts';
declare module '@google/genai';
declare module '@supabase/supabase-js';

// Help TypeScript resolve the services and components folders
declare module 'services/*';
declare module 'components/*';
declare module 'context/*';
declare module 'pages/*';