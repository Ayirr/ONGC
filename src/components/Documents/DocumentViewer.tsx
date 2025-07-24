import React, { useState } from 'react';
import { FileText, Download, Eye, X, Calendar, User, HardDrive } from 'lucide-react';
import { Document } from '../../types';

interface DocumentViewerProps {
  document: Document;
  onClose: () => void;
  onDownload?: (docId: string) => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ document, onClose, onDownload }) => {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    if (onDownload) {
      setLoading(true);
      try {
        await onDownload(document.id);
      } catch (error) {
        console.error('Download failed:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const getFileTypeIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word')) return '📝';
    if (fileType.includes('text')) return '📃';
    return '📄';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{getFileTypeIcon(document.fileType)}</div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{document.fileName}</h2>
              <p className="text-sm text-gray-500">Document Details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Document Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-3">File Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">File Name:</span>
                    <span className="text-sm font-medium text-gray-900">{document.fileName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">File Type:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {document.fileType.split('/')[1]?.toUpperCase() || 'Unknown'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">File Size:</span>
                    <div className="flex items-center space-x-1">
                      <HardDrive className="h-3 w-3 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">
                        {formatFileSize(document.fileSize)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Upload Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Uploaded By:</span>
                    <div className="flex items-center space-x-1">
                      <User className="h-3 w-3 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{document.uploadedBy}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Upload Date:</span>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(document.uploadedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      document.status === 'completed' 
                        ? 'bg-green-100 text-green-800'
                        : document.status === 'failed'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {/* Document Preview Placeholder */}
              <div className="bg-gray-50 p-4 rounded-lg h-64 flex items-center justify-center">
                <div className="text-center">
                  <FileText className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Document Preview</h4>
                  <p className="text-xs text-gray-500 mb-4">
                    Preview functionality will be available in a future update
                  </p>
                  <div className="text-4xl mb-2">{getFileTypeIcon(document.fileType)}</div>
                  <p className="text-xs text-gray-600">{document.fileName}</p>
                </div>
              </div>

              {/* Processing Status */}
              {document.status === 'processing' && (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                    <span className="text-sm font-medium text-yellow-800">Processing Document</span>
                  </div>
                  <p className="text-xs text-yellow-700 mt-1">
                    This document is being processed for AI analysis. This may take a few minutes.
                  </p>
                </div>
              )}

              {document.status === 'completed' && (
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <span className="text-sm font-medium text-green-800">Ready for AI Analysis</span>
                  </div>
                  <p className="text-xs text-green-700 mt-1">
                    This document has been successfully processed and is ready for AI-powered queries.
                  </p>
                </div>
              )}

              {document.status === 'failed' && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <X className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium text-red-800">Processing Failed</span>
                  </div>
                  <p className="text-xs text-red-700 mt-1">
                    There was an error processing this document. Please try uploading again.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={handleDownload}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span>Download</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;