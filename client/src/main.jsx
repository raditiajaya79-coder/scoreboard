import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Mounting aplikasi React ke div dengan id 'root' di index.html
// Menggunakan React.StrictMode untuk membantu mendeteksi bug potensial selama fase development
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
