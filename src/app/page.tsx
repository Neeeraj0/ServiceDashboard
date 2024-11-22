import ECommerce from "@/components/Dashboard/E-commerce";
import { Metadata } from "next";
import DefaultLayout from "@/components/Layouts/DefaultLaout";
import React from "react";
import { UserProvider } from "./context/UserContext";
import OpenBreakdown from "@/components/BreakdownCalls/OpenBreakdown";

// export const metadata: Metadata = {
//   title:
//     "Operation Tool Circolife",
//   description: "This is Next.js Home page for NextAdmin Dashboard Kit",
// };

export default function Home() {
  return (
    <>
    <UserProvider>
        <DefaultLayout>
          <OpenBreakdown />
        </DefaultLayout>
    </UserProvider>
    </>
  );
}
