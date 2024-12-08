"use client";

import { LayoutDashboard, Plus } from "lucide-react";
import lambda from "@/assets/lambda.png";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

const SideNav = () => {
  const pathname = usePathname();
  const navItems = [
    {
      name: "Manager Dashboard",
      icon: LayoutDashboard,
      href: "/dashboard",
    },
    {
      name: "New Lambda",
      icon: Plus,
      href: "/dashboard/new",
    },
  ];
  return (
    <div className="w-12 h-screen fixed flex flex-col gap-2 items-center border-r py-1 shadow-inner">
      <div className="h-12 w-full flex items-center justify-center border-b mb-1">
        <Image src={lambda} height={20} width={20} alt="logo" />
      </div>
      <div className="space-y-3 ">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "w-8 h-8 flex items-center justify-center rounded-full border p-1.5 shadow-inner transition-all duration-150",
              {
                "bg-primary text-white": pathname === item.href,
              }
            )}
          >
            <item.icon className="w-5 h-5" />
          </Link>
        ))}
      </div>
    </div>
  );
};

export default SideNav;
