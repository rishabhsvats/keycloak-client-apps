export interface Project {
  id: number;
  name: string;
  description?: string;
  creatorUserId: string;
  createdDate: string;
  updatedDate?: string;
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE'
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: TaskStatus;
  project?: Project;
  assigneeUserId?: string;
  createdDate: string;
  updatedDate?: string;
}

export interface User {
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
  scopes?: string;
}

export interface CreateProjectDto {
  name: string;
  description?: string;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  status?: TaskStatus;
}

export interface UpdateTaskStatusDto {
  status: TaskStatus;
}

export interface AssignTaskDto {
  assigneeUserId: string;
}
