import React, { ReactNode, useState } from 'react';
import { jsPDF } from 'jspdf';

interface Image {
  presignedUrl: string;
  type: string;
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
  const [isDownloading, setIsDownloading] = useState(false); // State for handling download loading

  if (!isOpen) return null;

  const downloadImagesAsPDF = async () => {
    setIsDownloading(true); // Start downloading

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const usableWidth = pageWidth - 2 * margin;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(`${taskName || "Images"} Report`, margin, margin);

    let currentY = margin + 15;

    if (taskDetails) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);

      const details = [
        `Task ID: ${taskDetails.task_id}`,
        `Client Name: ${taskDetails.client_name}`,
        `Client Number: ${taskDetails.client_number}`,
        `Technician Name: ${taskDetails.assignedTechnicians.map((tech) => tech.name).join(", ")}`,
        `Assigned Date: ${new Date(taskDetails.assignedDate).toLocaleString()}`,
        `Closure Date: ${new Date(taskDetails.endDate).toLocaleString()}`,
        `Status: ${taskDetails.status}`,
        `Description: ${taskDetails.description}`,
      ];

      details.forEach((detail) => {
        doc.text(detail, margin, currentY);
        currentY += 8; // Line spacing
      });

      currentY += 10; // Add spacing before materials used
    }

    // Add materials used
    if (taskDetails?.materialsUsed && taskDetails.materialsUsed.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("Materials Used", margin, currentY);
      currentY += 10;

      taskDetails.materialsUsed.forEach((material, index) => {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.text(
          `${index + 1}. ${material.materialName} - Quantity: ${material.quantityUsed}, Size: ${material.sizeUsed || "N/A"}`,
          margin,
          currentY
        );
        currentY += 8; // Line spacing

        // Add a new page if nearing the page's end
        if (currentY > doc.internal.pageSize.getHeight() - 20) {
          doc.addPage();
          currentY = margin;
        }
      });

      currentY += 10; // Add spacing before images
    }

    // Add images
    for (let i = 0; i < (images?.length || 0); i++) {
      const image = images![i];

      if (currentY > doc.internal.pageSize.getHeight() - 60) {
        doc.addPage();
        currentY = margin;
      }

      // Add image title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(`${image.type || "Image"} - ${image.servicePhase || ""}`, margin, currentY);
      currentY += 10;

      // Add image
      try {
        doc.addImage(image.presignedUrl, "JPEG", margin, currentY, usableWidth, 80);
        currentY += 90; // Image height + padding
      } catch (error) {
        console.error("Error adding image to PDF:", error);
        doc.text("Error loading image", margin, currentY);
        currentY += 20;
      }
    }

    doc.save(`${taskName || "images"}_report.pdf`);
    setIsDownloading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-999999">
      <div className="bg-white p-4 rounded max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{taskName} Images</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-white bg-red-600 p-2 rounded-md shadow-lg font-semibold"
          >
            Close
          </button>
        </div>
        <div className="flex justify-start mb-4">
          <button
            onClick={downloadImagesAsPDF}
            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
            disabled={isDownloading} // Disable button while downloading
          >
                        {isDownloading ? "Downloading..." : "Download as PDF 📄"}
          </button>
        </div>
        <div className="overflow-y-auto flex-grow">
          {images && images.length > 0 ? (
            <div className="flex flex-col items-center gap-4">
              {images.map((image, index) => (
                <div key={index} className="flex flex-col items-center w-full">
                  <h4 className="text-lg font-semibold capitalize mb-2">
                    {image.type} - {image.servicePhase}
                  </h4>
                  <img
                    src={image.presignedUrl}
                    alt={image.type}
                    className="w-full h-auto rounded-md shadow-lg"
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
