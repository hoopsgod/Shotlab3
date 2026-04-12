import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { demoBootstrap } from './lib/demoBootstrap.ts'
import './help/help.css'

demoBootstrap()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
