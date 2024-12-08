"use client";

import CodeEditor from "@/components/dashboard/new/code-editor";
import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";
import { useState } from "react";
import confetti from "canvas-confetti";
import { Input } from "@/components/ui/input";
import CompileLambda from "@/components/dashboard/new/compile-lambda";
import { useNewFunctionStore } from "@/lib/stores/new-function-store";
import axios from "axios";
import { HANDLE_LAMDA_API } from "@/lib/constant";
import DeployLambda from "@/components/dashboard/new/deploy-lambda";
const Page = () => {

  const {
    lambdaFunctionName,
    setLambdaFunctionName,
    lambdaFunction,
    setLambdaFunction,
    lambdaTestFunction,
    setLambdaTestFunction,
    compiled,
    setCompiled,
  } = useNewFunctionStore();
  const tabs = [
    {
      file: "lambda.sol",
      code: lambdaFunction,
      setCode: setLambdaFunction,
    },
    {
      file: "lambda_test.sol",
      code: lambdaTestFunction,
      setCode: setLambdaTestFunction,
    },
  ];

  const [activeTabIndex, setActiveTabIndex] = useState(0);

  const compilable = Boolean(lambdaFunction && lambdaTestFunction);

  // TODO: Add functionality and cCompileonfetti
  const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {

    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    confetti({
      origin: {
        x: x / window.innerWidth,
        y: y / window.innerHeight,
      },
    });
  };

  return (
    <>
      <div className="h-12 w-full flex items-center border-b px-4 mb-4">
        <h1 className="text-lg texCompilet-muted-foreground font-semibold">
          Create New Lambda Function
        </h1>
      </div>
      <div className="pl-4 pr-6 space-y-2">
        <div className="flex flex-row gap-2 mb-3">
          <div className="pr-4 border-r mr-2 flex-1">
            <Input
              placeholder="Name your Lambda Function"
              value={lambdaFunctionName}
              onChange={(e) => setLambdaFunctionName(e.target.value)}
            />
          </div>
          {tabs.map((tab, index) => (
            <Button
              key={index}
              size={"sm"}
              variant={activeTabIndex == index ? "active" : "inactive"}
              onClick={() => {
                setActiveTabIndex(index);
              }}
            >
              {tab.file}
            </Button>
          ))}
        </div>
        <div className="border p-2 rounded-md mb-4">
          <CodeEditor
            code={tabs[activeTabIndex].code}
            setCode={tabs[activeTabIndex].setCode}
          />
        </div>
        {/* TODO: Add deploy functionality */}
        <div className="flex flex-row gap-2 ">
          <div className="flex-1"></div>
          {compiled ? (
            <DeployLambda />
          ) : (
            <CompileLambda disabled={compilable} />
          )}
        </div>
      </div>
    </>
  );
};

export default Page;
