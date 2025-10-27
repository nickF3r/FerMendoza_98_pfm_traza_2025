import React, { useEffect, useState } from "react";
import { useWeb3 } from "../contexts/Web3Context";

export default function AdminPanel() {
  const { contract, changeStatus } = useWeb3();
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (contract) loadPending();
  }, [contract]);

  async function loadPending() {
    setLoading(true);
    try {
      const users = await contract.getAllUsers();
      const pendingUsers = users.filter((u) => Number(u.status) === 0);
      setPending(pendingUsers);
    } catch (e) {
      console.error("Error cargando usuarios:", e);
    } finally {
      setLoading(false);
    }
  }

  async function approve(addr) {
    await changeStatus(addr, 1);
    await loadPending();
  }

  async function reject(addr) {
    await changeStatus(addr, 2);
    await loadPending();
  }

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold text-indigo-600">Admin Panel</h2>
      <p className="mt-2 text-slate-600">Gestionar usuarios pendientes</p>

      {loading ? (
        <div className="mt-6 text-slate-500 animate-pulse">Cargando usuarios...</div>
      ) : pending.length === 0 ? (
        <div className="mt-6 text-slate-500">No hay usuarios pendientes.</div>
      ) : (
        <div className="mt-6 grid gap-3">
          {pending.map((u, i) => (
            <div
              key={i}
              className="p-3 border rounded flex justify-between items-center"
            >
              <div>
                <div className="font-medium">{u.userAddress}</div>
                <div className="text-sm text-slate-600">{u.role}</div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => approve(u.userAddress)}
                  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Aprobar
                </button>
                <button
                  onClick={() => reject(u.userAddress)}
                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Rechazar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
