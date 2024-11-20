import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogOverlay } from "@radix-ui/react-dialog";

interface MoveToInstallation {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
}

const MoveToInstallation = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description
}: MoveToInstallation) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* Blue background overlay */}
      <DialogOverlay className="fixed inset-0 bg-gray-600 opacity-10" />

      <DialogContent className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-full sm:max-w-md rounded-lg bg-white p-6 shadow-lg">
        <div className="space-y-4">
          <DialogTitle className="text-xl font-semibold text-center">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-center text-gray-500">
              {description}
            </DialogDescription>
          )}
        </div>
        <div className="flex justify-center gap-4 mt-6">
          <button
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-2 rounded-md"
            onClick={onConfirm}
          >
            Yes
          </button>
          <button
            className="border border-purple-600 text-purple-600 hover:bg-purple-50 px-8 py-2 rounded-md"
            onClick={onClose}
          >
            No
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MoveToInstallation;
