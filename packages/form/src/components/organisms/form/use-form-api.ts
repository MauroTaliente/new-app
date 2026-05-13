import {
  useState,
  useRef,
  useCallback,
  RefObject,
  useMemo,
  useEffect,
  FormEvent,
  FormEventHandler,
  ForwardedRef,
  FormHTMLAttributes,
  ReactNode,
  JSX,
  ChangeEvent,
  FocusEvent,
} from 'react';
import type { Primitive } from 'ts-essentials';
import { useTimer } from '@maurotaliente/react-hooks';
import { HttpCode } from '@maurotaliente/react-networking';
import {
  isArray,
  isNestedEmptyObject,
  isObject,
  isDeepEqual,
  isNullOrEmpty,
  isFunction,
  getValueFromPath,
  setValueByPath,
  getFallback,
  isEmptyArray,
  mergeDeepRight,
} from '@maurotaliente/react-helpers';

export type HtmlOmittedProps =
  | 'onChange'
  | 'onFocus'
  | 'onBlur'
  | 'label'
  | 'focus'
  | 'name'
  | 'value'
  | 'defaultValue'
  | 'prefix'
  | 'size'
  | 'sufix';

export type ValidatorsRules<T extends Values = any, K extends keyof T = keyof T> = {
  [key in keyof T]?: ValidatorsRules<T, K> | ((value: T[key], data: T) => any);
};

export type LastChange = { name: string; value?: any; method?: string };
export type formAction = FormEventHandler<HTMLFormElement>;
export type Inners = Primitive | Inners[] | { [key: string]: Inners };
export type Values = { [key: string]: Inners } | {};
export type Errors = string | Errors[] | { [key: string]: Errors };
export type Toucheds = boolean | Toucheds[] | { [key: string]: Toucheds };
export type Focuses = boolean | Focuses[] | { [key: string]: Focuses };
export type SoftObj = { [key: string]: any } | Primitive | undefined | null;
export type PlainObj = Record<string, any>;
export type Submit = (event: FormEvent | KeyboardEvent | EventTarget, author?: string) => void;
export type ApiFunc<T extends Values = Values> = (form: FormApi<T>) => void;
export type InputName<K> = K extends string ? K | (string & {}) : never;
const NOOP_API_FUNC = <T extends Values = Values>(_form: FormApi<T>) => { };

export interface FormConfig<T extends Values = any> {
  space: string;
  onSubmit?: ApiFunc<T>;
  onReject?: ApiFunc<T>;
  onReset?: ApiFunc<T>;
  onReady?: ApiFunc<T>;
  onChange?: ApiFunc<T>;
  onLazyChange?: ApiFunc<T>;
  lazyDelayMs?: number;
  lazyTickMs?: number;
  emptyValues?: T;
  initialValues?: T;
  initialErrors?: Errors;
  initialToucheds?: Toucheds;
  validatorsRules?: ValidatorsRules<T>;
  validateOnMount?: boolean;
  isEnterSubmit?: boolean;
  syncInitialValues?: boolean;
  activeValuesOnly?: boolean;
  htmlValidationsOn?: boolean;
  reportValidityOn?: boolean;
  undoLimit?: number;
  status?: HttpCode;
  loading?: boolean;
}
interface InitApi<T extends Values = any> {
  attempts: number;
  values: T;
  emptyValues: T;
  initialValues: T;
  toucheds: Toucheds;
  focuses: Focuses;
  errors: Errors;
  isValid: boolean;
  loading: boolean;
  hasChange: boolean;
  lastChange: LastChange;
}

interface NativeHandlers {
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
  onFocus?: (event: FocusEvent<HTMLInputElement>) => void;
}

interface CustomHandlers<T extends Values = any, K extends keyof T = keyof T> {
  onChange?: (value: T[K], key?: InputName<K>) => void;
  onBlur?: (key?: InputName<K>) => void;
  onFocus?: (key?: InputName<K>) => void;
}

