"use client";

import { useEffect, useState } from "react";
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
import { FileWarning, Package, SearchCode, Terminal } from "lucide-react";
import { useNewFunctionStore } from "@/lib/stores/new-function-store";
import { Combobox } from "@/components/ui/combobox";
import Spinner from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import axios from "axios";
import { COMPILE_LAMDA_API, HANDLE_LAMDA_API, LAMBDA_GATEWAY_ADDRESS } from "@/lib/constant";
import { compileFunction } from "vm";
import { useWriteContract } from "wagmi";
import { abi } from "@/lib/abi";
import { addEmitToLambda } from "@/lib/emit";

interface ContractState {
  name: string;
  type: string;
}

const CompileLambda = ({
  disabled = false,
}: { disabled?: boolean }) => {
  const {
    lambdaFunctionName,
    lambdaFunction,
    lambdaTestFunction,
    compiled,
    setCompiled,
    setAppGatewayByteCode,
    setDeployerByteCode,
    setAppGatewayABI,
    setDeployerABI,
  } = useNewFunctionStore();
  const { toast } = useToast();

  const [isCompiling, setIsCompiling] = useState(false);
  const [open, setOpen] = useState(false);

  const [dirname, setDirname] = useState("");


  const sampleContractStates: ContractState[] = [];

  const [contractStates, setContractStates] = useState<ContractState[]>([]);

  // Fetch kroo
  useEffect(() => {
    setIsCompiling(true);
    setTimeout(() => {
      setContractStates(sampleContractStates);
      setIsCompiling(false);
    }, 2000);
  }, []);

  const saveChanges = async () => {
    // TODO: Save changes to the backend
    setAnyStateChanged(false);
    toast({
      title: "Changes Saved",
      description: "Your changes have been successfully saved.",
    });
  };
  const [anyStateChanged, setAnyStateChanged] = useState(false);
  async function parse() {

    try {
      // add a line in the function to emit the event
      const lambdaFunction_ = addEmitToLambda(lambdaFunction);
      console.log(lambdaFunction_);
      const res = await axios.post(HANDLE_LAMDA_API, {
        function: lambdaFunction_,
        lambda_name: lambdaFunctionName
      })
      console.log(res.data);
      const data = parseSolidityState(res.data.state_string);
      const dirname = res.data.dirname;
      console.log(data);

      setContractStates(data);
      setDirname(dirname);

    } catch (error) {
      console.log(error);
      toast({
        title: "Error",
        description: "Error while parsing lambda function",
        value: "error"
      });
    }
  }

  async function compile() {
    if (dirname === "") {
      toast({
        title: "Error",
        description: "Could not parse lambda",
        variant: "destructive"
      });
      return;
    }
    try {
      const res = await axios.post(COMPILE_LAMDA_API, {
        dirname,
      });
      console.log(res.data)
      setAppGatewayByteCode(res.data.appgateway_bytecode);
      setDeployerByteCode(res.data.deployer_bytecode);
      setAppGatewayABI(res.data.appgateway_abi);
      setDeployerABI(res.data.deployer_abi);
      toast({
        title: "Compiled, ready for deployment",
        description: "Lambda function has been compiled",
      });
      setCompiled(true);
      setOpen(false); // Close the modal after successful compilation
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to compile lambda function",
        variant: "destructive"
      });
    }
  }




  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={disabled} size={"lg"} onClick={parse}>
          Parse <SearchCode className="w-5 h-5 ml-2" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isCompiling ? "Parsing" : "Parsed"}{" "}
            <span className="text-primary">{lambdaFunctionName}...</span>
          </DialogTitle>
          {isCompiling ? (
            <DialogDescription>
              Parsing your lambda function :)
            </DialogDescription>
          ) : (
            <div className="rounded-lg flex items-center gap-2 border border-destructive text-destructive px-4 py-2">
              <FileWarning className="w-4 h-4" />
              <p className="text-sm">
                Change these values if you are absolutely sure what you are
                doing.{" "}
              </p>
            </div>
          )}
        </DialogHeader>
        <div className="space-y-2 w-full">
          {isCompiling ? (
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
          <Button className="w-32" onClick={compile}>
            Compile <Package className="w-4 h-4 ml-1" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

function parseSolidityState(stateString: string): ContractState[] {
  const lines = stateString
    .split('\n')
    .filter(line => line.trim() !== '');

  const result: ContractState[] = lines.map(line => {
    line = line.replace(';', '').trim();

    const parts = line.split(' ');

    if (line.startsWith('mapping')) {
      const mappingMatch = line.match(/mapping\((.*?)=>(.*?)\)/);
      if (mappingMatch) {
        return {
          name: parts[parts.length - 1],
          type: `mapping(${mappingMatch[1]}=>${mappingMatch[2]})`,
        };
      }
    }

    return {
      name: parts[parts.length - 1],
      type: parts[0],
    };
  });

  return result;
}

export default CompileLambda;