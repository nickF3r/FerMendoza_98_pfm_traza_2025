import React, {useState, useEffect} from 'react';
import { useWeb3 } from '../../contexts/Web3Context';
import { FaUserCircle, FaWallet } from "react-icons/fa";
import { Button } from "./Button";
import { MdAdminPanelSettings } from "react-icons/md";
import { Link, useNavigate } from "react-router-dom";


export default function Header() {
  const { account, connect, disconnect, role, checkIsAdmin } = useWeb3();
  const [admin, setAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
  if (account && checkIsAdmin) {
    const fetchAdminStatus = async () => {
      try {
        const result = await checkIsAdmin();
        setAdmin(result);
        console.log("Admin status:", result); // depuración
      } catch (err) {
        console.error("Error checking admin:", err);
      }
    };
    fetchAdminStatus();
  }
  else {
      setAdmin(false); // Reset admin state if no account
    }
}, [account, checkIsAdmin]);

  return (
    <header className="w-full bg-white/90 backdrop-blur-md shadow-lg px-6 py-4 sticky top-0 z-50 flex justify-end">
      {account ? (
        <div className="grid grid-cols-4 gap-4 items-center">
          {/* Dirección Ethereum */}
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700 bg-slate-100/70 px-4 py-1 rounded-full">
            <FaUserCircle className="text-slate-500" />
            {account.slice(0,6)}...{account.slice(-4)}
          </div>

          {/* Rol */}
          <div className="text-sm px-4 py-1 bg-indigo-100 text-indigo-700 rounded-full font-semibold text-center">
            {role || 'No role'}
          </div>

          {/* Botón Admin Panel */}
          { admin && (
            <button
              onClick={() => navigate("/admin-panel")}
              className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 active:scale-95 transition-all shadow hover:shadow-md"
            >
              Admin Panel
            </button>
          )}

          {/* Botón Disconnect */}
          <button
            onClick={disconnect}
            className="px-5 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 active:scale-95 transition-all shadow hover:shadow-md"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          onClick={connect}
          className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 active:scale-95 transition-all shadow hover:shadow-md"
        >
          <FaWallet /> Connect MetaMask
        </button>
      )}
    </header>
  );
}

