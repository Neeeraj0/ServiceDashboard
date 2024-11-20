'use client'

import DefaultLayout from '@/components/Layouts/DefaultLaout'
import OpenSiteSurvey from '@/components/SiteSurvey/OpenSiteSurvey'
import React from 'react'

const page = () => {

  return (
    <DefaultLayout>
      <div class="relative flex flex-col w-full h-full text-gray-700 bg-white rounded-xl">
      <div class="relative mx-4 mt-4 overflow-hidden text-gray-700 bg-white rounded-none bg-clip-border">
        <div class="flex flex-col justify-between gap-8 mb-4 md:flex-row md:items-center">
          <div>
            <h5
              class="block font-sans text-xl antialiased font-semibold leading-snug tracking-normal text-blue-gray-900">
              Open Site Survey
            </h5>
          </div>
        </div>
      </div>
      <div class="p-6 px-0 overflow-scroll">
        <OpenSiteSurvey />
      </div>
    </div>
    </DefaultLayout>
  )
}

export default page