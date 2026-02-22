import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Remove or comment if no default styling exists yet, but we will leave a basic body reset below
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
