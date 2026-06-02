import { Link } from 'react-router-dom';
import { doLogout, getUsername } from '../auth/keycloak';
import TokenStatus from './TokenStatus';

export default function Header() {
  const username = getUsername();

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-2xl font-bold text-purple-600">
              Admin Dashboard
            </Link>
            <nav className="flex gap-4">
              <Link
                to="/"
                className="text-gray-700 hover:text-purple-600 font-medium"
              >
                Overview
              </Link>
              <Link
                to="/users"
                className="text-gray-700 hover:text-purple-600 font-medium"
              >
                Users
              </Link>
              <Link
                to="/activity"
                className="text-gray-700 hover:text-purple-600 font-medium"
              >
                Activity
              </Link>
              <a
                href="http://localhost:5173"
                className="text-gray-700 hover:text-purple-600 font-medium"
                target="_blank"
                rel="noopener noreferrer"
              >
                Task Manager
              </a>
            </nav>
          </div>
          <div className="flex items-center gap-6">
            <TokenStatus />
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700">
                Welcome, <span className="font-semibold">{username}</span>
              </span>
              <button
                onClick={doLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
