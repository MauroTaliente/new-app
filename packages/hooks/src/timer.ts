'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useLatest } from './latest.js';

export interface TimerCore {
  play: boolean;
  time: number;
  countdown: number;
  resetTimer: () => void;
  playTimer: () => void;
  pauseTimer: () => void;
  stopTimer: () => void;
  controlTimer: () => void;
  seek: (ms: number) => void;
  setLimit: (ms: number) => void;
}

export interface TimerProps {
  scale?: number;
  limit?: number;
  interval?: number;
  auto?: boolean;
  isReactive?: boolean;
  disabled?: boolean;
  onExpired?: (core: TimerCore) => void;
  onStart?: (core: TimerCore) => void;
  onPause?: (core: TimerCore) => void;
  onChange?: (core: TimerCore) => void;
  onChangeThrottleMs?: number;
  pauseWhenHidden?: boolean;
  resumeOnVisible?: boolean;
}

/**
 * Drift-safe timer/countdown using `performance.now`, with optional visibility handling.
 * Interval / countdown timer driven by `performance.now` and `requestAnimationFrame`.
 */
export const useTimer = (
  {
    scale = 1,
    limit = 1000,
    interval = 1000,
    auto = false,
    isReactive = false,
    disabled = false,
    onExpired = () => {},
    onStart = () => {},
    onPause = () => {},
    onChange = () => {},
    onChangeThrottleMs = 0,
    pauseWhenHidden = false,
    resumeOnVisible = true,
  }: TimerProps,
  watch: unknown[] = [],
): TimerCore => {
  const noop = useMemo<TimerCore>(() => {
    const f = () => {};
    return {
      play: false,
      time: 0,
      countdown: 0,
      resetTimer: f,
      playTimer: f,
      pauseTimer: f,
      stopTimer: f,
      controlTimer: f,
      seek: f as (ms: number) => void,
      setLimit: f as (ms: number) => void,
    };
  }, []);

  const [play, setPlay] = useState(false);
  const [rtime, setRtime] = useState(0);

  const carryRef = useRef(0);
  const startRef = useRef<number | null>(null);
  const limitRef = useRef(limit);
  const scaleRef = useRef(scale);
  const freqRef = useRef(interval);

  useEffect(() => {
    limitRef.current = limit;
  }, [limit]);
  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);
  useEffect(() => {
    freqRef.current = interval;
  }, [interval]);

  const onExpiredRef = useLatest(onExpired);
  const onStartRef = useLatest(onStart);
  const onPauseRef = useLatest(onPause);
  const onChangeRef = useLatest(onChange);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastChangeAtRef = useRef(0);

  const nowMs = () => performance.now();

  const computeElapsed = (now = nowMs()) => {
    const base = carryRef.current;
    return startRef.current != null ? base + (now - startRef.current) : base;
  };

  const setElapsed = (ms: number) => {
    const clamped = Math.max(0, Math.min(ms, limitRef.current));
    carryRef.current = clamped;
    if (startRef.current != null) startRef.current = nowMs();
    if (isReactive) setRtime(clamped / scaleRef.current);
  };

  const getLiveCore = (): TimerCore => ({
    play,
    time: isReactive ? rtime : computeElapsed() / scaleRef.current,
    countdown: Math.max(
      0,
      limitRef.current / scaleRef.current -
        (isReactive ? rtime : computeElapsed() / scaleRef.current),
    ),
    resetTimer,
    playTimer,
    stopTimer,
    pauseTimer,
    controlTimer,
    seek,
    setLimit,
  });

  const playTimer = () => {
    if (disabled) return;
    if (play) return;
    if (computeElapsed() >= limitRef.current) return;
    startRef.current = nowMs();
    setPlay(true);
    onStartRef.current(getLiveCore());
  };

  const pauseTimer = () => {
    if (disabled) return;
    if (!play) return;
    const now = nowMs();
    if (startRef.current != null) carryRef.current += now - startRef.current;
    startRef.current = null;
    setPlay(false);
    onPauseRef.current(getLiveCore());
  };

  const resetTimer = () => {
    if (disabled) return;
    carryRef.current = 0;
    startRef.current = nowMs();
    setPlay(true);
    if (isReactive) setRtime(0);
    onStartRef.current(getLiveCore());
  };

  const stopTimer = () => {
    if (disabled) return;
    carryRef.current = 0;
    startRef.current = null;
    setPlay(false);
    if (isReactive) setRtime(0);
  };

  const controlTimer = () => {
    if (disabled) return;
    return play ? pauseTimer() : playTimer();
  };

  const seek = (ms: number) => {
    if (disabled) return;
    setElapsed(ms);
  };

  const setLimit = (ms: number) => {
    if (disabled) return;
    limitRef.current = Math.max(0, ms);
    const elapsed = computeElapsed();
    if (elapsed >= limitRef.current) {
      carryRef.current = limitRef.current;
      startRef.current = null;
      setPlay(false);
      if (isReactive) setRtime(limitRef.current / scaleRef.current);
      onExpiredRef.current(getLiveCore());
    }
  };

  const visibleTime = isReactive ? rtime : computeElapsed() / scaleRef.current;
  const visibleCountdown = Math.max(0, limitRef.current / scaleRef.current - visibleTime);

  const core: TimerCore = {
    play,
    time: visibleTime,
    countdown: visibleCountdown,
    resetTimer,
    playTimer,
    stopTimer,
    pauseTimer,
    controlTimer,
    seek,
    setLimit,
  };

  const initAuto = useRef(auto);
  useEffect(() => {
    if (disabled) return;
    if (!initAuto.current) {
      initAuto.current = true;
    } else {
      playTimer();
    }
    return () => {
      stopTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run when watch tuple identity changes
  }, [disabled, auto, ...watch]);

  useEffect(() => {
    if (disabled || !pauseWhenHidden) return;
    let resumeFlag = false;
    const onVis = () => {
      if (document.hidden) {
        if (play) {
          resumeFlag = true;
          pauseTimer();
        }
      } else if (resumeOnVisible && resumeFlag) {
        resumeFlag = false;
        playTimer();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [disabled, pauseWhenHidden, resumeOnVisible, play]);

  useEffect(() => {
    if (disabled) return;
    let mounted = true;

    const schedule = () => {
      if (!mounted) return;
      const id = setTimeout(tick, freqRef.current);
      timeoutRef.current = id;
    };

    const clear = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    };

    const tick = () => {
      if (!mounted) return;
      const now = nowMs();
      const elapsed = computeElapsed(now);

      if (play) {
        if (onChangeThrottleMs <= 0) {
          onChangeRef.current(getLiveCore());
        } else if (now - lastChangeAtRef.current >= onChangeThrottleMs) {
          lastChangeAtRef.current = now;
          onChangeRef.current(getLiveCore());
        }
      }

      if (elapsed >= limitRef.current) {
        carryRef.current = limitRef.current;
        startRef.current = null;
        if (isReactive) setRtime(limitRef.current / scaleRef.current);
        if (play) {
          setPlay(false);
          onExpiredRef.current(getLiveCore());
        }
        clear();
        return;
      }

      if (play && isReactive) {
        setRtime(elapsed / scaleRef.current);
      }

      schedule();
    };

    schedule();
    return () => {
      mounted = false;
      clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, play, isReactive, onChangeThrottleMs, ...watch]);

  return disabled ? noop : core;
};
