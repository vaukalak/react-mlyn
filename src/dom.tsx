import React from "react"
import { mlynify } from "./utils";

export const Mlyn = {
  div: mlynify((props: React.HTMLProps<HTMLDivElement>) => <div {...props} />, ["style"]),
  input: mlynify((props: React.HTMLProps<HTMLInputElement>) => <input {...props} />, ["style"]),
  span: mlynify((props: React.HTMLProps<HTMLSpanElement>) => <span {...props} />, ["style"]),
  a: mlynify((props: React.HTMLProps<HTMLAnchorElement>) => <a {...props} />, ["style"]),
  table: mlynify((props: React.HTMLProps<HTMLTableElement>) => <table {...props} />, ["style"]),
  tr: mlynify((props: React.HTMLProps<HTMLTableRowElement>) => <tr {...props} />, ["style"]),
  td: mlynify((props: React.HTMLProps<HTMLTableCellElement>) => <td {...props} />, ["style"]),
};
  