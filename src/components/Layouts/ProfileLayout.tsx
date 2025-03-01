"use client"

import React from 'react';

interface MenuItem {
  name: string;
  icon: string;
  path: string;
}

interface ProfileLayoutProps {
  children: React.ReactNode;
  title: string;
  menuItems: MenuItem[];
}

const ProfileLayout: React.FC<ProfileLayoutProps> = ({ children, title, menuItems }) => {
  return (
    <div className="mx-4 min-h-screen max-w-screen-xl sm:mx-8 xl:mx-auto">
      <h1 className="border-b py-6 text-4xl font-semibold text-black">{title}</h1>
      <div className="grid grid-cols-8 pt-3 sm:grid-cols-10">
        {/* Mobile Menu */}
        <div className="relative my-4 w-56 sm:hidden">
          <input className="peer hidden" type="checkbox" name="select-1" id="select-1" />
          <label 
            htmlFor="select-1" 
            className="flex w-full cursor-pointer select-none rounded-lg border p-2 px-3 text-sm text-gray-700 ring-blue-700 peer-checked:ring"
          >
            Menu
          </label>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="pointer-events-none absolute right-0 top-3 ml-auto mr-5 h-4 text-slate-700 transition peer-checked:rotate-180" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
          <ul className="max-h-0 select-none flex-col overflow-hidden rounded-b-lg shadow-md transition-all duration-300 peer-checked:max-h-[100%] peer-checked:py-3">
            {menuItems.map((item) => (
              <li 
                key={item.name}
                className="cursor-pointer px-3 py-2 text-sm text-slate-600 hover:bg-blue-700 hover:text-white"
                onClick={() => window.location.href = item.path}
              >
                {item.name}
              </li>
            ))}
          </ul>
        </div>

        {/* Desktop Sidebar */}
        <div className="col-span-2 hidden sm:block">
          <ul>
            {menuItems.map((item) => (
              <li
                key={item.name}
                className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 p-2 rounded-lg transition"
                onClick={() => window.location.href = item.path}
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Main Content */}
        <div className="col-span-8 overflow-hidden rounded-xl sm:bg-gray-20 sm:px-8 sm:shadow-xl">
          {children}
        </div>
      </div>
    </div>
  );
};

export default ProfileLayout;