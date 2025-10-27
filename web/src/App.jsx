import React from 'react'
import { Web3Provider } from './contexts/Web3Context'
import Layout from './components/Layout'

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-100 flex items-center justify-center">
      <div className="p-10 bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl max-w-lg w-full text-center transition-all hover:scale-[1.01]">
        <h1 className="text-4xl font-extrabold text-indigo-700 mb-4">
          🚀 SupplyChain dApp
        </h1>
        <p className="text-slate-600 text-lg">
          Gestiona y visualiza toda la trazabilidad de tu cadena de suministro.
        </p>
        <Web3Provider>
            <Layout />
        </Web3Provider>
      </div>
    </div>
  );
}