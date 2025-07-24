import React, { useState, useEffect } from 'react';
import { FileText, Download, Trash2, Calendar, User, Eye, Search, Filter } from 'lucide-react';
import { Document } from '../../types';
import { documentApi } from '../../services/api';
import { toast } from '../../utils/toast';
import DocumentViewer from './DocumentViewer';

interface DocumentListProps {
  showUserInfo?: boolean;
}

const DocumentList: React.FC<DocumentListProps> = ({ showUserInfo = false }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = showUserInfo 
        ? await documentApi.getAllDocs() 
        : await documentApi.getMyDocs();
      setDocuments(response.data);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast.error('Failed to load documents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (docId: string, fileName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${fileName}"?`)) {
      return;
    }

    try {
      setDeleteLoading(docId);
      await documentApi.deleteDoc(docId);
      setDocuments(prev => prev.filter(doc => doc.id !== docId));
      toast.success(`${fileName} deleted successfully.`);
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document. Please try again.');
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleDownload = async (docId: string, fileName: string) => {
    try {
      const response = await documentApi.downloadDoc(docId);
      
      // Create blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success(`${fileName} downloaded successfully.`);
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document. Please try again.');
    }
  };

  const handleView = (document: Document) => {
    setSelectedDocument(document);
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesFilter = filter === 'all' || doc.fileType.includes(filter);
    const matchesSearch = doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return 'text-red-600';
    if (fileType.includes('word')) return 'text-blue-600';
    return 'text-gray-600';
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      processing: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    };
    return badges[status as keyof typeof badges] || badges.processing;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {showUserInfo ? 'All Documents' : 'My Documents'}
            </h2>
            <p className="text-sm text-gray-500">
              {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''} 
              {searchTerm && ` matching "${searchTerm}"`}
            </p>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent w-full sm:w-64"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Types</option>
                <option value="pdf">PDF</option>
                <option value="word">Word</option>
                <option value="text">Text</option>
              </select>
            </div>
          </div>
        </div>

        {/* Documents Grid */}
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No documents found' : 'No documents uploaded'}
            </h3>
            <p className="text-gray-500">
              {searchTerm 
                ? `No documents match your search "${searchTerm}". Try adjusting your search terms.`
                : filter === 'all' 
                ? 'Upload some documents to get started with the AI assistant.'
                : `No ${filter} documents found. Try changing the filter.`
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.map((doc) => (
              <div key={doc.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-200 hover:border-red-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <FileText className={`h-8 w-8 ${getFileIcon(doc.fileType)} flex-shrink-0`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate" title={doc.fileName}>
                        {doc.fileName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(doc.fileSize)}
                      </p>
                    </div>
                  </div>
                  
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(doc.status)} flex-shrink-0`}>
                    {doc.status}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  {showUserInfo && (
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <User className="h-3 w-3" />
                      <span>{doc.uploadedBy}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleView(doc)}
                    className="flex-1 px-3 py-2 text-sm text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center space-x-1"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View</span>
                  </button>
                  <button 
                    onClick={() => handleDownload(doc.id, doc.fileName)}
                    className="flex-1 px-3 py-2 text-sm text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center justify-center space-x-1"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download</span>
                  </button>
                  {!showUserInfo && (
                    <button
                      onClick={() => handleDelete(doc.id, doc.fileName)}
                      disabled={deleteLoading === doc.id}
                      className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {deleteLoading === doc.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Document Viewer Modal */}
      {selectedDocument && (
        <DocumentViewer
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
          onDownload={(docId) => handleDownload(docId, selectedDocument.fileName)}
        />
      )}
    </>
  );
};

export default DocumentList;