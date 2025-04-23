import { useContext } from "react";
import { TeamContext } from "../contexts/context";

export const useTeam = () => {
  return useContext(TeamContext);
};
