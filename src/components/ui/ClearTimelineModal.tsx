'use client';

import React from 'react';
import { Modal } from './Modal';
import { Icon } from './Icon';
import { AlertTriangle } from 'lucide-react';

interface ClearTimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  imageCount: number;
}

export const ClearTimelineModal: React.FC<ClearTimelineModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  imageCount
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-red-50 dark:bg-red-950/20 rounded-full flex items-center justify-center">
              <Icon icon={AlertTriangle} size="md" className="text-red-600 dark:text-red-400" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Clear Timeline
            </h3>
            <p className="text-sm text-muted-foreground">
              This action cannot be undone
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Are you sure you want to clear the timeline? All{' '}
            <span className="font-medium text-foreground">
              {imageCount} {imageCount === 1 ? 'item' : 'items'}
            </span>{' '}
            will be moved back to the gallery and the timeline will be empty.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 rounded-md hover:bg-muted/50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 transition-colors duration-200 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-background"
          >
            Clear Timeline
          </button>
        </div>
      </div>
    </Modal>
  );
};



