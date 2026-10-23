import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { StandarPage } from './pages/Standar';
import { DokumenPage } from './pages/Dokumen';
import { AmiPage } from './pages/Ami';

export function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<StandarPage />} />
            <Route path="/dokumen" element={<DokumenPage />} />
            <Route path="/ami" element={<AmiPage />} />
          </Routes>
        </main>
        <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} LPM UNUSU • Lembaga Penjaminan Mutu Universitas Nahdlatul Ulama Sumatera Utara</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
