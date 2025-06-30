import React, { useState } from 'react';
import Header from '../components/Layout/Header';
import Sidebar from '../components/Layout/Sidebar';
import ChatInterface from '../components/Chat/ChatInterface';
import DocumentUpload from '../components/Documents/DocumentUpload';
import DocumentList from '../components/Documents/DocumentList';
import UserManagement from '../components/Admin/UserManagement';
import AdminOverview from '../components/Admin/AdminOverview';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(
    user?.role === 'admin' ? 'overview' : 'chat'
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'chat':
        return <ChatInterface />;
      case 'upload':
        return <DocumentUpload />;
      case 'documents':
        return <DocumentList />;
      case 'overview':
        return <AdminOverview />;
      case 'users':
        return <UserManagement />;
      case 'all-documents':
        return <DocumentList showUserInfo={true} />;
      default:
        return <ChatInterface />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;