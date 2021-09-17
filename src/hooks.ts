import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { runInReactiveScope, createSubject, destroyScope, Scope, Subject } from "mlyn";

export const useMlynEffect = (callback: (() => void) | (() => Function)) => {
  useEffect(() => {
    const scope = runInReactiveScope(() => {
      return callback();
    });
    return () => {
      destroyScope(scope);
    };
  }, []); // no dependencies, run on every render
};

export const useCompute = <T>(callback: () => T): T => {
  const [computed, setComputed] = useState(callback());
  useMlynEffect(() => {
    setComputed(callback());
  });
  return computed;
};

export const useSelector = (selector, subject) => {
  return useMemo(() => {
    return selector(subject);
  }, [subject]);
};
export const useMlynSelector = useSelector;

export const useSubjectInputBinding = <T>(subject: Subject<T>) => {
  const value = useSubjectValue(subject);
  return { value, onChange: (e) => subject(e.target.value) };
};

export const useSubject = <T>(initialValue: T): Subject<T> => {
  const ref = useRef<T>(initialValue);
  const subject = useMemo(() => createSubject<T>(ref.current), []) as Subject<T>;

  runInReactiveScope(() => {
    ref.current = subject();
  });
  return subject;
};

export const useSubjectValue = <T>(subject: Subject<T>): T => {
  return useCompute(() => subject());
};

/**
 * deprecated
 */
export const useSubjectAccessors = <T>(subject: Subject<T>) => {
  const [state, setState] = useState(() => subject());
  useEffect(() => {
    const scope = runInReactiveScope(() => {
      const newValue = subject();
      setState(newValue);
    });
    return () => {
      destroyScope(scope);
    };
  }, [subject]);
  const setSubjectState = useCallback((value: T) => {
    subject(value);
  }, []);
  return [state, setSubjectState];
};

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
