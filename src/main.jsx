import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './styles/design-system.css'
import './styles/brand-theme.css'
import BrandThemeProvider from './styles/BrandThemeProvider.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrandThemeProvider>
      <App />
    </BrandThemeProvider>
  </React.StrictMode>
)
