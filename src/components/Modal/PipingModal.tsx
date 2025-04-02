import React, { ReactNode, useCallback, useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { default as NextImage } from 'next/image';

interface Image {
  presignedUrl: string;
  type: string;
  orderId: string;
  servicePhase: string;
}

interface AssignedTechnicians{
  _id: string,
  name: string,
  email: string,
  role: string,
  phone: string,
  technician_id: string,
}
interface MaterialsUsed{
  materialId: string,
  materialName: string,
  quantityUsed: string,
  QuantityInFt: string,
  sizeUsed:string
}
interface PipingResponse {
  approvalPending: any;
  _id: string;
  title: string;
  description: string;
  quantity: string;
  assignedTechnicians: AssignedTechnicians[];
  complaintRaised: string | null;
  status: string;
  taskType: string;
  task_id: string;
  client_name: string;
  client_number: string;
  address: {
    location: string;
    latitude: string;
    longitude: string;
  }[];
  ac_units: {
    type: string;
    capacity: string;
    quantity: number;
  }[];
  servicingDate: string;
  assignedDate: string;
  materialsUsed: MaterialsUsed[],
  customerComplaint: string;
  contactPerson: {
    name: string,
    phone_number: string
  },
  endDate: string;
}
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  images?: Image[];
  taskName?: String;
  taskDetails?: PipingResponse; // Add this property
  children?: ReactNode;
}

