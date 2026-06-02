import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import keycloak from '../auth/keycloak';
import { userApi } from '../services/api';
import type { User } from '../types';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      console.log('Loading user info...');
      const data = await userApi.getMe();
      console.log('User info loaded:', data);
      setUser(data);
    } catch (error: any) {
      console.error('Failed to load user info:', error);
      if (error.message && error.message.includes('timeout')) {
        toast.error('Request timed out. Please check your connection.');
      } else if (error.status === 401) {
        toast.error('Authentication failed. Please log in again.');
      } else {
        toast.error(`Failed to load user information: ${error.message || 'Unknown error'}`);
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
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">User Information</h2>
          {user && (
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
              {user.firstName && user.lastName && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Name</dt>
                  <dd className="text-base text-gray-900">
                    {user.firstName} {user.lastName}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500">Roles</dt>
                <dd className="text-base text-gray-900">
                  {user.roles.join(', ')}
                </dd>
              </div>
              {user.scopes && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Scopes</dt>
                  <dd className="text-sm text-gray-900 font-mono">
                    {user.scopes}
                  </dd>
                </div>
              )}
            </dl>
          )}
        </div>

        {/* Protocol Mapper Claims - from task:read, task:write, task:assign scopes */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Token Claims (Protocol Mappers)</h2>
          {keycloak.tokenParsed && (
            <dl className="space-y-2">
              {/* From task:read scope */}
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

              {/* From task:write scope */}
              {keycloak.tokenParsed.department && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Department <span className="text-xs text-green-600">(task:write)</span>
                  </dt>
                  <dd className="text-base text-gray-900">{keycloak.tokenParsed.department}</dd>
                </div>
              )}
              {keycloak.tokenParsed.job_title && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Job Title <span className="text-xs text-green-600">(task:write)</span>
                  </dt>
                  <dd className="text-base text-gray-900">{keycloak.tokenParsed.job_title}</dd>
                </div>
              )}

              {/* From task:assign scope */}
              {keycloak.tokenParsed.team && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Team <span className="text-xs text-purple-600">(task:assign)</span>
                  </dt>
                  <dd className="text-base text-gray-900">{keycloak.tokenParsed.team}</dd>
                </div>
              )}
              {keycloak.tokenParsed.manager_email && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Manager <span className="text-xs text-purple-600">(task:assign)</span>
                  </dt>
                  <dd className="text-base text-gray-900">{keycloak.tokenParsed.manager_email}</dd>
                </div>
              )}

              {!keycloak.tokenParsed.department && !keycloak.tokenParsed.job_title && !keycloak.tokenParsed.team && (
                <div className="text-sm text-gray-500 italic">
                  No custom attributes set. Run <code className="bg-gray-100 px-1 rounded">./setup.sh</code> to add them.
                </div>
              )}
            </dl>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              to="/projects"
              className="block w-full px-4 py-3 text-center text-white bg-blue-600 rounded hover:bg-blue-700"
            >
              View All Projects
            </Link>
            {user?.roles.includes('admin') || user?.roles.includes('project-manager') ? (
              <Link
                to="/projects?create=true"
                className="block w-full px-4 py-3 text-center text-white bg-green-600 rounded hover:bg-green-700"
              >
                Create New Project
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          About This Application
        </h3>
        <p className="text-blue-800">
          This is a teaching application demonstrating Keycloak authentication and
          authorization. The backend validates both <strong>roles</strong> (who you are)
          and <strong>scopes</strong> (what the client can do). Notice how different
          clients have different scopes assigned.
        </p>
      </div>

      {/* Debug Token Section */}
      <details className="bg-gray-50 border border-gray-300 rounded-lg p-4">
        <summary className="cursor-pointer font-semibold text-gray-700 hover:text-gray-900">
          🔍 Debug: View Raw JWT Token (for teaching)
        </summary>
        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-3">
            This shows the decoded JWT access token. Protocol mappers add claims based on client scopes.
            Open browser DevTools Console and run: <code className="bg-gray-800 text-white px-2 py-1 rounded">console.log(keycloak.tokenParsed)</code>
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
