'use client'

import AssignedInstallation from '@/components/Installation/AssignedInstallation'
import DefaultLayout from '@/components/Layouts/DefaultLaout'
import React from 'react'

const page = () => {

  return (
    <DefaultLayout>
      <div class="relative flex flex-col w-full h-full text-gray-700 bg-white rounded-xl bg-clip-border">
        <div class="relative w-fit overflow-hidden text-gray-700 bg-white rounded-none bg-clip-border">
          <div class="flex flex-col justify-between gap-8 mb-4 md:flex-row md:items-center">
            <div>
              <h5
                class="block font-sans text-xl antialiased font-semibold leading-snug tracking-normal text-blue-gray-900">
                Assigned Installation
              </h5>
            </div>
          </div>
        </div>
      <div class="p-6 px-0 overflow-y-hidden">
        <AssignedInstallation />
      </div>
    </div>
    </DefaultLayout>
  )
}

export default page