const PipingModal: React.FC<ModalProps> = ({ isOpen, onClose, images, taskName, taskDetails, children }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  console.log("line 72", taskDetails);

  const groupImagesByAC = useCallback((images: Image[]) => {
    const grouped = new Map<string, Image[]>();
    
    images?.forEach(image => {
      const orderId = (image as any).orderId?.replace(/"/g, '') || 'unknown';
      if (!grouped.has(orderId)) {
        grouped.set(orderId, []);
      }
      grouped.get(orderId)?.push(image);
    });
    
    return Array.from(grouped.entries());
  }, []);

  const generatePDFHeader = useCallback((doc: jsPDF) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(`${taskName || "Images"} Report`, margin, margin);
    
    return { pageWidth, margin, currentY: margin + 15 };
  }, [taskName]);

  const generateTaskDetails = useCallback((doc: jsPDF, startY: number) => {
    if (!taskDetails) return startY;

    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const usableWidth = pageWidth - 2 * margin;
    const labelWidth = 70;
    let currentY = startY;

    const printWrappedText = (label: string, text: string, y: number): number => {
      doc.setFont("helvetica", "normal");
      const splitText = doc.splitTextToSize(text, usableWidth - labelWidth);
      
      doc.setFont("helvetica", "bold");
      doc.text(`${label}: `, margin, y);
      
      doc.setFont("helvetica", "normal");
      doc.text(splitText, margin + labelWidth, y);
      
      return y + (splitText.length * 7);
    };

    doc.setFontSize(12);
    const techniciansList = taskDetails.assignedTechnicians
      .map((tech) => tech.name)
      .join(", ");

    currentY = printWrappedText("Task ID", taskDetails.task_id, currentY);
    currentY = printWrappedText("Client Name", taskDetails.client_name, currentY);
    currentY = printWrappedText("Client Number", taskDetails.client_number, currentY);
    currentY = printWrappedText("Technician Name", techniciansList, currentY);
    currentY = printWrappedText("Assigned Date", new Date(taskDetails.assignedDate).toLocaleString(), currentY);
    currentY = printWrappedText("Closure Date", new Date(taskDetails.endDate).toLocaleString(), currentY);
    currentY = printWrappedText("Status", taskDetails.status, currentY);
    currentY = printWrappedText("Total AC's Installed", taskDetails.quantity.toString(), currentY);
    currentY = printWrappedText("Description", taskDetails.description, currentY);
    return currentY + 10;
  }, [taskDetails]);

  const generateMaterialsTable = useCallback((doc: jsPDF, startY: number) => {
    if (!taskDetails?.materialsUsed?.length) return startY;

    const margin = 20;
    let currentY = startY;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Materials Used", margin, currentY);
    currentY += 10;

    const tableHeaders = [['No.', 'Material Name', 'Quantity', 'Size']];
    const tableData = taskDetails.materialsUsed.map((material, index) => [
      (index + 1).toString(),
      material.materialName,
      material.quantityUsed.toString(),
      material.sizeUsed || 'N/A'
    ]);

    autoTable(doc, {
      startY: currentY,
      head: tableHeaders,
      body: tableData,
      margin: { left: margin, right: margin },
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    return (doc as any).lastAutoTable.finalY + 15;
  }, [taskDetails]);
  
  const downloadImagesAsPDF = async () => {
    try {
      setIsDownloading(true);
      setProgress(0);
  
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
  
      const logoUrl = "/images/logo/airexpert.png";
      const margin = 20;
      const pageWidth = doc.internal.pageSize.getWidth();
  
      const totalSteps = 5; // Total number of steps for generating the PDF
      let currentStep = 0;
  
      const incrementProgress = (step: number) => {
        setProgress(Math.min(100, Math.floor((step / totalSteps) * 100)));
      };
  
      // Add logo
      await new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const logoWidth = 15;
          const logoHeight = 15;
          const x = pageWidth - margin - logoWidth;
          const y = 10;
          doc.addImage(img, "PNG", x, y, logoWidth, logoHeight);
          currentStep++;
          incrementProgress(currentStep);
          resolve();
        };
        img.onerror = reject;
        img.src = logoUrl;
      });
  
      let currentY = margin;
  
      const { currentY: headerY } = generatePDFHeader(doc);
      currentY = headerY;
      currentStep++;
      incrementProgress(currentStep);
  
      currentY = generateTaskDetails(doc, currentY);
      currentStep++;
      incrementProgress(currentStep);
  
      currentY = generateMaterialsTable(doc, currentY);
      currentStep++;
      incrementProgress(currentStep);
      const groupedImages = images?.reduce((groups, image) => {
        const orderId = image.orderId;
        if (!groups[orderId]) {
          groups[orderId] = [];
        }
        groups[orderId].push(image);
        return groups;
      }, {} as Record<string, Image[]>);
  
      if (groupedImages) {
        let acCounter = 1;
        for (const [orderId, acImages] of Object.entries(groupedImages)) {
          if (currentY > doc.internal.pageSize.getHeight() - 60) {
            doc.addPage();
            currentY = margin;
          }
  
          doc.setFont("helvetica", "bold");
          doc.setFontSize(14);
          doc.text(`AC ${acCounter}`, margin, currentY);
          currentY += 10;
  
          for (const image of acImages) {
            if (currentY > doc.internal.pageSize.getHeight() - 60) {
              doc.addPage();
              currentY = margin;
            }
  
            doc.setFont("helvetica", "normal");
            doc.text(`${image.type.replace(/_/g, " ")} - ${image.servicePhase || ""}`, margin, currentY);
            currentY += 10;
  
            try {
              doc.addImage(image.presignedUrl, "JPEG", margin, currentY, pageWidth - 6 * margin, 90);
              currentY += 100;
            } catch (error) {
              console.error("Error adding image to PDF:", error);
              doc.text("Error loading image", margin, currentY);
              currentY += 20;
            }
          }
  
          acCounter++;
          currentY += 10;
        }
      }
      currentStep++;
      incrementProgress(currentStep);
  
      doc.save(`${taskName || "images"}_report.pdf`);
      incrementProgress(totalSteps);
  
      setTimeout(() => {
        setIsDownloading(false);
        onClose();
      }, 500);
    } catch (error) {
      console.error("Error generating PDF:", error);
      setIsDownloading(false);
    }
  };  

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-999999">
      <div className="bg-white p-4 rounded max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{taskName} Images</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-white bg-red-600 p-2 rounded-md shadow-lg font-semibold"
            disabled={isDownloading}
          >
            Close
          </button>
        </div>
        <div className="flex flex-col gap-2 mb-4">
          <button
            onClick={downloadImagesAsPDF}
            className="bg-green-400 text-white px-4 py-2 rounded-md hover:bg-green-450 disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={isDownloading}
          >
            {isDownloading ? "Generating PDF..." : "Download as PDF 📄"}
          </button>
          {isDownloading && (
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
        <div className="overflow-y-auto flex-grow">
          {images && images.length > 0 ? (
            <div className="flex flex-col items-center gap-4">
              {images.map((image, index) => (
                <div key={index} className="flex flex-col items-center w-full">
                  <h4 className="text-lg font-semibold capitalize mb-2">
                    {image.type} - {image.servicePhase}
                  </h4>
                  {/* <img
                    src={image.presignedUrl}
                    alt={image.type}
                    className="w-full h-auto rounded-md shadow-lg"
                  /> */}
                  <NextImage
                    loader={() => image.presignedUrl}
                    src={image.presignedUrl}
                    alt={image.type}
                    width={500}
                    height={300}
                    className="w-full h-auto rounded-md shadow-lg"
                    priority={Number(image.orderId) < 8 ? true : false}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div>{children || "No images available."}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PipingModal;
