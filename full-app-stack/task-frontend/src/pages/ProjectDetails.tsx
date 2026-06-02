import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectApi, taskApi, ApiError } from '../services/api';
import { hasRole, getUsername } from '../auth/keycloak';
import type { Project, Task, CreateTaskDto, TaskStatus as TaskStatusType } from '../types';
import { TaskStatus } from '../types';
import toast from 'react-hot-toast';

export default function ProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<CreateTaskDto>({ title: '', description: '' });
  const [assigningTaskId, setAssigningTaskId] = useState<number | null>(null);
  const [assigneeInput, setAssigneeInput] = useState('');

  const currentUser = getUsername();
  const canManageTasks = hasRole('admin') || hasRole('project-manager');

  useEffect(() => {
    if (id) {
      loadProjectAndTasks(parseInt(id));
    }
  }, [id]);

  const loadProjectAndTasks = async (projectId: number) => {
    try {
      const [projectData, tasksData] = await Promise.all([
        projectApi.getById(projectId),
        projectApi.getTasks(projectId),
      ]);
      setProject(projectData);
      setTasks(tasksData);
    } catch (error) {
      console.error('Failed to load project:', error);
      toast.error('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      await taskApi.create(parseInt(id), formData);
      toast.success('Task created successfully');
      setFormData({ title: '', description: '' });
      setShowCreateForm(false);
      loadProjectAndTasks(parseInt(id));
    } catch (error) {
      console.error('Failed to create task:', error);
      if (error instanceof ApiError && error.status === 403) {
        toast.error('You do not have permission to create tasks');
      } else {
        toast.error('Failed to create task');
      }
    }
  };

  const handleUpdateStatus = async (taskId: number, status: TaskStatusType) => {
    try {
      await taskApi.updateStatus(taskId, { status });
      toast.success('Task status updated');
      if (id) {
        loadProjectAndTasks(parseInt(id));
      }
    } catch (error) {
      console.error('Failed to update task status:', error);
      if (error instanceof ApiError && error.status === 403) {
        toast.error('You can only update status of tasks assigned to you');
      } else {
        toast.error('Failed to update task status');
      }
    }
  };

  const handleAssignTask = async (taskId: number, assigneeUserId: string) => {
    if (!assigneeUserId.trim()) {
      toast.error('Please enter a user email');
      return;
    }

    try {
      await taskApi.assign(taskId, { assigneeUserId: assigneeUserId.trim() });
      toast.success('Task assigned successfully');
      setAssigningTaskId(null);
      setAssigneeInput('');
      if (id) {
        loadProjectAndTasks(parseInt(id));
      }
    } catch (error) {
      console.error('Failed to assign task:', error);
      if (error instanceof ApiError && error.status === 403) {
        toast.error('You do not have permission to assign tasks');
      } else {
        toast.error('Failed to assign task');
      }
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      await taskApi.delete(taskId);
      toast.success('Task deleted successfully');
      if (id) {
        loadProjectAndTasks(parseInt(id));
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
      if (error instanceof ApiError && error.status === 403) {
        toast.error('You do not have permission to delete tasks');
      } else {
        toast.error('Failed to delete task');
      }
    }
  };

  const getStatusBadgeClass = (status: TaskStatusType): string => {
    switch (status) {
      case TaskStatus.TODO:
        return 'bg-gray-200 text-gray-800';
      case TaskStatus.IN_PROGRESS:
        return 'bg-blue-200 text-blue-800';
      case TaskStatus.DONE:
        return 'bg-green-200 text-green-800';
    }
  };

  const canUpdateTaskStatus = (task: Task): boolean => {
    if (hasRole('admin') || hasRole('project-manager')) return true;
    if (hasRole('developer') && task.assigneeUserId === currentUser) return true;
    return false;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-gray-500 text-lg">Project not found</p>
          <button
            onClick={() => navigate('/projects')}
            className="mt-4 px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <button
          onClick={() => navigate('/projects')}
          className="text-blue-600 hover:text-blue-800 mb-4"
        >
          &larr; Back to Projects
        </button>
        <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
        {project.description && (
          <p className="text-gray-600 mt-2">{project.description}</p>
        )}
        <p className="text-sm text-gray-500 mt-2">Created by: {project.creatorUserId}</p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Tasks</h2>
        {canManageTasks && !showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700"
          >
            Create Task
          </button>
        )}
      </div>

      {showCreateForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="text-xl font-semibold mb-4">Create New Task</h3>
          <form onSubmit={handleCreateTask} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Task Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter task title"
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
                placeholder="Enter task description"
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
                  setFormData({ title: '', description: '' });
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="bg-white p-12 rounded-lg shadow text-center">
          <p className="text-gray-500 text-lg">No tasks found</p>
          {canManageTasks && (
            <p className="text-gray-400 mt-2">Create your first task to get started</p>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assignee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tasks.map((task) => (
                <tr key={task.id}>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{task.title}</div>
                    {task.description && (
                      <div className="text-sm text-gray-500 line-clamp-2">{task.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {canUpdateTaskStatus(task) ? (
                      <select
                        value={task.status}
                        onChange={(e) => handleUpdateStatus(task.id, e.target.value as TaskStatusType)}
                        className={`px-2 py-1 text-xs font-semibold rounded ${getStatusBadgeClass(task.status)}`}
                      >
                        <option value={TaskStatus.TODO}>TODO</option>
                        <option value={TaskStatus.IN_PROGRESS}>IN PROGRESS</option>
                        <option value={TaskStatus.DONE}>DONE</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusBadgeClass(task.status)}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {assigningTaskId === task.id ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={assigneeInput}
                          onChange={(e) => setAssigneeInput(e.target.value)}
                          placeholder="user@example.com"
                          className="w-48 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                        <button
                          onClick={() => handleAssignTask(task.id, assigneeInput)}
                          className="px-2 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setAssigningTaskId(null);
                            setAssigneeInput('');
                          }}
                          className="px-2 py-1 text-xs text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">
                          {task.assigneeUserId || 'Unassigned'}
                        </span>
                        {canManageTasks && (
                          <button
                            onClick={() => {
                              setAssigningTaskId(task.id);
                              setAssigneeInput(task.assigneeUserId || '');
                            }}
                            className="text-xs text-blue-600 hover:text-blue-900"
                          >
                            Assign
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {canManageTasks && (
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
