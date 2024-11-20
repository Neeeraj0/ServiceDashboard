import * as Dialog from "@radix-ui/react-dialog";
import { useState, useRef } from "react";
import axios from "axios";

interface CompletedApproveTaskProps {
  orderId: string;
}

export default function RoutineApproveTask({
  orderId,
}: CompletedApproveTaskProps) {
  const [isOpen, setIsOpen] = useState(false);
  const modalRef = useRef(null);
  const queryData = {
    queryStatus: "open",
  };

  const handleApproveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (orderId) {
      try {
        await axios.put(`http://localhost:8000/api/routine/approveTask/${orderId}`, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        alert("Task approved and query status changed successfully");
        setIsOpen(false);
      } catch (error) {
        console.error("Error approving task:", error);
        alert("Failed to approve task");
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
              <Dialog.Title className="text-center font-sans text-lg font-medium">
                Approve Task
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
                  <button
                    type="submit"
                    className="bg-purple-600 text-white py-2 px-8 rounded text-[16px] hover:bg-purple-700"
                    onClick={handleApproveTask}
                  >
                    Approve
                  </button>
                </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
