export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  enabled: boolean;
  roles: string[];
}

export interface Stats {
  totalProjects: number;
  totalTasks: number;
  todoTasks: number;
  inProgressTasks: number;
  doneTasks: number;
}

export interface Activity {
  type: string;
  description: string;
  userId: string;
  timestamp: string;
  entityId: number;
}

export interface CurrentUser {
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
  scopes?: string;
}
