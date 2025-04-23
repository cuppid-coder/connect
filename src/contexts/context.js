import { createContext } from "react";

export const ThemeContext = createContext();
export const TaskContext = createContext();
export const MessageContext = createContext();
export const AuthContext = createContext();
export const TeamContext = createContext();

export const initialTasks = [
  {
    id: 1,
    title: "Implement user authentication",
    description: "Add login and registration functionality",
    priority: "high",
    status: "todo",
    deadline: "2025-05-01",
    assignee: "John Doe",
    createdAt: "2025-04-20",
    activities: [
      {
        type: "created",
        date: "2025-04-20",
        user: "John Doe",
      },
    ],
  },
];
