'use client'
import DefaultLayout from '@/components/Layouts/DefaultLaout'
import { PhoneCall } from 'lucide-react'
import { useState, useEffect } from 'react'
import CallVerificationCard from '@/components/ServiceCalls/CallVerificationCard'

const CallVerificationPanel = () => {
  const [pendingCalls, setPendingCalls] = useState([])
  const [verifiedCalls, setVerifiedCalls] = useState([])
  const [flaggedCalls, setFlaggedCalls] = useState([])
  const [activeTab, setActiveTab] = useState('pending')
  const [isLoading, setIsLoading] = useState(true)

  // Fetch pending calls
  const fetchPendingCalls = async () => {
    try {
      const response = await fetch(`https://production.circolife.vip/api/query/customerCalls/PendingVerifications`)
      const data = await response.json()
      
      if (data.success) {
        setPendingCalls(data.data)
      }
    } catch (error) {
      console.error('Error fetching pending calls:', error)
    }
  }

  // Fetch verified calls
  const fetchVerifiedCalls = async () => {
    try {
      const response = await fetch('https://production.circolife.vip/api/query/customerCalls/verified')
      const data = await response.json()
      
      if (data.success) {
        setVerifiedCalls(data.data)
      }
    } catch (error) {
      console.error('Error fetching verified calls:', error)
    }
  }

  // Fetch flagged calls
  const fetchFlaggedCalls = async () => {
    try {
      const response = await fetch('https://production.circolife.vip/api/query/customerCalls/flagged')
      const data = await response.json()
      
      if (data.success) {
        setFlaggedCalls(data.data)
      }
    } catch (error) {
      console.error('Error fetching flagged calls:', error)
    }
  }

  // Initial data fetch
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      await Promise.all([
        fetchPendingCalls(),
        fetchVerifiedCalls(),
        fetchFlaggedCalls()
      ]);
      setIsLoading(false)
    };
    
    fetchData();
  }, [])

  // Handle call status update from child component
  const handleCallUpdated = (updatedCall, newStatus) => {
    const callId = updatedCall._id;
  
    // Remove from pending
    setPendingCalls(current => current.filter(call => call._id !== callId));
  
    // Add to verified or flagged
    if (newStatus === 'verified') {
      setVerifiedCalls(current => [...current, updatedCall]);
    } else if (newStatus === 'flagged') {
      setFlaggedCalls(current => [...current, updatedCall]);
    }
  };

  return (
    <DefaultLayout>
      <div className="relative flex flex-col w-full h-full text-gray-700 bg-white rounded-xl bg-clip-border">
        <div className="relative mx-4 mt-4 overflow-hidden text-gray-700 bg-white rounded-none bg-clip-border">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3 text-gray-800">
              <PhoneCall className="h-8 w-8 text-[#A14996]" />
              Call Verification Panel
            </h2>
            <div className="bg-purple-100 text-[#A14996] text-sm font-medium px-3 py-1.5 rounded-full">
              Admin Access
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="border-b border-gray-200 mb-6">
            <h3 className="text-xl font-semibold mb-4">Service Call Records</h3>
            
            <div className="flex gap-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-amber-500"></div>
                <span>Pending: {pendingCalls.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
                <span>Verified: {verifiedCalls.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500"></div>
                <span>Flagged: {flaggedCalls.length}</span>
              </div>
            </div>
          </div>

          <div className="flex border-b border-gray-200 mb-6">
            <button 
              className={`py-2 px-6 relative ${activeTab === 'pending' ? 'text-[#A14996] font-medium' : 'text-gray-500'}`}
              onClick={() => setActiveTab('pending')}
            >
              Pending Verification
              {pendingCalls.length > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs">
                  {pendingCalls.length}
                </span>
              )}
            </button>
            <button 
              className={`py-2 px-6 ${activeTab === 'verified' ? 'text-[#A14996] font-medium' : 'text-gray-500'}`}
              onClick={() => setActiveTab('verified')}
            >
              Verified Calls
            </button>
            <button 
              className={`py-2 px-6 ${activeTab === 'flagged' ? 'text-[#A14996] font-medium' : 'text-gray-500'}`}
              onClick={() => setActiveTab('flagged')}
            >
              Flagged Calls
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#A14996]"></div>
            </div>
          ) : (
            <div>
              {activeTab === 'pending' && (
                <div>
                  {pendingCalls.length > 0 ? (
                    pendingCalls.map((call) => (
                      <CallVerificationCard 
                        key={call._id} 
                        call={call} 
                        onCallUpdated={handleCallUpdated}
                        status="pending"
                      />
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-8">No pending calls to verify</p>
                  )}
                </div>
              )}
              {activeTab === 'verified' && (
                <div>
                  {verifiedCalls.length > 0 ? (
                    verifiedCalls.map((call) => (
                      <CallVerificationCard 
                        key={call._id} 
                        call={call}
                        status="verified"
                      />
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-8">No verified calls</p>
                  )}
                </div>
              )}
              {activeTab === 'flagged' && (
                <div>
                  {flaggedCalls.length > 0 ? (
                    flaggedCalls.map((call) => (
                      <CallVerificationCard 
                        key={call._id} 
                        call={call}
                        status="flagged"
                      />
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-8">No flagged calls</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DefaultLayout>
  )
}

export default CallVerificationPanel