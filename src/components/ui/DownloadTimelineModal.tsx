'use client';

import React from 'react';
import { Modal } from './Modal';
import { Icon } from './Icon';
import { Download } from 'lucide-react';

interface DownloadTimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  imageCount: number;
}

export const DownloadTimelineModal: React.FC<DownloadTimelineModalProps> = ({
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
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/20 rounded-full flex items-center justify-center">
              <Icon icon={Download} size="md" className="text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Download Timeline
            </h3>
            <p className="text-sm text-muted-foreground">
              Images and videos will be saved to your Downloads folder
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Download all{' '}
            <span className="font-medium text-foreground">
              {imageCount} {imageCount === 1 ? 'item' : 'items'}
            </span>{' '}
            currently in the timeline? Images and videos will be packaged into a zip file with numbered prefixes to maintain timeline order.
          </p>
          <div className="mt-3 p-3 bg-muted/30 rounded-md">
            <p className="text-xs text-muted-foreground">
              📁 Downloads as: <code className="font-mono">forge-timeline-YYYY-MM-DD.zip</code>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              💡 Contains: <code className="font-mono">001-image-name.jpg</code>, <code className="font-mono">002-video-name.mp4</code>, etc.
            </p>
          </div>
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
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors duration-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-background"
          >
            Download {imageCount} {imageCount === 1 ? 'Item' : 'Items'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
