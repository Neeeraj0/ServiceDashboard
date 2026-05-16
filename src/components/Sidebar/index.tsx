"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import SidebarItem from "@/components/Sidebar/SidebarItem";
import ClickOutside from "@/components/ClickOutside";
import useLocalStorage from "@/hooks/useLocalStorage";
import { Calendar1Icon, LayoutDashboardIcon, LogOut, LogOutIcon, MapIcon, MapPinned, PackageX, PhoneIcon, ReplaceAll, Settings, SquareActivityIcon, User2 } from "lucide-react"
import { useEffect, useState } from "react";
import LogoutButton from "../Logout/LogOut";
import ProfileSection from "../UserProfiling/ProfileSelection";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
}

const menuGroups = [
  {
    // name: "MAIN MENU",
    menuItems: [
      {
        icon: (
          <LayoutDashboardIcon strokeWidth={1}/>
        ),
        label: "Dashboard",
        route: "#",
        children: [
          { label: "Overview", route: "/" },
        ],
      },
      {
        icon: (
          <MapIcon strokeWidth={1} />
        ),
        label: "Site Survey",
        route: "#",
        children: [
          { label: "Open", route: "/site-survey/open"},
          { label: "Assigned", route: "/site-survey/assigned"},
          { label: "Approval Pending", route: "/site-survey/approvalPending"},
          { label: "Completed", route: "/site-survey/completed"}
        ],
      },
      {
        icon: (
          <Settings  strokeWidth={1} />
        ),
        label: "Breakdown",
        route: "#",
        children: [
          { label: "Open", route: "/breakdown/open"},
          { label: "Assigned", route: "/breakdown/assigned"},
          { label: "Completed", route: "/breakdown/completed"}
        ],
      },
      {
        icon: (
          <Calendar1Icon strokeWidth={1} />
        ),
        label: "Routine",
        route: "#",
        children: [
          { label: "Overdue", route: "/routine/overdue"},
          { label: "Assigned", route: "/routine/assigned"},
          { label: "Completed", route: "/routine/completed"},
          { label: "Upcoming", route: "/routine/upcoming"}
        ],
      },
      {
        icon: (
          <PhoneIcon strokeWidth={1} />
        ),
        label: "Service Calls",
        route: "#",
        children: [
          { label: "service calls", route: "/serviceCalls"},
        ],
      },
      {
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 64 64"
            xmlSpace="preserve"
            style={{
              fillRule: "evenodd",
              clipRule: "evenodd",
              strokeLinecap: "round",
              strokeLinejoin: "round",
              strokeMiterlimit: 2,
              width: "34px",
            }}
            className="my-custom-icon"
          >
            <path
              d="M56 12.232a4.235 4.235 0 0 0-1.239-2.993A4.235 4.235 0 0 0 51.768 8H12.232a4.235 4.235 0 0 0-2.993 1.239A4.235 4.235 0 0 0 8 12.232v15.536c0 1.123.446 2.199 1.239 2.993A4.235 4.235 0 0 0 12.232 32h39.536a4.235 4.235 0 0 0 2.993-1.239A4.235 4.235 0 0 0 56 27.768V12.232zM52 28v-6M12 28v-6M52 27H12M52 23H25.5M21.5 23H16"
              style={{ fill: "none", stroke: "currentColor", strokeWidth: "1.5px" }}
            />
            <circle
              cx="49"
              cy="14"
              r="2"
              style={{ fill: "none", stroke: "currentColor", strokeWidth: "1.5px" }}
            />
            <path
              d="M37.5 38v15.5a2.5 2.5 0 1 0 5 0V52M26.5 38v15.5a2.5 2.5 0 1 1-5 0V52M46.099 36.846V45.3a1.7 1.7 0 0 0 1.7 1.7h.001a1.7 1.7 0 0 0 1.7-1.7V45M17.901 36.846V45.3a1.7 1.7 0 0 1-1.7 1.7H16.2a1.7 1.7 0 0 1-1.7-1.7V45"
              style={{ fill: "none", stroke: "currentColor", strokeWidth: "1.5px" }}
            />
          </svg>
        ),
        label: "Installation",
        route: "#",
        children: [
          { label: "Open", route: "/installation/open"},
          { label: "Assigned", route: "/installation/assigned"},
          { label: "Approval Pending", route: "/installation/approvalPending"},
          // { label: "Completed", route: "/installation/completed"}
        ],
      },
      // {
      //   icon: (
      //     <PackageX strokeWidth={1} />
      //   ),
      //   label: "uninstallation",
      //   route: "#",
      //   children: [
      //     { label: "Open", route: "/uninstallation/open"},
      //     { label: "Assigned", route: "/uninstallation/pending"},
      //     { label: "Completed", route: "/uninstallation/completed"}
      //   ],
      // },
      {
        icon: (
          <ReplaceAll strokeWidth={1} />
        ),
        label: "Setup",
        route: "#",
        children: [
          { label: "Open", route: "/setup/open"},
          { label: "Assigned", route: "/setup/assigned"},
          { label: "Approval Pending", route: "/setup/approvalPending"},
          { label: "Completed", route: "/setup/completed"},
        ],
      },
    ],
  },
];

