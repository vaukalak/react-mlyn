import React, { useState, FunctionComponent, useMemo } from "react";
import { Subject, PrimitiveSubject, muteScope } from "mlyn";
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
        const [observables, normal] = partitionObjectDeep(entries[key]);
        result[0][key] = observables;
        result[1][key] = normal;
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

export const seal = <P extends object>(Component: FunctionComponent<P>) =>
  React.memo(Component, () => true);

const getValues = (
  subjects: { [key: string]: () => any },
  deepKeys: readonly string[]
) => {
  const newValues: any = {};
  for (let key in subjects) {
    if (deepKeys.indexOf(key) === -1) {
      newValues[key] = subjects[key]();
    } else {
      newValues[key] = getValues(subjects[key] as Subject<any>, []);
    }
  }

  return newValues;
};

export const mlynify = <T extends Record<string, any>, Keys extends readonly string[]>(
  Component: React.FC<T>,
  deepKeys: Keys
) =>
  seal((props: Reactify<T, Keys>) => {
    const forceUpdate$ = useSubject(0);
    useSubjectValue(forceUpdate$);
    const partitioned = useMemo(() => partitionObjectDeep(props, deepKeys), []);
    const [plainProps, mlynProps] = partitioned;
    const [mlynState, setMlynState] = useState(getValues(mlynProps, deepKeys));
    const getChlid = () => {
      return typeof plainProps.children === "function"
        ? plainProps.children()
        : plainProps.children;
    };
    useMlynEffect(() => {
      getChlid();
      muteScope(() => {
        forceUpdate$(forceUpdate$() + 1);
      });
    });
    useMlynEffect(() => {
      setMlynState(getValues(mlynProps, deepKeys));
    });
    return (
      <Component {...mergeDeep(plainProps, mlynState, deepKeys)}>
        {getChlid()}
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
