// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract SupplyChain {
    // ==========================================================
    // ENUMS
    // ==========================================================
    enum UserStatus { Pending, Approved, Rejected, Canceled }
    enum TransferStatus { Pending, Accepted, Rejected }

    // ==========================================================
    // STRUCTS
    // ==========================================================
    struct Token {
        uint id;
        address creator;
        string name;
        uint totalSupply;
        string features; // JSON string
        uint parentId;
        uint dateCreated;
        mapping(address => uint) balance;
    }

    struct Transfer {
        uint id;
        address from;
        address to;
        uint tokenId;
        uint dateCreated;
        uint amount;
        TransferStatus status;
    }

    struct User {
        uint id;
        address userAddress;
        string role;
        UserStatus status;
    }

    // ==========================================================
    // STATE VARIABLES
    // ==========================================================
    address public admin;

    uint public nextTokenId = 1;
    uint public nextTransferId = 1;
    uint public nextUserId = 1;
   
    mapping(uint => Token) private tokens;
    mapping(uint => Transfer) private transfers;
    mapping(uint => User) private users;
    mapping(address => uint) private addressToUserId;

    mapping(address => uint[]) private userTokens;
    mapping(address => uint[]) private userTransfers;

    User[] private userList;
    // ==========================================================
    // EVENTS
    // ==========================================================
    event UserRoleRequested(address indexed user, string role);
    event UserStatusChanged(address indexed user, UserStatus status);
    event TokenCreated(uint indexed tokenId, address indexed creator, string name, uint totalSupply);
    event TransferRequested(uint indexed transferId, address indexed from, address indexed to, uint tokenId, uint amount);
    event TransferAccepted(uint indexed transferId);
    event TransferRejected(uint indexed transferId);

    // ==========================================================
    // CONSTRUCTOR
    // ==========================================================
    constructor() {
        admin = msg.sender;
        // Registrar admin como usuario aprobado
        uint userId = nextUserId++;
        users[userId] = User({
            id: userId,
            userAddress: msg.sender,
            role: "Admin",
            status: UserStatus.Approved
            });
            addressToUserId[msg.sender] = userId;
            userList.push(users[userId]);
            emit UserRoleRequested(msg.sender, "Admin");
            emit UserStatusChanged(msg.sender, UserStatus.Approved);
    }

    // ==========================================================
    // GESTIÓN DE USUARIOS
    // ==========================================================
    function requestUserRole(string memory role) public {
        require(addressToUserId[msg.sender] == 0, "Usuario ya registrado");

        uint userId = nextUserId++;
        users[userId] = User(userId, msg.sender, role, UserStatus.Pending);
        addressToUserId[msg.sender] = userId;
        userList.push(users[userId]);

        emit UserRoleRequested(msg.sender, role);
    }

    function changeStatusUser(address userAddress, UserStatus newStatus) public {
        require(msg.sender == admin, "Solo admin puede cambiar estado");

        uint userId = addressToUserId[userAddress];
        require(userId != 0, "Usuario no existe");

        users[userId].status = newStatus;
        for (uint i = 0; i < userList.length; i++) {
            if (userList[i].userAddress == userAddress) {
                userList[i].status = newStatus;
                break;
            }
        }
        emit UserStatusChanged(userAddress, newStatus);
    }

    function getUserInfo(address userAddress) public view returns (User memory) {
        uint userId = addressToUserId[userAddress];
        require(userId != 0, "Usuario no encontrado");
        return users[userId];
    }

    function isAdmin(address userAddress) public view returns (bool) {
        return userAddress == admin;
    }

    function getAllUsers() public view returns (User[] memory) {
        return userList;
    }

    // ==========================================================
    // GESTIÓN DE TOKENS
    // ==========================================================
    function createToken(string memory name, uint totalSupply, string memory features, uint parentId) public {
        uint userId = addressToUserId[msg.sender];
        require(userId != 0, "Usuario no registrado");
        require(users[userId].status == UserStatus.Approved, "Usuario no aprobado");

        uint tokenId = nextTokenId++;
        Token storage t = tokens[tokenId];
        t.id = tokenId;
        t.creator = msg.sender;
        t.name = name;
        t.totalSupply = totalSupply;
        t.features = features;
        t.parentId = parentId;
        t.dateCreated = block.timestamp;
        t.balance[msg.sender] = totalSupply;

        userTokens[msg.sender].push(tokenId);

        emit TokenCreated(tokenId, msg.sender, name, totalSupply);
    }

    // No se puede devolver mapping en Solidity, así que devolvemos datos básicos
    function getToken(uint tokenId)public view returns (uint id, address creator, string memory name, uint totalSupply,
            string memory features, uint parentId, uint dateCreated)
    {
        Token storage t = tokens[tokenId];
        require(t.id != 0, "Token no encontrado");
        return (t.id, t.creator, t.name, t.totalSupply, t.features, t.parentId, t.dateCreated);
    }

    function getTokenBalance(uint tokenId, address userAddress) public view returns (uint) {
        return tokens[tokenId].balance[userAddress];
    }

    // ==========================================================
    // GESTIÓN DE TRANSFERENCIAS
    // ==========================================================
    function transfer(address to, uint tokenId, uint amount) public {
        Token storage t = tokens[tokenId];
        require(t.id != 0, "Token no existe");
        require(t.balance[msg.sender] >= amount, "Saldo insuficiente");

        uint transferId = nextTransferId++;
        transfers[transferId] = Transfer({
            id: transferId,
            from: msg.sender,
            to: to,
            tokenId: tokenId,
            dateCreated: block.timestamp,
            amount: amount,
            status: TransferStatus.Pending
        });

        userTransfers[msg.sender].push(transferId);
        userTransfers[to].push(transferId);

        emit TransferRequested(transferId, msg.sender, to, tokenId, amount);
    }

    function acceptTransfer(uint transferId) public {
        Transfer storage tr = transfers[transferId];
        require(tr.status == TransferStatus.Pending, "Transferencia no pendiente");
        require(msg.sender == tr.to, "No eres el receptor");

        Token storage t = tokens[tr.tokenId];
        require(t.balance[tr.from] >= tr.amount, "Saldo insuficiente");

        t.balance[tr.from] -= tr.amount;
        t.balance[tr.to] += tr.amount;
        tr.status = TransferStatus.Accepted;

        emit TransferAccepted(transferId);
    }

    function rejectTransfer(uint transferId) public {
        Transfer storage tr = transfers[transferId];
        require(tr.status == TransferStatus.Pending, "Transferencia no pendiente");
        require(msg.sender == tr.to, "No eres el receptor");
        tr.status = TransferStatus.Rejected;

        emit TransferRejected(transferId);
    }

    function getTransfer(uint transferId) public view returns (Transfer memory) {
        Transfer memory tr = transfers[transferId];
        require(tr.id != 0, "Transferencia no encontrada");
        return tr;
    }

    


    // ==========================================================
    // FUNCIONES AUXILIARES
    // ==========================================================
    function getUserTokens(address userAddress) public view returns (uint[] memory) {
        return userTokens[userAddress];
    }

    function getUserTransfers(address userAddress) public view returns (uint[] memory) {
        return userTransfers[userAddress];
    }

        // ==========================================================
    // TRAZABILIDAD DE PRODUCTOS
    // ==========================================================
    function getProductTrace(uint tokenId) public view returns (Transfer[] memory) {
        require(tokenId > 0 && tokenId < nextTokenId, "Token no existe");

        // Primero, contar cuántas transferencias corresponden al token
        uint count = 0;
        for (uint i = 1; i < nextTransferId; i++) {
            if (transfers[i].tokenId == tokenId) {
                count++;
            }
        }

        // Crear un arreglo del tamaño exacto
        Transfer[] memory trace = new Transfer[](count);
        uint index = 0;

        // Copiar las transferencias relacionadas
        for (uint i = 1; i < nextTransferId; i++) {
            if (transfers[i].tokenId == tokenId) {
                trace[index] = transfers[i];
                index++;
            }
        }

        return trace;
    }

}
