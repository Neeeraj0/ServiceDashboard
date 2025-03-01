"use client"

import DefaultLayout from "@/components/Layouts/DefaultLaout"
import { useAuth } from "../context/AuthContext";
import ProfileLayout from "@/components/Layouts/ProfileLayout";
import ProfileMenuItems from "@/components/constants/ProfileMenuItems";
import { useEffect } from "react";

export default function ProfilePage() {
    const {userName, userPhone, userEmail, userRole, userId, loadUserFromToken} = useAuth();
    const menuItems = ProfileMenuItems(userName);

    useEffect(() => {
        loadUserFromToken();
      }, []);
      
  return (
    <DefaultLayout>
         <ProfileLayout title="Profile" menuItems={menuItems}>
            <div class="mx-4 min-h-screen max-w-screen-xl sm:mx-8 xl:mx-auto">
                    <div class="col-span-8 overflow-hidden rounded-xl sm:bg-gray-20 sm:px-8 ">
                    <div class="pt-4">
                        <h1 class="py-2 text-2xl font-semibold text-black">Account settings</h1>
                    </div>
                    <hr class="mt-4 mb-8" />
                    <p class="py-2 text-xl font-semibold">Name</p>
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <p class="text-gray-600">Your User Name is <strong>{userName}</strong></p>
                        {/* <button class="inline-flex text-sm font-semibold text-blue-600 underline decoration-2">Change</button> */}
                    </div>
                    <p class="py-2 text-xl font-semibold">Email Address</p>
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <p class="text-gray-600">Your email address is <strong>{userEmail}</strong></p>
                        {/* <button class="inline-flex text-sm font-semibold text-blue-600 underline decoration-2">Change</button> */}
                    </div>
                    <p class="py-2 text-xl font-semibold">Admin Id</p>
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <p class="text-gray-600">Your Admin Id is  <strong>{userId}</strong></p>
                        {/* <button class="inline-flex text-sm font-semibold text-blue-600 underline decoration-2">Change</button> */}
                    </div>
                    <hr class="mt-4 mb-8" />
                    <p class="py-2 text-xl font-semibold">Phone</p>
                    <div class="flex items-center">
                        <div class="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3">
                        <div class="relative flex overflow-hidden rounded-md border-2 transition focus-within:border-blue-600">
                            <input type="tel" id="phone" class="w-full flex-shrink appearance-none border-gray-300 bg-white py-2 px-4 text-base text-gray-700 placeholder-gray-400 focus:outline-none" 
                            value={userPhone} />
                        </div>
                        </div>
                    </div>


                    <div class="mb-10">
                        <p class="py-2 text-xl font-semibold">Delete Account</p>
                        <p class="inline-flex items-center rounded-full bg-rose-100 px-4 py-1 text-rose-600">
                        <svg xmlns="http://www.w3.org/2000/svg" class="mr-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                        </svg>
                        Proceed with caution
                        </p>
                        <p class="mt-2">Make sure you have taken backup of your account in case you ever need to get access to your data. We will completely wipe your data. There is no way to access your account after this action.</p>
                        <button class="ml-auto text-sm font-semibold text-rose-600 underline decoration-2">Continue with deletion</button>
                    </div>
                    </div>
            </div>
        </ProfileLayout>
    </DefaultLayout>
  )
}

