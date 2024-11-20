import ECommerce from "@/components/Dashboard/E-commerce";
import { Metadata } from "next";
import DefaultLayout from "@/components/Layouts/DefaultLaout";
import React from "react";
import { UserProvider } from "./context/UserContext";

export const metadata: Metadata = {
  title:
    "Service Dashboard",
  description: "This is Next.js Home page for NextAdmin Dashboard Kit",
};

export default function Home() {
  return (
    <>
    <UserProvider>
        <DefaultLayout>
          <ECommerce />
        </DefaultLayout>
    </UserProvider>
    </>
  );
}
