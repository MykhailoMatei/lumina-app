
import * as React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

declare module 'react-dom/client';
declare module 'lucide-react';
declare module 'recharts';
declare module '@google/genai';
