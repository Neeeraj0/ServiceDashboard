import * as Dialog from "@radix-ui/react-dialog";
import { useState, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";

interface CompletedApproveTaskProps {
  orderId: string;
}

export default function CompletedApproveTask({
  orderId,
}: CompletedApproveTaskProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [issueFound, setIssueFound] = useState("");
  const [correctiveAction, setCorrectiveAction] = useState("");
  const selectedOrderId = localStorage.getItem("selectedOrderId");
  const modalRef = useRef(null);

  const taskDataCreation = {
    _id: orderId,
    issueFound: issueFound,
    counterMeasures: correctiveAction,
  };
  const queryData = {
    queryStatus: "complete",
  };

  const handleApproveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (orderId) {
      try {
        await axios.post("http://devappapi.circolives.in/api/query/resolveQuery", taskDataCreation, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        await axios.put(`http://devappapi.circolives.in/api/query/changeQueryStatus/${orderId}`, queryData, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        toast.success("Task approved and query status changed successfully");
        setIssueFound("");
        setCorrectiveAction("");
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
              <Dialog.Description className="text-center text-sm text-gray-600 mt-2">
                Enter details of the issue and corrective action.
              </Dialog.Description>

              <Dialog.Close asChild>
                <button
                  aria-label="Close"
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  &times;
                </button>
              </Dialog.Close>

              <form onSubmit={handleApproveTask} className="mt-4">
                <div className="mb-6">
                  <label className="block font-sans text-[14px] text-gray-700 mb-1">
                    Issue Found
                  </label>
                  <input
                    type="text"
                    className="form-control w-full p-2 border rounded"
                    value={issueFound}
                    onChange={(e) => setIssueFound(e.target.value)}
                  />
                </div>

                <div className="mb-6">
                  <label className="block font-sans text-[14px] text-gray-700 mb-1">
                    Corrective Action Taken
                  </label>
                  <input
                    type="text"
                    className="form-control w-full p-2 border rounded"
                    value={correctiveAction}
                    onChange={(e) => setCorrectiveAction(e.target.value)}
                  />
                </div>

                <div className="flex justify-center mt-8">
                  <button
                    type="submit"
                    className="bg-purple-600 text-white py-2 px-8 rounded text-[16px] hover:bg-purple-700"
                  >
                    Approve
                  </button>
                </div>
              </form>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
