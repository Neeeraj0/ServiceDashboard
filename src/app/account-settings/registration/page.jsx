"use client";

import { useAuth } from "@/app/context/AuthContext";
import DefaultLayout from "@/components/Layouts/DefaultLaout";
import ProfileLayout from "@/components/Layouts/ProfileLayout";
import ProfileMenuItems from "@/components/constants/ProfileMenuItems";
import { useBroadcastChannel } from "@/hooks/useBroadcaseChannel";
import axios from "axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function TechnicianProfile() {
    const {userName, userPhone, userEmail, userRole, userId} = useAuth();
    const menuItems = ProfileMenuItems(userName);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phoneNumber: "",
        role: "serviceengineer", 
      });
    
      const handleChange = (e) => {
        let { name, value } = e.target;
        if (name === "phoneNumber") {
          value = value.startsWith("+91") ? value : `+91${value}`;
        }
    
        setFormData((prev) => ({ ...prev, [name]: value }));
      };

      const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_SERVICE_BACKEND_API}/api/technicians/register`,
                // "http://localhost:8000/api/technicians/register",
                formData, 
                {
                  headers: { "Content-Type": "application/json" }
                }
            );              
    
            if (response.status === 201) {
              setFormData({ name: "", email: "", phoneNumber: "", role: "serviceengineer" }); // Reset form
            }
        } catch (error) {
          console.error("Registration failed:", error);
          toast.error("An error occurred. Please try again.");
        }
      };
  return (
    <DefaultLayout>
      <ProfileLayout title="Profile" menuItems={menuItems}>
        <section className="mx-4 min-h-screen max-w-screen-xl sm:mx-8 xl:mx-auto">
          <div className="flex flex-col items-center justify-center mx-auto md:h-screen lg:py-0">
            <a href="#" className="flex items-center mb-6 text-2xl font-semibold text-gray-900 dark:text-white">
              <img className="w-20 h-20 mr-2" src="/images/logo/airexpert_logo.svg" alt="logo" />
            </a>
            <div className="w-full bg-white rounded-lg dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700">
              <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
                <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
                  Register a Technician
                </h1>
                <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit}>
                  <div>
                    <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                      Technician&apos;s Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      placeholder="Name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                      Technician&apos;s Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      placeholder="name@company.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                      Technician&apos;s Phone Number
                    </label>
                    <input
                      type="text"
                      name="phoneNumber"
                      id="phonerNumber"
                      placeholder="Phone Number"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full text-white bg-blue-500 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
                  >
                    Create an account
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </ProfileLayout>
    </DefaultLayout>
  );
}
