import { useState, useEffect, useMemo } from "react";
import {
  runInReactiveScope,
  Subject,
  projectArray,
  projectSubject,
  createSubject,
} from "mlyn";

export const useSubject = <T>(initialValue: T): Subject<T> => {
  return useMemo(() => createSubject<T>(initialValue), []) as Subject<T>;
};

export const useMlynEffect = (callback: (() => void) | (() => Function)) => {
  useEffect(
    () => runInReactiveScope(callback),
    []
  ); // no dependencies, run only once
};

/**
 * returns one way bindable function
 * @param cb
 * @returns
 */
export const useMemoize = <T extends any>(cb: () => T) => {
  const subject$ = useSubject<T>(cb());
  useMlynEffect(() => {
    const newValue = cb();
    subject$(newValue);
  });
  return () => subject$();
};

/**
 * returns a 2-way bindable subject
 * @param cb
 * @returns
 */
export const useProjectSubject = <T extends any>(
  projection: () => Subject<T>
) => {
  const [result, scope] = useMemo(() => projectSubject<T>(projection), []);
  useEffect(() => scope, []);
  return result;
};

/**
 * returns an array projection, every entry is 2-way bindable
 * @param cb
 * @returns
 */
export const useProjectArray = <T extends any, R extends any = T>(
  array$: Subject<T[]>,
  projection: (array: Subject<T[]>) => R[],
  getKey: (item: T | R) => string,
  // bindBack?: (item: R, keyToIndex: Record<string, number>) => void,
) => {
  const [result, scopeDestroyer] = useMemo(
    () => projectArray(array$, projection, getKey),
    []
  );
  useEffect(() => scopeDestroyer, []);
  return result as Subject<T[]>;
};

/**
 * causes component re-rendering on computed value change
 * @param callback
 * @returns
 */
export const useCompute = <T>(callback: () => T): T => {
  const [computed, setComputed] = useState(callback());
  useMlynEffect(() => {
    setComputed(callback());
  });
  return computed;
};

/**
 * causes component re-rendering on subject value change
 * @param callback
 * @returns
 */
export const useSubjectValue = <T>(subject: Subject<T>): T => {
  return useCompute(() => subject());
};

/**
 * causes component re-rendering on subject value change
 * @param callback
 * @returns
 */
export const useSubjectInputBinding = <T>(subject: Subject<T>) => {
  const value = useSubjectValue(subject);
  return { value, onChange: (e) => subject(e.target.value) };
};
