import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Shell } from './layout/Shell';
import { Gallery } from './pages/Gallery';
import { DemoDetail } from './pages/DemoDetail';
import { Build } from './pages/Build';
import { MyOS } from './pages/MyOS';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Shell />}>
          <Route path="/" element={<Gallery />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/demo/:id" element={<DemoDetail />} />
          <Route path="/build" element={<Build />} />
          <Route path="/my-os" element={<MyOS />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
