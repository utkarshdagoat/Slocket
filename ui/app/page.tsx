"use client";

import { GridPattern } from "@/components/ui/animated-grid-pattern";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MoveRight } from "lucide-react";
import logo from "@/assets/logo.png";
import metamask from "@/assets/metamask.svg";
import Image from "next/image";
import { useAccount, useConnect } from "wagmi";
import Link from "next/link";

export default function Home() {
  const { connect, connectors } = useConnect();
  const { isConnected } = useAccount();

  return (
    <div className="w-full h-screen flex items-center justify-center flex-col gap-4">
      <GridPattern
        numSquares={80}
        maxOpacity={0.15}
        duration={3}
        repeatDelay={1}
        className={cn(
          "[mask-image:radial-gradient(420px_circle_at_center,white,transparent)]",
          "inset-x-0 inset-y-[-30%] skew-y-12 -z-10",
          "h-[100vh] my-auto",
          ""
        )}
      />
      <div className="flex gap-2">
        <Image height={100} width={100} src={logo} alt="logo" />

        <h1 className="text-8xl uppercase font-medium text-transparent bg-clip-text bg-gradient-to-tr from-primary to-primary to-brightness-50 to-[100%]">
          Slocket
        </h1>
      </div>
      <p className="text-lg font-medium text-muted-foreground">
        Lambda functions, now on{" "}
        <span className="text-foreground font-semibold">Socket Protocol</span>
      </p>
      {isConnected ? (
        <Link href="/dashboard">
          <Button size={"lg"} className="mt-6 py-4 flex flex-row gap-2">
            Get Started <MoveRight size={20} />
          </Button>
        </Link>
      ) : (
        <Button
          size={"lg"}
          className="mt-6 py-4 flex flex-row items-center gap-2"
          onClick={() => connect({ connector: connectors[0] })}
        >
          Connect with{" "}
          <Image src={metamask} height={18} width={18} alt="metamask" />
        </Button>
      )}
    </div>
  );
}
