import { createRoot } from 'react-dom/client';
import App from './app/App.tsx';
// @ts-ignore: CSS module declaration missing in this project setup
import './styles/index.css';

createRoot(document.getElementById('root')!).render(<App />);
