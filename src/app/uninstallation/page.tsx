"use client";
import AcUninstallationForm from '@/components/Forms/AcUninstallationForm'
import DefaultLayout from '@/components/Layouts/DefaultLaout'
import { Snowflake } from 'lucide-react'
import React from 'react'

const Uninstallation = () => {
  return (
    <DefaultLayout>
      <div className="flex-1">
        {/* Header */}
        <div className="bg-gradient-to-r rounded-xl from-blue-600 via-blue-500 to-blue-300 text-white shadow-lg">
          <div className="px-8 py-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-full">
                <Snowflake width={50} height={50}/>
              </div>
              <div>
                <h1 className="text-3xl font-bold">AC Uninstallation Service</h1>
                <p className="text-white/90 mt-1">Schedule and manage air conditioning unit removals</p>
              </div>
            </div>
          </div>
        </div>
      <AcUninstallationForm open={true} onClose={() => {}} defaultDate={new Date().toISOString()} />
      </div>
    </DefaultLayout>
  )
}

export default Uninstallation