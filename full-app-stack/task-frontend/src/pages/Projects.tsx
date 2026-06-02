import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { projectApi, ApiError } from '../services/api';
import { hasRole } from '../auth/keycloak';
import type { Project, CreateProjectDto } from '../types';
import toast from 'react-hot-toast';

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<CreateProjectDto>({ name: '', description: '' });
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const canCreateProject = hasRole('admin') || hasRole('project-manager');

  useEffect(() => {
    loadProjects();
    if (searchParams.get('create') === 'true') {
      setShowCreateForm(true);
      setSearchParams({});
    }
  }, []);

  const loadProjects = async () => {
    try {
      const data = await projectApi.getAll();
      setProjects(data);
    } catch (error) {
      console.error('Failed to load projects:', error);
      if (error instanceof ApiError && error.status === 403) {
        toast.error('You do not have permission to view projects');
      } else {
        toast.error('Failed to load projects');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await projectApi.create(formData);
      toast.success('Project created successfully');
      setFormData({ name: '', description: '' });
      setShowCreateForm(false);
      loadProjects();
    } catch (error) {
      console.error('Failed to create project:', error);
      if (error instanceof ApiError && error.status === 403) {
        toast.error('You do not have permission to create projects');
      } else {
        toast.error('Failed to create project');
      }
    }
  };

  const handleDeleteProject = async (id: number) => {
    if (!confirm('Are you sure you want to delete this project?')) {
      return;
    }

    try {
      await projectApi.delete(id);
      toast.success('Project deleted successfully');
      loadProjects();
    } catch (error) {
      console.error('Failed to delete project:', error);
      if (error instanceof ApiError && error.status === 403) {
        toast.error('You can only delete projects you created');
      } else {
        toast.error('Failed to delete project');
      }
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
        {canCreateProject && !showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
          >
            Create Project
          </button>
        )}
      </div>

      {showCreateForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Create New Project</h2>
          <form onSubmit={handleCreateProject} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter project name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter project description"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setFormData({ name: '', description: '' });
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="bg-white p-12 rounded-lg shadow text-center">
          <p className="text-gray-500 text-lg">No projects found</p>
          {canCreateProject && (
            <p className="text-gray-400 mt-2">Create your first project to get started</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-semibold text-gray-900">{project.name}</h3>
              </div>
              {project.description && (
                <p className="text-gray-600 mb-4 line-clamp-3">{project.description}</p>
              )}
              <div className="text-sm text-gray-500 mb-4">
                Created by: {project.creatorUserId}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="flex-1 px-3 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
                >
                  View Tasks
                </button>
                {canCreateProject && (
                  <button
                    onClick={() => handleDeleteProject(project.id)}
                    className="px-3 py-2 text-sm text-white bg-red-600 rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
