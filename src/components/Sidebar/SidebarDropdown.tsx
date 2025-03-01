import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const SidebarDropdown = ({ item }: any) => {
  const pathname = usePathname();

  return (
    <>
      <ul className="my-2 flex flex-col gap-1.5 pl-9">
        {item.map((item: any, index: number) => (
          <li key={index}>
            <Link
              href={item.route}
              className={`relative flex rounded-[7px] px-3.5 py-2 font-medium duration-300 ease-in-out ${
                pathname === item.route
                  ? "bg-[#FFECFD] text-[#A14996] dark:text-white"
                  : "dark:text-[#FFECFD] dark:hover:bg-[#FFECFD] dark:hover:text-[#FFECFD]"
              }`}
            >
              {item.label}
              {item.pro && (
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-md bg-[#FFECFD] px-1.5 py-px text-[10px] font-medium leading-[17px] text-white">
                  Pro
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
};

export default SidebarDropdown;
