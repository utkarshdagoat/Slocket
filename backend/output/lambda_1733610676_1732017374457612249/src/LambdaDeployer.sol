// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

import {Lambda} from "./Lambda.sol";
import "socket-protocol/contracts/base/AppDeployerBase.sol";

contract LambdaDeployer is AppDeployerBase {
    bytes32 public lambda = _createContractId("lambda");

    constructor(
        address addressResolver_,
        FeesData memory feesData_
    ) AppDeployerBase(addressResolver_) {
        creationCodeWithArgs[lambda] = type(Lambda).creationCode;
        _setFeesData(feesData_);
    }

    function deployContracts(uint32 chainSlug) external async {
        _deploy(lambda, chainSlug);
    }

    function initialize(uint32 chainSlug) public override async {
        address socket = getSocketAddress(chainSlug);
        address counterForwarder = forwarderAddresses[lambda][chainSlug];
        Lambda(counterForwarder).setSocket(socket);
    }

    function setFees(FeesData memory feesData_) public {
        feesData = feesData_;
    }
}
