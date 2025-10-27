import React, { useEffect, useState } from 'react';
import { useWeb3 } from '../contexts/Web3Context';

export default function RetailerPanel() {
  const { contract, account, acceptTransfer, rejectTransfer, transfer } = useWeb3();

  // === Transferencias pendientes ===
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [loading, setLoading] = useState(false);

  // === Tokens propios y recibidos ===
  const [retailerTokens, setAvailableTokens] = useState([]);
  const [selectedTokenId, setSelectedTokenId] = useState(0);
  const [transferAmount, setTransferAmount] = useState(1);

  // === Consumers ===
  const [consumers, setConsumers] = useState([]);
  const [consumerTo, setConsumerTo] = useState('');

  // ================= FUNCIONES =================

  // Cargar transferencias pendientes hacia el retailer
  async function fetchPendingTransfers() {
    if (!contract || !account) return;
    try {
      const transferIds = await contract.getUserTransfers(account);
      const transfersData = await Promise.all(transferIds.map(id => contract.getTransfer(id)));
      const pending = transfersData
        .filter(tr => Number(tr.status) === 0) // status = pending
        .map(tr => ({
          id: Number(tr.id),
          from: tr.from,
          tokenId: Number(tr.tokenId),
          amount: Number(tr.amount),
          date: new Date(Number(tr.dateCreated) * 1000).toLocaleString(),
        }));
      setPendingTransfers(pending);
    } catch (e) {
      console.error('Error cargando transferencias pendientes:', e);
    }
  }

  // Aceptar transferencia
  async function handleAccept(id) {
    try {
      setLoading(true);
      await acceptTransfer(id);
      alert('Transferencia aceptada');
      await fetchPendingTransfers();
      await fetchAvailableTokens(); // actualizar tokens disponibles
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  // Rechazar transferencia
  async function handleReject(id) {
    try {
      setLoading(true);
      await rejectTransfer(id);
      await fetchPendingTransfers();
      alert('Transferencia rechazada');
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  // Cargar tokens disponibles (propios + aceptados)
  async function fetchAvailableTokens() {
    if (!contract || !account) return;
    try {
      const tokenIds = await contract.getUserTokens(account); // tokens propios
      const tokenDetails = await Promise.all(tokenIds.map(id => contract.getToken(id)));

      // Tokens propios con balance
      const ownTokens = await Promise.all(tokenDetails.map(async t => {
        const id = Number(t[0]);
        const balance = Number(await contract.balanceOf(account, id));
        return { id, name: t[2], balance };
      }));

      // Tokens recibidos por transferencias aceptadas
      const transferIds = await contract.getUserTransfers(account);
      const transfersData = await Promise.all(transferIds.map(id => contract.getTransfer(id)));
      const acceptedTransfers = transfersData
        .filter(tr => Number(tr.status) === 1 && tr.to.toLowerCase() === account.toLowerCase())
        .map(tr => ({
          id: Number(tr.tokenId),
          name: `Token ${tr.tokenId}`,
          balance: Number(tr.amount),
        }));

      // Combinar tokens y sumar balances si hay duplicados
      const combined = {};
      [...ownTokens, ...acceptedTransfers].forEach(t => {
        if (!combined[t.id]) combined[t.id] = { ...t };
        else combined[t.id].balance += t.balance;
      });

      setAvailableTokens(Object.values(combined).filter(t => t.balance > 0));
    } catch (e) {
      console.error('Error cargando tokens disponibles:', e);
    }
  }

  // Cargar usuarios consumers
  async function fetchConsumers() {
    if (!contract) return;
    try {
      const allUsers = await contract.getAllUsers();
      const filtered = allUsers
        .filter(u => (u.role || u[2])?.toLowerCase() === 'consumer' && (u.status != null ? Number(u.status) : Number(u[3])) === 1)
        .map(u => ({
          userAddress: u.userAddress || u[1],
        }));
      setConsumers(filtered);
    } catch (e) {
      console.error('Error cargando consumers:', e);
    }
  }

  // Transferir tokens a consumer
  async function handleTransferToConsumer() {
    if (!consumerTo || selectedTokenId <= 0 || transferAmount <= 0) {
      alert('Completa los campos correctamente');
      return;
    }
    const token = retailerTokens.find(t => t.id === selectedTokenId);
    if (!token || transferAmount > token.balance) {
      alert(`Cantidad inválida. Balance disponible: ${token?.balance || 0}`);
      return;
    }
    try {
      setLoading(true);
      await transfer(consumerTo, selectedTokenId, transferAmount);
      alert('Transferencia a consumer realizada');
      setConsumerTo('');
      setSelectedTokenId(0);
      setTransferAmount(1);
      await fetchAvailableTokens();
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  // ================= useEffect =================
  useEffect(() => {
    fetchPendingTransfers();
    fetchAvailableTokens();
    fetchConsumers();
  }, [contract, account]);

  // ================= RENDER =================
  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded shadow space-y-6">
      <h2 className="text-xl font-semibold mb-4">Retailer Panel</h2>

      {/* Transferencias pendientes */}
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
                  <button onClick={() => handleAccept(tr.id)} disabled={loading} className="px-3 py-1 bg-green-600 text-white rounded">Aceptar</button>
                  <button onClick={() => handleReject(tr.id)} disabled={loading} className="px-3 py-1 bg-red-600 text-white rounded">Rechazar</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Transferir a consumer */}
      <div>
        <h3 className="font-semibold">Transferir a Consumer</h3>
        <label>Token</label>
        <select value={selectedTokenId} onChange={e => setSelectedTokenId(Number(e.target.value))} className="w-full p-2 border rounded mt-1">
          <option value={0}>Selecciona token</option>
          {retailerTokens.map(t => (
            <option key={t.id} value={t.id}>{t.name} (ID {t.id}) - Balance: {t.balance}</option>
          ))}
        </select>
        <label className="mt-2">Consumer</label>
        <select value={consumerTo} onChange={e => setConsumerTo(e.target.value)} className="w-full p-2 border rounded mt-1">
          <option value="">Selecciona consumer</option>
          {consumers.map(c => (
            <option key={c.userAddress} value={c.userAddress}>{c.userAddress}</option>
          ))}
        </select>
        <label className="mt-2">Cantidad</label>
        <input type="number" value={transferAmount} onChange={e => setTransferAmount(Number(e.target.value))} className="w-full p-2 border rounded mt-1" />
        <button onClick={handleTransferToConsumer} disabled={loading} className="mt-4 px-4 py-2 bg-purple-600 text-white rounded">
          {loading ? 'Procesando...' : 'Transferir'}
        </button>
      </div>
    </div>
  );
}
