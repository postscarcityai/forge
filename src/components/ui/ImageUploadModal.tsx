'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from './Modal';
import { Icon, Upload, X, Check, AlertCircle } from './Icon';
import { useProjectContext } from '@/contexts/ProjectContext';
import { useImageContext } from '@/contexts/ImageContext';

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UploadFile {
  file: File;
  id: string;
  preview: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export const ImageUploadModal: React.FC<ImageUploadModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentProject } = useProjectContext();
  const { addNewImage } = useImageContext();
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Handle file selection
  const handleFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const imageFiles = fileArray.filter(file => 
      file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024 // 10MB limit
    );

    const newUploadFiles: UploadFile[] = imageFiles.map(file => ({
      file,
      id: `${Date.now()}-${Math.random()}`,
      preview: URL.createObjectURL(file),
      status: 'pending'
    }));

    setUploadFiles(prev => [...prev, ...newUploadFiles]);
  }, []);

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  // Remove file from upload list
  const removeFile = useCallback((id: string) => {
    setUploadFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  }, []);

  // Upload files to server
  const uploadFilesToServer = useCallback(async () => {
    if (!currentProject) return;

    setIsUploading(true);
    
    for (const uploadFile of uploadFiles) {
      if (uploadFile.status !== 'pending') continue;

      try {
        // Update status to uploading
        setUploadFiles(prev => 
          prev.map(f => f.id === uploadFile.id ? { ...f, status: 'uploading' } : f)
        );

        // Create FormData
        const formData = new FormData();
        formData.append('image', uploadFile.file);
        formData.append('projectId', currentProject.id);
        
        // Upload file
        const response = await fetch('/api/images/upload', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (result.success) {
          // Update status to success
          setUploadFiles(prev => 
            prev.map(f => f.id === uploadFile.id ? { ...f, status: 'success' } : f)
          );

          // Add to image context
          if (result.image) {
            addNewImage(result.image, false); // Add to gallery, not timeline
          }
        } else {
          throw new Error(result.error || 'Upload failed');
        }
      } catch (error) {
        console.error('Upload error:', error);
        setUploadFiles(prev => 
          prev.map(f => f.id === uploadFile.id ? { 
            ...f, 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Upload failed' 
          } : f)
        );
      }
    }

    setIsUploading(false);
  }, [uploadFiles, currentProject, addNewImage]);

  // Close modal and cleanup
  const handleClose = useCallback(() => {
    // Cleanup object URLs
    uploadFiles.forEach(file => {
      URL.revokeObjectURL(file.preview);
    });
    setUploadFiles([]);
    setIsDragOver(false);
    setIsUploading(false);
    onClose();
  }, [uploadFiles, onClose]);

  // Check if all uploads are complete
  const allUploadsComplete = uploadFiles.length > 0 && 
    uploadFiles.every(f => f.status === 'success' || f.status === 'error');

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      size="lg"
      className="max-h-[90vh] overflow-hidden"
    >
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Upload Images
          </h2>
          <p className="text-muted-foreground">
            Add images to your gallery. Supports JPG, PNG, GIF up to 10MB each.
          </p>
        </div>

        {/* Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
            ${isDragOver 
              ? 'border-primary bg-primary/10 scale-[1.02]' 
              : 'border-muted-foreground/30 hover:border-muted-foreground/50 hover:bg-accent/10'
            }
          `}
        >
          <div className="flex flex-col items-center space-y-4">
            <div className={`
              w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200
              ${isDragOver 
                ? 'bg-primary/20 text-primary' 
                : 'bg-accent/20 text-muted-foreground'
              }
            `}>
              <Icon icon={Upload} size="lg" />
            </div>
            
            <div>
              <p className="text-lg font-medium text-foreground mb-1">
                {isDragOver ? 'Drop images here' : 'Drag & drop images here'}
              </p>
              <p className="text-muted-foreground">
                or{' '}
                <label className="text-primary hover:text-primary/80 cursor-pointer font-medium">
                  browse files
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                </label>
              </p>
            </div>
          </div>
        </div>

        {/* File List */}
        {uploadFiles.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">
              Files to Upload ({uploadFiles.length})
            </h3>
            
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {uploadFiles.map(uploadFile => (
                <motion.div
                  key={uploadFile.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center space-x-3 p-3 bg-accent/10 rounded-lg"
                >
                  {/* Preview */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-accent/20">
                    <img
                      src={uploadFile.preview}
                      alt={uploadFile.file.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {uploadFile.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>

                  {/* Status */}
                  <div className="flex-shrink-0">
                    {uploadFile.status === 'pending' && (
                      <button
                        onClick={() => removeFile(uploadFile.id)}
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Icon icon={X} size="sm" />
                      </button>
                    )}
                    {uploadFile.status === 'uploading' && (
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    )}
                    {uploadFile.status === 'success' && (
                      <Icon icon={Check} size="sm" className="text-green-500" />
                    )}
                    {uploadFile.status === 'error' && (
                      <Icon icon={AlertCircle} size="sm" className="text-red-500" />
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-border">
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            {allUploadsComplete ? 'Done' : 'Cancel'}
          </button>
          
          {uploadFiles.length > 0 && !allUploadsComplete && (
            <button
              onClick={uploadFilesToServer}
              disabled={isUploading}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Uploading...' : `Upload ${uploadFiles.length} ${uploadFiles.length === 1 ? 'Image' : 'Images'}`}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}; 