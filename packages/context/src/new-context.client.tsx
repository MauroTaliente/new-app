'use client';

import { createContext, useReducer, useContext, useCallback, type ReactNode } from 'react';
import { capitalized, KnownParamsContext, ReturnContext } from './module';

export const newContext = <T extends KnownParamsContext>({
  name = '',
  initValues,
  reducer = () => {},
}: T) => {
  const processName = capitalized(name);

  const StateContext = createContext(initValues);
  StateContext.displayName = `${processName}Context`;

  const UpdaterContext = createContext((s: any) => s);
  UpdaterContext.displayName = `${processName}Dispatch`;

  const Provider = ({ children, value }: { children: ReactNode, value?: T['initValues'] }) => {
    const [store, setStore] = useReducer(reducer, value || initValues);
    return (
      <StateContext.Provider value={store}>
        <UpdaterContext.Provider value={setStore}>
          <>{children}</>
        </UpdaterContext.Provider>
      </StateContext.Provider>
    );
  };

  const useState = () => {
    const storeState = useContext(StateContext);
    if (storeState === undefined) {
      throw new Error(`${name}.useState must be used within a StoreProvider`);
    }
    return storeState;
  };

  const useUpdater = () => {
    const setStore = useContext(UpdaterContext);
    if (setStore === undefined) {
      throw new Error(`${name}.useUpdater must be used within a StoreProvider`);
    }
    const updater = useCallback(setStore, [setStore]);
    return updater;
  };

  const context = {
    [`${processName}Provider`]: Provider,
    [`use${processName}State`]: useState,
    [`use${processName}Updater`]: useUpdater,
  } as const;

  return context as ReturnContext<T>;
};
