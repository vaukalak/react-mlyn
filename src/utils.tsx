import React, { useState, FunctionComponent, useMemo, useEffect, useRef } from "react";
import { Subject, PrimitiveSubject, muteScope, runInReactiveScope } from "mlyn";
import { useMlynEffect } from "./hooks";
import { useSubject, useSubjectValue } from ".";

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

type RactiveProps<T, DeepKeys extends string> = {
  [K in keyof Omit<T, "children" | DeepKeys> as `${string & K}$`]: () => T[K];
};

type RactiveSubProps<T> = {
  [K in keyof T]: () => T[K];
};

type DeepProps<T, DeepKeys extends keyof T> = {
  [K in keyof Pick<T, DeepKeys> as `${string & K}$`]: RactiveSubProps<T[K]>;
};

type Reactify<T extends Record<string, any>, DeepKeys extends readonly string[]> = T &
  DeepProps<T, ValueOf<DeepKeys>> &
  RactiveProps<T, ValueOf<DeepKeys>>;

export const partitionObjectDeep = (entries: any, deepKeys: readonly any[] = []) =>
  Object.keys(entries).reduce(
    (result, key) => {
      if (deepKeys.indexOf(key) !== -1) {
        const [normal, observables] = partitionObjectDeep(entries[key]);
        result[0][key] = normal;
        result[1][key] = observables;
      } else {
        const lastIndex = key.length - 1;
        if (key.indexOf("$") === lastIndex) {
          result[1][key.substr(0, lastIndex)] = entries[key];
        } else {
          result[0][key] = entries[key];
        }
      }
      return result;
    },
    [{} as any, {} as any]
  );

const mergeDeep = (base: any, override: any, deepKeys: readonly any[]) => {
  const deepOverride = deepKeys.reduce((acc, nextKey) => {
    acc[nextKey] = {
      ...base[nextKey],
      ...override[nextKey],
    };
    return acc;
  }, {});
  return {
    ...base,
    ...override,
    ...deepOverride,
  };
};

export const seal = <P extends object>(Component: (props: P) => React.ReactElement) =>
  React.memo(Component, () => true) as (props: P) => React.ReactElement;

const getValues = (
  subjects: { [key: string]: () => any },
  deepKeys: readonly string[]
) => {
  const newValues: any = {};
  for (let key in subjects) {
    if (deepKeys.indexOf(key) === -1) {
      try {
        newValues[key] = subjects[key]();
      } catch (err) {
        throw new Error(`key "${key}"" is undefined or not a function (key of ${JSON.stringify(subjects)})`);
      }
    } else {
      newValues[key] = getValues(subjects[key] as Subject<any>, []);
    }
  }

  return newValues;
};

const unitialized = {};

const useForceUpdate = () => {
  const [, forceUpdate] = useState(0);
  return () => forceUpdate(v => v + 1);
}

const useObervableValue = <T extends any>(observable: () => T): T => {
  // @ts-ignore
  const ref = useRef<T>(unitialized);
  const forceUpdate = useForceUpdate();
  const destroyScope = useMemo(() => runInReactiveScope(() => {
    if (ref.current === unitialized) {
      ref.current = observable();
    } else {
      ref.current = observable();
      forceUpdate();
    }
  }), []);
  useEffect(() => {
    destroyScope();
  })
  return ref.current;
}

export const mlynify = <T extends Record<string, any>, Keys extends readonly string[]>(
  Component: React.FC<T>,
  deepKeys: Keys
) =>
  seal((props: Reactify<T, Keys>) => {
    // const [, forceUpdate$] = useState(0);
    // useSubjectValue(forceUpdate$);
    const partitioned = useMemo(() => partitionObjectDeep(props, deepKeys), []);
    const [plainProps, mlynProps] = partitioned;
    const mlynState = getValues(mlynProps, deepKeys);
    const child = useObervableValue(() => {
      return typeof plainProps.children === "function"
      ? plainProps.children()
      : plainProps.children;
    });
    return (
      <Component {...mergeDeep(plainProps, mlynState, deepKeys)}>
        {child}
      </Component>
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
