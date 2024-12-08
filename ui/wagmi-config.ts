import { http, createConfig } from 'wagmi'
import { Chain, mainnet, sepolia } from 'wagmi/chains'
import { metaMask } from 'wagmi/connectors'


export const SocketTestnet = {
  id: 7625382,
  name: "Socket Testnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: {http: ["https://rpc-socket-composer-testnet.t.conduit.xyz"]}
  },blockExplorers : {
    default : {name: "SocketScan" , url:"https://explorer-socket-composer-testnet.t.conduit.xyz"}
  }
} as const satisfies Chain



export const config = createConfig({
  chains: [SocketTestnet],
  connectors: [metaMask()],
  transports: {
    [SocketTestnet.id]: http(),
  },
})