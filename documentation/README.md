# Supply Chain Tracker DApp

![Ethereum](https://img.shields.io/badge/Blockchain-Ethereum-blue)
![React](https://img.shields.io/badge/Frontend-React-brightgreen)
![Solidity](https://img.shields.io/badge/SmartContract-Solidity-orange)

**Supply Chain Tracker** es una aplicación descentralizada (DApp) que permite gestionar la trazabilidad de productos desde el fabricante hasta el cliente final usando **Ethereum**, **Solidity**, **React** y **Ethers.js**.

---

## Tecnologías

- **Frontend:** React.js, Tailwind CSS  
- **Smart Contracts:** Solidity, Foundry/Hardhat  
- **Blockchain Local:** Anvil / Ganache  
- **Web3:** Ethers.js, Metamask  
- **Gestión de Estado:** React Context (`Web3Context`)  

---

## Características

### Usuarios
- **Admin:** Aprueba/rechaza solicitudes de rol de usuario.  
- **Factory / Retailer / Consumer:** Roles con permisos específicos.

### Tokens / Productos
- Crear tokens que representan productos con información y características (`features` en JSON).  
- Registro de **producto padre** para trazabilidad.

### Transferencias
- Solicitud de transferencias entre usuarios.  
- Aceptar/rechazar transferencias.  
- Control de saldo de cada token por usuario.

### Consumer Panel
- Visualización de tokens propios y transferencias aceptadas.  
- Venta a cliente final mediante carrito.  
- Consulta completa de **trazabilidad del producto**, mostrando el camino desde su creación.

---

## Instalación y Ejecución

1. Clonar el repositorio:
```bash
git clone <url-del-repositorio>
cd supply-chain-tracker

