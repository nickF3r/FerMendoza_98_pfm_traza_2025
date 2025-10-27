// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/SupplyChain.sol";

/// @title DeploySupplyChain
/// @notice Script de despliegue del contrato SupplyChain en cualquier red compatible con EVM.
/// @dev Se ejecuta con: forge script script/DeploySupplyChain.s.sol --rpc-url <RPC> --private-key <KEY> --broadcast
contract DeploySupplyChain is Script {
    SupplyChain public supplyChain;

    function setUp() public {
        // Aquí podrías configurar variables previas al despliegue si fuese necesario.
    }

    function run() public {
        // Inicia la grabación de la transacción (modo broadcast)
        vm.startBroadcast();

        // Desplegar contrato
        supplyChain = new SupplyChain();

        // Mostrar dirección del contrato en la consola
        console.log("SupplyChain desplegado en:", address(supplyChain));
        console.log("Admin:", supplyChain.admin());

        // Finaliza la grabación
        vm.stopBroadcast();
    }
}
