import { Subject } from "mlyn";
export declare const useMlynEffect: (callback: (() => void) | (() => Function)) => void;
export declare const useCompute: <T>(callback: () => T) => T;
export declare const useSelector: (selector: any, subject: any) => any;
export declare const useMlynSelector: (selector: any, subject: any) => any;
export declare const useSubjectInputBinding: <T>(subject: Subject<T>) => {
    value: T;
    onChange: (e: any) => void;
};
export declare const useSubject: <T>(initialValue: T) => Subject<T>;
export declare const useSubjectValue: <T>(subject: Subject<T>) => T;
/**
 * deprecated
 */
export declare const useSubjectAccessors: <T>(subject: Subject<T>) => (T | ((value: T) => void))[];
export declare const shallowCompare: (a: any, b: any) => boolean;
export declare const compareArrays: (first: any[], second: any[]) => boolean;
