import { MapPinned } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup, Marker } from 'react-simple-maps';
import axios from 'axios';

const INDIA_TOPO_JSON = "/maps/india.topo.json";

const PROJECTION_CONFIG = {
  scale: 550,
  center: [78.9629, 22.5937] as [number, number]
};

const STATE_ID_MAPPING: Record<string, string> = {
  'Andhra Pradesh': 'AP',
  'Arunachal Pradesh': 'AR',
  'Assam': 'AS',
  'Bihar': 'BR',
  'Chhattisgarh': 'CT',
  'Goa': 'GA',
  'Gujarat': 'GJ',
  'Haryana': 'HR',
  'Himachal Pradesh': 'HP',
  'Jharkhand': 'JH',
  'Karnataka': 'KA',
  'Kerala': 'KL',
  'Madhya Pradesh': 'MP',
  'Maharashtra': 'MH',
  'Manipur': 'MN',
  'Meghalaya': 'ML',
  'Mizoram': 'MZ',
  'Nagaland': 'NL',
  'Odisha': 'OR',
  'Punjab': 'PB',
  'Rajasthan': 'RJ',
  'Sikkim': 'SK',
  'Tamil Nadu': 'TN',
  'Telangana': 'TG',
  'Tripura': 'TR',
  'Uttarakhand': 'UT',
  'Uttar Pradesh': 'UP',
  'West Bengal': 'WB',
  'Andaman and Nicobar Islands': 'AN',
  'Chandigarh': 'CH',
  'Dadra and Nagar Haveli': 'DN',
  'Daman and Diu': 'DD',
  'Delhi': 'DL',
  'Jammu and Kashmir': 'JK',
  'Ladakh': 'LA',
  'Lakshadweep': 'LD',
  'Puducherry': 'PY'
};

// State centroids for label positioning (approximate coordinates)
const STATE_CENTROIDS: Record<string, [number, number]> = {
  'AP': [79.7400, 15.9129], // Andhra Pradesh
  'AR': [94.7278, 28.2180], // Arunachal Pradesh
  'AS': [92.9376, 26.2006], // Assam
  'BR': [85.3131, 25.0961], // Bihar
  'CT': [81.8661, 21.2787], // Chhattisgarh
  'GA': [74.1240, 15.2993], // Goa
  'GJ': [71.0583, 22.2587], // Gujarat
  'HR': [76.0856, 29.0588], // Haryana
  'HP': [77.1734, 31.1048], // Himachal Pradesh
  'JH': [85.2799, 23.6102], // Jharkhand
  'KA': [75.7139, 15.3173], // Karnataka
  'KL': [76.2711, 10.8505], // Kerala
  'MP': [78.6569, 22.9734], // Madhya Pradesh
  'MH': [75.7139, 19.7515], // Maharashtra
  'MN': [93.9063, 24.6637], // Manipur
  'ML': [91.3662, 25.4670], // Meghalaya
  'MZ': [92.9376, 23.1645], // Mizoram
  'NL': [94.5624, 26.1584], // Nagaland
  'OR': [85.0985, 20.9517], // Odisha
  'PB': [75.3412, 31.1471], // Punjab
  'RJ': [74.2179, 27.0238], // Rajasthan
  'SK': [88.5122, 27.5330], // Sikkim
  'TN': [78.6569, 11.1271], // Tamil Nadu
  'TG': [79.0193, 17.1232], // Telangana
  'TR': [91.9882, 23.9408], // Tripura
  'UT': [79.0193, 30.0668], // Uttarakhand
  'UP': [80.9462, 26.8467], // Uttar Pradesh
  'WB': [87.8550, 22.9868], // West Bengal
  'AN': [92.6586, 11.7401], // Andaman and Nicobar Islands
  'CH': [76.7794, 30.7333], // Chandigarh
  'DN': [73.0169, 20.1809], // Dadra and Nagar Haveli
  'DD': [72.8777, 20.4283], // Daman and Diu
  'DL': [77.1025, 28.7041], // Delhi
  'JK': [74.7973, 34.0837], // Jammu and Kashmir
  'LA': [78.0322, 34.1526], // Ladakh
  'LD': [72.1818, 10.5667], // Lakshadweep
  'PY': [79.8083, 11.9416]  // Puducherry
};

