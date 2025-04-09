import { useState } from "react";
import ClickOutside from "@/components/ClickOutside";
import { ACUnit, Order } from "@/types/breakdown/Order";
import AssignTask from "../Dialogs/AssignTask";
import MarkAsResolved from "../Dialogs/MarkAsResolved";

export type ShippingAddressDetail = {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
} | null;

const DropdownDefaultTwo = ({
  orderId,
  order,
  getShippingAddress,
  transformOrderModels,
  onTaskAssigned,
  onResolved
}: {
  orderId: string;
  order: Order;
  getShippingAddress: (orderId: string) => ShippingAddressDetail;
  transformOrderModels: (orderModels: (string | number | null)[]) => ACUnit[];
  onTaskAssigned: (id: string) => void;
  onResolved: (id: string) => void;
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isResolvedOpen, setIsResolvedOpen] = useState(false);

  const shippingAddrDetail = getShippingAddress(orderId);

  return (
    <div>
      <div className="relative flex items-center justify-center">
        <button
          className="flex rounded-md bg-white text-red-500 px-3 py-2 shadow-sm hover:bg-gray-50 border-gray-300 border-sm border"
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          Action
          <svg className="ml-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 top-full z-40 mt-1 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
            <div className="py-1 gap-1 flex flex-col items-center justify-center mx-auto">
              <AssignTask
                orderId={orderId}
                clientName={order.contactperson}
                clientNumber={order.contactnumber}
                description={order.summary}
                complaintRaised={order.TimeStamp}
                customerComplaint={order.subject}
                // addressDisplay={
                //   shippingAddrDetail
                //     ? `${shippingAddrDetail.line1}, ${shippingAddrDetail.city}`
                //     : "N/A"
                // }
                addressDisplay={order.address}
                ac_units={
                  Array.isArray(order.orderModels) && typeof order.orderModels[0] === "string"
                    ? transformOrderModels(order.orderModels as (string | number | null)[])
                    : (order.orderModels as ACUnit[])
                }
                onTaskAssigned={onTaskAssigned}
              />
             {/* <MarkAsResolved
                  orderId={orderId}
                  order={order}
                  onResolved={onResolved}
              /> */}
              <MarkAsResolved 
                orderId={orderId}
                order= {order}
                onResolved={onResolved}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DropdownDefaultTwo;
