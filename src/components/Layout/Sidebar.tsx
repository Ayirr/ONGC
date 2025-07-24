import React from 'react';
import { MessageSquare, Upload, FileText, Users, Home } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const { user } = useAuth();

  const userMenuItems = [
    { id: 'chat', label: 'Chat Assistant', icon: MessageSquare },
    { id: 'upload', label: 'Upload Documents', icon: Upload },
    { id: 'documents', label: 'My Documents', icon: FileText },
  ];

  const adminMenuItems = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'all-documents', label: 'All Documents', icon: FileText },
  ];

  const menuItems = user?.role === 'admin' ? adminMenuItems : userMenuItems;

  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 min-h-screen">
      <nav className="mt-8">
        <div className="px-4 pb-4">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {user?.role === 'admin' ? 'Administration' : 'My Workspace'}
          </h2>
        </div>
        
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className={`sidebar-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => onTabChange(item.id)}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </div>
            );
          })}
        </div>

        {/* <div className="mt-8 px-4">
          <div className="bg-gradient-to-br from-red-50 to-yellow-50 border border-red-100 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-red-800 mb-2">Need Help?</h3>
            <p className="text-xs text-red-600 mb-3">
              Get assistance with document analysis and AI queries.
            </p>
            <button className="text-xs text-red-700 hover:text-red-800 font-medium">
              Contact Support →
            </button>
          </div>
        </div> */}
      </nav>
    </aside>
  );
};

export default Sidebar;