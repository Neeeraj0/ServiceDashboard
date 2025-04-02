import * as Dialog from "@radix-ui/react-dialog";
import { useState, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "@/app/context/AuthContext";

interface CompletedApproveTaskProps {
  orderId: string;
  taskDetails: any; // Replace 'any' with the actual type if known
  onApprove: (orderId: string) => void;
}

export default function SiteSurveyApprove({
  orderId,
  taskDetails,
  onApprove
}: CompletedApproveTaskProps) {
  const [isOpen, setIsOpen] = useState(false);
  const modalRef = useRef(null);
  const [showAnimation, setShowAnimation] = useState(false);
  const [taskApproved, setTaskApproved] = useState(false);
  const [isApproving, setIsApproving] = useState(false); 
  const {userId, userName} = useAuth();
  console.log(userId, userName);

  const handleApproveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsApproving(true);
    setShowAnimation(true); // Start showing animation
    setTaskApproved(false); // Reset task approval state
  
    if (orderId) {
      try {
        await new Promise((resolve) => setTimeout(resolve, 5000));
  
        // Make the PUT request to the backend
        await axios.put(`${process.env.NEXT_PUBLIC_SERVICE_BACKEND_API}/api/siteSurveyDetails/approveTask/${orderId}`, 
          {
            adminId: userId, 
          },  
          {  
            headers: {
              "Content-Type": "application/json",
            },
          });
  
        // If the request is successful, execute onApprove function
        onApprove(orderId);
  
        setTaskApproved(true); // Mark task as approved
        toast.success("Task approved and installation task created successfully");
  
      } catch (error) {
        console.error("Error approving task:", error);
  
        if (axios.isAxiosError(error) && error.response) {
          const backendMessage = error.response.data ? error.response.data.error || error.response.data : "An error occurred while processing your request.";
          const status = error.response.status || "Unknown";
  
          toast.error(`Error ${status}: ${backendMessage}`); // Display detailed error message
        } else {
          toast.error("Failed to approve task. Please try again.");
        }
      } finally {
        setShowAnimation(false);
        setIsOpen(false); 
        setIsApproving(false); 
      }
    } else {
      alert("No corresponding task ID for selected task");
    }
  };
  

  return (
    <div className="flex w-full font-sans">
      <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
        <Dialog.Trigger asChild>
          <button
            onClick={() => setIsOpen(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded hover:bg-blue-600"
          >
            Approve Task
          </button>
        </Dialog.Trigger>

        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40" />
          <Dialog.Content className="flex items-center justify-center fixed inset-0 w-full h-full bg-transparent">
            <div className="w-[35%] h-auto bg-white rounded-lg p-8 shadow-lg relative" ref={modalRef}>
              <Dialog.Title className="text-center font-sans text-lg font-bold">
                  {isApproving ? "Approving Task..." : "Approve Task"}
              </Dialog.Title>

              <Dialog.Close asChild>
                <button
                  aria-label="Close"
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  &times;
                </button>
              </Dialog.Close>

              <div className="flex justify-center mt-8">
                {showAnimation && (
                  <div className="flex justify-center">
                    {/* GIF animation */}
                    <img
                      src="/images/approve/SuccessfullyDone.gif"
                      alt="Loading animation"
                      width="150"
                      height="150"
                    />
                  </div>
                )}

                {!showAnimation && taskApproved && (
                  <div className="text-center">
                    <p className="text-green-500">Task Approved Successfully!</p>
                  </div>
                )}

                {!showAnimation && !taskApproved && (
                  <button
                    type="submit"
                    className="bg-purple-600 text-white py-2 px-8 rounded text-[16px] hover:bg-purple-700"
                    onClick={handleApproveTask}
                  >
                    Approve
                  </button>
                )}
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
