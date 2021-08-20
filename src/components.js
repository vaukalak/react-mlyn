import { useState } from "react";
import { useMlynEffect } from "./hooks";

export const Show = ({ when, children }) => {
  const [visible, setVisible] = useState(Boolean(when()));
  useMlynEffect(() => {
    setVisible(Boolean(when()));
  });
  return visible && children();
};
  