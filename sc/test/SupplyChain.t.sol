// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/SupplyChain.sol";

contract SupplyChainTest is Test {
    SupplyChain public manager;

    address admin;
    address producer;
    address factory;
    address retailer;
    address consumer;

    function setUp() public {
        admin = address(1);
        producer = address(2);
        factory = address(3);
        retailer = address(4);
        consumer = address(5);

        vm.deal(admin, 100 ether);
        vm.deal(producer, 100 ether);
        vm.deal(factory, 100 ether);
        vm.deal(retailer, 100 ether);
        vm.deal(consumer, 100 ether);

        vm.startPrank(admin);
        manager = new SupplyChain();
        vm.stopPrank();
    }

    // ==========================================================
    // GESTIÓN DE USUARIOS
    // ==========================================================
    function testUserRegistration() public {
        vm.startPrank(producer);
        vm.expectEmit(true, false, false, false);
        emit SupplyChain.UserRoleRequested(producer, "producer");
        manager.requestUserRole("producer");
        vm.stopPrank();

        SupplyChain.User memory user = manager.getUserInfo(producer);
        assertEq(user.userAddress, producer);
        assertEq(keccak256(bytes(user.role)), keccak256(bytes("producer")));
        assertEq(uint256(user.status), uint256(SupplyChain.UserStatus.Pending));
    }

    function testAdminApproveUser() public {
        _approveUser(producer, "producer");

        vm.expectEmit(true, false, false, true);
        emit SupplyChain.UserStatusChanged(producer, SupplyChain.UserStatus.Approved);

        vm.startPrank(admin);
        manager.changeStatusUser(producer, SupplyChain.UserStatus.Approved);
        vm.stopPrank();

        SupplyChain.User memory user = manager.getUserInfo(producer);
        assertEq(uint256(user.status), uint256(SupplyChain.UserStatus.Approved));
    }

    function testAdminRejectUser() public {
        vm.startPrank(factory);
        manager.requestUserRole("factory");
        vm.stopPrank();

        vm.expectEmit(true, false, false, true);
        emit SupplyChain.UserStatusChanged(factory, SupplyChain.UserStatus.Rejected);

        vm.startPrank(admin);
        manager.changeStatusUser(factory, SupplyChain.UserStatus.Rejected);
        vm.stopPrank();

        SupplyChain.User memory user = manager.getUserInfo(factory);
        assertEq(uint256(user.status), uint256(SupplyChain.UserStatus.Rejected));
    }

    function testUserStatusChanges() public {
        _approveUser(retailer, "retailer");

        vm.startPrank(admin);
        manager.changeStatusUser(retailer, SupplyChain.UserStatus.Canceled);
        vm.stopPrank();

        SupplyChain.User memory user = manager.getUserInfo(retailer);
        assertEq(uint256(user.status), uint256(SupplyChain.UserStatus.Canceled));
    }

    function testOnlyApprovedUsersCanOperate() public {
        vm.startPrank(consumer);
        manager.requestUserRole("consumer");
        vm.expectRevert(bytes("Usuario no aprobado"));
        manager.createToken("Fail", 100, "{}", 0);
        vm.stopPrank();
    }

    function testGetUserInfo() public {
        _approveUser(producer, "producer");

        SupplyChain.User memory user = manager.getUserInfo(producer);
        assertEq(user.userAddress, producer);
        assertEq(keccak256(bytes(user.role)), keccak256(bytes("producer")));
    }

    function testIsAdmin() public {
        assertTrue(manager.isAdmin(admin));
    }

    // ==========================================================
    // GESTIÓN DE TOKENS
    // ==========================================================

    function testCreateTokenByProducer() public {
        _approveUser(producer, "producer");

        vm.expectEmit(true, true, false, true);
        emit SupplyChain.TokenCreated(1, producer, "Cacao", 100);

        _createTokenBy(producer, "Cacao", 100);

        (uint256 id, address creator, string memory name, uint256 totalSupply,,,) = manager.getToken(1);
        assertEq(creator, producer);
        assertEq(keccak256(bytes(name)), keccak256(bytes("Cacao")));
        assertEq(totalSupply, 100);
    }

    function testCreateTokenByFactory() public {
        _approveUser(factory, "factory");

        _createTokenBy(factory, "Chocolate", 50);

        (, address creator,, uint256 totalSupply,,,) = manager.getToken(1);
        assertEq(creator, factory);
        assertEq(totalSupply, 50);
    }

    function testCreateTokenByRetailer() public {
        _approveUser(retailer, "retailer");

        _createTokenBy(retailer, "CajaChocolate", 20);

        uint256 balance = manager.getTokenBalance(1, retailer);
        assertEq(balance, 20);
    }

    function testTokenWithParentId() public {
        _approveUser(factory, "factory");

        _createTokenBy(factory, "Semielaborado", 10);

        (uint256 id,,,,, uint256 parentId,) = manager.getToken(1);
        assertEq(id, 1);
        assertEq(parentId, 0);
    }

    function testTokenMetadata() public {
        _approveUser(factory, "factory");

        vm.startPrank(factory);
        manager.createToken("LoteX", 100, '{"lote":"X1","fecha":"2025"}', 0);
        vm.stopPrank();

        (,,,, string memory features,,) = manager.getToken(1);
        assertEq(keccak256(bytes(features)), keccak256(bytes('{"lote":"X1","fecha":"2025"}')));
    }

    function testTokenBalance() public {
        _approveUser(producer, "producer");
        _createTokenBy(producer, "Materia", 500);

        uint256 balance = manager.getTokenBalance(1, producer);
        assertEq(balance, 500);
    }

    function testGetToken() public {
        _approveUser(producer, "producer");
        _createTokenBy(producer, "Producto", 10);

        (uint256 id, address creator,,,,,) = manager.getToken(1);
        assertEq(id, 1);
        assertEq(creator, producer);
    }

    function testGetUserTokens() public {
        _approveUser(producer, "producer");
        _createTokenBy(producer, "A", 1);
        _createTokenBy(producer, "B", 2);

        uint256[] memory tokens = manager.getUserTokens(producer);
        assertEq(tokens.length, 2);
    }

    // ==========================================================
    // GESTIÓN DE TRANSFERENCIAS
    // ==========================================================

    function testTransferFromProducerToFactory() public {
        _setupTwoApproved(producer, factory);
        _createTokenBy(producer, "Cacao", 100);

        vm.expectEmit(true, true, true, true);
        emit SupplyChain.TransferRequested(1, producer, factory, 1, 50);

        vm.startPrank(producer);
        manager.transfer(factory, 1, 50);
        vm.stopPrank();

        uint256[] memory transfers = manager.getUserTransfers(producer);
        assertEq(transfers.length, 1);
    }

    function testAcceptTransfer() public {
        _setupTwoApproved(producer, factory);
        _createTokenBy(producer, "Cacao", 100);

        vm.startPrank(producer);
        manager.transfer(factory, 1, 50);
        vm.stopPrank();

        vm.expectEmit(true, false, false, false);
        emit SupplyChain.TransferAccepted(1);

        vm.startPrank(factory);
        manager.acceptTransfer(1);
        vm.stopPrank();

        uint256 balFactory = manager.getTokenBalance(1, factory);
        assertEq(balFactory, 50);
    }

    function testRejectTransfer() public {
        _setupTwoApproved(producer, factory);
        _createTokenBy(producer, "Cacao", 100);

        vm.startPrank(producer);
        manager.transfer(factory, 1, 50);
        vm.stopPrank();

        vm.expectEmit(true, false, false, false);
        emit SupplyChain.TransferRejected(1);

        vm.startPrank(factory);
        manager.rejectTransfer(1);
        vm.stopPrank();

        SupplyChain.Transfer memory tr = manager.getTransfer(1);
        assertEq(uint256(tr.status), uint256(SupplyChain.TransferStatus.Rejected));
    }

    function testTransferInsufficientBalance() public {
        _setupTwoApproved(producer, factory);
        _createTokenBy(producer, "Cacao", 10);

        vm.startPrank(producer);
        vm.expectRevert(bytes("Saldo insuficiente"));
        manager.transfer(factory, 1, 50);
        vm.stopPrank();
    }

    function testTransferZeroAmount() public {
        _setupTwoApproved(producer, factory);
        _createTokenBy(producer, "Cacao", 100);

        vm.startPrank(producer);
        vm.expectRevert();
        manager.transfer(factory, 1, 0);
        vm.stopPrank();
    }

    function testTransferNonExistentToken() public {
        _setupTwoApproved(producer, factory);

        vm.startPrank(producer);
        vm.expectRevert();
        manager.transfer(factory, 99, 10);
        vm.stopPrank();
    }

    function testDoubleAcceptTransfer() public {
        _setupTwoApproved(producer, factory);
        _createTokenBy(producer, "Cacao", 100);

        vm.startPrank(producer);
        manager.transfer(factory, 1, 10);
        vm.stopPrank();

        vm.startPrank(factory);
        manager.acceptTransfer(1);
        vm.expectRevert();
        manager.acceptTransfer(1);
        vm.stopPrank();
    }

    function testTransferAfterRejection() public {
        _setupTwoApproved(producer, factory);
        _createTokenBy(producer, "Cacao", 100);

        vm.startPrank(producer);
        manager.transfer(factory, 1, 10);
        vm.stopPrank();

        vm.startPrank(factory);
        manager.rejectTransfer(1);
        vm.stopPrank();

        vm.startPrank(factory);
        vm.expectRevert();
        manager.acceptTransfer(1);
        vm.stopPrank();
    }

    // ==========================================================
    // 🔧 FUNCIONES INTERNAS DE APOYO
    // ==========================================================
    function _approveUser(address user, string memory role) internal {
        vm.startPrank(user);
        manager.requestUserRole(role);
        vm.stopPrank();

        vm.startPrank(admin);
        manager.changeStatusUser(user, SupplyChain.UserStatus.Approved);
        vm.stopPrank();
    }

    function _createTokenBy(address user, string memory name, uint256 totalSupply) internal {
        vm.startPrank(user);
        manager.createToken(name, totalSupply, "{}", 0);
        vm.stopPrank();
    }

    function _setupTwoApproved(address u1, address u2) internal {
        _approveUser(u1, "producer");
        _approveUser(u2, "factory");
    }
}