export interface FormInputApi<T extends Values = any, K extends keyof T = keyof T> {
  space?: string;
  id?: string;
  name: InputName<K>;
  value?: T[K];
  error?: string;
  touched?: boolean;
  focus?: boolean;
  showError?: boolean;
  values?: T;
  errors?: Errors;
  toucheds?: Toucheds;
  focuses?: Focuses;
  loading?: boolean;
  status?: HttpCode;
}

export interface FromInputCustomApi<T extends Values = any, K extends keyof T = keyof T>
  extends FormInputApi<T, K>,
  CustomHandlers<T, K> { }
export interface FromInputNativeApi<T extends Values = any, K extends keyof T = keyof T>
  extends NativeHandlers {
  name: InputName<K>;
  value?: T[K];
}

export interface FormInputStateApi<T extends Values = any, K extends keyof T = keyof T> {
  value?: T[K];
  error?: string;
  touched?: boolean;
  focus?: boolean;
}

export interface FormApi<T extends Values = any, K extends keyof T = keyof T> extends InitApi<T> {
  setValue: (key: InputName<K>, value: any, method?: string) => void;
  setNativeValue: (event: ChangeEvent<HTMLElement>) => void;
  setBlur: (key: InputName<K>, value: boolean) => void;
  setNativeBlur: (event: FocusEvent<HTMLElement>) => void;
  setFocus: (key: InputName<K>, value: boolean) => void;
  setNativeFocus: (event: FocusEvent<HTMLElement>) => void;
  setTouch: (key: InputName<K>, value: boolean) => void;
  setAllTouched: (value: boolean) => void;
  validate: () => void;
  submit: Submit;
  nativeSubmit: formAction;
  reset: () => void;
  formReset: formAction;
  undo: () => void;
  redo: () => void;
  registerField: (key: InputName<K>, initialValue: Values) => void;
  connect: <K extends Extract<keyof T, string>>(key: InputName<K>) => FromInputCustomApi<T, K>;
  connectNative: <K extends Extract<keyof T, string>>(
    key: InputName<K>,
  ) => FromInputNativeApi<T, K>;
  getInputState: <K extends Extract<keyof T, string>>(
    name: InputName<K>,
  ) => FormInputStateApi<T, K>;
  getInputHandlers: <K extends Extract<keyof T, string>>(
    name: InputName<K>,
  ) => CustomHandlers<T, K>;
}

export interface HTMLFormElementExtended<T extends Values = any> extends HTMLFormElement {
  api: FormApi<T>;
}

export interface FormProps<T extends Values = any>
  extends Omit<FormHTMLAttributes<HTMLFormElement>, 'children'> {
  config: FormConfig<T>;
  children?: ReactNode | ((api: FormApi<T>) => ReactNode);
}

export type ForwardForm = <T extends Values = any>(
  props: FormProps<T>,
  ref?: ForwardedRef<HTMLFormElementExtended<T>>,
) => JSX.Element;

const getValid = (
  errors: Errors,
  ref: RefObject<HTMLFormElementExtended | null>,
  htmlValidationsOn = false,
) => {
  const formEl = ref?.current;
  const curValid = isNestedEmptyObject(errors);
  if (htmlValidationsOn) {
    const natValid = formEl?.checkValidity();
    return natValid && curValid;
  }
  return curValid;
};

export const getUID = (space?: string, name?: string) => {
  let id = 'unknown';
  if (space) id = `${space}-`;
  if (name) id += name;
  return id;
}

const getActives = (base: SoftObj, payload: SoftObj, fixed?: any, mode?: 'default' | 'over'): any => {
  const runner = (base: any, payload: any): any => {

    if (isArray(payload)) {
      return payload.map((value, i) => runner(base?.[i], value));
    }

    if (isArray(base)) {
      return base.map((value, i) => runner(value, payload?.[i]));
    }

    if (isObject(base) || isObject(payload)) {
      const out: PlainObj = {};
      const bObj = isObject(base) ? base : {};
      const pObj = isObject(payload) ? payload : {};
      for (const k of Object.keys(bObj)) {
        out[k] = runner(bObj?.[k], pObj?.[k]);
      }
      for (const k of Object.keys(pObj)) {
        out[k] = runner(bObj?.[k], pObj?.[k]);
      }
      return out;
    }
    if (mode === 'over') return getFallback(fixed, payload, base);
    return getFallback(payload, base, fixed);
  };
  return runner(base, payload);
};

