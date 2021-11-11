import React, { useState, FunctionComponent, useMemo } from "react";
import { Subject } from "mlyn";
import { useMlynEffect } from "./hooks";

type ValueOf<T extends any[]> =
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

type RactiveProps<T> = {
  [K in keyof T as `${string & K}$`]: Subject<T[K]>;
};

type ReactifyFlat<T extends Record<string, any>> = T & RactiveProps<T>;

type DeepProps<T, Keys extends string[]> = {
  [K in keyof T]: K extends ValueOf<Keys> ? ReactifyFlat<T[K]> : T[K];
};

type Reactify<T extends Record<string, any>, Keys extends string[]> = DeepProps<
  T,
  Keys
> &
  RactiveProps<T>;

export const partitionObjectDeep = (entries: any, deepKeys: any[] = []) =>
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

const mergeDeep = (base: any, override: any, deepKeys: any[]) => {
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
  subjects: { [key: string]: Subject<any> },
  deepKeys: string[]
) => {
  const newValues: any = {};
  for (let key in subjects) {
    if (deepKeys.indexOf(key) === -1) {
      newValues[key] = subjects[key]();
    } else {
      newValues[key] = getValues(subjects[key], []);
    }
  }

  return newValues;
};

export const mlynify = <T extends Record<string, any>, Keys extends string[]>(
  Component: React.FC<T>,
  deepKeys: Keys
) =>
  seal((props: Reactify<T, Keys>) => {
    const partitioned = useMemo(() => partitionObjectDeep(props, deepKeys), []);
    const [plainProps, mlynProps] = partitioned;
    const [mlynState, setMlynState] = useState(getValues(mlynProps, deepKeys));
    useMlynEffect(() => {
      setMlynState(getValues(mlynProps, deepKeys));
    });
    return (
      <Component {...mergeDeep(plainProps, mlynState, deepKeys)}>
        {mlynState.children || plainProps.children}
      </Component>
    );
  });
