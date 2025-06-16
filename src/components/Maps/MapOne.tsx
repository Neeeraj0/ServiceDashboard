"use client";
import jsVectorMap from "jsvectormap";
import React, { useEffect, useRef } from "react";
import "../../js/us-aea-en";

const MapOne: React.FC = () => {
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Clean up existing map instance first
    if (mapRef.current) {
      try {
        mapRef.current.destroy();
        mapRef.current = null;
      } catch (error) {
        console.warn("Error destroying existing map:", error);
      }
    }

    const mapElement = document.getElementById("mapOne");
    if (!mapElement) {
      console.error("Map element not found");
      return;
    }

    // Clear the map container content
    mapElement.innerHTML = '';

    try {
      const vectorMapOne = new jsVectorMap({
        selector: "#mapOne",
        map: "us_aea_en",
        zoomButtons: true,

        regionStyle: {
          initial: {
            fill: "#C8D0D8",
          },
          hover: {
            fillOpacity: 1,
            fill: "#3056D3",
          },
        },
        regionLabelStyle: {
          initial: {
            fontFamily: "Satoshi",
            fontWeight: "semibold",
            fill: "#fff",
          },
          hover: {
            cursor: "pointer",
          },
        },

        labels: {
          regions: {
            render(code: string) {
              return code.split("-")[1];
            },
          },
        },
      });

      mapRef.current = vectorMapOne;
      console.log("Map created successfully");
    } catch (error) {
      console.error("Error creating map:", error);
    }

    // Cleanup function
    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.destroy();
          mapRef.current = null;
          console.log("Map destroyed successfully");
        } catch (error) {
          console.warn("Error destroying map during cleanup:", error);
        }
      }
    };
  }, []); // Empty dependency array to run only once

  return (
    <div className="col-span-12 rounded-[10px] bg-white p-7.5 shadow-1 dark:bg-gray-dark dark:shadow-card xl:col-span-7">
      <h4 className="mb-7 text-body-2xlg font-bold text-dark dark:text-white">
        Region labels
      </h4>
      <div className="h-[422px]">
        <div ref={mapContainerRef} id="mapOne" className="mapOne map-btn"></div>
      </div>
    </div>
  );
};

export default MapOne;