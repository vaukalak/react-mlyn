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

export const Show = seal(({ when, children }: ShowProps) => {
  const visible = useCompute(() => Boolean(when()));
  return visible && children();
});

interface Props<T> {
  each: Subject<T[]>;
  children(item: Subject<T>, index: Subject<number>): React.ReactElement;
}

export const For = seal(<T extends any>(props: Props<T>) => {
  const { each, children } = props;
  const updateClosure = useMemo(() => {
    let renderItems = [];
    let prevItems = [];
    return () => {
      /**
       * - iterate over the array
       * - we have map of extracted key => renderIndex
       * - when we detect change
       */
      const newItems = each();
      let suffix = [];

      let changesStart: number;
      let end;
      let changesEnd;
      const prevLen = prevItems.length;
      const newLen = newItems.length;
      if (newLen === 0) {
        renderItems = [];
      } else if (prevLen === 0) {
        renderItems = new Array(newLen);
        for (let i = 0; i < newLen; i++) {
          const subj$ = createSubject(newItems[i]);
          renderItems[i] = {
            subj$,
            Item: seal(() => children(subj$, createSubject(i))),
            key: i,
          };
        }
      } else if (prevLen !== newLen) {

        for (
          changesStart = 0, end = Math.min(prevLen, newLen);
          changesStart < end && prevItems[changesStart] === newItems[changesStart];
          changesStart++
        );
  
        // console.log(">>> changesStart:", changesStart);
        // console.log(">>> prevItems:", prevItems);
        // console.log(">>> newItems:", newItems);
        // common suffix
        for (
          end = prevLen - 1, changesEnd = newLen - 1;
          end >= changesStart && changesEnd >= changesStart && prevItems[end] === newItems[changesEnd];
          end--, changesEnd--
        ) {
          // console.log(">>> changesEnd e", changesEnd)
          // suffix[changesEnd] = renderItems[end];
          // suffix.unshift(renderItems[end]);
        }
        suffix = renderItems.slice(end + 1);
  
        // console.log(">>> changesEnd:", changesEnd);
        // console.log(">>> suffix.length:", suffix.length);

        const mid = renderItems.slice(changesStart + 1, -suffix.length);
        // console.log(">>> mid:", mid);
        for (let i = changesStart; i < newLen-suffix.length; i++) {
          let j = i - changesStart;
          // console.log(">>> j: ", j);
          if (j >= mid.length) {
            const subj$ = createSubject(newItems[i]);
            mid[j] = {
              subj$,
              Item: seal(() => children(subj$, createSubject(i))),
              key: i,
            };
          } else {
            // @ts-ignore
            if (mid[j].subj$.__curried !== newItems[j]) {
              mid[j].subj$(newItems[j]);
            }
          }
        }

        // console.log(">>> mid2:", mid);

        prevItems = newItems;
        if (changesStart > 0) {
          renderItems = renderItems.slice(0, changesStart).concat(mid, suffix);
        } else {
          renderItems = mid.concat(suffix);
        }
        
      } else {
        
        for (let i = 0; i < newLen; i++) {
          // @ts-ignore
          if (renderItems[i].subj$.__curried !== newItems[i]) {
            renderItems[i].subj$(newItems[i]);
          }
        }
      }
      return renderItems;
    };
  }, []);
  const items = useObervableValue(updateClosure);
  // console.log(">>> items:", items);
  return (
    <>
      {items.map(({ Item, key }) => <Item key={key} />)}
    </>
  );
});

// {items.map((e) => {
//   return <e.Wrapped key={e.key} />;
// })}