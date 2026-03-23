import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AppRoutes from './routes/AppRoutes';

function App() {
  return (
    <Router>
      <Toaster position="top-right"
        toastOptions={{
          style: {
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 700,
            borderRadius: '12px',
          },
        }}
      />
      <AppRoutes />
    </Router>
  );
}

export default App;
