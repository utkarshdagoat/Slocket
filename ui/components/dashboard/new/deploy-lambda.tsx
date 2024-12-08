import { useNewFunctionStore } from "@/lib/stores/new-function-store";
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowUp, FileWarning, SearchCode } from "lucide-react";
import Spinner from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import confetti from "canvas-confetti";
import { useToast } from "@/hooks/use-toast";
import { GET_TRANSACTION_STATUS, LAMBDA_GATEWAY_ADDRESS } from "@/lib/constant";
import { abi } from "@/lib/abi";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { deployContract, waitForTransactionReceipt } from '@wagmi/core'
import { config } from "@/wagmi-config";
import { getTransaction } from '@wagmi/core'
import { japanese } from "viem/accounts";


interface ContractState {
    name: string;
    type: string;
    value: string | BigInt | number;
}

export default function DeployLambda() {
    const {
        lambdaFunctionName,
        lambdaFunction,
        lambdaTestFunction,
        appGatewayByteCode,
        deployerByteCode,
        appGatewayABI,
        deployerABI,
    } = useNewFunctionStore();
    const { toast } = useToast();
    const [anyStateChanged, setAnyStateChanged] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const sampleContractStates: ContractState[] = [
        { name: "addressResolver", type: "address", value: "0x208dC31cd6042a09bbFDdB31614A337a51b870ba" },
        { name: "token", type: "address", value: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" },
        { name: "feePoolChain", type: "uint32", value: 421614 },
        { name: "maxFees", type: "uin256", value: BigInt(1e16) },
    ];
    const [contractStates, setContractStates] = useState<ContractState[]>(sampleContractStates);
    const [deployerAddress, setDeployerAddress] = useState<string | null>(null);
    const [appGatewayHash, setAppGatewayHash] = useState<string | null>(null);

    const deploy = async (event: React.MouseEvent<HTMLButtonElement>) => {
        console.log("Deploying...");
        if (appGatewayByteCode === "" || deployerByteCode === "") {
            toast({
                title: "Error",
                description: "Could not compile lambda",
                variant: "destructive"
            });
            return;
        }
        ///@ts-ignore
        const result = await deployContract(config, {
            abi: deployerABI as any,
            bytecode: deployerByteCode as any,
            args: [sampleContractStates[0].value, sampleContractStates[1].value, Number(sampleContractStates[2].value), BigInt(1e16)],
        })

        const data = await pollUntilResponse(GET_TRANSACTION_STATUS(result))
        console.log(data)

        if (data) {
            toast({
                title: "Success",
                description: "Lambda deployed successfully",
                variant: "default"
            });

            const receipt = await deployContract(config, {
                abi: appGatewayABI as any,
                bytecode: appGatewayByteCode as any,
                args: [sampleContractStates[0].value, data, sampleContractStates[1].value, Number(sampleContractStates[2].value), BigInt(1e16)],
            })
            const data_ = await pollUntilResponse(GET_TRANSACTION_STATUS(receipt))
            console.log(data_)
        }




        // confetti
        const rect = event.currentTarget.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        confetti({
            origin: {
                x: x / window.innerWidth,
                y: y / window.innerHeight,
            },
        });
    }

    const saveChanges = () => {
        // Add save changes functionality here
        setAnyStateChanged(false);
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button size={"lg"}>
                    Deploy <ArrowUp className="ml-1 w-4 h-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-screen-sm">
                <DialogHeader>
                    <DialogTitle>
                        Deploying{" "}
                        <span className="text-primary">{lambdaFunctionName}...</span>
                    </DialogTitle>

                    <div className="rounded-lg flex items-center gap-2 border border-destructive text-destructive px-4 py-2">
                        <FileWarning className="w-4 h-4" />
                        <p className="text-sm">
                            Change these values if you are absolutely sure what you are
                            doing.{" "}
                        </p>
                    </div>
                </DialogHeader>

                <div className="space-y-2 w-full">
                    {isAnalyzing ? (
                        <div className="w-full flex justify-center">
                            <Spinner className="w-8 h-8 my-4" />
                        </div>
                    ) : (
                        contractStates.map((state, index) => {
                            return (
                                <div
                                    key={index}
                                    className="rounded-lg bg-gray-100 text-sm flex flex-row items-center justify-between py-2 px-4"
                                >
                                    <p className="text-muted-foreground font-semibold">
                                        {state.name}
                                    </p>

                                    <p className="text-primary font-semibold">
                                        {state.value.toString().length > 8 ? `${state.value.toString().slice(0, 8)}...` : state.value.toString()}
                                    </p>
                                    <Input
                                        defaultValue={state.type}
                                        className="w-[240px]"
                                        onChange={(e) => {
                                            const newStates = [...contractStates];
                                            newStates[index].type = e.target.value;
                                            setContractStates(newStates);
                                            setAnyStateChanged(true);
                                        }}
                                    />
                                </div>
                            );
                        })
                    )}

                </div>
                <DialogFooter>
                    <Button
                        variant={"active"}
                        disabled={!anyStateChanged}
                        onClick={saveChanges}
                        className="w-32"
                    >
                        Save Changes
                    </Button>
                    <Button className="w-32" onClick={deploy}>
                        Deploy <ArrowUp className="w-4 h-4 ml-1" />
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

async function pollUntilResponse(url: string, maxAttempts: number = 500): Promise<any> {
    for (let i = 0; i < maxAttempts; i++) {
        try {
            const response = await fetch(url);
            const data = await response.json();
            console.log(data)
            if (data.items[0].created_contract.hash) {  // Change 'response' to whatever field you're looking for
                return data.items[0].created_contract.hash;
            }

            await new Promise(resolve => setTimeout(resolve, 2**i * 1000));
        } catch (error) {
            console.error(`Attempt ${i + 1} failed:`, error);
        }
    }

    throw new Error('Max attempts reached without getting response');
}