// Normalize state names to match our mapping
const normalizeStateName = (stateName: string): string => {
  const normalized = stateName.toLowerCase().trim();
  
  // Handle common variations
  const stateVariations: Record<string, string> = {
    'maharashtra': 'Maharashtra',
    'mh': 'Maharashtra',
    'delhi': 'Delhi',
    'karnataka': 'Karnataka',
    'tamil nadu': 'Tamil Nadu',
    'tn': 'Tamil Nadu',
    'kerala': 'Kerala',
    'gujarat': 'Gujarat',
    'rajasthan': 'Rajasthan',
    'west bengal': 'West Bengal',
    'wb': 'West Bengal',
    'uttar pradesh': 'Uttar Pradesh',
    'up': 'Uttar Pradesh',
    'madhya pradesh': 'Madhya Pradesh',
    'mp': 'Madhya Pradesh',
    'andhra pradesh': 'Andhra Pradesh',
    'andaman and nicobar islands': 'Andaman and Nicobar Islands',
    'ap': 'Andhra Pradesh',
    'telangana': 'Telangana',
    'tg': 'Telangana',
    'odisha': 'Odisha',
    'orissa': 'Odisha',
    'or': 'Odisha',
    'bihar': 'Bihar',
    'jharkhand': 'Jharkhand',
    'assam': 'Assam',
    'punjab': 'Punjab',
    'haryana': 'Haryana',
    'himachal pradesh': 'Himachal Pradesh',
    'hp': 'Himachal Pradesh',
    'uttarakhand': 'Uttarakhand',
    'uk': 'Uttarakhand',
    'chhattisgarh': 'Chhattisgarh',
    'ct': 'Chhattisgarh',
    'goa': 'Goa'
  };
  
  return stateVariations[normalized] || stateName;
};

// interface AddressData {
//   _id: string;
//   line1: string;
//   line2: string;
//   city: string;
//   state: string;
//   pincode: string;
// }

interface AddressData {
  _id: string;
  subject: string;
  status: boolean;
  TimeStamp: string;      // ISO date string
  customer_id: string;
  customerName: string;
  complaint_id: string;
  city: string;
  state: string;
  pincode: string;
}

interface ApiResponse {
  success: boolean;
  count: number;
  data: AddressData[];
}

interface LinearGradientData {
  fromColor: string;
  toColor: string;
  min: number;
  max: number;
}

interface TooltipContent {
  state: string;
  value: number;
}

interface Position {
  x: number;
  y: number;
}

interface GeographyProperties {
  NAME_1: string;
  [key: string]: any;
}

interface Geography {
  rsmKey: string;
  id: string;
  properties: GeographyProperties;
}
const getColor = (value: number | undefined, max: number): string => {
  if (!value || value === 0) return '#f0f0f0'; // default for no data

  const intensity = Math.min(value / max, 1);

  const red = 255;

  // Fade green and blue from 180 (light red) to 0 (pure red)
  const fadeStart = 140;
  const greenBlue = Math.floor(fadeStart * (1 - intensity));

  return `rgb(${red}, ${greenBlue}, ${greenBlue})`;
};


const getTextColor = (backgroundColor: string): string => {
  // Extract RGB values from the background color
  const rgbMatch = backgroundColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!rgbMatch) return '#333333';
  
  const [, r, g, b] = rgbMatch.map(Number);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return dark text for light backgrounds, light text for dark backgrounds
  return luminance > 0.6 ? '#333333' : '#ffffff';
};

const LinearGradient: React.FC<{ data: LinearGradientData; compact?: boolean }> = ({ data, compact = false }) => {
  const gradientWidth = compact ? 140 : 200;
  
  const boxStyle: React.CSSProperties = {
    width: gradientWidth,
    margin: 'auto',
    marginTop: compact ? 20 : "120px",
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: compact ? '10px' : '12px',
    fontWeight: 'bold'
  };
  
  const gradientStyle: React.CSSProperties = {
    backgroundImage: `linear-gradient(to right, ${data.fromColor}, ${data.toColor})`,
    height: compact ? 15 : 20,
    width: gradientWidth,
    margin: 'auto',
    marginTop: compact ? 5 : 10,
    borderRadius: 4
  };

  return (
    <div>
      <div style={boxStyle}>
        <span>{data.min}</span>
        <span>{data.max}</span>
      </div>
      <div style={gradientStyle}></div>
      <div className={`text-center mt-2 font-medium text-gray-600 ${compact ? 'text-xs' : 'text-sm'}`}>
        Complaints Count
      </div>
    </div>
  );
};

const MapTooltip: React.FC<{
  content: TooltipContent | null;
  position: Position;
  visible: boolean;
}> = ({ content, position, visible }) => {
  if (!visible || !content) return null;

  const tooltipStyle: React.CSSProperties = {
    left: position.x + 10,
    top: position.y - 10,
    transform: "translate(-250%, -150%)"
  };

  return (
    <div 
      className="absolute bg-gray-800 w-fit p-2 text-white rounded-lg shadow-lg text-sm z-50 pointer-events-none"
      style={tooltipStyle}
    >
      <div className="font-semibold">{content.state}</div>
      <div className='text-white font-bold'>Complaints: {content.value || 0}</div>
    </div>
  );
};

