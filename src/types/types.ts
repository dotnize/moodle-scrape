export type Fetch = (
  input: RequestInfo | URL,
  init?: RequestInit | undefined
) => Promise<Response>;

export interface Task {
  id: number;
  name: string;
  description: string;
  deadline: Date;
  courseId: number;
}
export interface User {
  id: number;
  name: string;
  picture: string;
}
export interface Course {
  id: number;
  name: string;
  taskIds: Array<number>;
}

export interface Options {
  refresh?: boolean;
  loginFormPath?: string;
}
