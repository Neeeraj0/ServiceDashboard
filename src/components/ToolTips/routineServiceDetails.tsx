interface RoutineServiceDetailsProps {
  totalUnits: number;
  completedUnits: number;
  message?: string;
}

const RoutineServiceDetails: React.FC<RoutineServiceDetailsProps> = ({
  totalUnits,
  completedUnits,
  message = "Service completion status",
}) => {
  const pendingUnits = totalUnits - completedUnits;

  return (
    <div className="relative inline-block group h-full">
      <button
        className="relative px-6 py-3 text-sm font-semibold text-white bg-[#3182ce]/10 rounded-xl hover:bg-[#3182ce]/20 transition-all overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 blur-xl"></div>

        <span className="relative flex items-center gap-2 text-[#3182ce]">
          <svg
            viewBox="0 0 24 24"
            stroke="currentColor"
            fill="none"
            className="w-4 h-4 text-[#3182ce]"
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

      <div
        className="absolute invisible opacity-0 group-hover:visible group-hover:opacity-100 bottom-full left-1/2 -translate-x-1/2 mb-6 w-[300px] transition-all duration-300 ease-out transform group-hover:translate-y-0 translate-y-2 z-50"
      >
        <div className="relative p-4 bg-white rounded-2xl shadow-[0_0_30px_rgba(79,70,229,0.15)]">
          <div className="mb-2">
            <h3 className="text-sm font-semibold text-gray-800">Routine Service Details</h3>
            <p className="text-xs text-gray-500">{message}</p>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Units:</span>
              <span className="text-gray-900 font-medium">{totalUnits}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Completed Units:</span>
              <span className="text-green-700 bg-green-100 px-2 py-0.5 rounded-full">{completedUnits}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Pending Units:</span>
              <span className="text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">{pendingUnits}</span>
            </div>
          </div>

          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 to-cyan-500/5"></div>
        </div>
      </div>
    </div>
  );
};

export default RoutineServiceDetails;
