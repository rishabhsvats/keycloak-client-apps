import { Link } from 'react-router-dom';
import { doLogout, getUsername, isAdmin } from '../auth/keycloak';
import TokenStatus from './TokenStatus';

export default function Header() {
  const username = getUsername();
  const showAdminLink = isAdmin();

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-2xl font-bold text-blue-600">
              Task Manager
            </Link>
            <nav className="flex gap-4">
              <Link
                to="/"
                className="text-gray-700 hover:text-blue-600 font-medium"
              >
                Dashboard
              </Link>
              <Link
                to="/projects"
                className="text-gray-700 hover:text-blue-600 font-medium"
              >
                Projects
              </Link>
              {showAdminLink && (
                <a
                  href="http://localhost:5174"
                  className="text-gray-700 hover:text-blue-600 font-medium"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Admin Dashboard
                </a>
              )}
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
