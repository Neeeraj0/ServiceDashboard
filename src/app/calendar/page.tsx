"use client"

import DefaultLayout from "@/components/Layouts/DefaultLaout";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import CalendarBox from "@/components/CalenderBox";
import Upcoming from "@/components/Routine/Upcoming";

// export const metadata: Metadata = {
//   title: "Next.js Calender Page | NextAdmin - Next.js Dashboard Kit",
//   description:
//     "This is Next.js Calender page for NextAdmin  Tailwind CSS Admin Dashboard Kit",
//   // other metadata
// };

const CalendarPage = () => {
  return (
    <DefaultLayout>
      <div className="mx-auto max-w-7xl">
        <Breadcrumb pageName="Routine" />

        {/* <CalendarBox /> */}
        <Upcoming />
      </div>
    </DefaultLayout>
  );
};

export default CalendarPage;
