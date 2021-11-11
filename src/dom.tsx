import { Subject } from "mlyn";
import React from "react"
import { seal } from "./utils";
import { mlynify } from "./utils";

const InputBase = mlynify((props: React.HTMLProps<HTMLInputElement>) => <input {...props} />, ["style"]);

type InputProps = Parameters<typeof InputBase>[0] & {
  "bind:checked": Subject<boolean>;
  bindChecked: Subject<boolean>;
  "bind:value": Subject<string>;
  bindValue: Subject<string>;
};

export const Mlyn = {
  div: mlynify((props: React.HTMLProps<HTMLDivElement>) => <div {...props} />, ["style"]),
  input: seal((props: InputProps) => {
    const propsClone = { ...props };
    const bindValue = propsClone["bind:value"] || propsClone["bindValue"];
    if (bindValue) {
      const subject$ = bindValue;
      propsClone["value$"] = subject$;
      propsClone["onChange"] = (e) => {
        subject$((e.target as HTMLInputElement).value);
      };
      delete propsClone["bind:value"];
      delete propsClone["bindValue"];
    }
    const bindChecked = propsClone["bind:checked"] || propsClone["bindChecked"];
    if (bindChecked) {
      const subject$ = bindChecked;
      propsClone["checked$"] = subject$;
      propsClone["onChange"] = (e) => {
        subject$((e.target as HTMLInputElement).checked);
      };
      delete propsClone["bind:checked"];
      delete propsClone["bindChecked"];
    }
    return <InputBase {...propsClone} />;
  }),
  span: mlynify((props: React.HTMLProps<HTMLSpanElement>) => <span {...props} />, ["style"]),
  a: mlynify((props: React.HTMLProps<HTMLAnchorElement>) => <a {...props} />, ["style"]),
  table: mlynify((props: React.HTMLProps<HTMLTableElement>) => <table {...props} />, ["style"]),
  tr: mlynify((props: React.HTMLProps<HTMLTableRowElement>) => <tr {...props} />, ["style"]),
  td: mlynify((props: React.HTMLProps<HTMLTableCellElement>) => <td {...props} />, ["style"]),
};
  