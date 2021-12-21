import React, { useMemo, useRef, useState } from "react";
import { seal, useObervableValue } from "./utils";
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

// useMlynEffect(() => {
//     const newItems = each();
//     if (block) {
//       block = false;
//       return;
//     }
//     let update = false;
//     const oldLength = itemsRef.current.length;
//     const notInvoked = { ...cache };
//     itemsRef.current = newItems.map((item, i) => {
//       let key;
//       key = getKey(item, i);
//       delete notInvoked[key];
//       const cachedItem = cache[key];
//       if (cachedItem) {
//         block = true;
//         batch(() => {
//           let oladItem;
//           let oladIndex;
//           muteScope(() => {
//             oladItem = cachedItem.item$();
//             oladIndex = cachedItem.index$();
//           });
//           if (cachedItem.item$() !== item) {
//             cachedItem.item$(item);
//           }
//           if (cachedItem.index$() !== i) {
//             update = true;
//             cachedItem.index$(i);
//           }
//         });
//         block = false;
//         return cache[key];
//       }

//       const item$ = createSubject(newItems[i]);
//       const index$ = createSubject(i);
//       const Wrapped = seal(() => children(item$, index$));
//       let disposer;
//       muteScope(() => {
//         let firstRun = true;
//         disposer = runInReactiveScope(() => {
//           const updatedValue = item$();
//           if (firstRun) {
//             firstRun = false;
//             return;
//           }
//           muteScope(() => {
//             block = true;
//             if (
//               getKey(each[index$()](), index$()) ===
//               getKey(updatedValue, index$())
//             ) {
//               each[index$()](updatedValue);
//             }
//             block = false;
//           });
//         });
//       });
//       cache[key] = {
//         disposer,
//         key,
//         item$,
//         index$,
//         Wrapped,
//       };
//       update = true;
//       return cache[key];
//     });
//     for (let nKey in notInvoked) {
//       delete cache[nKey];
//       notInvoked[nKey].disposer();
//     }
//     if (update || oldLength !== newItems.length) {
//       forceUpdate$(v => v + 1);
//     }
//   });

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
  const updateClosure = useMemo(() => {
    let renderItems = [];
    let changed = false;
    return () => {
      /**
       * - iterate over the array
       * - we have map of extracted key => renderIndex
       * - when we detect change
       */
      const itemsData = each();
      const newRenderItems = [...renderItems];
      for (let i = 0; i < itemsData.length; i++) {
        if (i >= newRenderItems.length) {
          const subj$ = createSubject(itemsData[i]);
          newRenderItems[i] = {
            subj$,
            Item: () => children(subj$, createSubject(i)),
            // getKey: () => getKey(itemsData[i], i),
            key: i,
          }
          changed = true;
        } else {
          // @ts-ignore
          if (newRenderItems[i].subj$.__curried !== itemsData[i]) {
            newRenderItems[i].subj$(itemsData[i]);
          }
        }
      }
      // something has been removed
      if (itemsData.length < newRenderItems.length) {
        newRenderItems.length = itemsData.length;
        changed = true;
      }

      if (changed) {
        renderItems = newRenderItems;
      }
      return renderItems;
    };
  }, []);
  const items = useObervableValue(updateClosure);
  return (
    <>
      {items.map(({ Item, key }) => <Item key={key} />)}
    </>
  );
});

// {items.map((e) => {
//   return <e.Wrapped key={e.key} />;
// })}