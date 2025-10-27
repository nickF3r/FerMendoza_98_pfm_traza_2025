import React, { useEffect, useState } from 'react';
import { useWeb3 } from '../contexts/Web3Context';

export default function FactoryPanel() {
  const { transfer, acceptTransfer, rejectTransfer, createToken, contract, account } = useWeb3();

  // === Transferencias simples ===
  const [to, setTo] = useState('');
  const [tokenId, setTokenId] = useState(1);
  const [amount, setAmount] = useState(10);

  // === Transferencias pendientes ===
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [loading, setLoading] = useState(false);

  // === Crear productos terminados ===
  const [finishedName, setFinishedName] = useState('');
  const [finishedSupply, setFinishedSupply] = useState(100);
  const [finishedFeatures, setFinishedFeatures] = useState('{}');
  const [materiaPrimaTokens, setMateriaPrimaTokens] = useState([]);
  const [parentTokenId, setParentTokenId] = useState(0);

  // === Productos terminados del Factory ===
  const [finishedProducts, setFinishedProducts] = useState([]);
  const [selectedFinishedProductId, setSelectedFinishedProductId] = useState(0);

  // === Usuarios Retailers ===
  const [retailers, setRetailers] = useState([]);
  const [retailerTo, setRetailerTo] = useState('');
  const [finishedAmount, setFinishedAmount] = useState(1);

  // ================= FUNCIONES =================

  // Enviar token simple
  async function onTransfer() {
    if (!to || tokenId <= 0 || amount <= 0) {
      alert('Completa los campos correctamente');
      return;
    }
    try {
      setLoading(true);
      await transfer(to, tokenId, amount);
      alert('Transferencia solicitada');
      setTo('');
      setTokenId(1);
      setAmount(10);
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  // Crear producto terminado
  async function onCreateFinished() {
    if (!finishedName || finishedSupply <= 0 || parentTokenId <= 0) {
      alert('Completa los campos correctamente');
      return;
    }
    try {
      JSON.parse(finishedFeatures); // Validar JSON
    } catch (e) {
      alert('JSON inválido');
      return;
    }
    try {
      setLoading(true);
      await createToken(finishedName, Number(finishedSupply), finishedFeatures, Number(parentTokenId));
      alert('Producto terminado creado');
      setFinishedName('');
      setFinishedSupply(100);
      setFinishedFeatures('{}');
      setParentTokenId(0);
      fetchMateriaPrimaTokens();
      fetchFinishedProducts();
    } catch (e) {
      alert('Error creando token: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  // Transferir productos terminados a retailer
  async function onTransferFinished() {
    if (!retailerTo || selectedFinishedProductId <= 0 || finishedAmount <= 0) {
      alert('Completa los campos correctamente');
      return;
    }
    try {
      setLoading(true);
      await transfer(retailerTo, selectedFinishedProductId, finishedAmount);
      alert('Transferencia a retailer solicitada');
      setRetailerTo('');
      setSelectedFinishedProductId(0);
      setFinishedAmount(1);
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  // Cargar transferencias pendientes
  async function fetchPendingTransfers() {
    if (!contract || !account) return;
    try {
      const transferIds = await contract.getUserTransfers(account);
      const transfersData = await Promise.all(
        transferIds.map(id => contract.getTransfer(id))
      );
      const pending = transfersData
        .filter(tr => Number(tr.status) === 0)
        .map(tr => ({
          id: Number(tr.id),
          from: tr.from,
          tokenId: Number(tr.tokenId),
          amount: Number(tr.amount),
          status: tr.status,
          date: new Date(Number(tr.dateCreated) * 1000).toLocaleString()
        }));
      setPendingTransfers(pending);
    } catch (e) {
      console.error('Error cargando transferencias pendientes:', e);
    }
  }

  // Cargar productos materia prima
  async function fetchMateriaPrimaTokens() {
    if (!contract || !account) return;
    try {
      const transferIds = await contract.getUserTransfers(account);
      const transfersData = await Promise.all(
        transferIds.map(id => contract.getTransfer(id))
      );
      const pending = transfersData
        .filter(tr => Number(tr.status) === 1 && tr.to === account) // Aceptadas hacia este Factory
        .map(tr => ({
          id: Number(tr.id),
          from: tr.from,
          tokenId: Number(tr.tokenId),
          amount: Number(tr.amount),
          status: tr.status,
          date: new Date(Number(tr.dateCreated) * 1000).toLocaleString()
        }));
      setMateriaPrimaTokens(pending);
    } catch (e) {
      console.error('Error cargando Materia Prima recepcionada por la fabrica:', e);
    }
  }

  // Cargar productos terminados
  async function fetchFinishedProducts() {
    if (!contract || !account) return;
    try {
      const tokenIds = await contract.getUserTokens(account);
      const tokenDetails = await Promise.all(tokenIds.map(id => contract.getToken(id)));
      const finished = tokenDetails
        .filter(t => Number(t.parentId) > 0)
        .map(t => ({
          id: Number(t[0]),
          name: t[2],
          totalSupply: Number(t[3])
        }));
      setFinishedProducts(finished);
    } catch (e) {
      console.error('Error cargando productos terminados:', e);
    }
  }

  // Cargar retailers
  async function fetchRetailers() {
    if (!contract) return;
    try {
      const allUsers = await contract.getAllUsers();      
      const filtered = allUsers
        .filter(u => (u.role || u[2])?.toLowerCase() === 'retailer')
        .map(u => ({ userAddress: u.userAddress || u[1] }));
      setRetailers(filtered); 
    } catch (e) {
      console.error('Error cargando retailers:', e);
    }
  }

  useEffect(() => {
    fetchPendingTransfers();
    fetchMateriaPrimaTokens();
    fetchFinishedProducts();
    fetchRetailers();
  }, [contract, account]);

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded shadow space-y-6">
      <h2 className="text-xl font-semibold mb-4">Factory Panel Avanzado</h2>

      {/* === Crear Producto Terminado === */}
      <div className="mb-6">
        <h3 className="font-semibold">Crear Producto Terminado</h3>
        <label>Nombre</label>
        <input value={finishedName} onChange={e => setFinishedName(e.target.value)} className="w-full p-2 border rounded mt-1" />
        <label className="mt-2">Total Supply</label>
        <input type="number" value={finishedSupply} onChange={e => setFinishedSupply(Number(e.target.value))} className="w-full p-2 border rounded mt-1" />
        <label className="mt-2">Features (JSON)</label>
        <textarea value={finishedFeatures} onChange={e => setFinishedFeatures(e.target.value)} className="w-full p-2 border rounded mt-1" rows={3} />
        <label className="mt-2">Usar Materia Prima</label>
        <select value={parentTokenId} onChange={e => setParentTokenId(Number(e.target.value))} className="w-full p-2 border rounded mt-1">
          <option value={0}>Selecciona materia prima</option>
          {materiaPrimaTokens.map(t => (
            <option key={t.id} value={t.id}>{t.name} (ID {t.id})</option>
          ))}
        </select>
        <button onClick={onCreateFinished} disabled={loading} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">
          {loading ? 'Creando...' : 'Crear Producto Terminado'}
        </button>
      </div>

      {/* === Transferir Producto Terminado a Retailer === */}
      <div className="mb-6">
        <h3 className="font-semibold">Transferir Producto Terminado a Retailer</h3>
        <label>Producto</label>
        <select value={selectedFinishedProductId} onChange={e => setSelectedFinishedProductId(Number(e.target.value))} className="w-full p-2 border rounded mt-1">
          <option value={0}>Selecciona producto</option>
          {finishedProducts.map(t => (
            <option key={t.id} value={t.id}>{t.name} (ID {t.id})</option>
          ))}
        </select>
        <label className="mt-2">Retailer</label>
        <select value={retailerTo} onChange={e => setRetailerTo(e.target.value)} className="w-full p-2 border rounded mt-1">
          <option value="">Selecciona retailer</option>
          {retailers.map(r => (
            <option key={r.userAddress} value={r.userAddress}>{r.userAddress}</option>
          ))}
        </select>
        <label className="mt-2">Cantidad</label>
        <input type="number" value={finishedAmount} onChange={e => setFinishedAmount(Number(e.target.value))} className="w-full p-2 border rounded mt-1" />
        <button onClick={onTransferFinished} disabled={loading} className="mt-4 px-4 py-2 bg-purple-600 text-white rounded">
          {loading ? 'Procesando...' : 'Transferir a Retailer'}
        </button>
      </div>

      {/* === Transferencias Pendientes === */}
      <div>
        <h3 className="font-semibold">Transferencias Pendientes</h3>
        {pendingTransfers.length === 0 ? (
          <p>No hay transferencias pendientes.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {pendingTransfers.map(tr => (
              <li key={tr.id} className="p-2 border rounded flex justify-between items-center">
                <div>
                  De: {tr.from} <br />
                  Token ID: {tr.tokenId} <br />
                  Cantidad: {tr.amount} <br />
                  Fecha: {tr.date}
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => acceptTransfer(tr.id)} className="px-3 py-1 bg-green-600 text-white rounded" disabled={loading}>Aceptar</button>
                  <button onClick={() => rejectTransfer(tr.id)} className="px-3 py-1 bg-red-600 text-white rounded" disabled={loading}>Rechazar</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
