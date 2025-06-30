import React, { useState, useCallback } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { UploadProgress } from '../../types';
import { documentApi } from '../../services/api';
import { toast } from '../../utils/toast';
import { validateFile } from '../../utils/validation';

const DocumentUpload: React.FC = () => {
  const [dragActive, setDragActive] = useState(false);
  const [uploads, setUploads] = useState<UploadProgress[]>([]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
      // Reset input value to allow re-uploading the same file
      e.target.value = '';
    }
  };

  const handleFiles = async (files: File[]) => {
    for (const file of files) {
      // Validate file
      const validation = validateFile(file);
      if (!validation.isValid) {
        toast.error(`${file.name}: ${validation.errors[0]}`);
        continue;
      }

      const uploadProgress: UploadProgress = {
        fileName: file.name,
        progress: 0,
        status: 'uploading',
      };

      setUploads(prev => [...prev, uploadProgress]);

      try {
        const formData = new FormData();
        formData.append('file', file);

        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setUploads(prev =>
            prev.map(upload =>
              upload.fileName === file.name && upload.status === 'uploading'
                ? { ...upload, progress: Math.min(upload.progress + 10, 90) }
                : upload
            )
          );
        }, 200);

        await documentApi.upload(formData);

        clearInterval(progressInterval);

        setUploads(prev =>
          prev.map(upload =>
            upload.fileName === file.name
              ? { ...upload, progress: 100, status: 'completed' }
              : upload
          )
        );

        toast.success(`${file.name} uploaded successfully!`);
      } catch (error) {
        console.error('Upload error:', error);
        setUploads(prev =>
          prev.map(upload =>
            upload.fileName === file.name
              ? { ...upload, status: 'error' }
              : upload
          )
        );
        toast.error(`Failed to upload ${file.name}. Please try again.`);
      }
    }
  };

  const removeUpload = (fileName: string) => {
    setUploads(prev => prev.filter(upload => upload.fileName !== fileName));
  };

  const retryUpload = async (fileName: string) => {
    // This would require storing the original file, which we don't do in this implementation
    // For now, just remove the failed upload
    removeUpload(fileName);
    toast.info('Please select the file again to retry upload.');
  };

  const clearCompleted = () => {
    setUploads(prev => prev.filter(upload => upload.status !== 'completed'));
  };

  return (
    <div className="space-y-6">
      {/* Upload Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Upload Documents</h2>
          <p className="text-sm text-gray-500">
            Upload PDF, DOCX, or TXT files to analyze with the AI assistant. Maximum file size: 50MB.
          </p>
        </div>
        {uploads.some(u => u.status === 'completed') && (
          <button
            onClick={clearCompleted}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Clear Completed
          </button>
        )}
      </div>

      {/* Drop Zone */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-all duration-200 ${
          dragActive
            ? 'border-red-400 bg-red-50 scale-105'
            : 'border-gray-300 hover:border-red-400 hover:bg-red-50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className={`mx-auto h-12 w-12 mb-4 transition-colors ${
          dragActive ? 'text-red-500' : 'text-gray-400'
        }`} />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {dragActive ? 'Drop files here' : 'Drop files here or click to upload'}
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Supports PDF, DOCX, and TXT files up to 50MB
        </p>
        <input
          type="file"
          multiple
          accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <button className="px-6 py-2 ongc-gradient text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity">
          Choose Files
        </button>
      </div>

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Upload Progress</h3>
            <span className="text-sm text-gray-500">
              {uploads.filter(u => u.status === 'completed').length} of {uploads.length} completed
            </span>
          </div>
          <div className="space-y-4 max-h-64 overflow-y-auto">
            {uploads.map((upload, index) => (
              <div key={`${upload.fileName}-${index}`} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  {upload.status === 'completed' ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : upload.status === 'error' ? (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  ) : (
                    <div className="relative">
                      <FileText className="h-5 w-5 text-blue-500" />
                      <div className="absolute inset-0 animate-pulse bg-blue-200 rounded opacity-50"></div>
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate" title={upload.fileName}>
                    {upload.fileName}
                  </p>
                  {upload.status === 'uploading' && (
                    <div className="mt-1">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Uploading...</span>
                        <span>{upload.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="ongc-gradient h-2 rounded-full transition-all duration-300"
                          style={{ width: `${upload.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  {upload.status === 'completed' && (
                    <p className="text-sm text-green-600">Upload completed successfully</p>
                  )}
                  {upload.status === 'error' && (
                    <p className="text-sm text-red-600">Upload failed - please try again</p>
                  )}
                </div>

                <div className="flex space-x-1">
                  {upload.status === 'error' && (
                    <button
                      onClick={() => retryUpload(upload.fileName)}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Retry upload"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => removeUpload(upload.fileName)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    title="Remove from list"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-800 mb-2">Upload Tips</h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Ensure documents are clear and readable for best AI analysis</li>
          <li>• PDF files should not be password protected</li>
          <li>• Multiple files can be uploaded simultaneously</li>
          <li>• Processing may take a few minutes for large documents</li>
        </ul>
      </div>
    </div>
  );
};

export default DocumentUpload;