import { createContext, useState } from "react";

export const TeamContext = createContext();

const initialTeams = [
  {
    id: 1,
    name: "Frontend Team",
    description: "Responsible for UI/UX development",
    members: ["John Doe", "Jane Smith"],
    openPositions: ["React Developer", "UI Designer"],
    tasks: [
      {
        id: 1,
        title: "Implement new dashboard",
        status: "in-progress",
        assignee: "John Doe",
        priority: "high",
      },
    ],
  },
  {
    id: 2,
    name: "Backend Team",
    description: "API and database management",
    members: ["Mike Johnson", "Sarah Wilson"],
    openPositions: ["Node.js Developer"],
    tasks: [
      {
        id: 2,
        title: "Optimize database queries",
        status: "todo",
        assignee: "Mike Johnson",
        priority: "medium",
      },
    ],
  },
];

export function TeamProvider({ children }) {
  const [teams, setTeams] = useState(initialTeams);

  const createTeam = (team) => {
    const newTeam = {
      ...team,
      id: Date.now(),
      members: [],
      tasks: [],
    };
    setTeams((prev) => [...prev, newTeam]);
  };

  const joinTeam = (teamId, memberName) => {
    setTeams((prev) =>
      prev.map((team) => {
        if (team.id === teamId && !team.members.includes(memberName)) {
          return {
            ...team,
            members: [...team.members, memberName],
          };
        }
        return team;
      })
    );
  };

  const leaveTeam = (teamId, memberName) => {
    setTeams((prev) =>
      prev.map((team) => {
        if (team.id === teamId) {
          return {
            ...team,
            members: team.members.filter((member) => member !== memberName),
          };
        }
        return team;
      })
    );
  };

  const addTeamTask = (teamId, task) => {
    setTeams((prev) =>
      prev.map((team) => {
        if (team.id === teamId) {
          const newTask = {
            ...task,
            id: Date.now(),
            teamId,
          };
          return {
            ...team,
            tasks: [...team.tasks, newTask],
          };
        }
        return team;
      })
    );
  };

  const updateTeamTask = (teamId, taskId, updates) => {
    setTeams((prev) =>
      prev.map((team) => {
        if (team.id === teamId) {
          return {
            ...team,
            tasks: team.tasks.map((task) =>
              task.id === taskId ? { ...task, ...updates } : task
            ),
          };
        }
        return team;
      })
    );
  };

  const deleteTeamTask = (teamId, taskId) => {
    setTeams((prev) =>
      prev.map((team) => {
        if (team.id === teamId) {
          return {
            ...team,
            tasks: team.tasks.filter((task) => task.id !== taskId),
          };
        }
        return team;
      })
    );
  };

  return (
    <TeamContext.Provider
      value={{
        teams,
        createTeam,
        joinTeam,
        leaveTeam,
        addTeamTask,
        updateTeamTask,
        deleteTeamTask,
      }}
    >
      {children}
    </TeamContext.Provider>
  );
}
