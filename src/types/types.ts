export type Fetch = (input: RequestInfo | URL, init?: RequestInit | undefined) => Promise<Response>;

export interface Task {
    id: number;
    name: string;
    description: string;
    deadline: string;
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
