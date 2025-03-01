'use client'

import OpenBreakdown from '@/components/BreakdownCalls/OpenBreakdown'
import DefaultLayout from '@/components/Layouts/DefaultLaout'
import ApprovalPending from '@/components/Installation/ApprovalPending'
import React, { useEffect, useState } from 'react'
import Loader from '@/components/common/Loader'

const page = () => {
      const [isLoading, setIsLoading] = useState(true)
    
      const handleLoadingComplete = () => {
        setIsLoading(false)
      }
  
      useEffect(() => {
          if (isLoading) {
              document.body.style.overflow = 'hidden' // Prevent scrolling
          } else {
              document.body.style.overflow = 'auto' // Restore scrolling
          }
      }, [isLoading])

  return (
    <>
      {isLoading && (
          <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-white z-50">
            <Loader />
          </div>
        )}
      <DefaultLayout>
        <div class="relative flex flex-col w-full h-full text-gray-700 bg-white rounded-xl">
        <div class="relative mx-4 mt-4 overflow-hidden text-gray-700 bg-white rounded-none bg-clip-border">
          <div class="flex flex-col justify-between gap-8 mb-4 md:flex-row md:items-center">
            <div>
              <h5
                class="block font-sans text-xl antialiased font-semibold leading-snug tracking-normal text-blue-gray-900">
                Approval Pending Installation
              </h5>
            </div>
          </div>
        </div>
        <div class="p-6 px-0 overflow-scroll">
          <ApprovalPending  onLoadingComplete={handleLoadingComplete} />
        </div>
      </div>
      </DefaultLayout>
    </>
  )
}

export default page