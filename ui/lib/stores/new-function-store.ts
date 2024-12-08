import { create } from "zustand";

interface NewFunctionState {
  lambdaFunctionName: string;
  setLambdaFunctionName: (name: string) => void;
  lambdaFunction: string;
  setLambdaFunction: (lambdaFunction: string) => void;
  lambdaTestFunction: string;
  setLambdaTestFunction: (lambdaTestFunction: string) => void;
  compiled: boolean;
  setCompiled: (compiled: boolean) => void;
  reset: () => void;

  appGatewayByteCode: string;
  setAppGatewayByteCode: (byteCode: string) => void;
  deployerByteCode: string;
  setDeployerByteCode: (byteCode: string) => void;


  appGatewayABI: Object;
  setAppGatewayABI: (byteCode: Object) => void;
  deployerABI: Object;
  setDeployerABI: (byteCode: Object) => void;



}

export const useNewFunctionStore = create<NewFunctionState>((set) => ({
  lambdaFunctionName: "",
  setLambdaFunctionName: (name: string) => set({ lambdaFunctionName: name }),
  lambdaFunction: `function lambda(uint256 val) public onlySocket {
    count = val;
}`,
  setLambdaFunction: (lambdaFunction: string) => set({ lambdaFunction }),
  lambdaTestFunction: "",
  setLambdaTestFunction: (lambdaTestFunction: string) => set({ lambdaTestFunction }),
  compiled: false,
  setCompiled: (compiled: boolean) => set({ compiled }),
  appGatewayByteCode: "",
  setAppGatewayByteCode: (byteCode: string) => set({ appGatewayByteCode: byteCode }),
  deployerByteCode: "",
  setDeployerByteCode: (byteCode: string) => set({ deployerByteCode: byteCode }),
  appGatewayABI: {},
  setAppGatewayABI: (byteCode: Object) => set({ appGatewayABI: byteCode }),
  deployerABI: {},
  setDeployerABI: (byteCode: Object) => set({ deployerABI: byteCode }),
  reset: () => set({
    lambdaFunctionName: "",
    lambdaFunction: `function lambda(uint256 val) public onlySocket {
    count = val;
}`,
    lambdaTestFunction: "",
    appGatewayByteCode: "",
    deployerByteCode: "",
    appGatewayABI: {},
    deployerABI: {},

  }),
}));