const getDiff = (values: SoftObj, initialValues: SoftObj): any => {
  const runner = (values: any, initialValues: any): any => {
    if (isArray(values)) {
      return values.map((value, i) => runner(value, initialValues[i]));
    }

    if (isObject(values)) {
      const entries = Object.entries(values);
      return entries.reduce((acc, [key, value]) => {
        const equal = isDeepEqual(value, initialValues[key]);
        if (equal) return acc;
        return { ...acc, [key]: value };
      }, {} as any);
    }

    return isDeepEqual(values, initialValues);
  };
  return runner(values, initialValues);
};

const getCalcErrors = (validatorsRules: SoftObj, values: SoftObj): Errors => {
  const joinSeg = (base: string, seg: string) => (base ? `${base}/${seg}` : seg);
  const joinIdx = (base: string, i: number) => (base ? `${base}/[${i}]` : `[${i}]`);

  const runner = (rule: any, values: any, path = ''): any => {
    if (isArray(rule)) {
      return rule.map((subRule, i) => {
        return runner(subRule, values, joinIdx(path, i))
      });
    }

    if (isObject(rule)) {
      const entries = Object.entries(rule);
      return entries.reduce((acc, [key, subRule]) => {
        acc[key] = runner(subRule, values, joinSeg(path, key));
        return acc;
      }, {} as any);
    }

    if (isFunction(rule)) {
      const value = getValueFromPath(path, values);
      const error = rule(value, values);
      return error || undefined;
    }

    return rule;
  };

  return runner(validatorsRules, values);
};

const getNativeErrors = (ref: RefObject<HTMLFormElementExtended>): Errors => {
  const result: Errors = {};
  const elements = ref?.current?.elements;

  if (!elements) return result;
  for (const el of Array.from(elements) as HTMLInputElement[]) {
    const name = el.name;
    if (!name) continue;
    if (!el.validity.valid) {
      if (result[name]) {
        // multiple inputs with same name (e.g. radios)
        if (Array.isArray(result[name])) result[name].push(el.validationMessage);
        else result[name] = [result[name], el.validationMessage];
      } else {
        result[name] = el.validationMessage;
      }
    }
  }

  return result;
};

const getErrors = (
  ref: RefObject<HTMLFormElementExtended>,
  validatorsRules: SoftObj,
  values: SoftObj,
  htmlValidationsOn = false,
) => {
  const calcErrors = getCalcErrors(validatorsRules, values);

  // Keep native HTML validations opt-in to avoid mixing browser constraints
  // when the form is configured for custom-only validations.
  if (!htmlValidationsOn) return calcErrors || {};

  const nativeErrors = getNativeErrors(ref);

  if (
    (isObject(nativeErrors) && isObject(calcErrors)) ||
    (isArray(nativeErrors) && isArray(calcErrors))
  ) {
    const composedErrors = mergeDeepRight(nativeErrors, calcErrors);
    return composedErrors as Errors;
  }

  if (!isNullOrEmpty(nativeErrors) && isNullOrEmpty(calcErrors)) return nativeErrors;
  return calcErrors || {};
};

const setAllValues = (values: any, state: any): any => {
  const runner = (values: any, state: any): any => {
    if (isArray(values)) {
      return values.map((value, i) => runner(value, state));
    }

    if (isObject(values)) {
      const entries = Object.entries(values);
      return entries.reduce((acc, [key, value]) => {
        const child = runner(value, state);
        return { ...acc, [key]: child };
      }, {} as any);
    }

    return state;
  };

  return runner(values, state);
};

const getPathStateBase = (state: unknown) => {
  if (isArray(state)) return [...state];
  if (isObject(state)) return { ...state };
  return {};
};