interface IndiaComplaintsMapProps {
  title?: string;
  compact?: boolean;
  apiEndpoint?: string;
  showStateLabels?: boolean;
}

const IndiaComplaintsMap: React.FC<IndiaComplaintsMapProps> = ({ 
  title = "Complaints Distribution",
  compact = false,
  apiEndpoint = `${process.env.NEXT_PUBLIC_CIRCOLIFE_PRODUCTION_API}/api/query/getToday/Complaints`,
  showStateLabels = true
}) => {
  const [tooltipContent, setTooltipContent] = useState<TooltipContent | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<Position>({ x: 0, y: 0 });
  const [showTooltip, setShowTooltip] = useState<boolean>(false);
  const [complaintData, setComplaintData] = useState<AddressData[]>([]);
  const [totalComplaints, setTotalComplaints] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch complaints data from API
  const fetchComplaintsData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get<ApiResponse>(apiEndpoint, {
    headers: {
    Authorization: `${process.env.NEXT_PUBLIC_CIRCOLIFE_PRODUCTION_TOKEN}`
  }
});

      
      if (response.data.data) {
        setComplaintData(response.data.data);
        setTotalComplaints(response.data.count);
        console.log("Fetched complaints data:", response.data.data);
      } else {
        throw new Error('API returned unsuccessful response');
      }
    } catch (err) {
      console.error("Error fetching complaints data:", err);
      setError("Failed to fetch complaints data");
      setComplaintData([]);
      setTotalComplaints(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaintsData();
  }, [apiEndpoint]);

  const processComplaintData = (): Record<string, number> => {
    const stateComplaintCounts: Record<string, number> = {};
    
    complaintData?.forEach(complaint => {
      console.log("line 340", complaint.state);
      const normalizedStateName = normalizeStateName(complaint.state);
      console.log("line 342", normalizeStateName);
      if (normalizedStateName && STATE_ID_MAPPING[normalizedStateName]) {
        const stateId = STATE_ID_MAPPING[normalizedStateName];
        stateComplaintCounts[stateId] = (stateComplaintCounts[stateId] || 0) + 1;
      } else {
        console.warn(`Unknown state: ${complaint.state} (normalized: ${normalizedStateName})`);
      }
    });

    console.log("Processed state data:", stateComplaintCounts);
    return stateComplaintCounts;
  };

  const stateData = processComplaintData();
  const maxValue = Math.max(...Object.values(stateData), 1);

  const geographyStyle = {
    default: {
      outline: 'none',
      stroke: '#607D8B',
      strokeWidth: 0.5,
    },
    hover: {
      outline: 'none',
      stroke: '#607D8B',
      strokeWidth: 1,
      filter: 'brightness(1.1)',
    },
    pressed: {
      outline: 'none',
      stroke: '#607D8B',
      strokeWidth: 1,
    },
  };

  const onMouseEnter = (geo: Geography, current: number | undefined) => (event: React.MouseEvent) => {
    setTooltipContent({
      state: geo.properties.NAME_1,
      value: current || 0
    });
    setTooltipPosition({ x: event.clientX, y: event.clientY });
    setShowTooltip(true);
  };

  const onMouseLeave = () => {
    setShowTooltip(false);
    setTooltipContent(null);
  };

  const onMouseMove = (event: React.MouseEvent) => {
    setTooltipPosition({ x: event.clientX, y: event.clientY });
  };

  const mapContainerClass = compact 
    ? "relative w-full max-w-lg h-96 mx-auto" 
    : "relative w-full max-w-4xl h-[500px] mx-auto";
  
  const mapWidth = compact ? 280 : 500;
  const mapHeight = compact ? 320 : 400;

  // Calculate percentage change (you can modify this logic based on your needs)
  const percentageChange = 5.6;
  const isPositive = percentageChange > 0;

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Loading complaints data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg p-6">
        <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-red-700">
          <p>{error}</p>
          <button 
            onClick={fetchComplaintsData}
            className="mt-2 px-4 py-2 bg-red-100 hover:bg-red-200 rounded-lg text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="mb-6">
        <h2 className={`${compact ? 'text-xl' : 'text-3xl'} font-extrabold capitalize text-gray-900 mb-2`}>
          {title}
        </h2>
        <p className={`text-gray-600 mb-4 ${compact ? 'text-xs' : 'text-sm'}`}>
          Today&apos;s complaint distribution patterns across states
        </p>
        <div className="flex items-end gap-3">
          <span className={`font-bold text-gray-900 ${compact ? 'text-2xl' : 'text-4xl'}`}>
            {/* {totalComplaints.(} */}
          </span>
          <div className={`flex items-center gap-1 mb-1 ${compact ? 'text-xs' : 'text-sm'}`}>
            <span className={`${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? '↗' : '↘'} {Math.abs(percentageChange)}%
            </span>
            <span className="text-gray-600">Today&apos;s Complaints</span>
          </div>
        </div>
      </div>
      
      <div className={mapContainerClass} onMouseMove={onMouseMove}>
        <ComposableMap
          projectionConfig={PROJECTION_CONFIG}
          projection="geoMercator"
          width={mapWidth}
          height={mapHeight}
          data-tip=""
        >
          <ZoomableGroup center={[78.9629, 22.5937]} zoom={1} disablePanning>
            <Geographies geography={INDIA_TOPO_JSON}>
              {({ geographies }: { geographies: Geography[] }) =>
                geographies.map((geo) => {
                  const stateId = geo.id;
                  const current = stateData[stateId];
                  const fillColor = getColor(current, maxValue);
                  
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={fillColor}
                      style={geographyStyle}
                      onMouseEnter={onMouseEnter(geo, current)}
                      onMouseLeave={onMouseLeave}
                    />
                  );
                })
              }
            </Geographies>
            
            {/* State Labels */}
            {showStateLabels && Object.entries(STATE_CENTROIDS).map(([stateId, coordinates]) => {
              const complaintCount = stateData[stateId];

              // ❗ Only show label if there is at least one complaint
              if (!complaintCount || complaintCount === 0) return null;

              const fillColor = getColor(complaintCount, maxValue);
              const textColor = getTextColor(fillColor);
              const fontSize = compact ? 6 : 8;

              return (
                <Marker key={stateId} coordinates={coordinates}>
                  <text
                    textAnchor="middle"
                    dy="0.35em"
                    style={{
                      fontFamily: 'system-ui, sans-serif',
                      fontSize: `${fontSize}px`,
                      fontWeight: 'bold',
                      fill: textColor,
                      stroke: 'rgba(255,255,255,0.8)',
                      strokeWidth: 0.5,
                      pointerEvents: 'none',
                      userSelect: 'none',
                    }}
                  >
                    {stateId}
                  </text>
                </Marker>
              );
            })}
          </ZoomableGroup>
        </ComposableMap>
        
        <MapTooltip 
          content={tooltipContent}
          position={tooltipPosition}
          visible={showTooltip}
        />
      </div>

      <LinearGradient
        data={{
          fromColor: '#f0f0f0',
          toColor: '#ff0000',
          min: 0,
          max: maxValue
        }}
        compact={compact}
      />

      <div className={`mt-8 grid gap-4 ${
        compact 
          ? 'grid-cols-2' 
          : 'grid-cols-2 sm:grid-cols-2 md:grid-cols-4'
      }`}>
        <div className="bg-gradient-to-l from-blue-300 to-blue-50 p-4 rounded-lg shadow-md">
          <div className={`font-bold text-blue-600 ${compact ? 'text-xl' : 'text-2xl'}`}>
            {totalComplaints}
          </div>
          <div className={`text-blue-600 ${compact ? 'text-xs' : 'text-sm'}`}>Today&apos;s Complaints</div>
        </div>
        <div className="bg-gradient-to-l from-green-300 to-green-50 p-4 rounded-lg shadow-md">
          <div className={`font-bold text-green-600 ${compact ? 'text-xl' : 'text-2xl'}`}>
            {Object.keys(stateData).length}
          </div>
          <div className={`text-green-600 ${compact ? 'text-xs' : 'text-sm'}`}>States Affected</div>
        </div>
        {!compact && (
          <>
            <div className="bg-gradient-to-l from-orange-300 to-orange-50 p-4 rounded-lg shadow-md">
              <div className="text-2xl font-bold text-orange-600">
                {maxValue}
              </div>
              <div className="text-sm text-orange-600">Max per State</div>
            </div>
            <div className="bg-gradient-to-l from-purple-300 to-purple-50 p-4 rounded-lg shadow-md">
              <div className="text-2xl font-bold text-purple-600">
                {Object.keys(stateData).length > 0 ? Math.round(totalComplaints / Object.keys(stateData).length) : 0}
              </div>
              <div className="text-sm text-purple-600">Avg per State</div>
            </div>
          </>
        )}
      </div>

      {/* Controls */}
      <div className="mt-4 flex justify-between items-center">
        <button 
          onClick={fetchComplaintsData}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm flex items-center space-x-2"
          disabled={isLoading}
        >
          <MapPinned className="w-4 h-4" />
          <span>Refresh Map Data</span>
        </button>
      </div>
    </div>
  );
};

export default IndiaComplaintsMap;