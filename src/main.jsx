import React from 'react'
import ReactDOM from 'react-dom/client'
import AppRoutes from './app/routes/AppRoutes.jsx'
import './index.css'
import './styles/design-system.css'
import './styles/typography-spacing.css'
import './styles/premium-mobile.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppRoutes />
  </React.StrictMode>
)
