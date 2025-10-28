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
Instalar dependencias:

bash
Copy code
yarn install
# o
npm install
Iniciar blockchain local:

bash
Copy code
anvil
# o
ganache
Configurar variables de entorno:

env
Copy code
REACT_APP_RPC_URL=http://127.0.0.1:8545
REACT_APP_PRIVATE_KEY=<tu_clave_privada>
Desplegar smart contracts:

bash
Copy code
forge script script/Deploy.s.sol --rpc-url $REACT_APP_RPC_URL --broadcast --private-key $REACT_APP_PRIVATE_KEY
Ejecutar la aplicación:

bash
Copy code
yarn dev
# o
npm start
Abrir en navegador:

arduino
Copy code
http://localhost:5173
Uso
Admin
Aprueba/rechaza usuarios.

Visualiza todos los usuarios y su estado.

Retailer
Recibe transferencias de fábrica.

Acepta/rechaza transferencias.

Envía productos a consumidores.

Consumer
Acepta/rechaza transferencias recibidas.

Vende productos a cliente final mediante carrito.

Consulta trazabilidad completa de cualquier producto propio.

Estructura del Proyecto
bash
Copy code
/contracts         -> Smart Contracts Solidity
/web               -> Frontend React
/web/src/contexts  -> Web3Context para conexión a blockchain
/web/src/components -> Componentes (RetailerPanel, ConsumerPanel, Layout)
Mejoras Futuras
Registrar ventas finales on-chain.

Notificaciones en tiempo real de transferencias.

Integración con IPFS para almacenar características de productos.

Dashboard de trazabilidad global de todos los productos.

Contacto
Proyecto desarrollado por NickFer

Github: <url>

Correo: <email>

yaml
Copy code
