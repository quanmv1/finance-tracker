import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext.jsx'
import { GoogleOAuthProvider } from '@react-oauth/google'; 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* THÊM THẺ GOOGLE PROVIDER BỌC NGOÀI CÙNG VÀ ĐIỀN CLIENT ID CỦA BẠN */}
    <GoogleOAuthProvider clientId="1051675741665-bg806rria3qhkjcuusko5dmsqnv2l0l8.apps.googleusercontent.com">
      <AuthProvider>
        <App />
      </AuthProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>,
)