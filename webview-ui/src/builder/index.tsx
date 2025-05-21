import React from 'react';
import { createRoot } from 'react-dom/client';
import BuilderApp from './BuilderApp';
import './builder.css';

const root = createRoot(document.getElementById('root')!);
root.render(<BuilderApp />);
