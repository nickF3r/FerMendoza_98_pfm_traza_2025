import React, { useEffect, useState } from 'react';
import { useWeb3 } from '../contexts/Web3Context';

export default function ProducerPanelAdvanced() {
  const { createToken, contract, account, transfer } = useWeb3();

  const [name, setName] = useState('');
  const [supply, setSupply] = useState(100);
  const [features, setFeatures] = useState('{}');
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(false);

  // Para transferencias
  const [factoryUsers, setFactoryUsers] = useState([]);
  const [selectedToken, setSelectedToken] = useState(null);
  const [recipient, setRecipient] = useState('');
  const [transferAmount, setTransferAmount] = useState(0);

  // ================== CREAR TOKEN ==================
  async function onCreate() {
    try {
      JSON.parse(features);
    } catch {
      alert('JSON de features inválido');
      return;
    }

    try {
      setLoading(true);
      await createToken(name, Number(supply), features, 0);
      alert('Token creado');
      setName('');
      setSupply(100);
      setFeatures('{}');
      fetchTokens();
    } catch (e) {
      alert('Error al crear token: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  // ================== CARGAR TOKENS ==================
  async function fetchTokens() {
    if (!contract || !account) return;
    try {
      const tokenIds = await contract.getUserTokens(account);
      const tokenDetails = await Promise.all(
        tokenIds.map(id => contract.getToken(id))
      );
      const formatted = tokenDetails.map(t => ({
        id: Number(t[0]),
        creator: t[1],
        name: t[2],
        totalSupply: Number(t[3]),
        features: t[4],
        parentId: Number(t[5]),
        dateCreated: new Date(Number(t[6]) * 1000).toLocaleString()
      }));
      setTokens(formatted);
    } catch (e) {
      console.error('Error cargando tokens:', e);
    }
  }

  // ================== CARGAR FACTORY USERS ==================
  async function fetchFactoryUsers() {
    if (!contract) return;
    try {
      const allUsers = await contract.getAllUsers();
      const factories = allUsers
        .filter(u => {
          const role = u.role || u[2]; // string role
          const status = u.status != null ? Number(u.status) : Number(u[3]);
          return role === 'factory' && status === 1; // Solo Approved
        })
        .map(u => u.userAddress || u[1]);
      setFactoryUsers(factories);
    } catch (e) {
      console.error('Error cargando usuarios Factory:', e);
    }
  }

  // ================== TRANSFERIR TOKEN ==================
  async function onTransfer() {
    if (!selectedToken || !recipient || transferAmount <= 0) {
      alert('Selecciona token, destinatario y cantidad válida');
      return;
    }
    try {
      setLoading(true);
      await transfer(recipient, selectedToken.id, Number(transferAmount));
      alert('Transferencia solicitada');
      setRecipient('');
      setTransferAmount(0);
      setSelectedToken(null);
      fetchTokens();
    } catch (e) {
      alert('Error al transferir: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTokens();
    fetchFactoryUsers();
  }, [contract, account]);

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Producer Panel Advanced</h2>

      {/* === CREAR TOKEN === */}
      <div className="mb-6">
        <h3 className="font-semibold">Crear Token</h3>
        <label>Name</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full p-2 border rounded mt-1"
        />
        <label className="mt-2">Total Supply</label>
        <input
          type="number"
          value={supply}
          onChange={e => setSupply(Number(e.target.value))}
          className="w-full p-2 border rounded mt-1"
        />
        <label className="mt-2">Features (JSON)</label>
        <textarea
          value={features}
          onChange={e => setFeatures(e.target.value)}
          className="w-full p-2 border rounded mt-1"
          rows={4}
        />
        <button
          onClick={onCreate}
          disabled={loading}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
        >
          {loading ? 'Creando...' : 'Create Token'}
        </button>
      </div>

      {/* === LISTA DE TOKENS === */}
      <div className="mb-6">
        <h3 className="font-semibold">Mis Tokens</h3>
        {tokens.length === 0 ? (
          <p>No has creado tokens aún.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {tokens.map(t => (
              <li
                key={t.id}
                className={`p-2 border rounded cursor-pointer ${selectedToken?.id === t.id ? 'bg-gray-200' : ''}`}
                onClick={() => setSelectedToken(t)}
              >
                <strong>{t.name}</strong> (ID: {t.id})<br />
                Total Supply: {t.totalSupply}<br />
                Features: {t.features}<br />
                Creado el: {t.dateCreated}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* === TRANSFERENCIA === */}
      <div>
        <h3 className="font-semibold">Transferir Token</h3>
        <label>Seleccionar Token</label>
        <select
          value={selectedToken?.id || ''}
          onChange={e => setSelectedToken(tokens.find(t => t.id === Number(e.target.value)))}
          className="w-full p-2 border rounded mt-1"
        >
          <option value="">-- Seleccionar --</option>
          {tokens.map(t => (
            <option key={t.id} value={t.id}>
              {t.name} (ID: {t.id})
            </option>
          ))}
        </select>

        <label className="mt-2">Destinatario (Factory)</label>
        <select
          value={recipient}
          onChange={e => setRecipient(e.target.value)}
          className="w-full p-2 border rounded mt-1"
        >
          <option value="">-- Seleccionar --</option>
          {factoryUsers.map(addr => (
            <option key={addr} value={addr}>
              {addr}
            </option>
          ))}
        </select>

        <label className="mt-2">Cantidad</label>
        <input
          type="number"
          value={transferAmount}
          onChange={e => setTransferAmount(Number(e.target.value))}
          className="w-full p-2 border rounded mt-1"
        />

        <button
          onClick={onTransfer}
          disabled={loading || !selectedToken || !recipient || transferAmount <= 0}
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded"
        >
          {loading ? 'Procesando...' : 'Transferir Token'}
        </button>
      </div>
    </div>
  );
}