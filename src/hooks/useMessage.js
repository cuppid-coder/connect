import { useContext } from "react";
import { MessageContext } from "../contexts/context";

export const useMessage = () => {
  return useContext(MessageContext);
};
