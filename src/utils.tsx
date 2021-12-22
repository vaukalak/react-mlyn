import React, {
  useState,
  FunctionComponent,
  useMemo,
  useEffect,
  useRef,
} from "react";
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

type Reactify<
  T extends Record<string, any>,
  DeepKeys extends readonly string[]
> = T & DeepProps<T, ValueOf<DeepKeys>> & RactiveProps<T, ValueOf<DeepKeys>>;

export const partitionObjectDeep = (
  entries: any,
) => {
  const plain = {};
  const mlyn = {};
  for (let key in entries) {
    const lastIndex = key.length - 1;
    if (key.indexOf("$") === lastIndex) {
      mlyn[key.substr(0, lastIndex)] = entries[key];
    } else {
      plain[key] = entries[key];
    } 
  }
  return [plain, mlyn];
}
  // Object.keys(entries).reduce(
  //   (result, key) => {
  //       const lastIndex = key.length - 1;
  //       if (key.indexOf("$") === lastIndex) {
  //         result[1][key.substr(0, lastIndex)] = entries[key];
  //       } else {
  //         result[0][key] = entries[key];
  //       }
  //     return result;
  //   },
    
  // );

  export const getMlynProps = (
    entries: any,
  ) => {
    const res = {};
    for (let key in entries) {
      const lastIndex = key.length - 1;
      if (key.indexOf("$") === lastIndex) {
        res[key.substr(0, lastIndex)] = entries[key];
      }
    }
    return res;
  }
  

const mergeDeep = (base: any, override: any, deepKeys: readonly any[]) => {
  // const deepOverride = deepKeys.reduce((acc, nextKey) => {
  //   acc[nextKey] = {
  //     ...base[nextKey],
  //     ...override[nextKey],
  //   };
  //   return acc;
  // }, {});
  return {
    ...base,
    ...override,
    // ...deepOverride,
  };
};

export const seal = <P extends object>(
  Component: (props: P) => React.ReactElement
) => React.memo(Component, () => true) as (props: P) => React.ReactElement;

const getValues = (
  subjects: { [key: string]: () => any },
) => {
  const newValues: any = {};
  for (let key in subjects) {
    // if (deepKeys.indexOf(key) === -1) {
      try {
        newValues[key] = subjects[key]();
      } catch (err) {
        throw new Error(
          `key "${key}"" is undefined or not a function (key of ${JSON.stringify(
            subjects
          )})`
        );
      }
    // } else {
    //   newValues[key] = getValues(subjects[key] as Subject<any>, []);
    // }
  }

  return newValues;
};

const unitialized = {};

const useForceUpdate = () => {
  const [, forceUpdate] = useState(0);
  return () => forceUpdate((v) => v + 1);
};

export const useObervableValue = <T extends any>(observable: () => T): T => {
  // @ts-ignore
  const ref = useRef<T>(unitialized);
  const forceUpdate = useForceUpdate();
  const destroyScope = useMemo(() => {
    return runInReactiveScope(() => {
      const newValue = observable();
      if (ref.current === unitialized) {
        ref.current = newValue;
      } else {
        if (ref.current !== newValue) {
          ref.current = newValue;
          forceUpdate();
        }
      }
    });
  }, []);
  useEffect(() => destroyScope, []);
  return ref.current;
};

export const mlynify = <
  T extends Record<string, any>,
  Keys extends readonly string[]
>(
  Component: React.FC<T>,
  deepKeys: Keys
) =>
  seal((props: Reactify<T, Keys>) => {
    // const [, forceUpdate$] = useState(0);
    // useSubjectValue(forceUpdate$);
    const partitioned = useMemo(() => {
      // const { children, ...rest } = props;
      return partitionObjectDeep(props);
    }, []);
    const [plainProps, mlynProps] = partitioned;
    const mergedProps = useObervableValue(() => {
      const mlynState = getValues(mlynProps);
      // console.log(">>> plainProps:", plainProps);
      // console.log(">>> mlynProps:", mlynProps);
      // return mergeDeep(plainProps, mlynState, deepKeys);
      return { ...plainProps, ...mlynState };
    });
    const child = useObervableValue(() => {
      return typeof props.children === "function"
        ? props.children()
        : props.children;
    });
    return (
      <Component {...mergedProps}>
        {child}
      </Component>
    );
  });

const prototypes = {};

const emptyArray = [];
export const mlynify2 = (tag: string) =>
  seal((props: any) => {
    const forceUpdate = useForceUpdate();
    const { current } = useRef({
      firstRun: true,
      state: unitialized,
      destroyStateScope: undefined,
      destroyChildScope: undefined,
      prototype: undefined,
      child: unitialized,
    });
    if (current.firstRun) {
      current.firstRun = false;
      const { pid, children, ...rest } = props;
      if (pid) {
        if (prototypes[pid]) {
          current.prototype = prototypes[pid];
          const mlynProps = getMlynProps(rest);
          current.destroyStateScope = runInReactiveScope(() => {
            const newValue = getValues(mlynProps);
            if (current.state === unitialized) {
              current.state = newValue;
            } else {
              if (current.state !== newValue) {
                current.state = newValue;
                forceUpdate();
              }
            }
          });
        } else {
          const [plainProps, mlynProps] = partitionObjectDeep(rest);
          prototypes[pid] = current.prototype = React.createElement(tag, plainProps);
          current.destroyStateScope = runInReactiveScope(() => {
            const newValue = getValues(mlynProps);
            if (current.state === unitialized) {
              current.state = newValue;
            } else {
              if (current.state !== newValue) {
                current.state = newValue;
                forceUpdate();
              }
            }
          });
        }
      } else {
        const [plainProps, mlynProps] = partitionObjectDeep(rest);
        current.prototype = React.createElement(tag, plainProps);
        current.destroyStateScope = runInReactiveScope(() => {
          const newValue = getValues(mlynProps);
          if (current.state === unitialized) {
            current.state = newValue;
          } else {
            if (current.state !== newValue) {
              current.state = newValue;
              forceUpdate();
            }
          }
        });
      }
      if (typeof children === "function") {
        current.destroyChildScope = runInReactiveScope(() => {
          const newValue = children();
          if (current.child === unitialized) {
            current.child = newValue;
          } else {
            if (current.child !== newValue) {
              current.child = newValue;
              forceUpdate();
            }
          }
        });
      } else {
        current.child = props.children;
      }
    }
    useEffect(() => {
      return () => {
        current.destroyStateScope();
        if (current.destroyChildScope) {
          current.destroyChildScope();
        }
      };
    }, emptyArray);
    // console.log(">>> current.child:", current.child);
    return React.cloneElement(
      current.prototype,
      current.state,
      current.child,
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
