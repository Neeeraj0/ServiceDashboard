interface Device {
  deviceName: string;
  model: string;
  status: string;
}

interface AcInstallationDetailsProps {
  devices: Device[];
}

const AcInstallationDetails: React.FC<AcInstallationDetailsProps> = ({ devices = [] }) => {
  // Calculate counts for different statuses
  const pendingCount = devices.filter(device => 
    device.status === 'Installation Pending').length;
  const requestedCount = devices.filter(device => 
    device.status === 'Installation Open').length;
  const completedCount = devices.filter(device => 
    device.status === 'Installation Completed').length;
  
    console.log('Devices:', devices);
  // Group devices by model for the tooltip
  const modelGroups = devices.reduce((acc: Record<string, Device[]>, device) => {
    if (!acc[device.model]) {
      acc[device.model] = [];
    }
    acc[device.model].push(device);
    return acc;
  }, {});

  // Limit displayed models for large datasets
  const totalModels = Object.entries(modelGroups).length;
  const maxDisplayedModels = 8; // Limit to a reasonable number
  const displayedModels = totalModels > maxDisplayedModels 
    ? Object.entries(modelGroups).slice(0, maxDisplayedModels) 
    : Object.entries(modelGroups);

  return (
    <div className="relative inline-block group h-full">
      <button
        className="relative px-6 py-3 text-sm font-semibold text-white bg-[#A14996]/29 rounded-xl hover:bg-[#A14996]/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-300 overflow-hidden"
      >
        <div
          className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-xl"
        ></div>

        <span className="relative flex items-center gap-2 text-[#A14996]">
          <svg
            viewBox="0 0 24 24"
            stroke="currentColor"
            fill="none"
            className="w-4 h-4 text-[#A14996]"
          >
            <path
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            ></path>
          </svg>
          Status
        </span>
      </button>

      {/* Fixed tooltip positioning and overflow handling */}
      <div
        className="absolute invisible opacity-0 group-hover:visible group-hover:opacity-100 bottom-full left-1/2 -translate-x-1/2 mb-6 w-[350px] h-[120px] transition-all duration-300 ease-out transform group-hover:translate-y-0 translate-y-2 z-99"
        style={{ overflow: 'visible' }}
      >
            <div
              className="relative p-4 z-50 bg-white rounded-2xl shadow-[0_0_30px_rgba(79,70,229,0.15)]" 
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/20"
                >
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-4 h-4 text-indigo-700"
                  >
                    <path
                      clipRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      fillRule="evenodd"
                    ></path>
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-gray-800">AC Installation Details</h3>
              </div>

              <div className="space-y-3">
                {/* Summary counts */}
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">Total ACs:</span>
                  <span className="font-bold text-gray-900">{devices.length}</span>
                </div>
                
                {/* Status breakdown */}
                <div className="space-y-1">
                  {pendingCount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Pending:</span>
                      <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">{pendingCount}</span>
                    </div>
                  )}
                  {requestedCount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Open:</span>
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">{requestedCount}</span>
                    </div>
                  )}
                  {completedCount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Completed:</span>
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">{completedCount}</span>
                    </div>
                  )}
                </div>
                
                {/* Model breakdown with improved overflow handling */}
                <div className="pt-2 border-t bg-white opacity-100">
                  <h4 className="text-xs font-medium text-gray-700 mb-2">Model Breakdown:</h4>
                  <div className="max-h-fit space-y-2 pr-1" style={{ scrollbarWidth: 'thin' }}>
                    {displayedModels.map(([model, deviceList]) => (
                      <div key={model} className="text-xs">
                        <div className="flex justify-between mb-1">
                          <span className="font-medium text-gray-600">{model === "S10" ? "Split 1 Ton" : model === 'S20' ? "Split 2 Ton" : model === "S15" ? "Split 1.5 Ton" : model === "S30" ? "Split 3 Ton" : model === "C20" ? "Cassette 2 Ton" : model === "C30" ? "Cassette 3 Ton" : model === "C40" ? "Cassette 4 Ton" : model }:</span>
                          <span className="text-gray-900">{deviceList.length} units</span>
                        </div>
                        <div className="ml-2 space-y-1">
                          {['Installation Pending', 'Installation Open', 'Installation Completed'].map(status => {
                            const count = deviceList.filter(d => d.status === status).length;
                            if (count === 0) return null;
                            
                            const bgColor = 
                              status === 'Installation Pending' ? 'bg-yellow-100 text-yellow-800' :
                              status === 'Installation Open' ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800';
                            
                            return (
                              <div key={status} className="flex items-center justify-between">
                                <span className="text-gray-500">{status.replace('Installation ', '')}:</span>
                                <span className={`px-1.5 py-0.5 rounded-full ${bgColor}`}>{count}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    
                    
                  </div>
                </div>
              </div>

              <div
                className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10"
              ></div>

              
            </div>
      </div>
    </div>
  );
};

export default AcInstallationDetails;