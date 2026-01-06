import React from 'react'
import ReactDOM from 'react-dom/client'
import appIcon from '@resources/build/icons/png/icon256.png?asset'
import { WindowContextProvider, menuItems } from '@lib/window'
import '@lib/window/window.css'
import "./style/classes.css";
// @ts-ignore
import "./style/index.css";
// @ts-ignore
import "./App.css";
import "./style/applies.css";

// @ts-ignore
import App from "./App";

const isElectron = (
  typeof window !== 'undefined' && (
    window.process?.type === 'renderer' ||
    window.electron !== undefined ||
    navigator.userAgent.toLowerCase().includes('electron')
  )
);

export const RootWrapper = ({ children }) => {
  if (isElectron) {
    return (
      <WindowContextProvider titlebar={{ title: 'ChatThread', icon: appIcon, menuItems }}>
        {children}
      </WindowContextProvider>
    );
  }
  
  return <>{children}</>;
};

ReactDOM.createRoot(document.getElementById('app') as HTMLElement).render(
  <React.StrictMode>
    <RootWrapper>
      <App />
    </RootWrapper>
  </React.StrictMode>
)
