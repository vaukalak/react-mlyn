import { PrimitiveSubject } from "mlyn";
import React from "react";
import { seal, mlynify } from "./utils";

const InputBase = mlynify(
  (props: React.HTMLProps<HTMLInputElement>) => <input {...props} />,
  ["style"]
);

const TextareaBase = mlynify(
  (props: React.HTMLProps<HTMLTextAreaElement>) => <textarea {...props} />,
  ["style"]
);

const SelectBase = mlynify(
  (props: React.HTMLProps<HTMLSelectElement>) => <select {...props} />,
  ["style"]
);
interface BindChecked {
  "bind:checked"?: PrimitiveSubject<boolean>;
  bindChecked?: PrimitiveSubject<boolean>;
}

interface BindValue {
  "bind:value"?: PrimitiveSubject<string>;
  bindValue?: PrimitiveSubject<string>;
}

type InputProps = Parameters<typeof InputBase>[0] & BindChecked & BindValue;
type SelectProps = Parameters<typeof SelectBase>[0] & BindValue;
type TextareaProps = Parameters<typeof TextareaBase>[0] & BindValue;

const bindChecked = <T extends object>(propsClone: T) => {
  const checked$ = propsClone["bind:checked"] || propsClone["bindChecked"];
  if (checked$) {
    const subject$ = checked$;
    propsClone["checked$"] = subject$;
    propsClone["onChange"] = (e) => {
      subject$((e.target as HTMLInputElement).checked);
    };
    delete propsClone["bind:checked"];
    delete propsClone["bindChecked"];
  }
};

const bindValue = <T extends object>(propsClone: T) => {
  const value$ = propsClone["bind:value"] || propsClone["bindValue"];
  if (value$) {
    const subject$ = value$;
    propsClone["value$"] = subject$;
    propsClone["onChange"] = (e) => {
      subject$((e.target as HTMLInputElement).value);
    };
    delete propsClone["bind:value"];
    delete propsClone["bindValue"];
  }
  return propsClone;
};

const textarea = seal((props: TextareaProps) => {
  const propsClone: TextareaProps = { ...props };
  bindValue<TextareaProps>(propsClone);
  return <TextareaBase {...propsClone} />;
});

const select = seal((props: SelectProps) => {
  const propsClone: SelectProps = { ...props };
  bindValue<SelectProps>(propsClone);
  return <SelectBase {...propsClone} />;
});

const input = seal((props: InputProps) => {
  const propsClone = { ...props };
  bindValue(propsClone);
  bindChecked(propsClone);
  return <InputBase {...propsClone} />;
});

const div = mlynify(
  (props: React.HTMLProps<HTMLDivElement>) => <div {...props} />,
  ["style"]
);

const span = mlynify(
  (props: React.HTMLProps<HTMLSpanElement>) => <span {...props} />,
  ["style"]
);

const a = mlynify(
  (props: React.HTMLProps<HTMLAnchorElement>) => <a {...props} />,
  ["style"]
);

const table = mlynify(
  (props: React.HTMLProps<HTMLTableElement>) => <table {...props} />,
  ["style"]
);
const tr = mlynify(
  (props: React.HTMLProps<HTMLTableRowElement>) => <tr {...props} />,
  ["style"]
);
const td = mlynify(
  (props: React.HTMLProps<HTMLTableCellElement>) => <td {...props} />,
  ["style"]
);

export const Mlyn: {
  div: typeof div;
  input: typeof input;
  span: typeof span;
  a: typeof a;
  table: typeof table;
  tr: typeof tr;
  td: typeof td;
  textarea: typeof textarea;
  select: typeof select;
} = {
  div,
  input,
  span,
  a,
  table,
  tr,
  td,
  textarea,
  select,
};
