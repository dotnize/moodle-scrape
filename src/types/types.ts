export type Fetch = (input: RequestInfo | URL, init?: RequestInit | undefined) => Promise<Response>;

export interface Task {
    id: number;
    name: string;
    description: string;
    deadline: Date;
    course: Course;
}
export interface User {
    id: number;
    name: string;
    picture: string;
}
export interface Course {
    id: number;
    name: string;
    tasks: Array<Task>;
}

export interface Options{
    refresh?: boolean;
    loginFormPath?: string;
}
