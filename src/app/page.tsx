import ECommerce from "@/components/Dashboard/E-commerce";
import { Metadata } from "next";
import DefaultLayout from "@/components/Layouts/DefaultLaout";
import React from "react";
import { UserProvider } from "./context/UserContext";
import OpenBreakdown from "@/components/BreakdownCalls/OpenBreakdown";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import OpenSetup from "@/components/SetupInstallation/OpenSetup";

export const metadata: Metadata = {
  title:
    "Airexpert Service tool",
  description: "This is a operation tool of Circolife",
};

export default function Home() {
  return (
    <>
    <UserProvider>
        <DefaultLayout>
          {/* <OpenBreakdown /> */}
          <OpenBreakdown /> 
        </DefaultLayout>
    </UserProvider>
    </>
  );
}
