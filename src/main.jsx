import * as React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

// const element = (
//   <div key='hello' onClick={() => console.log('this is hello div component')}>
//     hello <span style={{ color: 'pink' }}>react</span>
//   </div>
// );

function FunctionComponent() {
  const [state, dispatch] = React.useReducer(() => { }, 123);
  return (
    <div key='hello'>
      hello <span style={{ color: 'pink' }}>react</span>
    </div>
  );
}

/**
 * jsx: https://babeljs.io/repl#?browsers=defaults%2C%20not%20ie%2011%2C%20not%20ie_mob%2011&build=&builtIns=false&corejs=3.21&spec=false&loose=false&code_lz=DwEwlgbgfAFgpgGwQewAQCc4EMDGAXYAenGgG4g&debug=false&forceAllTransforms=false&shippedProposals=false&circleciRepo=&evaluate=false&fileSize=false&timeTravel=false&sourceType=module&lineWrap=true&presets=env%2Creact%2Cstage-2&prettier=false&targets=&version=7.20.11&externalPlugins=&assumptions=%7B%7D
 * babel -> js
 * < v17 React.createElement
 * > v17 import { jsx } from 'react/jsn-runtime'; 无需引入React
 * 
 * jsx('div', { children: 'hello react' });
 */

// console.log(element);

const root = createRoot(document.getElementById('root'));

const functionElement = <FunctionComponent />;

// debugger;
root.render(functionElement);
