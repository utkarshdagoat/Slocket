import SideNav from "@/components/dashboard/sidenav";
import React from "react";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="w-full flex">
      <SideNav />
      <div className="ml-12 py-1 overflow-y-auto w-full">{children}</div>
    </div>
  );
};

export default Layout;
