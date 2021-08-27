import { useCompute } from "./hooks";

export const Show = ({ when, children }) => {
  const visible = useCompute(() => Boolean(when()));
  return visible && children();
};
  