import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import keycloak from '../auth/keycloak';
import { adminApi, userApi, ApiError } from '../services/api';
import type { Stats, CurrentUser } from '../types';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, userData] = await Promise.all([
        adminApi.getStats(),
        userApi.getMe(),
      ]);
      setStats(statsData);
      setUser(userData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      if (error instanceof ApiError && error.status === 403) {
        toast.error('Admin access required');
      } else {
        toast.error('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">System Overview</h1>

      {/* User Info and Token Claims */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {user && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Current User</h2>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Username</dt>
                <dd className="text-base text-gray-900">{user.username}</dd>
              </div>
              {user.email && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="text-base text-gray-900">{user.email}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500">Roles</dt>
                <dd className="text-base text-gray-900">{user.roles.join(', ')}</dd>
              </div>
              {user.scopes && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Scopes (from JWT)</dt>
                  <dd className="text-sm text-gray-900 font-mono">{user.scopes}</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {/* Protocol Mapper Claims - from task:read, admin:users, admin:stats scopes */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Token Claims (Protocol Mappers)</h2>
          {keycloak.tokenParsed && (
            <dl className="space-y-2">
              {/* From task:read scope (shared with Task Manager) */}
              {keycloak.tokenParsed.name && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Full Name <span className="text-xs text-blue-600">(task:read)</span>
                  </dt>
                  <dd className="text-base text-gray-900">{keycloak.tokenParsed.name}</dd>
                </div>
              )}
              {keycloak.tokenParsed.preferred_username && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Username <span className="text-xs text-blue-600">(task:read)</span>
                  </dt>
                  <dd className="text-base text-gray-900">{keycloak.tokenParsed.preferred_username}</dd>
                </div>
              )}

              {/* From admin:users scope */}
              {keycloak.tokenParsed.admin_level && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Admin Level <span className="text-xs text-purple-600">(admin:users)</span>
                  </dt>
                  <dd className="text-base text-gray-900">{keycloak.tokenParsed.admin_level}</dd>
                </div>
              )}

              {/* From admin:stats scope */}
              {keycloak.tokenParsed.access_level && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Access Level <span className="text-xs text-orange-600">(admin:stats)</span>
                  </dt>
                  <dd className="text-base text-gray-900">{keycloak.tokenParsed.access_level}</dd>
                </div>
              )}
              {keycloak.tokenParsed.token_purpose && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Token Purpose <span className="text-xs text-orange-600">(admin:stats)</span>
                  </dt>
                  <dd className="text-base text-gray-900">{keycloak.tokenParsed.token_purpose}</dd>
                </div>
              )}
              {keycloak.tokenParsed.aud && Array.isArray(keycloak.tokenParsed.aud) && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Audience <span className="text-xs text-orange-600">(admin:stats)</span>
                  </dt>
                  <dd className="text-sm text-gray-900 font-mono">
                    {keycloak.tokenParsed.aud.join(', ')}
                  </dd>
                </div>
              )}

              {/* Note about missing claims */}
              <div className="pt-3 mt-3 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  <strong>Note:</strong> This client lacks <code className="bg-gray-100 px-1 rounded">task:write</code> and{' '}
                  <code className="bg-gray-100 px-1 rounded">task:assign</code> scopes, so department, job_title, and team claims are not included.
                </p>
              </div>
            </dl>
          )}
        </div>
      </div>

      {stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total Projects</h3>
              <p className="text-3xl font-bold text-gray-900">{stats.totalProjects}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total Tasks</h3>
              <p className="text-3xl font-bold text-gray-900">{stats.totalTasks}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500 mb-2">TODO</h3>
              <p className="text-3xl font-bold text-gray-600">{stats.todoTasks}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500 mb-2">In Progress</h3>
              <p className="text-3xl font-bold text-blue-600">{stats.inProgressTasks}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Done</h3>
              <p className="text-3xl font-bold text-green-600">{stats.doneTasks}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link
              to="/users"
              className="block bg-purple-50 border border-purple-200 p-6 rounded-lg hover:bg-purple-100 transition"
            >
              <h3 className="text-lg font-semibold text-purple-900 mb-2">User Management</h3>
              <p className="text-purple-800">View all users and their assigned roles</p>
            </Link>
            <Link
              to="/activity"
              className="block bg-blue-50 border border-blue-200 p-6 rounded-lg hover:bg-blue-100 transition"
            >
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Activity Log</h3>
              <p className="text-blue-800">View recent system activity and events</p>
            </Link>
          </div>
        </>
      )}

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-purple-900 mb-2">
          About This Dashboard
        </h3>
        <p className="text-purple-800 mb-3">
          This Admin Dashboard demonstrates Single Sign-On (SSO) with the Task Manager app.
          Notice how you're logged in with the same session - no need to authenticate again.
        </p>
        <p className="text-purple-800">
          This client has <strong>admin:users</strong> and <strong>admin:stats</strong> scopes,
          but lacks <strong>task:write</strong> and <strong>task:assign</strong> scopes. This
          demonstrates how different clients get different capabilities even for the same user.
        </p>
      </div>

      {/* Debug Token Section */}
      <details className="bg-gray-50 border border-gray-300 rounded-lg p-4">
        <summary className="cursor-pointer font-semibold text-gray-700 hover:text-gray-900">
          🔍 Debug: View Raw JWT Token (for teaching)
        </summary>
        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-3">
            Compare this token with the Task Manager token - different scopes = different claims!
            Notice this token has <code className="bg-gray-100 px-1 rounded">admin_level</code> and{' '}
            <code className="bg-gray-100 px-1 rounded">access_level</code> but NOT{' '}
            <code className="bg-gray-100 px-1 rounded">department</code> or{' '}
            <code className="bg-gray-100 px-1 rounded">job_title</code>.
          </p>
          {keycloak.tokenParsed && (
            <pre className="bg-gray-800 text-green-400 p-4 rounded overflow-x-auto text-xs">
              {JSON.stringify(keycloak.tokenParsed, null, 2)}
            </pre>
          )}
        </div>
      </details>
    </div>
  );
}
