import React, { useEffect, useState } from "react";
import ReactApexChart from "react-apexcharts";
import axios from "axios";
import { ApexOptions } from "apexcharts";

interface QueryData {
  _id: string;
  userid?: string;
  contactperson: string;
  contactnumber: string;
  contactemail: string;
  image?: string;
  subject: string;
  summery: string;
  type: "Breakdown" | "ServiceRequest" | "Query" | "general";
  status: boolean;
  deviceid: string;
  TimeStamp: string;
  queryStatus: "open" | "complete" | "assign";
  orderModels?: Array<string | number | null>;
}

const ChartOne: React.FC = () => {
  const [series, setSeries] = useState<ApexOptions["series"]>([]);
  const [xAxisCategories, setXAxisCategories] = useState<string[]>([]);

  useEffect(() => {
    axios.get<{ data: QueryData[] }>("http://35.154.99.208:5000/api/query/queries/all")
      .then((response) => {
        const data = response.data.data;

        const today = new Date();
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 6); // Include today as one of the days

        // Initialize dayTypeCounts for the last 7 days
        const dayTypeCounts: Record<string, Record<string, number>> = {};
        const days: any = [];

        for (let i = 0; i < 7; i++) {
          const date = new Date(sevenDaysAgo);
          date.setDate(sevenDaysAgo.getDate() + i);
          const dayName = date.toLocaleString("en-US", { weekday: "long" });
          dayTypeCounts[dayName] = {
            Breakdown: 0,
            ServiceRequest: 0,
            Query: 0,
            general: 0,
          };
          days.push(dayName);
        }

        // Filter queries from the past week and populate counts
        data.filter((item) => {
          const itemDate = new Date(item.TimeStamp);
          return itemDate >= sevenDaysAgo && itemDate <= today;
        }).forEach((item) => {
          const { type, TimeStamp } = item;
          const day = new Date(TimeStamp).toLocaleString("en-US", { weekday: "long" });
          if (dayTypeCounts[day]) {
            dayTypeCounts[day][type] += 1;
          }
        });

        // Prepare series data based on `dayTypeCounts`
        const seriesData = Object.keys(dayTypeCounts[days[0]]).map((type) => ({
          name: type,
          data: days.map((day: any) => dayTypeCounts[day][type]),
        }));

        setSeries(seriesData);
        setXAxisCategories(days);
      })
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  const options: ApexOptions = {
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
    },
    colors: ["#5750F1", "#0ABEF9", "#FFA500", "#FF5733"],
    chart: {
      fontFamily: "Satoshi, sans-serif",
      height: 310,
      type: "area",
      toolbar: {
        show: false,
      },
    },
    fill: {
      gradient: {
        opacityFrom: 0.75,
        opacityTo: 0,
      },
    },
    stroke: {
      curve: "smooth",
    },
    markers: {
      size: 4,
    },
    grid: {
      strokeDashArray: 5,
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      fixed: {
        enabled: false,
      },
      x: {
        show: false,
      },
      y: {
        title: {
          formatter: function () {
            return "";
          },
        },
      },
      marker: {
        show: true,
      },
    },
    xaxis: {
      type: "category",
      categories: xAxisCategories,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      title: {
        style: {
          fontSize: "0px",
        },
      },
    },
  };

  return (
    <div className="col-span-12 rounded-[10px] bg-white px-7.5 pb-6 pt-7.5 shadow-1 dark:bg-gray-dark dark:shadow-card xl:col-span-7">
      <div className="mb-3.5 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="text-body-2xlg font-bold text-dark dark:text-white">
            Query Type Breakdown by Day (Last 7 Days)
          </h4>
        </div>
      </div>
      <div>
        <div className="-ml-4 -mr-5">
          <ReactApexChart
            options={options}
            series={series}
            type="area"
            height={310}
          />
        </div>
      </div>
    </div>
  );
};

export default ChartOne;
