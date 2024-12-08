export const BACKEND_URL="http://localhost:8080/"
export const HANDLE_LAMDA_API=`${BACKEND_URL}handle-lambda`
export const COMPILE_LAMDA_API=`${BACKEND_URL}compile`

export const LAMBDA_GATEWAY_ADDRESS="0xbf70F0a6726bAbE566030a34f899470452337cd5"
export const GET_TRANSACTION_STATUS = (tx:string) => `https://explorer-socket-composer-testnet.t.conduit.xyz/api/v2/transactions/${tx}/internal-transactions`
