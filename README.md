# react-mlyn
React bindings to [mlyn](https://github.com/vaukalak/mlyn)

## Goals of this library:
- Reduce re-renders of the application due to subscription based model (update only components that changed).
- Allow 2 way binding, without violating Unidirectional Data Flow.
- Reduce react app / components boilerplate.
- Reduce the amount of properties passed to components props / context, and make components reuse easier.

## Installation

Install both `react-mlyn` and `mlyn`.
```
yarn add react-mlyn mlyn
```
or
```
npm i -S react-mlyn mlyn
```

## Eamples

- [Simple TodoMVC app](https://codesandbox.io/s/react-mlyn-todo-mvc-owecw)
- [Advanced TodoMVC app](https://codesandbox.io/s/react-mlyn-todo-mvc-with-filters-i5e7j)
- [Currency conversion calculator](https://codesandbox.io/s/mlyn-currency-converter-t5w0o)

## Quick start

```tsx
import Mlyn, { useSubject, seal } from "react-mlyn";

const App = seal(() => {
  const firstName$ = useSubject("Barbara");
  const lastName$ = useSubject("Radzivil");
  return (
    <div>
      <div>First name:</div>
      <Mlyn.input bindValue={firstName$} />
      <div>Last name:</div>
      <Mlyn.input bindValue={lastName$} />
      <div>Full name:</div>
      <Mlyn.div>{() => `${firstName$()} ${lastName$()}`}</Mlyn.div>
    </div>
  );
});
```

## Documentation

### Components

**Show**

Can show / hide an element on a condition, without re-rendering host component:
```tsx
<Show when={() => subject() > 1}>
  {() => (
      <div>More than 1</div>
  )}
</Show>
```

**For**

Used to display a collection of elements, by providing items to render and key extractor.
```tsx
<For each={state$.todos} getKey={({ createdAt }) => createdAt}>
  {(todo$, index$) => (
    <div>
      <Mlyn.input type="checkbox" bindChecked={todo$.done} />
      <Mlyn.input bindValue={todo$.title} />
      <button onClick={() => removeItem(index$())}>x</button>
    </div>
  )}
</For>
```



### Hooks

**useSubject**:
Creates a memoized subject, by passing to it initial state:

```ts
const subject = useSubject({ x: 1 });
```

**useMlynEffect**:
Simlar to reacts `useEffect`,  however doesn't require dependencies, cause it's automatically subscribed to to mlyn bindings. Please note, that invocation of hook callback doesn't mean that component has been re-rendered.

```ts
const usePersist = (key: string, subject: Sybject<any>) => {
    useEffect(() => {
        const persisted = localStorage.getItem(key);
        if (persisted) {
            subject(JSON.parse(persisted));
        }
    }, []); // will perform once
    useMlynEffect(() => {
        localStorage.setItem(key, JSON.stringify(subject());
    });
}
```

**(Advanced) useSubjectValue**: creates react state entry binded to the subject value. This hook will cause component re-render, which might can be required in components like `For`.
```ts
const subject = useSubject(0);
const value = useSubjectValue(subject); // starts with 0
useEffect(() => {
    subject(1);
    // component will rerender
    // `value` will become 1
}, []);

```

Since `subject` has been invoked during execution of `useMlynEffect` callback, this callback will be reinvoked on every change of `subject` value.
