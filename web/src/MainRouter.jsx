import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useWeb3 } from './contexts/Web3Context';
import AdminPanel from './pages/AdminPanel';
import ProducerPanel from './pages/ProducerPanel';
import FactoryPanel from './pages/FactoryPanel';
import RetailerPanel from './pages/RetailerPanel';
import ConsumerPanel from './pages/ConsumerPanel';
import Guest from './pages/Guest';

export default function MainRouter() {
  const { account, role } = useWeb3();
  const r = role ? role.toLowerCase() : 'guest';

  // Redirige a Guest si no hay cuenta
  if (!account) return <Guest />;

  return (
    <Routes>
      {/* Rutas privadas por rol */}
      {r === 'admin' && <Route path="/admin-panel" element={<AdminPanel />} />}
      {r === 'producer' && <Route path="/producer-panel" element={<ProducerPanel />} />}
      {r === 'factory' && <Route path="/factory-panel" element={<FactoryPanel />} />}
      {r === 'retailer' && <Route path="/retailer-panel" element={<RetailerPanel />} />}
      {r === 'consumer' && <Route path="/consumer-panel" element={<ConsumerPanel />} />}

      {/* Ruta principal redirige según rol */}
      <Route
        path="/"
        element={
          r === 'producer'            
            ? <Navigate to="/producer-panel" />
            : r === 'factory'
            ? <Navigate to="/factory-panel" />
            : r === 'retailer'
            ? <Navigate to="/retailer-panel" />
            : r === 'consumer'
            ? <Navigate to="/consumer-panel" />
            : <Guest />
        }
      />

      {/* Ruta comodín */}
      <Route path="*" element={<Navigate to="/" />} />
      {/* Ruta directa para Admin Panel (siempre accesible) */}
      <Route path="/admin-panel" element={<AdminPanel />} />
    </Routes>
  );
}
