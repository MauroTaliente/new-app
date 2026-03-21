export type EventMap = Record<string, any>;

export interface EventBusCore<Events extends EventMap = EventMap> {
  on<T extends keyof Events>(event: T, callback: (payload: Events[T]) => void): void;
  off<T extends keyof Events>(event: T, callback: (payload: Events[T]) => void): void;
  once<T extends keyof Events>(event: T, callback: (payload: Events[T]) => void): void;
  emit<T extends keyof Events>(event: T, payload?: Events[T]): void;
  defineType<T extends keyof Events>(event: T, sample: Events[T]): this;
}

export function createEventBus<Events extends EventMap = EventMap>(): EventBusCore<Events> {
  const listeners = new Map<keyof Events, Set<(payload: any) => void>>();
  const eventTypes = {} as Record<keyof Events, unknown>;
  const queue = new Map<keyof Events, Events[keyof Events][]>();

  function on<T extends keyof Events>(event: T, callback: (payload: Events[T]) => void) {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event)!.add(callback);

    if (queue.has(event)) {
      (queue.get(event)! as Events[T][]).forEach((payload) => callback(payload));
      queue.delete(event);
    }
  }

  function off<T extends keyof Events>(event: T, callback: (payload: Events[T]) => void) {
    listeners.get(event)?.delete(callback);
  }

  function once<T extends keyof Events>(event: T, callback: (payload: Events[T]) => void) {
    const wrapper = (payload: Events[T]) => {
      off(event, wrapper);
      callback(payload);
    };
    on(event, wrapper);
  }

  function emit<T extends keyof Events>(event: T, payload?: Events[T]) {
    if (eventTypes[event] && typeof payload !== typeof eventTypes[event]) {
      console.warn(`Payload type mismatch for event ${String(event)}`);
    }

    const handlers = listeners.get(event);
    if (handlers && handlers.size > 0) {
      handlers.forEach((cb) => cb(payload as Events[T]));
    } else {
      if (!queue.has(event)) queue.set(event, []);
      queue.get(event)!.push(payload as Events[T]);
    }
  }

  function defineType<T extends keyof Events>(event: T, sample: Events[T]) {
    eventTypes[event] = sample;
    return api;
  }

  const api: EventBusCore<Events> = {
    on,
    off,
    once,
    emit,
    defineType,
  };

  return api;
}
