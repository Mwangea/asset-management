/* eslint-disable @typescript-eslint/no-explicit-any */
import  { useEffect, useState } from 'react';
import { BarChart3, Package, QrCode, Users,  MapPin, Activity, AlertCircle, PenTool, ChartCandlestick } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../../components/Spinner';
import api from '../../api/axios';
import { DistributionItem, IActivity, LocationItem, UserItem } from '../../types/dashboard';

interface DashboardData {
  stats: {
    totalAssets: number;
    assetsInUse: number;
    availableAssets: number;
    assetsUnderMaintenance: number;
  };
  distributions: {
    byType: DistributionItem[];
    byLocation: LocationItem[];
    byUser: UserItem[];
  };
  recentActivities: IActivity[];
}

// Create a default/initial state for dashboardData
const defaultDashboardData: DashboardData = {
  stats: {
    totalAssets: 0,
    assetsInUse: 0,
    availableAssets: 0,
    assetsUnderMaintenance: 0
  },
  distributions: {
    byType: [],
    byLocation: [],
    byUser: []
  },
  recentActivities: []
};

// Stat Card Component with TypeScript prop definitions
interface StatCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const StatCard = ({ title, value, icon: Icon, color }: StatCardProps) => (
  <div className="bg-white rounded-lg shadow-md p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-500 text-sm font-medium">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </div>
      <div className={`p-3 rounded-full ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

// Format date for activity logs
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

// Format time difference (e.g., "2 hours ago")
const getTimeDifference = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 60) {
    return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
  }
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  }
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
};
// Get icon based on action type
const getActionIcon = (action: string): React.ReactNode => {
  switch (action) {
    case 'created':
      return <Package className="w-4 h-4 text-green-600" />;
    case 'updated':
      return <Activity className="w-4 h-4 text-blue-600" />;
    case 'deleted':
      return <AlertCircle className="w-4 h-4 text-red-600" />;
    case 'scanned':
      return <QrCode className="w-4 h-4 text-purple-600" />;
    case 'assigned':
      return <Users className="w-4 h-4 text-indigo-600" />;
    case 'unassigned':
      return <Users className="w-4 h-4 text-amber-600" />;
    case 'maintenance':
      return <PenTool className="w-4 h-4 text-orange-600" />;
    case 'available':
      return <Package className="w-4 h-4 text-emerald-600" />;
    default:
      return <Activity className="w-4 h-4 text-gray-600" />;
  }
};

const AdminOverview = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData>(defaultDashboardData);

  useEffect(() => {
    // Fetch dashboard data from API
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await api.get<DashboardData>('/dashboard/admin');

        // Ensure we have proper structure by merging with defaults
        const data = {
          ...defaultDashboardData,
          ...response.data,
          distributions: {
            ...defaultDashboardData.distributions,
            ...(response.data.distributions || {}),
            byType: response.data.distributions?.byType || [],
            byLocation: response.data.distributions?.byLocation || [],
            byUser: response.data.distributions?.byUser || []
          }
        };
        
        setDashboardData(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(
          (err as any).response?.data?.msg || 
          'Failed to load dashboard data. Please try again later.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Calculate total active users from distribution data (with safe access)
  const activeUsers = dashboardData?.distributions?.byUser?.length || 0;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <Spinner size="lg" />
        <p className="ml-2 text-gray-600">Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-red-600 underline"
          >
            Reload page
          </button>
        </div>
      </div>
    );
  }

  // Calculate percentages for asset distribution chart (with safe access)
  const totalAssetCount = dashboardData?.stats?.totalAssets || 0;
  const assetDistributionWithPercentages = dashboardData?.distributions?.byType?.map(item => ({
    ...item,
    percentage: Math.round((item.count / (totalAssetCount || 1)) * 100) || 0
  })) || [];

  // Calculate percentages for location distribution chart (with safe access)
  const locationDistributionWithPercentages = dashboardData?.distributions?.byLocation?.map(item => ({
    ...item,
    percentage: Math.round((item.count / (totalAssetCount || 1)) * 100) || 0
  })) || [];

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.username || 'Admin'}!</h1>
        <p className="text-gray-600">Here's what's happening with your assets today.</p>
      </div>
      
      {/* Key Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Assets"
          value={dashboardData?.stats?.totalAssets || 0}
          icon={ChartCandlestick}
          color="bg-blue-600"
        />
        <StatCard
          title="Assets In Use"
          value={dashboardData?.stats?.assetsInUse || 0}
          icon={BarChart3}
          color="bg-emerald-600"
        />
        <StatCard
          title="Available Assets"
          value={dashboardData?.stats?.availableAssets || 0}
          icon={Package}
          color="bg-amber-600"
        />
        <StatCard
          title="Active Users"
          value={activeUsers}
          icon={Users}
          color="bg-purple-600"
        />
      </div>
      
      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          {(dashboardData?.recentActivities?.length || 0) === 0 ? (
            <p className="text-gray-500 text-center py-4">No recent activities found</p>
          ) : (
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {dashboardData.recentActivities.map((activity, index) => (
                <div key={activity._id || index} className="flex items-start justify-between py-2 border-b last:border-0">
                  <div className="flex items-start">
                    <div className="p-2 rounded-full bg-gray-100 mr-3">
                      {getActionIcon(activity.action)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {activity.details || `${activity.action} ${activity.asset?.name || 'asset'}`}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {getTimeDifference(activity.timestamp)} ({formatDate(activity.timestamp)})
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">{activity.username}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Asset Status Breakdown */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Asset Status</h2>
          <div className="space-y-6">
            {/* Assets in Use */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">In Use</span>
                <span className="text-sm text-gray-500">
                  {dashboardData?.stats?.assetsInUse || 0} assets 
                  ({Math.round(((dashboardData?.stats?.assetsInUse || 0) / (dashboardData?.stats?.totalAssets || 1)) * 100) || 0}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-emerald-600 h-2 rounded-full"
                  style={{ width: `${((dashboardData?.stats?.assetsInUse || 0) / (dashboardData?.stats?.totalAssets || 1)) * 100}%` }}
                />
              </div>
            </div>
            
            {/* Available Assets */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Available</span>
                <span className="text-sm text-gray-500">
                  {dashboardData?.stats?.availableAssets || 0} assets
                  ({Math.round(((dashboardData?.stats?.availableAssets || 0) / (dashboardData?.stats?.totalAssets || 1)) * 100) || 0}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-amber-600 h-2 rounded-full"
                  style={{ width: `${((dashboardData?.stats?.availableAssets || 0) / (dashboardData?.stats?.totalAssets || 1)) * 100}%` }}
                />
              </div>
            </div>
            
            {/* Under Maintenance */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Under Maintenance</span>
                <span className="text-sm text-gray-500">
                  {dashboardData?.stats?.assetsUnderMaintenance || 0} assets
                  ({Math.round(((dashboardData?.stats?.assetsUnderMaintenance || 0) / (dashboardData?.stats?.totalAssets || 1)) * 100) || 0}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-orange-500 h-2 rounded-full"
                  style={{ width: `${((dashboardData?.stats?.assetsUnderMaintenance || 0) / (dashboardData?.stats?.totalAssets || 1)) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Asset Distribution and User Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Asset Distribution by Type */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Asset Distribution by Type</h2>
          <div className="space-y-4">
            {assetDistributionWithPercentages.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No asset type data available</p>
            ) : (
              assetDistributionWithPercentages.map((item) => (
                <div key={item.type}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">{item.type}</span>
                    <span className="text-sm text-gray-500">{item.count} items</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-ocean-600 h-2 rounded-full"
                      style={{ width: `${item.percentage || 0}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Asset Distribution by Location */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Asset Distribution by Location</h2>
          <div className="space-y-4">
            {locationDistributionWithPercentages.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No location data available</p>
            ) : (
              locationDistributionWithPercentages.map((item) => (
                <div key={item.location}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">
                      <MapPin className="h-4 w-4 inline mr-1 text-gray-500" />
                      {item.location}
                    </span>
                    <span className="text-sm text-gray-500">{item.count} items</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{ width: `${item.percentage || 0}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      {/* Top Users Table */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Top Users by Asset Count</h2>
        {(dashboardData?.distributions?.byUser?.length || 0) === 0 ? (
          <p className="text-gray-500 text-center py-4">No user assignment data available</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assets Assigned
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    % of Total Assets
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dashboardData.distributions.byUser.map((item, index) => (
                  <tr key={item.user || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.user}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {Math.round((item.count / (dashboardData?.stats?.totalAssets || 1)) * 100)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOverview;