import React from "react";
import { render, act } from "@testing-library/react";
import { createSubject } from "mlyn";
import Mlyn, { For } from "../src";

const mapChildren = (container) =>
  [...container.children].map((c) => c.innerHTML);

test("displays entries", async () => {
  const items$ = createSubject(["a", "b", "c"]);
  const { container } = render(
    <For each={items$} getKey={(e) => e}>
      {(e$) => <div>{e$()}</div>}
    </For>
  );
  expect(mapChildren(container)).toEqual(["a", "b", "c"]);
});

test("add / remove entries", async () => {
  const items$ = createSubject(["a", "b", "c"]);
  const { container } = render(
    <For each={items$} getKey={(e) => e}>
      {(e$) => <div>{e$()}</div>}
    </For>
  );
  expect(mapChildren(container)).toEqual(["a", "b", "c"]);
  act(() => { items$([...items$(), "d"]) });
  expect(mapChildren(container)).toEqual(["a", "b", "c", "d"]);
  act(() => { items$(items$().slice(1)) });
  expect(mapChildren(container)).toEqual(["b", "c", "d"]);
});

const idGen = () => {
  let i = 0;
  return () => (i++).toString();
};

test("update entries", async () => {
  const id = idGen();
  const item = (v) => ({ v, id: id() });
  const items$ = createSubject([item("a"), item("b"), item("c")]);
  const { container } = render(
    <For each={items$} getKey={({ id }) => id}>
      {(e$) => <Mlyn.div>{e$.v()}</Mlyn.div>}
    </For>
  );
  expect(mapChildren(container)).toEqual(["a", "b", "c"]);
  act(() => { items$[1].v("d") });
  expect(mapChildren(container)).toEqual(["a", "b", "c"]);
});
