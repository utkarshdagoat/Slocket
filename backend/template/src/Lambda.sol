// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

import "socket-protocol/contracts/utils/Ownable.sol";

// generic template for a lambda function contract
contract Lambda is Ownable(msg.sender) {
    address public socket;

    //states_here
    event LambdaCalled();

    modifier onlySocket() {
        require(msg.sender == socket, "not socket");
        _;
    }

    function setSocket(address _socket) external onlyOwner {
        socket = _socket;
    }

    function getSocket() external view returns (address) {
        return socket;
    }

    //lambda_here
}