const Sidebar = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
  const [pageName, setPageName] = useLocalStorage("selectedMenu", "dashboard");
  const [userName, setUserName] = useState("Guest");
  const [userRole, setUserRole] = useState("User ");
  const [userEmail, setUserEmail] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [userId, setUserId] = useState("");

  useEffect(() => {
    const checkUserAccess = () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
          
          const decodedToken = JSON.parse(jsonPayload);
          
          setUserName(decodedToken.name || "Guest");
          setUserRole(decodedToken.role || "User ");
          setUserEmail(decodedToken.email || "");
          setUserPhone(decodedToken.phone || "");
          setUserId(decodedToken.admin_id || "");
        } catch (err) {
          console.error("Error decoding token:", err);
          setUserName("Guest");
          setUserRole("User ");
          setUserEmail("");
          setUserPhone("");
          setUserId("");
        }
      }
    };

    checkUserAccess();
  }, []);

  return (
    <ClickOutside onClick={() => setSidebarOpen(false)}>
      <aside
        className={`absolute left-0 top-0 z-9999 flex h-screen w-72.5 flex-col overflow-hidden border-r border-stroke bg-white lg:static lg:translate-x-0 ${
          sidebarOpen
            ? "translate-x-0 duration-300 ease-linear"
            : "-translate-x-full"
        }`}
      >
        {/* <!-- SIDEBAR HEADER --> */}
        <div className="flex-shrink-0 flex items-center justify-between gap-2 px-6 py-5.5 lg:py-6.5 xl:py-10">
          <Link href="/">
            <Image
              width={260}
              height={52}
              src={"/images/logo/airexpert_logo.svg"}
              alt="Logo"
              priority
              className="dark:hidden"
            />
            <Image
              width={156}
              height={32}
              src={"/images/logo/airexpert_logo.svg"}
              alt="Logo"
              priority
              className="hidden dark:block"
              style={{ width: "auto", height: "auto" }}
            />
          </Link>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="block lg:hidden"
          >
            <svg
              className="fill-current"
              width="20"
              height="18"
              viewBox="0 0 20 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M19 8.175H2.98748L9.36248 1.6875C9.69998 1.35 9.69998 0.825 9.36248 0.4875C9.02498 0.15 8.49998 0.15 8.16248 0.4875L0.399976 8.3625C0.0624756 8.7 0.0624756 9.225 0.399976 9.5625L8.16248 17.4375C8.31248 17.5875 8.53748 17.7 8.76248 17.7C8.98748 17.7 9.17498 17.625 9.36248 17.475C9.69998 17.1375 9.69998 16.6125 9.36248 16.275L3.02498 9.8625H19C19.45 9.8625 19.825 9.4875 19.825 9.0375C19.825 8.55 19.45 8.175 19 8.175Z"
                fill=""
              />
            </svg>
          </button>
        </div>

        {/* <!-- SIDEBAR CONTENT --> */}
        <div className="flex flex-col flex-grow overflow-y-auto">
          {/* <!-- Sidebar Menu --> */}
          <nav className="flex-grow mt-1 px-4 lg:px-6">
            {menuGroups.map((group, groupIndex) => (
              <div key={groupIndex}>
                <h3 className="mb-5 text-sm font-medium text-dark-4 dark:text-dark-6">
                  {/* {group.name} */}
                </h3>

                <ul className="mb-6 flex flex-col gap-2">
                  {group.menuItems.map((menuItem, menuIndex) => (
                    <SidebarItem
                      key={menuIndex}
                      item={menuItem}
                      pageName={pageName}
                      setPageName={setPageName}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* <!-- Profile Section --> */}
        <ProfileSection />
      </aside>
    </ClickOutside>
  );
};

export default Sidebar;