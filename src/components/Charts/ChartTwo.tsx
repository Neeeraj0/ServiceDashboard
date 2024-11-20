import { ApexOptions } from "apexcharts";
import React, { useEffect, useState } from "react";
import ReactApexChart from "react-apexcharts";
import axios from "axios";

interface QueryData {
  _id: string;
  subject: string;
  TimeStamp: string;
  type: "Breakdown" | "ServiceRequest" | "Query" | "general";
}

// Define type for the series data
interface SeriesType {
  name: string;
  data: number[];
}

const ChartTwo: React.FC = () => {
  const [series, setSeries] = useState<SeriesType[]>([{ name: "Queries", data: [] }]);
  const [xAxisCategories, setXAxisCategories] = useState<string[]>([]);

  useEffect(() => {
    // Fetch data from the API
    axios
      .get<{ data: QueryData[] }>("http://35.154.99.208:5000/api/query/queries/all")
      .then((response) => {
        const data = response.data.data;

        const today = new Date();
        const oneWeekAgo = new Date(today);
        oneWeekAgo.setDate(today.getDate() - 7);

        // Filter queries that fall within the last 7 days
        const filteredData = data.filter((item) => {
          const queryDate = new Date(item.TimeStamp);
          return queryDate >= oneWeekAgo && queryDate <= today;
        });

        // Count occurrences of each subject within the last 7 days
        const subjectCounts: Record<string, number> = {};
        filteredData.forEach((item) => {
          subjectCounts[item.subject] = (subjectCounts[item.subject] || 0) + 1;
        });

        // Ensure all types appear in the data, even if they have zero counts
        const subjects = Array.from(new Set(data.map((item) => item.subject)));
        subjects.forEach((subject) => {
          if (!(subject in subjectCounts)) {
            subjectCounts[subject] = 0;
          }
        });

        setSeries([{ name: "Queries", data: Object.values(subjectCounts) }]);
        setXAxisCategories(Object.keys(subjectCounts));
      })
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  const options: ApexOptions = {
    colors: ["#FF0000"],
    chart: {
      fontFamily: "Satoshi, sans-serif",
      type: "bar",
      height: 335,
      stacked: false,
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        borderRadius: 3,
        columnWidth: "25%",
        borderRadiusApplication: "end",
        borderRadiusWhenStacked: "last",
      },
    },
    dataLabels: {
      enabled: false,
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
    xaxis: {
      categories: xAxisCategories,
    },
    legend: {
      show: false,
    },
    fill: {
      opacity: 1,
    },
  };

  return (
    <div className="col-span-12 rounded-[10px] bg-white px-7.5 pt-7.5 shadow-1 dark:bg-gray-dark dark:shadow-card xl:col-span-5">
      <div className="mb-4 justify-between gap-4 sm:flex">
        <div>
          <h4 className="text-body-2xlg font-bold text-dark dark:text-white">
            Queries in the Past Week
          </h4>
        </div>
      </div>

      <div>
        <div id="chartTwo" className="-ml-3.5">
          <ReactApexChart options={options} series={series} type="bar" height={370} width={500} />
        </div>
      </div>
    </div>
  );
};

export default ChartTwo;
