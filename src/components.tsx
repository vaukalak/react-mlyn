import React, { useRef } from "react";
import { seal } from "./utils";
import {
  useCompute,
  useMlynEffect,
  useSubject,
  useSubjectValue,
} from "./hooks";
import {
  batch,
  createSubject,
  muteScope,
  runInReactiveScope,
  Subject,
} from "mlyn";

interface ShowProps {
  when: () => any;
  children: () => React.ReactElement;
}

export const Show = seal(({ when, children }: ShowProps) => {
  const visible = useCompute(() => Boolean(when()));
  return visible && children();
});

interface Props<T> {
  each: Subject<T[]>;
  children(item: Subject<T>, index: Subject<number>): React.ReactElement;
  getKey(item: T, index: number): string;
}

export const For = seal(<T extends any>(props: Props<T>) => {
  const { each, children, getKey } = props;
  const { current: cache } = useRef({});
  const itemsRef = useRef([]);
  const forceUpdate$ = useSubject(0);
  let forceUpdateValue = useSubjectValue(forceUpdate$);
  const forceUpdateRef = useRef(forceUpdateValue);
  forceUpdateRef.current = forceUpdateValue;

  let block = false;
  useMlynEffect(() => {
    const newItems = each();
    if (block) {
      block = false;
      return;
    }
    let update = false;
    const oldLength = itemsRef.current.length;
    const notInvoked = { ...cache };
    itemsRef.current = newItems.map((item, i) => {
      let key;
      key = getKey(item, i);
      delete notInvoked[key];
      const cachedItem = cache[key];
      if (cachedItem) {
        block = true;
        batch(() => {
          let oladItem;
          let oladIndex;
          muteScope(() => {
            oladItem = cachedItem.item$();
            oladIndex = cachedItem.index$();
          });
          if (cachedItem.item$() !== item) {
            cachedItem.item$(item);
          }
          if (cachedItem.index$() !== i) {
            update = true;
            cachedItem.index$(i);
          }
        });
        block = false;
        return cache[key];
      }

      const item$ = createSubject(newItems[i]);
      const index$ = createSubject(i);
      const Wrapped = seal(() => children(item$, index$));
      let disposer;
      muteScope(() => {
        let firstRun = true;
        disposer = runInReactiveScope(() => {
          const updatedValue = item$();
          if (firstRun) {
            firstRun = false;
            return;
          }
          muteScope(() => {
            block = true;
            if (
              getKey(each[index$()](), index$()) ===
              getKey(updatedValue, index$())
            ) {
              each[index$()](updatedValue);
            } else {
              // will this ever happen?
              console.warn(
                "Mlyn: unexpected behavior #1 happened, please report an issue!"
              );
              for (let i = 0; i < each().length; i++) {
                if (getKey(each[i](), i) === getKey(updatedValue, index$())) {
                  each[i](updatedValue);
                  break;
                }
              }
            }
            block = false;
          });
        });
      });
      cache[key] = {
        disposer,
        key,
        item$,
        index$,
        Wrapped,
      };
      update = true;
      return cache[key];
    });
    for (let nKey in notInvoked) {
      delete cache[nKey];
      notInvoked[nKey].disposer();
    }
    if (update || oldLength !== newItems.length) {
      forceUpdate$(forceUpdateRef.current + 1);
    }
  });
  return (
    <>
      {itemsRef.current.map((e) => {
        return <e.Wrapped key={e.key} />;
      })}
    </>
  );
});
