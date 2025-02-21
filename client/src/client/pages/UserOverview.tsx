/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { Package, Users, Activity, AlertCircle, QrCode, PenTool, ChartCandlestick, BarChart3, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../../components/Spinner';
import api from '../../api/axios';

// TypeScript interfaces
interface UserAsset {
  _id: string;
  name: string;
  type: string;
  location: string;
  status: string;
  dateAssigned: string;
}

interface Activity {
  _id: string;
  action: string;
  details: string;
  timestamp: string;
  asset: {
    name: string;
    type: string;
  };
}

interface UserDashboardData {
  userAssets: UserAsset[];
  assetCount: number;
  recentActivities: Activity[];
}

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, color }: {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) => (
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

// Format time difference
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

// Format date
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

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
    case 'maintenance':
      return <PenTool className="w-4 h-4 text-orange-600" />;
    default:
      return <Activity className="w-4 h-4 text-gray-600" />;
  }
};

const UserDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<UserDashboardData>({
    userAssets: [],
    assetCount: 0,
    recentActivities: []
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await api.get<UserDashboardData>('/dashboard/user');
        setDashboardData(response.data);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError(err.response?.data?.msg || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-8">
      <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.username || 'Employee001'}!</h1>
        <p className="text-gray-600">Here's your dashboard overview..</p>
      </div>

      {/* Key Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Assigned Assets"
          value={dashboardData.assetCount}
          icon={ChartCandlestick}
          color="bg-blue-600"
        />
        <StatCard
          title="Assets In Use"
          value={dashboardData.userAssets.filter(asset => asset.status === 'In Use').length}
          icon={BarChart3}
          color="bg-emerald-600"
        />
        <StatCard
          title="Under Maintenance"
          value={dashboardData.userAssets.filter(asset => asset.status === 'Under Maintenance').length}
          icon={Package}
          color="bg-amber-600"
        />
        <StatCard
          title="Active Locations"
          value={[...new Set(dashboardData.userAssets.map(asset => asset.location))].length}
          icon={Users}
          color="bg-purple-600"
        />
      </div>

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          {dashboardData.recentActivities.length === 0 ? (
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
                        {activity.details}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {getTimeDifference(activity.timestamp)} ({formatDate(activity.timestamp)})
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Asset Status */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">My Asset Status</h2>
          <div className="space-y-6">
            {/* Assets in Use */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">In Use</span>
                <span className="text-sm text-gray-500">
                  {dashboardData.userAssets.filter(asset => asset.status === 'In Use').length} assets
                  ({Math.round((dashboardData.userAssets.filter(asset => asset.status === 'In Use').length / dashboardData.assetCount) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-emerald-600 h-2 rounded-full"
                  style={{ width: `${(dashboardData.userAssets.filter(asset => asset.status === 'In Use').length / dashboardData.assetCount) * 100}%` }}
                />
              </div>
            </div>

            {/* Under Maintenance */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Under Maintenance</span>
                <span className="text-sm text-gray-500">
                  {dashboardData.userAssets.filter(asset => asset.status === 'Under Maintenance').length} assets
                  ({Math.round((dashboardData.userAssets.filter(asset => asset.status === 'Under Maintenance').length / dashboardData.assetCount) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-orange-500 h-2 rounded-full"
                  style={{ width: `${(dashboardData.userAssets.filter(asset => asset.status === 'Under Maintenance').length / dashboardData.assetCount) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Asset Distribution by Location */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">My Assets by Location</h2>
        <div className="space-y-4">
          {[...new Set(dashboardData.userAssets.map(asset => asset.location))].length === 0 ? (
            <p className="text-gray-500 text-center py-4">No location data available</p>
          ) : (
            [...new Set(dashboardData.userAssets.map(asset => asset.location))].map((location) => {
              const count = dashboardData.userAssets.filter(asset => asset.location === location).length;
              const percentage = (count / dashboardData.assetCount) * 100;
              
              return (
                <div key={location}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">
                      <MapPin className="h-4 w-4 inline mr-1 text-gray-500" />
                      {location}
                    </span>
                    <span className="text-sm text-gray-500">{count} items</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;