export function useFormApi<T extends Values = any, K extends keyof T = keyof T>(
  {
    space = '',
    emptyValues,
    initialValues,
    initialToucheds,
    initialErrors,
    validatorsRules,
    onSubmit = NOOP_API_FUNC,
    onReject = NOOP_API_FUNC,
    onReset = NOOP_API_FUNC,
    onReady = NOOP_API_FUNC,
    onChange = NOOP_API_FUNC,
    onLazyChange,
    lazyDelayMs = 500,
    lazyTickMs = 100,
    undoLimit = 0,
    status = HttpCode.BEGGINNING,
    loading = false,
    syncInitialValues,
    activeValuesOnly,
    validateOnMount,
    isEnterSubmit,
    htmlValidationsOn,
    reportValidityOn,
  }: FormConfig<T>,
  receivedRef?: ForwardedRef<HTMLFormElementExtended<T> | null>,
): [RefObject<HTMLFormElementExtended<T>>, FormApi<T>] {
  // refs
  const innerRef = useRef<HTMLFormElementExtended<T> | null>(null);
  const ref = (receivedRef || innerRef) as RefObject<HTMLFormElementExtended<T>>;
  // states
  const [attempts, setAttempts] = useState(0);
  const [values, setValues] = useState<T>({} as T);
  const [toucheds, setToucheds] = useState<Toucheds>({});
  const [focuses, setFocuses] = useState<Focuses>({});
  const valuesRef = useRef<T>({} as T);
  const lastValuesRef = useRef<T | undefined>(undefined);
  const onChangeRef = useRef(onChange);
  // memo
  const memo = useMemo(
    () => ({
      init: false,
      startSync: false,
      startLazy: false,
      lastChange: { name: '', value: undefined, method: '' } as LastChange,
      register: {} as Record<string, boolean>,
      pendingRegister: {} as Record<string, any>,
      metadata: { author: '' },
      showErrors: validateOnMount,
      history: [] as T[],
      future: [] as T[],
    }),
    [],
  );

  // lazy values changes and trigger hook
  const lazyTimer = useTimer({
    limit: lazyDelayMs,
    interval: lazyTickMs,
    auto: false,
    isReactive: false,
    disabled: !onLazyChange,
    onExpired: () => {
      const activeApi = ref.current?.api;
      if (activeApi) onLazyChange?.(activeApi);
    },
  }, []);

  // real time
  const liveErrors = useMemo(
    () => getErrors(ref, validatorsRules, values, htmlValidationsOn),
    [ref, validatorsRules, values, htmlValidationsOn],
  );

  const errors = useMemo(
    () => (memo.showErrors ? liveErrors : initialErrors || {}),
    [memo.showErrors, liveErrors, initialErrors],
  );
  const isValid = useMemo(
    () => getValid(liveErrors, ref, htmlValidationsOn),
    [liveErrors, ref, htmlValidationsOn],
  );
  const changes = useMemo(() => getDiff(initialValues, values), [initialValues, values]);
  const hasChange = useMemo(() => !isNullOrEmpty(changes), [changes]);

  useEffect(() => {
    valuesRef.current = values;
    return () => { };
  }, [values]);

  useEffect(() => {
    onChangeRef.current = onChange;
    return () => { };
  }, [onChange]);

  // helpers
  const syncValues = useCallback((values: T) => {
    if (syncInitialValues || !memo.startSync) {
      setValues((pre) => {
        const nextValues = activeValuesOnly ? getActives(pre, values) : values;
        if (isDeepEqual(pre, nextValues)) return pre;
        return nextValues;
      });
    }
  }, [syncInitialValues, activeValuesOnly]);

  // Register queued fields after commit to avoid setState during render.
  useEffect(() => {
    const entries = Object.entries(memo.pendingRegister);
    if (!entries.length) return () => { };

    memo.pendingRegister = {};
    entries.forEach(([key, value]) => {
      if (memo.register[key]) return;
      memo.register[key] = true;
      setValues((prev) => setValueByPath(key, value, { ...prev }));
      setToucheds((prev) => setValueByPath(key, false, getPathStateBase(prev)));
      setFocuses((prev) => setValueByPath(key, false, getPathStateBase(prev)));
    });

    return () => { };
  });

  // listen values changes and set history
  useEffect(() => {
    const hasValuesChanged = !isDeepEqual(lastValuesRef.current, values);
    lastValuesRef.current = values;
    if (!hasValuesChanged) return () => { };

    const last = memo.history[0] || {};
    const hasBack = !isDeepEqual(values, last);
    if (hasBack) {
      const newHistory = [values, ...memo.history].slice(0, undoLimit);
      memo.history = newHistory;
    }

    // If the user edits after undo, redo history is no longer valid.
    const isBranchingEdit =
      hasBack &&
      memo.lastChange.method !== 'undo' &&
      memo.lastChange.method !== 'redo' &&
      memo.lastChange.method !== 'register';
    if (isBranchingEdit && !isEmptyArray(memo.future)) {
      memo.future = [];
    }

    const shouldScheduleLazy =
      memo.startSync &&
      !!memo.lastChange.name &&
      memo.lastChange.method !== 'register';

    if (shouldScheduleLazy) {
      if (!memo.startLazy) memo.startLazy = true;
      lazyTimer.resetTimer();
    }
    const activeApi = ref.current?.api;
    if (activeApi) onChangeRef.current(activeApi);
    return () => { };
  }, [values, ref]);

  // listen initValues changes
  useEffect(() => {
    if (syncInitialValues) syncValues(initialValues as T);
    if (!memo.startSync) memo.startSync = true;
    return () => { };
  }, [initialValues, syncInitialValues]);

  // listen reqStatus changes
  useEffect(() => {
    if (status === HttpCode.BEGGINNING) {
      setToucheds((pre) => getActives(pre, initialToucheds, false, 'over'));
    }
    if (
      status === HttpCode.OK ||
      status === HttpCode.CREATED ||
      status === HttpCode.NO_CONTENT
    ) {
      setToucheds((pre) => getActives(pre, initialToucheds, false, 'over'));
      syncValues((emptyValues || initialValues) as T);
    }
    return () => { };
  }, [status]);

  const undo = useCallback(() => {
    const { history, future } = memo;
    if (history.length <= 1) return;

    const [current, ...rest] = history;
    const next = rest[0];

    if (next) {
      memo.future = [current, ...future];
      memo.history = rest;
      setValues(next);
      memo.lastChange.method = 'undo';
    }
  }, [setValues]);

  const redo = useCallback(() => {
    const { history, future } = memo;
    if (future.length === 0) return;

    const [next, ...rest] = future;

    if (next) {
      memo.history = [next, ...history];
      memo.future = rest;
      setValues(next);
      memo.lastChange.method = 'redo';
    }
  }, [setValues]);

  const validate = useCallback(() => {
    memo.showErrors = true;
    if (htmlValidationsOn && reportValidityOn) ref?.current?.reportValidity();
  }, [ref, htmlValidationsOn, reportValidityOn]);

  const setValue = useCallback(
    (name: string, value: any, method: string = '') => {
      setValues((prev) => {
        const isNewValue = !isDeepEqual(getValueFromPath(name, prev), value);
        if (!isNewValue) return prev;
        memo.lastChange = { name, value, method };
        return setValueByPath(name, value, { ...prev });
      });
    },
    [setValues],
  );

  const setNativeValue = useCallback(
    (event: ChangeEvent<HTMLElement>) => {
      if (!('target' in event)) return;

      const target = event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
      const { name, type } = target;

      if (!name) return;

      let value: any;

      switch (type) {
        case 'file':
          value = (target as HTMLInputElement).multiple
            ? (target as HTMLInputElement).files
            : (target as HTMLInputElement).files?.[0];
          break;
        case 'checkbox':
          value = (target as HTMLInputElement).checked;
          break;
        case 'radio':
          if ((target as HTMLInputElement).checked) {
            value = target.value;
          } else {
            return;
          }
          break;
        case 'select-multiple':
          value = Array.from((target as HTMLSelectElement).selectedOptions).map((opt) => opt.value);
          break;
        default:
          value = target.value;
      }

      setValues((prev) => {
        const isNewValue = !isDeepEqual(getValueFromPath(name, prev), value);
        if (!isNewValue) return prev;
        memo.lastChange = { name, value, method: 'native' };
        return setValueByPath(name, value, { ...prev });
      });
    },
    [setValues],
  );

  const setFocus = useCallback(
    (key: string, value: boolean) => {
      setFocuses((prev) => setValueByPath(key, value, getPathStateBase(prev)));
    },
    [setFocuses],
  );

  const setNativeFocus = useCallback(
    (event: FocusEvent<HTMLElement>) => {
      if (!('target' in event)) return;

      const target = event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
      const { name } = target;

      if (!name) return;
      setFocuses((prev) => setValueByPath(name, true, getPathStateBase(prev)));
    },
    [setFocuses],
  );

  const setBlur = useCallback(
    (key: string, value: boolean) => {
      validate();
      setToucheds((prev) => setValueByPath(key, true, getPathStateBase(prev)));
      setFocuses((prev) => setValueByPath(key, value, getPathStateBase(prev)));
    },
    [validate, setFocuses, setToucheds],
  );

  const setNativeBlur = useCallback(
    (event: FocusEvent<HTMLElement>) => {
      if (!('target' in event)) return;

      const target = event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
      const { name } = target;

      if (!name) return;
      memo.showErrors = true;
      setToucheds((prev) => setValueByPath(name, true, getPathStateBase(prev)));
      setFocuses((prev) => setValueByPath(name, false, getPathStateBase(prev)));
    },
    [setToucheds, setFocuses],
  );

  const setTouch = useCallback(
    (key: string, value: boolean) => {
      setToucheds((prev) => setValueByPath(key, value, getPathStateBase(prev)));
    },
    [setToucheds],
  );

  const setAllTouched = useCallback(
    (value: boolean) => {
      setToucheds(setAllValues(valuesRef.current, value));
    },
    [setToucheds],
  );

  const submit = useCallback(
    (event: FormEvent | KeyboardEvent | EventTarget, author: string = '') => {
      memo.metadata.author = author;
      validate();
      setAllTouched(true);
      setAttempts((pre) => pre + 1);
    },
    [validate, setAllTouched, setAttempts],
  );

  const nativeSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      submit(event, 'form');
    },
    [submit],
  );

  const reset = useCallback(() => {
    const nextValues = getActives(valuesRef.current, initialValues, undefined) as T;
    setValues(nextValues);
    setToucheds(getActives(nextValues, initialToucheds, false));
    setFocuses(setAllValues(nextValues, false));
    setAttempts(0);
    memo.lastChange = { name: '', value: undefined, method: 'reset' };
    memo.showErrors = false;
    const activeApi = ref.current?.api;
    if (activeApi) onReset(activeApi);
  }, [setValues, setToucheds, setFocuses, setAttempts, initialValues, initialToucheds, onReset, ref]);

  const formReset = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      reset();
    },
    [reset],
  );

  const registerField = useCallback(
    (key: InputName<K>, value: any) => {
      if (memo.register[key]) return;
      if (Object.prototype.hasOwnProperty.call(memo.pendingRegister, key)) return;
      memo.pendingRegister[key] = value;
    },
    [],
  );

  const getInputState = useCallback(
    (name: InputName<K>) => {
      registerField(name, getValueFromPath(name, initialValues));
      const currentValue = name && getValueFromPath(name, values);
      const initialValue = name && getValueFromPath(name, initialValues);
      return {
        value: getFallback(currentValue, initialValue),
        error: name && getValueFromPath(name, errors),
        touched: name && getValueFromPath(name, toucheds),
        focus: name && getValueFromPath(name, focuses),
      };
    },
    [registerField, initialValues, values, errors, toucheds, focuses],
  );

  const getInputHandlers = useCallback(
    (name: InputName<K>) => {
      return {
        onBlur: (inName?: InputName<K>) => setBlur(inName || name, false),
        onChange: (value: any, inName?: InputName<K>) => setValue(inName || name, value),
        onFocus: (inName?: InputName<K>) => setFocus(inName || name, true),
      };
    },
    [setBlur, setValue, setFocus],
  );

  const connect = useCallback(
    (name: InputName<K>) => {
      const id = getUID(space, name);
      const input = getInputState(name);
      const handlers = getInputHandlers(name);
      return {
        id,
        name,
        space,
        ...input,
        showError: !!input.error && input.touched && !input.focus && !loading,
        ...handlers,
        loading,
        status,
      };
    },
    [space, getInputState, getInputHandlers, loading, status],
  );

  const connectNative = useCallback(
    (name: InputName<K>) => {
      const input = getInputState(name);
      return {
        name,
        space,
        ...input,
        onBlur: setNativeBlur,
        onChange: setNativeValue,
        onFocus: setNativeFocus,
      };
    },
    [getInputState, setNativeBlur, setNativeValue, setNativeFocus, space],
  );

  const api = useMemo(
    () =>
      ({
        attempts,
        values,
        emptyValues,
        initialValues,
        toucheds,
        focuses,
        errors,
        isValid,
        hasChange,
        lastChange: memo.lastChange,
        loading,
        undo,
        redo,
        validate,
        setValue,
        setNativeValue,
        setFocus,
        setNativeFocus,
        setBlur,
        setNativeBlur,
        setTouch,
        setAllTouched,
        submit,
        nativeSubmit,
        reset,
        formReset,
        registerField,
        getInputState,
        getInputHandlers,
        connect,
        connectNative,
      } as FormApi<T>),
    [
      attempts,
      values,
      emptyValues,
      initialValues,
      toucheds,
      focuses,
      errors,
      isValid,
      hasChange,
      loading,
      undo,
      redo,
      validate,
      setValue,
      setNativeValue,
      setFocus,
      setNativeFocus,
      setBlur,
      setNativeBlur,
      setTouch,
      setAllTouched,
      submit,
      nativeSubmit,
      reset,
      formReset,
      registerField,
      getInputState,
      getInputHandlers,
      connect,
      connectNative,
    ],
  );

  // Save the latest API on the form ref and trigger onReady once.
  useEffect(() => {
    if (ref.current) {
      ref.current.api = api;
      if (!memo.init) {
        memo.init = true;
        onReady(api);
      }
    }
    return () => { };
  }, [ref, api, onReady]);

  // Trigger submit/reject lifecycle when submit attempts change.
  useEffect(() => {
    if (!attempts) return () => { };
    if (isValid) onSubmit(api);
    else onReject(api);
    return () => { };
  }, [attempts]);

  // Global keyboard controller for submit and history shortcuts.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // html
      const formEl = ref.current;
      const target = event.target as HTMLElement | null;
      // Abort if the event target is outside the form
      if (!formEl || !target || !formEl.contains(target)) return;
      // state
      const tag = target.tagName.toLowerCase();
      const role = target.getAttribute('role');
      const isEnter = event.key === 'Enter';
      const isUndo = (event.ctrlKey || event.metaKey) && event.key === 'z';
      const isRedo = (event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'z';
      const isInteractiveInput =
        tag === 'button' ||
        tag === 'textarea' ||
        (tag === 'input' && (target as HTMLInputElement).type !== 'submit') ||
        role === 'combobox';
      // Skip Enter handling if the focused element is interactive (e.g., textarea, combobox)
      if (isEnter && isInteractiveInput) return;
      // Trigger form submission via Enter when allowed
      if (isEnter && isEnterSubmit) {
        event.preventDefault();
        submit(event, 'keyboard');
      }
      // Handle undo with Ctrl+Z / Cmd+Z
      if (isUndo && undoLimit > 0) {
        event.preventDefault();
        undo();
      }
      // Handle redo with Ctrl+Shift+Z / Cmd+Shift+Z
      if (isRedo && undoLimit > 0) {
        event.preventDefault();
        redo();
      }
    };
    // Attach the keydown listener to the document
    document.addEventListener('keydown', handleKeyDown);
    // Clean up the listener on unmount
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [ref, isEnterSubmit, undoLimit, submit, undo, redo]);

  return [ref, api];
}
