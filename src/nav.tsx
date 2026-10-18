import { createContext, useContext } from "react";

export type ToolId = "home" | "pdf" | "cv";
export const NavContext = createContext<(to: ToolId) => void>(() => {});
export const useNav = () => useContext(NavContext);
export const useGoHome = () => {
  const nav = useNav();
  return () => nav("home");
};
