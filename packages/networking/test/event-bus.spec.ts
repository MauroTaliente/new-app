import { describe, it, expect, vi } from 'vitest';
import { createEventBus } from '../src/event-bus/event-bus.js';

describe('createEventBus', () => {
  it('delivers payloads to subscribers', () => {
    const bus = createEventBus<{ ping: string }>();
    const received: string[] = [];
    bus.on('ping', (payload) => received.push(payload));
    bus.emit('ping', 'hello');
    expect(received).toEqual(['hello']);
  });

  it('queues events until a listener is registered', () => {
    const bus = createEventBus<{ ready: number }>();
    bus.emit('ready', 1);
    bus.emit('ready', 2);
    const received: number[] = [];
    bus.on('ready', (n) => received.push(n));
    expect(received).toEqual([1, 2]);
  });

  it('once removes the handler after the first delivery', () => {
    const bus = createEventBus<{ tick: void }>();
    const spy = vi.fn();
    bus.once('tick', spy);
    bus.emit('tick');
    bus.emit('tick');
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('off stops further deliveries', () => {
    const bus = createEventBus<{ n: number }>();
    const spy = vi.fn();
    bus.on('n', spy);
    bus.off('n', spy);
    bus.emit('n', 1);
    expect(spy).not.toHaveBeenCalled();
  });

  it('defineType warns on payload type mismatch', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const bus = createEventBus<{ typed: string }>();
    bus.defineType('typed', 'sample');
    bus.emit('typed', 42 as unknown as string);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Payload type mismatch'));
    warn.mockRestore();
  });
});
