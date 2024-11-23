"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { ACUnit, Order } from "@/types/breakdown/Order";
import { ShippingAddress } from "@/types/breakdown/ShippingAddress";
import AssignTask from "../Dialogs/AssignTask";

const OpenBreakdown = () => {
  const [backendData, setBackendData] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [shippingAddresses, setShippingAddresses] = useState<ShippingAddress[]>([]);
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 10; // For pagination, if required

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await axios.get("http://devappapi.circolives.in/api/query/queries/all", {
          headers: {
            "Content-Type": "application/json",
          },
        });

        setBackendData(
          res.data.data.map((order: any) => ({
            ...order,
            contactperson: order.contactperson || "N/A",
            contactnumber: order.contactnumber || "N/A",
            subject: order.subject || "N/A",
            deviceid: order.deviceid || "N/A",
            orderModels: order.orderModels || [],
          }))
        );
      } catch (err: any) {
        console.error("Error fetching data: ", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  // Transform orderModels to ACUnit array
  const transformOrderModels = (orderModels: (string | number | null)[]): ACUnit[] => {
    const acUnits: ACUnit[] = [];
    for (let i = 0; i < orderModels.length; i += 2) {
      const model = orderModels[i] as string;
      const quantity = (orderModels[i + 1] as number) || 1;
      if (model && model !== "Select Device") {
        acUnits.push({ model, quantity });
      }
    }
    return acUnits;
  };

  // Fetch shipping addresses
  useEffect(() => {
    const fetchShippingAddresses = async () => {
      try {
        const loginResponse = await axios.post(
          "https://testing.backend.summary.circolife.vip/api/login",
          {
            email: "admin@gmail.com",
            password: "admin@123",
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const token = loginResponse.data.token;

        const res = await axios.get("http://35.154.208.29:5000/api/summary/address", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        setShippingAddresses(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchShippingAddresses();
  }, []);

  const getShippingAddress = (orderId: string) => {
    const address = shippingAddresses.find((address) => address._id === orderId);
    return address?.customerData?.shipping_address[0] || null;
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return (
      <div className="flex flex-col text-sm">
        <span>{date.toLocaleDateString()}</span>
        <span>{date.toLocaleTimeString()}</span>
      </div>
    );
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error fetching data: {error}</div>;

  return (
    <div>
      <table className="w-full text-left table-auto min-w-max">
        <thead>
          <tr>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Task ID</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Contact Person</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Customer Details</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Issue Reported</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Customer Address</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Date</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Device ID</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Action</th>
          </tr>
        </thead>
        <tbody>
          {backendData.length === 0 ? (
            <tr>
              <td colSpan={8} className="text-center">
                No tasks available
              </td>
            </tr>
          ) : (
            backendData
              .filter((order) => ["open", "assign"].includes(order.queryStatus)) // Adjust filter for new queryStatus
              .map((order, index) => {
                const shippingAddress = getShippingAddress(order._id);
                const addressDisplay = shippingAddress
                  ? `${shippingAddress.line1}, ${shippingAddress.line2 || ""}, ${shippingAddress.city}, ${shippingAddress.state}, ${shippingAddress.pincode}`
                  : "N/A";

                return (
                  <tr key={order._id}>
                    <td className="p-2 border-b border-blue-gray-50 text-sm">{index + 1}</td>
                    <td className="p-2 border-b border-blue-gray-50 text-sm">
                      {order.contactperson} <br /> {order.contactnumber}
                    </td>
                    <td className="p-2 border-b border-blue-gray-50 text-sm">
                      {order.contactperson} <br /> {order.contactnumber}
                    </td>
                    <td className="p-2 border-b border-blue-gray-50 text-sm">{order.subject}</td>
                    <td className="p-2 border-b border-blue-gray-50 text-wrap max-w-50">{addressDisplay}</td>
                    <td className="p-2 border-b border-blue-gray-50 text-wrap text-sm flex-wrap">
                      {formatDate(order.TimeStamp)}
                    </td>
                    <td className="p-2 border-b border-blue-gray-50 text-sm max-w-50">
                      {order.deviceid && order.deviceid !== "Select Device" ? order.deviceid : "N/A"}
                    </td>
                    <td className="p-2 border-b border-blue-gray-50 mt-[5vh] text-sm">
                      <AssignTask
                        orderId={order._id}
                        clientName={order.contactperson}
                        clientNumber={order.contactnumber}
                        description={order.summery}
                        complaintRaised={order.TimeStamp}
                        customerComplaint={order.subject}
                        addressDisplay={addressDisplay}
                        ac_units={
                          Array.isArray(order.orderModels) && typeof order.orderModels[0] === "string"
                            ? transformOrderModels(order.orderModels as (string | number | null)[])
                            : (order.orderModels as ACUnit[])
                        }
                      />
                    </td>
                  </tr>
                );
              })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default OpenBreakdown;
