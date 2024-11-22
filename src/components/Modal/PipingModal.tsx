import React, { ReactNode } from 'react';

interface Image {
  presignedUrl: string;
  type: string;
  servicePhase: string;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  images?: Image[];
  children?: ReactNode;
}

const PipingModal: React.FC<ModalProps> = ({ isOpen, onClose, images, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-999999">
      <div className="bg-white p-4 rounded max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Piping Images</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-white bg-red-600 p-2 rounded-md shadow-lg font-semibold"
          >
            Close
          </button>
        </div>
        <div className="overflow-y-auto flex-grow">
          {images && images.length > 0 ? (
            <div className="flex flex-col items-center gap-4">
              {images.map((image, index) => (
                <div key={index} className="flex flex-col items-center">
                  <h4 className="text-lg font-semibold capitalize mb-2">{image.type || "Unknown Type"}</h4>
                  <img
                    src={image.presignedUrl}
                    alt={image.type}
                    className="max-w-full h-auto rounded-md shadow-lg"
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
