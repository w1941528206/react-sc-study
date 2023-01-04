import * as React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

debugger;

const element = <div>hello react</div>;

console.log(element);

const root = createRoot(document.getElementById('root'));

root.render(element);
