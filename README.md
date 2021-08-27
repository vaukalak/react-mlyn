# react-mlyn
React bindings to [mlyn](https://github.com/vaukalak/mlyn)

## Goals of this library:
- Reduce re-renderings count thanks to mlyn state dispatching updates only for parts of state that actually changed.
- Allow 2 way binding, without violating Unidirectional Data Flow.
- Reduce the amount of properties passed to components, and make components reuse easier.

## Installation

Install both `react-mlyn` and `mlyn`.
```
yarn add react-mlyn mlyn
```
or
```
npm i -S react-mlyn mlyn
```

## Develop

### hooks

**useSubject**:
Creates a memoized subject, by passing to it initial state:

```
const subject = useSubject({ x: 1 });
```


**useSubjectValue**: creates react state entry binded to the subject value:
```
const subject = useSubject(0);
const value = useSubjectValue(subject); // starts with 0
useEffect(() => {
    subject(1);
    // component will rerender
    // `value` will become 1
}, []);

```

**useMlynEffect**:
Simlar to reacts `useEffect`, however doesn't require dependencies, cause it's automatically subscribed to to mlyn bindings:

```
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

Since `subject` has been invoked during execution of `useMlynEffect` callback, this callback will be reinvoked on every change of `subject` value.

### components

**Show**

Can show / hide an element on a condition, without re-rendering host component:
```
<Show when={() => subject() > 1}>
  {() => (
      <div>More than 1</div>
  )}
</Show>
```