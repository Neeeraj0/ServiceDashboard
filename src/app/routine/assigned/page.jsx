'use client'

import DefaultLayout from '@/components/Layouts/DefaultLaout'
import Assigned from '@/components/Routine/Assigned'
import React from 'react'

const page = () => {

  return (
    <DefaultLayout>
      <div className="relative flex flex-col w-full h-full text-gray-700 bg-white shadow-md rounded-xl bg-clip-border">
      <div class="relative mx-4 mt-4 overflow-hidden text-gray-700 bg-white rounded-none bg-clip-border">
        <div class="flex flex-col justify-between gap-8 mb-4 md:flex-row md:items-center">
          <div>
            <h5
              class="block font-sans text-xl antialiased font-semibold leading-snug tracking-normal text-blue-gray-900">
              Assigned Routine Services 
            </h5>
          </div>
        </div>
      </div>
      <div class="p-6 px-0 overflow-scroll">
        <Assigned />
      </div>
    </div>
    </DefaultLayout>
  )
}

export default page