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

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, images, children }) => {
  if (!isOpen) return null;

  const groupedImages = images?.reduce<Record<string, { before: Image | null; after: Image | null }>>((acc, image) => {
    const { type, servicePhase } = image;
    if (!acc[type]) {
      acc[type] = { before: null, after: null };
    }
    if (servicePhase.toLowerCase() === 'before') {
      acc[type].before = image;
    } else if (servicePhase.toLowerCase() === 'after') {
      acc[type].after = image;
    }
    return acc;
  }, {});

  console.log(groupedImages)

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-999999">
      <div className="bg-white p-4 rounded max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Before and After Images</h2>
          <button onClick={onClose} className="text-white hover:text-white bg-red-600 p-2 rounded-md shadow-lg font-semibold">
            Close
          </button>
        </div>
        <div className="overflow-y-auto flex-grow">
          {images ? (
            <div className="flex flex-col items-center">
              {Object.keys(groupedImages || {}).map((type, index) => {
                const { before, after } = groupedImages![type];
                return (
                  <div key={index} className="flex w-full gap-2 mb-6">
                    {before && (
                      <div className="w-1/2 flex flex-col items-center">
                        <h4 className="text-lg font-semibold capitalize mb-2">{`${before.servicePhase} - ${type}`}</h4>
                        <img src={before.presignedUrl} alt={`${before.servicePhase} - ${type}`} className="max-w-full h-auto rounded-md shadow-lg" />
                      </div>
                    )}
                    {after && (
                      <div className="w-1/2 flex flex-col items-center">
                        <h4 className="text-lg font-semibold capitalize mb-2">{`${after.servicePhase} - ${type}`}</h4>
                        <img src={after.presignedUrl} alt={`${after.servicePhase} - ${type}`} className="max-w-full h-auto rounded-md" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div>{children}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
