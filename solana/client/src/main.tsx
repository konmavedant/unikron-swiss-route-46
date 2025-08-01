// src/main.tsx (Updated)
import './lib/polyfills'; // Import polyfills first
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById("root")!).render(<App />);