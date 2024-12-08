// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

import "socket-protocol/contracts/base/AppGatewayBase.sol";
import {Lambda} from "./Lambda.sol";

contract LambdaAppGateway is AppGatewayBase {
    constructor(
        address _addressResolver,
        address deployerContract_,
        address token,
        uint32 feePoolChain,
        uint256 maxFees
    ) AppGatewayBase(_addressResolver) {
        addressResolver.setContractsToGateways(deployerContract_);
        FeesData memory feesData_ = FeesData({
            feePoolChain: feePoolChain,
            feePoolToken: token,
            maxFees: maxFees
        });
        _setFeesData(feesData_);
    }

    // create the lambda function gateway here
    // it is of the type

    modifier preExecutionChecks() {
        //preexecution_checks_here
        _;
    }

    function callLambda( 
            address lambdaAddress
            , uint256 val 
        ) public preExecutionChecks async { 
            Lambda lambda = Lambda(lambdaAddress); 
            lambda.lambda(val); 
        }

    function setFees(FeesData memory feesData_) public {
        feesData = feesData_;
    }
}
