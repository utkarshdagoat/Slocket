export const abi = [
    {
      "type": "function",
      "name": "deployContract",
      "inputs": [
        {
          "name": "_bytecodeDeployer",
          "type": "bytes",
          "internalType": "bytes"
        },
        {
          "name": "_bytecodeAppGateway",
          "type": "bytes",
          "internalType": "bytes"
        },
        {
          "name": "addressResolver",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "token",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "feePoolValue",
          "type": "uint32",
          "internalType": "uint32"
        },
        {
          "name": "maxFees",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [
        {
          "name": "deployerAddress",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "appgatewayAddress",
          "type": "address",
          "internalType": "address"
        }
      ],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "deployedAppGateways",
      "inputs": [
        {
          "name": "",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "address",
          "internalType": "address"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "deployedDeployers",
      "inputs": [
        {
          "name": "",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "address",
          "internalType": "address"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "event",
      "name": "LambdaAppGatewayDeployed",
      "inputs": [
        {
          "name": "appGatewayAddress",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "owner",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "LambdaDeployerDeployed",
      "inputs": [
        {
          "name": "deployerAddress",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "owner",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        }
      ],
      "anonymous": false
    }
  ] as const;
  