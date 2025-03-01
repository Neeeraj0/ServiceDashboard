import * as Dialog from "@radix-ui/react-dialog";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import React from "react";
import "../BreakdownCalls/module.style.css";
import issuesList from "../utils/IssuesList";
import { useAuth } from "@/app/context/AuthContext";
import axios from "axios";
import { formatDate } from "../utils/dateUtils";

interface MarkAsResolvedProps {
  orderId: string;
  onResolved: (id: string) => void;
}

export default function MarkAsResolved({ orderId, onResolved }: MarkAsResolvedProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [resolveNote, setResolveNote] = useState("");
  const [issueIdentified, setIssueIdentified] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [shippingAddress, setShippingAddress] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [clientName, setClientName] = useState<string | null>(null);
  const [clientNumber, setClientNumber] = useState<string | null>(null);
  const [customerComplaint, setCustomerComplaint] = useState<string | null>(null);
  const { userName } = useAuth();

  // Fetch authentication token
  const getToken = async (): Promise<string | null> => {
    let token = localStorage.getItem("token");

    if (!token) {
      try {
        const loginResponse = await fetch("https://testing.backend.summary.circolife.vip/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "admin@circolife.com",
            password: "admin@123",
          }),
        });

        if (!loginResponse.ok) {
          throw new Error("Login failed");
        }

        const data = await loginResponse.json();
        token = data.token;
        localStorage.setItem("token", token || "");
        localStorage.setItem("isAuthenticated", "true");
      } catch (error) {
        console.error("Login error:", error);
        toast.error("Authentication failed");
        return null;
      }
    }

    return token;
  };

  // Fetch shipping address and customer details
  useEffect(() => {
    const fetchShippingAddress = async () => {
      const token = await getToken();
      if (!token) return;

      try {
        const response = await fetch("https://testing.backend.summary.circolife.vip/api/summary/address", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch address. Status: ${response.status}`);
        }

        const data = await response.json();
        const matchedOrder = data.find((item: any) => item._id === orderId);

        if (matchedOrder) {
          const address = matchedOrder.customerData?.shipping_address[0] || null;
          setShippingAddress(address ? `${address.line1}, ${address.line2}, ${address.city}, ${address.state} - ${address.pincode}` : null);
          setDeviceId(matchedOrder.deviceid || null);
          setCustomerComplaint(matchedOrder.subject || null);
          setClientName(matchedOrder.contactperson || null);
          setClientNumber(matchedOrder.contactnumber || null);
        } else {
          toast.error("Order ID not found in address data.");
        }
      } catch (error) {
        console.error("Error fetching shipping address:", error);
        toast.error("Failed to fetch shipping address.");
      }
    };

    if (isOpen) {
      fetchShippingAddress();
    }
  }, [isOpen, orderId]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resolveNote.trim() || !issueIdentified.trim()) {
      toast.error("Please provide resolution details and select an issue.");
      return;
    }

    setIsLoading(true);

    try {
      const token = await getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      const payload = {
        _id: orderId,
        address: shippingAddress || "N/A",
        title: "Breakdown",
        customerComplaint: customerComplaint || "N/A",
        ac_units: [],
        servicingDate: new Date().toISOString(),
        assignedTechnicians: [""], 
        deviceId: deviceId || "Unknown",
        quantity: 1,
        taskType: "breakdown",
        client_number: clientNumber || "N/A",
        client_name: clientName || "N/A",
        assignedBy: userName ? [userName] : [],
        status: "Completed",
        note: resolveNote, // Resolution note
        issueObserved: issueIdentified, // Selected issue
        endDate: new Date().toISOString(),
      };

      console.log("Payload:", payload);

      const saveTaskResponse = await axios.post(`${process.env.NEXT_PUBLIC_SERVICE_BACKEND_API}/api/tasks/saveMarkAsResolved`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!saveTaskResponse) {
        toast.error("Failed to save task resolution");
      }

      const summaryResponse = await fetch(
        `https://testing.backend.summary.circolife.vip/api/summary/queryresolved/?id=${orderId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            resolvenote: resolveNote,
          }),
        }
      );

      if (summaryResponse.status === 403) {
        toast.error("Session expired. Please log in again.");
        localStorage.removeItem("token");
        localStorage.setItem("isAuthenticated", "false");
        return;
      }

      if (!summaryResponse.ok) {
        throw new Error(`API error: ${summaryResponse.status}`);
      }

      toast.success("Query marked as resolved successfully");
      onResolved(orderId);
      setIsOpen(false);
      setResolveNote("");
      setIssueIdentified("");
    } catch (error) {
      console.error("Error marking as resolved:", error);
      toast.error("Failed to mark as resolved.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex w-full font-sans">
      <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
        {/* Trigger Button */}
        <Dialog.Trigger asChild>
          <button onClick={() => setIsOpen(true)} className="px-4 py-2 flex items-center gap-2 text-sm font-medium text-black bg-white rounded text-center mx-auto">
            <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            Mark as Resolved
          </button>
        </Dialog.Trigger>

        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40" />
          <Dialog.Content className="flex items-center justify-center fixed inset-0 w-full h-full bg-transparent">
            <div className="w-[35%] h-auto bg-white rounded-lg p-8 shadow-lg relative">
              <Dialog.Title className="text-center font-sans text-lg font-medium">Mark Query as Resolved</Dialog.Title>
              <Dialog.Description className="text-center text-sm text-gray-600 mt-2">Provide details about the resolution</Dialog.Description>

              <form onSubmit={handleSubmit} className="mt-4">
                <div className="mb-6">
                  <label className="block text-sm text-gray-700 mb-1">Issue Identified</label>
                  <select className="form-control w-full p-2 border rounded" value={issueIdentified} onChange={(e) => setIssueIdentified(e.target.value)}>
                    <option value="" disabled>Select</option>
                    {issuesList.map((issue, index) => (
                      <option key={index} value={issue}>{issue}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-6">
                  <label className="block text-sm text-gray-700 mb-1">Resolution Note</label>
                  <textarea className="form-control w-full p-2 border rounded" rows={4} value={resolveNote} onChange={(e) => setResolveNote(e.target.value)} required />
                </div>

                <button type="submit" disabled={isLoading} className="bg-purple-600 text-white py-2 px-8 rounded text-sm hover:bg-purple-700">{isLoading ? "Processing..." : "Submit"}</button>
              </form>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
