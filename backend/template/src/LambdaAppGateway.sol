// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

import "socket-protocol/contracts/base/AppGatewayBase.sol";
import {Lambda} from "./Lambda.sol";

contract LambdaAppGateway is AppGatewayBase {
    constructor(
        address _addressResolver,
        address deployerContract_,
        FeesData memory feesData_
    ) AppGatewayBase(_addressResolver) {
        addressResolver.setContractsToGateways(deployerContract_);
        _setFeesData(feesData_);
    }

    // create the lambda function gateway here
    // it is of the type

    modifier preExecutionChecks() {
        //preexecution_checks_here
        _;
    }

    //lambda_here

    function setFees(FeesData memory feesData_) public {
        feesData = feesData_;
    }
}
