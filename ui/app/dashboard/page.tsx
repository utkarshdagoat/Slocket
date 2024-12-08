"use client";

import FunctionData from "@/components/dashboard/functions";
import { Button } from "@/components/ui/button";
import { useFunctionsStore } from "@/lib/stores/functions-store";
import { MoveRight, Plus } from "lucide-react";
import Link from "next/link";

const Page = () => {
  const { functions, setFunctions, activeFunction, setActiveFunction } =
    useFunctionsStore();

  return (
    <>
      <div className="h-12 w-full flex items-center border-b px-4">
        <h1 className="text-lg text-muted-foreground font-semibold">
          Manage your Lambda Functions
        </h1>
      </div>
      <div className="pl-4 pr-6 space-y-4">
        <div className="flex flex-row gap-2 py-4 items-center border-b border-gray-100">
          {functions.length ? (
            functions.map((func, index) => (
              <Button
                variant={func == activeFunction ? "active" : "inactive"}
                className="w-32 line-clamp-1"
                title={func}
                size={"sm"}
                onClick={() => setActiveFunction(functions[index])}
              >
                {func.length > 8 ? func.slice(0, 8) + "..." : func}
              </Button>
            ))
          ) : (
            <p className="inline-flex items-center text-muted-foreground/60 font-medium gap-2">
              No functions yet, create your first one :){" "}
              <MoveRight className="w-4" />
            </p>
          )}
          <Link href={"/dashboard/new"}>
            <Button
              size={"iconSm"}
              variant={"outline"}
              className="text-muted-foreground rounded-full"
            >
              <Plus className="w-5" />
            </Button>
          </Link>
        </div>
        <FunctionData />
      </div>
    </>
  );
};

export default Page;
