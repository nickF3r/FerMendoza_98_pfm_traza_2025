import React from 'react'
import Header from './ui/Header'
import MainRouter from '../MainRouter'


export default function Layout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-100 flex flex-col">
      
      {/* Header ocupa toda la parte superior */}
      <Header />

      {/* Main content */}
      <main className="flex-1 p-6 md:p-10 w-full max-w-7xl mx-auto">
        <MainRouter />
      </main>

      {/* Footer opcional */}
      <footer className="py-4 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} SupplyChain dApp
      </footer>
    </div>
  );
}
