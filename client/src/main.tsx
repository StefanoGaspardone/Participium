import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from "react-router-dom";
import { AppProvider } from './contexts/AppContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppProvider>
        <App/>
      </AppProvider>
    </BrowserRouter>
  </StrictMode>,
)
