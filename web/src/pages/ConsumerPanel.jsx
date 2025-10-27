import React, { useEffect, useState } from 'react';
import { useWeb3 } from '../contexts/Web3Context';

export default function ConsumerPanel() {
  const { contract, account, acceptTransfer, rejectTransfer, transfer } = useWeb3();

  // === Estados ===
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [consumerTokens, setConsumerTokens] = useState([]);
  const [loading, setLoading] = useState(false);

  // === Venta a cliente final ===
  const [cart, setCart] = useState([]);
  const [selectedTokenId, setSelectedTokenId] = useState(0);
  const [sellAmount, setSellAmount] = useState(1);

  // === Trazabilidad ===
  const [traceData, setTraceData] = useState([]);
  const [traceTokenId, setTraceTokenId] = useState(null);
  const [showTrace, setShowTrace] = useState(false);

  // ================= FUNCIONES =================

  // Cargar transferencias pendientes
  async function fetchPendingTransfers() {
    if (!contract || !account) return;
    try {
      const transferIds = await contract.getUserTransfers(account);
      const transfersData = await Promise.all(transferIds.map(id => contract.getTransfer(id)));
      const pending = transfersData
        .filter(tr => Number(tr.status) === 0)
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
      await fetchConsumerTokens();
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
  async function fetchConsumerTokens() {
    if (!contract || !account) return;
    try {
      const tokenIds = await contract.getUserTokens(account);
      const tokenDetails = await Promise.all(tokenIds.map(id => contract.getToken(id)));

      const ownTokens = await Promise.all(tokenDetails.map(async t => {
        const id = Number(t[0]);
        const balance = Number(await contract.balanceOf(account, id));
        return { id, name: t[2], balance };
      }));

      const transferIds = await contract.getUserTransfers(account);
      const transfersData = await Promise.all(transferIds.map(id => contract.getTransfer(id)));
      const acceptedTransfers = transfersData
        .filter(tr => Number(tr.status) === 1 && tr.to.toLowerCase() === account.toLowerCase())
        .map(tr => ({
          id: Number(tr.tokenId),
          name: `Token ${tr.tokenId}`,
          balance: Number(tr.amount),
        }));

      const combined = {};
      [...ownTokens, ...acceptedTransfers].forEach(t => {
        if (!combined[t.id]) combined[t.id] = { ...t };
        else combined[t.id].balance += t.balance;
      });

      setConsumerTokens(Object.values(combined).filter(t => t.balance > 0));
    } catch (e) {
      console.error('Error cargando tokens del consumidor:', e);
    }
  }

  // ================== Venta a cliente final ==================
  function handleAddToCart() {
    if (selectedTokenId <= 0 || sellAmount <= 0) {
      alert('Selecciona un token y una cantidad válida.');
      return;
    }

    const token = consumerTokens.find(t => t.id === selectedTokenId);
    if (!token || sellAmount > token.balance) {
      alert(`Cantidad inválida. Balance disponible: ${token?.balance || 0}`);
      return;
    }

    setCart(prev => [
      ...prev,
      { id: token.id, name: token.name, quantity: sellAmount },
    ]);

    setSellAmount(1);
  }

  async function handleSellToClient() {
    if (cart.length === 0) {
      alert('El carrito está vacío');
      return;
    }
    alert('Venta completada al cliente final (simulación)');
    setCart([]);
  }

  // ================== Consulta de trazabilidad ==================
  async function handleTraceProduct(tokenId) {
    try {
      const trace = await contract.getProductTrace(Number(tokenId));
      const formatted = trace.map((step, idx) => ({
        step: idx + 1,
        from: step.from,
        to: step.to,
        amount: Number(step.amount),
        status:
          Number(step.status) === 0
            ? 'Pendiente'
            : Number(step.status) === 1
            ? 'Aceptada'
            : 'Rechazada',
        timestamp: new Date(Number(step.dateCreated) * 1000).toLocaleString(),
      }));
      setTraceData(formatted);
      setTraceTokenId(tokenId);
      setShowTrace(true);
    } catch (e) {
      alert('Error al obtener trazabilidad: ' + e.message);
    }
  }

  // ================== useEffect ==================
  useEffect(() => {
    fetchPendingTransfers();
    fetchConsumerTokens();
  }, [contract, account]);

  // ================== Render ==================
  return (
    <div className="max-w-5xl mx-auto bg-white p-6 rounded shadow space-y-6">
      <h2 className="text-xl font-semibold mb-4">Consumer Panel</h2>

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
                  <strong>De:</strong> {tr.from} <br />
                  <strong>Token ID:</strong> {tr.tokenId} <br />
                  <strong>Cantidad:</strong> {tr.amount} <br />
                  <strong>Fecha:</strong> {tr.date}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleAccept(tr.id)}
                    disabled={loading}
                    className="px-3 py-1 bg-green-600 text-white rounded"
                  >
                    Aceptar
                  </button>
                  <button
                    onClick={() => handleReject(tr.id)}
                    disabled={loading}
                    className="px-3 py-1 bg-red-600 text-white rounded"
                  >
                    Rechazar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Tokens disponibles */}
      <div>
        <h3 className="font-semibold">Mis Productos</h3>
        {consumerTokens.length === 0 ? (
          <p>No tienes tokens disponibles.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {consumerTokens.map(t => (
              <li key={t.id} className="p-2 border rounded flex justify-between items-center">
                <div>
                  <strong>{t.name}</strong> (ID: {t.id})<br />
                  Balance: {t.balance}
                </div>
                <button
                  onClick={() => handleTraceProduct(t.id)}
                  className="px-3 py-1 bg-purple-600 text-white rounded"
                >
                  Ver Trazabilidad
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Venta a cliente final */}
      <div>
        <h3 className="font-semibold">Vender a Cliente Final</h3>
        <select
          value={selectedTokenId}
          onChange={e => setSelectedTokenId(Number(e.target.value))}
          className="w-full p-2 border rounded mt-1"
        >
          <option value={0}>Selecciona producto</option>
          {consumerTokens.map(t => (
            <option key={t.id} value={t.id}>{t.name} (Balance: {t.balance})</option>
          ))}
        </select>

        <label className="mt-2 block">Cantidad</label>
        <input
          type="number"
          value={sellAmount}
          onChange={e => setSellAmount(Number(e.target.value))}
          className="w-full p-2 border rounded mt-1"
        />

        <button onClick={handleAddToCart} className="mt-3 px-4 py-2 bg-blue-600 text-white rounded">
          Agregar al carrito
        </button>

        {cart.length > 0 && (
          <div className="mt-4 border p-3 rounded bg-gray-50">
            <h4 className="font-semibold">Carrito de Venta</h4>
            <ul className="mt-2 space-y-1">
              {cart.map((item, idx) => (
                <li key={idx}>{item.name} - {item.quantity} unidades</li>
              ))}
            </ul>
            <button
              onClick={handleSellToClient}
              className="mt-3 px-4 py-2 bg-green-600 text-white rounded"
            >
              Finalizar Venta
            </button>
          </div>
        )}
      </div>

      {/* Trazabilidad */}
      {showTrace && traceData.length > 0 && (
        <div className="mt-4 border p-3 rounded bg-gray-50">
          <h4 className="font-semibold mb-2">
            Camino del producto (Token ID: {traceTokenId})
          </h4>
          <ul className="space-y-1 text-sm">
            {traceData.map(t => (
              <li key={t.step} className="border-b pb-1">
                <strong>Paso {t.step}</strong> — {t.from} → {t.to}<br />
                Cantidad: {t.amount} | Estado: {t.status}<br />
                Fecha: {t.timestamp}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
