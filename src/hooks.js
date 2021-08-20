import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { runInReactiveScope, createSubject, destroyScope } from "mlyn";

export const useMlynEffect = (callback) => {
  useEffect(() => {
    const scope = runInReactiveScope(() => {
      callback();
    });
    return () => {
      destroyScope(scope);
    };
  }, []); // no dependencies, run on every render
};

export const useCompute = (callback) => {
  const [computed, setComputed] = useState(callback());
  useEffect(() => {
    let lastValue;
    const scope = runInReactiveScope(() => {
      const newValue = callback();
      if (lastValue !== newValue) {
        lastValue = newValue;
        setComputed(newValue);
      }
    });
    return () => destroyScope(scope);
  }, []);
  return computed;
};

export const useSelector = (selector, subject) => {
  return useMemo(() => {
    return selector(subject);
  }, [subject]);
};
export const useMlynSelector = useSelector;

export const useSubject = (initialValue) => {
  const ref = useRef(initialValue);
  const subject = useMemo(() => createSubject(ref.current), []);

  runInReactiveScope(() => {
    ref.current = subject();
  });
  return subject;
};

export const useSubjectAccessors = (subject) => {
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
  const setSubjectState = useCallback((value) => {
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

export const compareArrays = (first, second) => {
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
