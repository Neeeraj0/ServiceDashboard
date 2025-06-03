import * as Dialog from "@radix-ui/react-dialog";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import React from "react";
import "../BreakdownCalls/module.style.css";
import issuesList from "../utils/IssuesList";
import { useAuth } from "@/app/context/AuthContext";
import axios from "axios";
import { formatDate } from "../utils/dateUtils";
import { ACUnit, Order } from "@/types/breakdown/Order";

interface MarkAsResolvedProps {
  orderId: string;
  // clientName: string,
  // clientNumber: string,
  // description: string,
  // complaintRaised: string,
  // addressDisplay: string,
  // customerComplaint: string ,
  // ac_units: ACUnit[],
  onResolved: (id: string) => void;
  ac_units?: ACUnit[];
  order: Order
}

export default function MarkAsReolved({ orderId, onResolved, order, ac_units}: MarkAsResolvedProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [resolveNote, setResolveNote] = useState("");
  const [issueIdentified, setIssueIdentified] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [shippingAddress, setShippingAddress] = useState<string | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const { userName } = useAuth();

  console.log("MarkAsResolved Props: ", order);

  const [token, setToken] = useState<string | null>(null);

  const getToken = async (): Promise<string | null> => {
    if (token) {
      return token;  
    }

    try {
      // const loginResponse = await axios.post("https://testing.backend.summary.circolife.vip/api/login",
      const loginResponse = await axios.post("https://testing.backend.summary.circolife.vip/api/login", 
        {
          email: "admin@circolife.com",
          password: "admin@123",
        }, 
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      if (loginResponse.status !== 200) {
        throw new Error("Login failed");
      }

      const data = loginResponse.data;
      const newToken = data.token;
      setToken(newToken);  // Save token in state
      localStorage.setItem("token", newToken);  // Optional: still store token in localStorage for future sessions
      localStorage.setItem("isAuthenticated", "true");

      return newToken;
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Authentication failed");
      return null;
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resolveNote.trim() || !issueIdentified.trim()) {
      toast.error("Please provide resolution details and select an issue.");
      return;
    }

    try {
      const token = await getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      const transformedACUnit =
  ac_units && ac_units.length > 0
    ? ac_units.map((unit) => {
        let type, capacity;
        console.log("units", unit);

        if (
          unit?.model === "1 Ton" ||
          unit?.model === "1.5 Ton" ||
          unit?.model === "2 Ton" ||
          unit?.model === "3 Ton"
        ) {
          type = "Split AC";
          capacity =
            unit.model === "1 Ton"
              ? "S10"
              : unit.model === "1.5 Ton"
              ? "S15"
              : unit.model === "2 Ton"
              ? "S20"
              : unit.model === "3 Ton"
              ? "S30"
              : unit.model;
        } 
        else if (unit?.model.startsWith("S")) {
          type = "Split AC";
          capacity =
            unit.model === "S10"
              ? "S10"
              : unit.model === "S15"
              ? "S15"
              : unit.model === "S20"
              ? "S20"
              : unit.model;
        } 
        else if (unit?.model.startsWith("C")) {
          type = "Cassette AC";
          capacity =
            unit.model === "C10"
              ? "C10"
              : unit.model === "C15"
              ? "C15"
              : unit.model === "C20"
              ? "C20"
              : unit.model === "C30"
              ? "C30"
              : unit.model;
        } 
        else {
          type = "Split AC";
          capacity = unit?.model;
        }

        return {
          type,
          capacity,
          quantity: unit?.quantity,
        };
      })
    : [
        {
          type: "Split AC",
          capacity: "S10",
          quantity: 1,
        },
      ];

      console.log('inside handle submit');
      console.log(token);
      const payload = {
        _id: orderId,
        address: order.address ,
        title: "Breakdown",
        customerComplaint: order.subject,
        ac_units: transformedACUnit,
        assignedTechnicians: [""], 
        deviceId: order.deviceid,
        complaintRaised: order.TimeStamp,
        quantity: 1,
        taskType: "breakdown",
        client_number: order.contactnumber,
        client_name: order.contactperson ,
        assignedBy: userName ? [userName] : [],
        status: "Completed",
        note: resolveNote, // Resolution note
        issueObserved: issueIdentified, // Selected issue
        endDate: new Date().toISOString(),
      };

      console.log("Payload:", payload);

      const saveTaskResponse = await axios.post(`${process.env.NEXT_PUBLIC_SERVICE_BACKEND_API}/api/tasks/saveMarkAsResolved`, payload, {
      // const saveTaskResponse = await axios.post(`http://localhost:8080/api/tasks/saveMarkAsResolved`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!saveTaskResponse) {
        toast.error("Failed to save task resolution");
      }

      const now = new Date();
      const istDateTime = now.toLocaleString('sv-SE', { 
          timeZone: 'Asia/Kolkata' 
      }).replace(' ', 'T');

      const summaryResponse = await fetch(
        // `https://app.dev.circolife.vip/api/queryApi/updateQueryStatus/?id=${orderId}`,
        `https://production.circolife.vip/api/queryApi/updateQueryStatus/${orderId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: false,
            queryStatus: "Completed",
            resolvedNote: resolveNote,
            resolvedTimeStamp: istDateTime,
          }),
        }
      );

      if (summaryResponse.status === 403) {
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
              <button 
                className="absolute top-2 right-2 text-gray-600 hover:text-red-500"
                onClick={() => setIsOpen(false)}
                aria-label="Close"
              >
                &times; {/* You can also use an SVG icon here */}
              </button>
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

                <button 
                  type="submit" 
                  className={`btn-primary bg-[#A14996] text-white p-2 rounded-lg`}
                >
                  {'Submit'}
                </button>
              </form>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
