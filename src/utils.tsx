import React, { memo, useEffect, useRef } from "react";
import { runInReactiveScope } from "mlyn";
import { useForceUpdate } from "./hooks";

type ValueOf<T extends readonly any[]> =
  | (T[0] extends undefined ? never : T[0])
  | (T[1] extends undefined ? never : T[1])
  | (T[2] extends undefined ? never : T[2])
  | (T[3] extends undefined ? never : T[3])
  | (T[4] extends undefined ? never : T[4])
  | (T[5] extends undefined ? never : T[5])
  | (T[6] extends undefined ? never : T[6])
  | (T[7] extends undefined ? never : T[7])
  | (T[8] extends undefined ? never : T[8])
  | (T[9] extends undefined ? never : T[9])
  | (T[10] extends undefined ? never : T[10]);

type Reactify2<T> = T & {
  [K in keyof Omit<T, "children"> as `${string & K}$`]: () => T[K];
};

type RactiveProps<T, DeepKeys extends string> = {
  [K in keyof Omit<T, "children" | DeepKeys> as `${string & K}$`]: () => T[K];
};

type RactiveSubProps<T> = {
  [K in keyof T]: () => T[K];
};

type DeepProps<T, DeepKeys extends keyof T> = {
  [K in keyof Pick<T, DeepKeys> as `${string & K}$`]: RactiveSubProps<T[K]>;
};

type Reactify<
  T extends Record<string, any>,
  DeepKeys extends readonly string[]
> = T & DeepProps<T, ValueOf<DeepKeys>> & RactiveProps<T, ValueOf<DeepKeys>>;

export const partitionObject = (entries: any) =>
  Object.keys(entries).reduce(
    (result, key) => {
      const lastIndex = key.length - 1;
      if (key.charAt(lastIndex) === "$") {
        result[1][key.substring(0, lastIndex)] = entries[key];
      } else {
        result[0][key] = entries[key];
      }
      return result;
    },
    [{} as any, {} as any]
  );

export const getMlynProps = (entries: any) =>
  Object.keys(entries).reduce((result, key) => {
    const lastIndex = key.length - 1;
    if (key.charAt(lastIndex) === "$") {
      result[key.substr(0, lastIndex)] = entries[key];
    }
    return result;
  }, {});

export const seal = <P extends object>(
  Component: (props: P) => React.ReactElement
) => React.memo(Component, () => true) as (props: P) => React.ReactElement;

const unitialized = {};

const emptyArray = [];

const isNotEmpty = (o) => {
  for (let i in o) return true;
  return false;
};

export const mlynify = <T extends React.PropsWithChildren<object>>(
  tag: string
) =>
  memo((props: Reactify2<T>) => {
    const forceUpdate = useForceUpdate();
    const { current } = useRef({
      firstRun: true,
      state: unitialized,
      scope: undefined,
      childScope: undefined,
      child: unitialized,
    });
    const { children, ...rest } = props;
    const [plainProps, mlynProps] = partitionObject(rest);
    if (current.firstRun) {
      current.firstRun = false;
      current.scope = runInReactiveScope(() => {
        const newValues: any = {};
        let changed = false;
        Object.keys(mlynProps).forEach((key) => {
          const newValue = mlynProps[key]();
          if (newValues[key] !== newValue) {
            changed = true;
          }
          newValues[key] = newValue;
        })
      
        if (current.state === unitialized) {
          current.state = newValues;
        } else {
          if (changed) {
            current.state = newValues;
            forceUpdate();
          }
        }
      });
      current.childScope = runInReactiveScope(() => {
        if (typeof children === "function") {
          // @ts-ignore
          const newValue = children();
          if (current.child === unitialized) {
            current.child = newValue;
          } else {
            if (current.child !== newValue) {
              current.child = newValue;
              forceUpdate();
            }
          }
        } else {
          current.child = props.children;
        }
      });
    }
    useEffect(
      () => () => {
        if (current.scope) {
          current.scope.destroy();
        }
        if (current.childScope) {
          current.childScope.destroy();
        }
      },
      emptyArray
    );
    return React.createElement(
      tag,
      Object.assign({}, plainProps, current.state),
      current.child
    );
  });

export const shallowCompare = (a, b) => {
  if (a === undefined || b === undefined) {
    return a === b;
  }
  for (let key in a) {
    if (a[key] !== b[key]) {
      return false;
    }
  }
  return true;
};

export const compareArrays = (first: any[], second: any[]) => {
  if (!first || !second) {
    return false;
  }
  if (first.length !== second.length) {
    return false;
  }
  for (let i = 0; i < first.length; i++) {
    if (first[i] !== second[i]) {
      return false;
    }
  }
  return true;
};
