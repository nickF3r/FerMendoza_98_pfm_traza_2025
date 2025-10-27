import React, { createContext, useContext, useEffect, useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, ABI } from "../lib/contract";

const Web3Context = createContext(null);

export function useWeb3() {
  return useContext(Web3Context);
}

export function Web3Provider({ children }) {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [contract, setContract] = useState(null);
  const [role, setRole] = useState("guest");
  const [status, setStatus] = useState(null);

  // === Auto-reconnect if account stored ===
  useEffect(() => {
    const stored = localStorage.getItem("sc_account");
    if (stored) connect().catch(console.warn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // === Connect to MetaMask ===
  async function connect() {
    try {
      if (!window.ethereum) throw new Error("MetaMask no detectado");

      const ethProvider = new ethers.BrowserProvider(window.ethereum);
      setProvider(ethProvider);

      await window.ethereum.request({ method: "eth_requestAccounts" });
      const s = await ethProvider.getSigner();
      const acc = await s.getAddress();

      setSigner(s);
      setAccount(acc);
      localStorage.setItem("sc_account", acc);

      const network = await ethProvider.getNetwork();
      setChainId(network.chainId);

      const c = new ethers.Contract(CONTRACT_ADDRESS, ABI, s);
      setContract(c);

      // === Intentar recuperar info de usuario ===
      try {
        const user = await c.getUserInfo(acc);
        const userRole = user?.role ? user.role.toString() : "guest";
        setRole(userRole);
        setStatus(user?.status ?? null);
      } catch (e) {
        console.warn("Usuario no registrado, rol asignado: guest");
        setRole("guest");
        setStatus(0);
      }

      // === Suscripción a eventos ===
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);
    } catch (err) {
      console.error("Error al conectar Web3:", err);
      disconnect();
    }
  }

  function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
      disconnect();
    } else {
      connect().catch(console.warn);
    }
  }

  function handleChainChanged() {
    connect().catch(console.warn);
  }

  // === Disconnect ===
  function disconnect() {
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setContract(null);
    setRole("guest");
    setStatus(null);
    localStorage.removeItem("sc_account");

    // Limpiar listeners si existen
    if (window.ethereum?.removeListener) {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    }
  }

  // === USER ACTIONS ===
  async function requestRole(desiredRole) {
    if (!contract) throw new Error("Contrato no conectado");
    if (!account) throw new Error("Cuenta no conectada");

    try {
      const tx = await contract.requestUserRole(desiredRole, {
        gasLimit: 200000,
      });
      await tx.wait();
      console.log(`Solicitud de rol ${desiredRole} enviada.`);
    } catch (e) {
      console.error("Error al solicitar rol:", e);
      throw e;
    }
  }

  async function checkIsAdmin() {
    if (!contract || !account) return false;
    try {
      const result = await contract.isAdmin(account);
      return Boolean(result);
    } catch (e) {
      console.error("Error verificando admin:", e);
      return false;
    }
  }

  async function changeStatus(userAddress, newStatus) {
    if (!contract) throw new Error("Contrato no conectado");
    const tx = await contract.changeStatusUser(userAddress, newStatus);
    await tx.wait();
  }

  // === TOKEN ACTIONS ===
  async function createToken(name, totalSupply, featuresJson, parentId) {
    if (!contract) throw new Error("Contrato no conectado");
    const tx = await contract.createToken(
      name,
      totalSupply,
      featuresJson,
      parentId
    );
    await tx.wait();
  }

  async function transfer(to, tokenId, amount) {
    if (!contract) throw new Error("Contrato no conectado");
    const tx = await contract.transfer(to, tokenId, amount);
    await tx.wait();
  }

  async function acceptTransfer(transferId) {
    if (!contract) throw new Error("Contrato no conectado");
    const tx = await contract.acceptTransfer(transferId);
    await tx.wait();
  }

  async function rejectTransfer(transferId) {
    if (!contract) throw new Error("Contrato no conectado");
    const tx = await contract.rejectTransfer(transferId);
    await tx.wait();
  }

  const value = {
    provider,
    signer,
    account,
    chainId,
    contract,
    role,
    status,
    connect,
    disconnect,
    requestRole,
    changeStatus,
    createToken,
    transfer,
    acceptTransfer,
    rejectTransfer,
    checkIsAdmin,
  };

  return (
    <Web3Context.Provider value={value}>{children}</Web3Context.Provider>
  );
}
