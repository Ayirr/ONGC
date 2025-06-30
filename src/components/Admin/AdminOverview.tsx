import React, { useState, useEffect } from 'react';
import { Users, FileText, MessageSquare, TrendingUp, Activity, Clock, HardDrive, Zap } from 'lucide-react';
import { adminApi } from '../../services/api';

interface Stats {
  totalUsers: number;
  totalDocuments: number;
  totalChats: number;
  activeUsers: number;
  recentActivity: ActivityItem[];
  systemHealth: SystemHealth;
}

interface ActivityItem {
  id: string;
  user: string;
  action: string;
  file?: string;
  time: string;
  type: 'upload' | 'chat' | 'login' | 'signup';
}

interface SystemHealth {
  apiResponseTime: string;
  documentProcessing: string;
  storageUsage: number;
  activeSessions: number;
  status: 'operational' | 'degraded' | 'down';
}

const AdminOverview: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalDocuments: 0,
    totalChats: 0,
    activeUsers: 0,
    recentActivity: [],
    systemHealth: {
      apiResponseTime: '0ms',
      documentProcessing: 'Unknown',
      storageUsage: 0,
      activeSessions: 0,
      status: 'operational'
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const [usersResponse, systemStatsResponse] = await Promise.all([
        adminApi.getUsers(),
        adminApi.getSystemStats()
      ]);

      const users = usersResponse.data;
      const systemStats = systemStatsResponse.data;

      setStats({
        totalUsers: users.length,
        totalDocuments: systemStats.totalDocuments || 0,
        totalChats: systemStats.totalChats || 0,
        activeUsers: users.filter(u => u.role === 'user').length,
        recentActivity: systemStats.recentActivity || [],
        systemHealth: {
          apiResponseTime: systemStats.apiResponseTime || '142ms',
          documentProcessing: systemStats.documentProcessing || 'Active',
          storageUsage: systemStats.storageUsage || 68,
          activeSessions: systemStats.activeSessions || 23,
          status: systemStats.systemStatus || 'operational'
        }
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      // Fallback to basic user data if system stats fail
      try {
        const usersResponse = await adminApi.getUsers();
        const users = usersResponse.data;
        setStats(prev => ({
          ...prev,
          totalUsers: users.length,
          activeUsers: users.filter(u => u.role === 'user').length,
        }));
      } catch (userError) {
        console.error('Error loading users:', userError);
      }
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-900',
      change: '+12%',
      changeType: 'positive' as const
    },
    {
      title: 'Active Users',
      value: stats.activeUsers,
      icon: TrendingUp,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-900',
      change: '+8%',
      changeType: 'positive' as const
    },
    {
      title: 'Total Documents',
      value: stats.totalDocuments,
      icon: FileText,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-900',
      change: '+24%',
      changeType: 'positive' as const
    },
    {
      title: 'Total Chats',
      value: stats.totalChats,
      icon: MessageSquare,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-900',
      change: '+16%',
      changeType: 'positive' as const
    },
  ];

  // const getActivityIcon = (type: string) => {
  //   switch (type) {
  //     case 'upload': return FileText;
  //     case 'chat': return MessageSquare;
  //     case 'login': return Users;
  //     case 'signup': return Users;
  //     default: return Activity;
  //   }
  // };

  // const getActivityColor = (type: string) => {
  //   switch (type) {
  //     case 'upload': return 'text-purple-600';
  //     case 'chat': return 'text-blue-600';
  //     case 'login': return 'text-green-600';
  //     case 'signup': return 'text-orange-600';
  //     default: return 'text-gray-600';
  //   }
  // };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
          <p className="text-gray-600">Overview of system usage and statistics</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Clock className="h-4 w-4" />
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className={`${stat.bgColor} p-6 rounded-lg border hover:shadow-md transition-shadow`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className={`text-3xl font-bold ${stat.textColor} mt-2`}>
                    {stat.value.toLocaleString()}
                  </p>
                  <div className="flex items-center mt-2">
                    <span className={`text-xs font-medium ${
                      stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.change}
                    </span>
                    <span className="text-xs text-gray-500 ml-1">vs last month</span>
                  </div>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        {/* <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <Activity className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {stats.recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-gray-500">No recent activity</p>
              </div>
            ) : (
              stats.recentActivity.map((activity) => {
                const Icon = getActivityIcon(activity.type);
                const iconColor = getActivityColor(activity.type);
                return (
                  <div key={activity.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border">
                      <Icon className={`h-4 w-4 ${iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">{activity.user}</span> {activity.action}
                        {activity.file && <span className="font-medium"> {activity.file}</span>}
                      </p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div> */}

        {/* System Health */}
        {/* <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">System Health</h3>
            <Zap className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">API Response Time</span>
              </div>
              <span className="text-sm font-medium text-green-600">{stats.systemHealth.apiResponseTime}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">Document Processing</span>
              </div>
              <span className="text-sm font-medium text-green-600">{stats.systemHealth.documentProcessing}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <HardDrive className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">Storage Usage</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      stats.systemHealth.storageUsage > 80 ? 'bg-red-500' : 
                      stats.systemHealth.storageUsage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${stats.systemHealth.storageUsage}%` }}
                  ></div>
                </div>
                <span className={`text-sm font-medium ${
                  stats.systemHealth.storageUsage > 80 ? 'text-red-600' : 
                  stats.systemHealth.storageUsage > 60 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {stats.systemHealth.storageUsage}%
                </span>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">Active Sessions</span>
              </div>
              <span className="text-sm font-medium text-blue-600">{stats.systemHealth.activeSessions}</span>
            </div>
          </div>
          
          <div className={`mt-6 p-4 rounded-lg ${
            stats.systemHealth.status === 'operational' ? 'bg-green-50' :
            stats.systemHealth.status === 'degraded' ? 'bg-yellow-50' : 'bg-red-50'
          }`}>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                stats.systemHealth.status === 'operational' ? 'bg-green-500' :
                stats.systemHealth.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
              }`}></div>
              <span className={`text-sm font-medium ${
                stats.systemHealth.status === 'operational' ? 'text-green-800' :
                stats.systemHealth.status === 'degraded' ? 'text-yellow-800' : 'text-red-800'
              }`}>
                System Status: {stats.systemHealth.status === 'operational' ? 'Operational' : 
                                stats.systemHealth.status === 'degraded' ? 'Degraded' : 'Down'}
              </span>
            </div>
            <p className={`text-xs mt-1 ${
              stats.systemHealth.status === 'operational' ? 'text-green-600' :
              stats.systemHealth.status === 'degraded' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {stats.systemHealth.status === 'operational' ? 'All services running normally' :
               stats.systemHealth.status === 'degraded' ? 'Some services experiencing issues' : 
               'System experiencing problems'}
            </p>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default AdminOverview;