import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './help/help.css'
import { demoBootstrap } from './lib/demoBootstrap.ts'

demoBootstrap()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
