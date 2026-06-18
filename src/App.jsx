import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import RequestVisit from './pages/RequestVisit';
import ClosePass from './pages/ClosePass';
import Placeholder from './pages/Placeholder';
import NotFound from './pages/NotFound';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/request-visit" element={<RequestVisit />} />
      <Route path="/approval" element={<Placeholder title="Approval Dashboard" />} />
      <Route path="/close-pass" element={<ClosePass />} />
      <Route path="/not-found" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/not-found" replace />} />
    </Routes>
  );
}

export default App;
