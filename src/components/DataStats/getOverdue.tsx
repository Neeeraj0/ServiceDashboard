import React, { useEffect, useState } from "react";
import axios from "axios";
import { format } from "date-fns";

// Types
interface Query {
  _id: string;
  contactperson: string;
  contactnumber: string;
  subject: string;
  summary: string;
  address: string;
  deviceid: string;
  queryRaised: string;
  queryStatus: string;
  status: string;
}

const OverdueTasks: React.FC = () => {
  const [queries, setQueries] = useState<Query[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQueries = async () => {
      try {
        const res = await axios.get("https://production.circolife.vip/api/query/queries/all", {
          headers: { "Content-Type": "application/json" },
        });
        console.log("Response data: ", res.data);
        if (!res.data || !res.data.allQueries) {
          setError("No queries found.");
          return;
        }
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const filteredData: Query[] = res.data.allQueries
          .filter((q: any) => q.TimeStamp && new Date(q.TimeStamp) < yesterday)
          .map((order: any) => ({
            _id: order._id,
            contactperson: order.contactperson || "N/A",
            contactnumber: order.contactnumber || "N/A",
            subject: order.subject || "N/A",
            summary: order.summery || "N/A",
            deviceid: order.deviceid || "N/A",
            queryRaised: order.TimeStamp,
            status: order.status || "N/A",
            queryStatus: order.queryStatus === "assign" ? "Assigned" : order.queryStatus === "complete" ? "Completed" : order.queryStatus === "open" ? "Not Started" : "N/A",
            address: [
              order.flat,
              order.area,
              order.address,
              order.city,
              order.state,
              order.pincode,
            ]
              .filter((part) => part?.trim() !== "")
              .join(", ") || "N/A",
          }))
          .slice(0, 5);
        setQueries(filteredData);
      } catch (err: any) {
        console.error("Error fetching queries: ", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchQueries();
  }, []);

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="p-4">
      <div className="flex justify-between">
        <h2 className="text-lg font-semibold mb-4">Overdue Complaints</h2>
        <button
          onClick={() => (window.location.href = "/queries/all")}
          className="text-blue-600"
        >
          Show All
        </button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-md p-5">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-100 text-xs uppercase">
            <tr>
              <th className="p-2 truncate w-20">Query ID</th>
              <th className="p-2">Contact Person</th>
              <th className="p-2">Contact Number</th>
              <th className="p-2">Subject</th>
              <th className="p-2">Summary</th>
              <th className="p-2">Address</th>
              <th className="p-2">Device ID</th>
              <th className="p-2">Query Raised</th>
              <th className="p-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {queries.map((query) => (
              <tr key={query._id} className="hover:bg-gray-50">
                <td className="p-2 truncate">{query._id}</td>
                <td className="p-2">{query.contactperson}</td>
                <td className="p-2">{query.contactnumber}</td>
                <td className="p-2">{query.subject}</td>
                <td className="p-2 whitespace-pre-wrap">{query.summary}</td>
                <td className="p-2">{query.address}</td>
                <td className="p-2">{query.deviceid}</td>
                <td className="p-2">
                  {format(new Date(query.queryRaised), "dd MMM yyyy")}
                </td>
                <td className="p-2 text-blue-600">{query.queryStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OverdueTasks;
