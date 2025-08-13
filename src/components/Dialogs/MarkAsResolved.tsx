import * as Dialog from "@radix-ui/react-dialog";
import { useState, useRef } from "react";
import toast from "react-hot-toast";
import React from "react";
import "../BreakdownCalls/module.style.css";
import issuesList from "../utils/IssuesList";
import { useAuth } from "@/app/context/AuthContext";
import axios from "axios";
import { ACUnit, Order } from "@/types/breakdown/Order";

interface MarkAsResolvedProps {
  orderId: string;
  order: Order;
  ac_units?: ACUnit[];
  onResolved: (id: string) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function MarkAsResolved({
  orderId,
  onResolved,
  order,
  ac_units,
  isOpen,
  onOpenChange
}: MarkAsResolvedProps) {
  const [resolveNote, setResolveNote] = useState("");
  const [issueIdentified, setIssueIdentified] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { userName } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  
  // Prevent multiple simultaneous submissions
  const isSubmittingRef = useRef(false);

  const getToken = async (): Promise<string | null> => {
    if (token) return token;
    
    // Check localStorage first (but don't store new tokens there)
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
      return storedToken;
    }

    try {
      const loginResponse = await axios.post(
        "https://testing.backend.summary.circolife.vip/api/login",
        {
          email: "admin@circolife.com",
          password: "admin@123",
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      const newToken = loginResponse.data.token;
      setToken(newToken);
      // Note: We're not storing in localStorage to avoid Claude.ai artifact issues
      return newToken;
    } catch (error) {
      console.error("Authentication failed:", error);
      toast.error("Authentication failed");
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent multiple simultaneous submissions
    if (isSubmittingRef.current || isLoading) {
      console.warn("Submission already in progress, ignoring duplicate call");
      return;
    }

    if (!resolveNote.trim() || !issueIdentified.trim()) {
      toast.error("Please provide resolution details and select an issue.");
      return;
    }

    try {
      // Set flags to prevent duplicate submissions
      isSubmittingRef.current = true;
      setIsLoading(true);
      
      const authToken = await getToken();
      if (!authToken) {
        return;
      }

      const transformedACUnit =
        ac_units?.length
          ? ac_units.map((unit) => {
              let type = "Split AC";
              let capacity = unit?.model || "";

              if (unit?.model?.startsWith("C")) {
                type = "Cassette AC";
              }

              if (unit?.model === "1 Ton") capacity = "S10";
              else if (unit?.model === "1.5 Ton") capacity = "S15";
              else if (unit?.model === "2 Ton") capacity = "S20";
              else if (unit?.model === "3 Ton") capacity = "S30";

              return {
                type,
                capacity,
                quantity: unit?.quantity,
              };
            })
          : [{ type: "Split AC", capacity: "S10", quantity: 1 }];

      const payload = {
        _id: orderId,
        ticketId: order.ticketId,
        address: order.address,
        title: "Breakdown",
        customerComplaint: order.subject,
        ac_units: transformedACUnit,
        assignedTechnicians: [""],
        deviceId: order.deviceid,
        complaintRaised: order.TimeStamp,
        quantity: 1,
        taskType: "breakdown",
        addressId: order.addressId,
        customerId: order.customer_id,
        client_number: order.customerNumber || order.contactnumber || "NA",
        client_name: order.customerName,
        assignedBy: userName ? [userName] : [],
        status: "Completed",
        note: resolveNote,
        issueObserved: issueIdentified,
        endDate: new Date().toISOString(),
      };

      console.log("Submitting payload:", payload);

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVICE_BACKEND_API}/api/tasks/saveMarkAsResolved`,
        // `http://localhost:8080/api/tasks/saveMarkAsResolved`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          timeout: 30000, // 30 second timeout
        }
      );

      console.log("API Response:", response.data);
      
      toast.success("Query marked as resolved successfully");
      onResolved(orderId);
      onOpenChange(false);
      
      // Reset form
      setResolveNote("");
      setIssueIdentified("");
      
    } catch (error) {
      console.error("Failed to mark as resolved:", error);
      
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          toast.error("Request timeout. Please try again.");
        } else if (error.response?.status === 401) {
          toast.error("Session expired. Please refresh and try again.");
          setToken(null);
          localStorage.removeItem("token");
        } else {
          toast.error(`Failed to mark as resolved: ${error.response?.data?.message || error.message}`);
        }
      } else {
        toast.error("Failed to mark as resolved. Please try again.");
      }
    } finally {
      setIsLoading(false);
      isSubmittingRef.current = false;
    }
  };

  // Reset submission flag when dialog closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      isSubmittingRef.current = false;
      setIsLoading(false);
    }
    onOpenChange(open);
  };

  return (
    <div className="flex w-full font-sans">
      <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40" />
          <Dialog.Content className="flex items-center justify-center fixed inset-0 w-full h-full bg-transparent">
            <div className="w-[35%] h-auto bg-white rounded-lg p-8 shadow-lg relative">
              <button
                className="absolute top-2 right-2 text-gray-600 hover:text-red-500"
                onClick={() => handleOpenChange(false)}
                aria-label="Close"
                disabled={isLoading}
              >
                &times;
              </button>
              <Dialog.Title className="text-center text-lg font-medium">
                Mark Query as Resolved
              </Dialog.Title>
              <Dialog.Description className="text-center text-sm text-gray-600 mt-2">
                Provide details about the resolution
              </Dialog.Description>

              <form onSubmit={handleSubmit} className="mt-4">
                <div className="mb-6">
                  <label className="block text-sm text-gray-700 mb-1">
                    Issue Identified
                  </label>
                  <select
                    className="form-control w-full p-2 border rounded"
                    value={issueIdentified}
                    onChange={(e) => setIssueIdentified(e.target.value)}
                    required
                    disabled={isLoading}
                  >
                    <option value="" disabled>
                      Select
                    </option>
                    {issuesList.map((issue, index) => (
                      <option key={index} value={issue}>
                        {issue}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-6">
                  <label className="block text-sm text-gray-700 mb-1">
                    Resolution Note
                  </label>
                  <textarea
                    className="form-control w-full p-2 border rounded"
                    rows={4}
                    value={resolveNote}
                    onChange={(e) => setResolveNote(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || isSubmittingRef.current}
                  className={`btn-primary bg-[#A14996] text-white p-2 rounded-lg w-full ${
                    isLoading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {isLoading ? "Submitting..." : "Submit"}
                </button>
              </form>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}