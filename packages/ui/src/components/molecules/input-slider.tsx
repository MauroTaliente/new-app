'use client';

import { useRef, type HTMLProps, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import { buildStyles, cn, type ClassValue } from '@react33/react-styles';
import {
  InputFrame,
  type FromInputCustomApi,
  type HtmlOmittedProps,
} from '@react33/react-form';

type HtmlSliderProps = Omit<HTMLProps<HTMLDivElement>, HtmlOmittedProps>;
type SliderRangeValue = [number, number];
type SliderValue = number | SliderRangeValue;

const sliderStyleMap = {
  root: 'w-full',
  body: 'w-full px-3 py-3',
  bodyClean: 'w-full py-1',
  trackWrap: 'relative py-2',
  track: 'relative z-0 h-2 w-full rounded-full bg-bg-300',
  range: 'absolute top-0 z-10 h-2 rounded-full bg-accent-200',
  thumb: [
    'absolute top-1/2 h-5 w-5 -translate-y-1/2 -translate-x-1/2 rounded-full border border-border-200 bg-bg-100 shadow-sm',
    'cursor-grab touch-none outline-none transition-[box-shadow,border-color] duration-150',
    'focus-visible:border-accent-100 focus-visible:ring-2 focus-visible:ring-accent-200/50',
    'active:cursor-grabbing',
    'disabled:cursor-not-allowed',
  ],
  values: 'mt-2 flex items-center justify-between text-xs text-text-300',
} as const;

export type InputSliderMode = 'single' | 'range';

export interface InputSliderProps extends FromInputCustomApi, HtmlSliderProps {
  min?: number;
  max?: number;
  step?: number;
  mode?: InputSliderMode;
  prefix?: ReactNode;
  suffix?: ReactNode;
  indicators?: 'off' | 'all';
  focusMode?: 'soft' | 'highLight';
  hidden?: boolean;
  loading?: boolean;
  disabled?: boolean;
  showValue?: boolean;
  boxMode?: 'boxed' | 'clean';
  value?: SliderValue;
  defaultRangeValue?: SliderRangeValue;
}

const toSafeBounds = (min: number, max: number) => {
  if (max > min) return { min, max };
  return { min: 0, max: 100 };
};

const toSafeStep = (step: number) => {
  if (!Number.isFinite(step) || step <= 0) return 1;
  return step;
};

const clamp = (value: number, min: number, max: number) => {
  return Math.min(max, Math.max(min, value));
};

const snapValue = (value: number, min: number, max: number, step: number) => {
  const clamped = clamp(value, min, max);
  const snapped = min + Math.round((clamped - min) / step) * step;
  return clamp(snapped, min, max);
};

const resolveValue = (
  mode: InputSliderMode,
  value: SliderValue | undefined,
  min: number,
  max: number,
  step: number,
  defaultRangeValue: SliderRangeValue,
): SliderRangeValue => {
  if (mode === 'single') {
    const raw = typeof value === 'number' ? value : Array.isArray(value) ? value[0] : min;
    const next = snapValue(raw, min, max, step);
    return [next, next];
  }

  if (Array.isArray(value)) {
    const left = snapValue(value[0] ?? min, min, max, step);
    const right = snapValue(value[1] ?? max, min, max, step);
    return left <= right ? [left, right] : [right, left];
  }

  const left = snapValue(defaultRangeValue[0], min, max, step);
  const right = snapValue(defaultRangeValue[1], min, max, step);
  return left <= right ? [left, right] : [right, left];
};

const toPercent = (value: number, min: number, max: number) => {
  if (max === min) return 0;
  return ((value - min) / (max - min)) * 100;
};

const getRatioFromPointer = (clientX: number, trackElement: HTMLDivElement) => {
  const rect = trackElement.getBoundingClientRect();
  if (!rect.width) return 0;
  return clamp((clientX - rect.left) / rect.width, 0, 1);
};

const toValueFromPointer = (
  clientX: number,
  trackElement: HTMLDivElement,
  min: number,
  max: number,
  step: number,
) => {
  const ratio = getRatioFromPointer(clientX, trackElement);
  const raw = min + ratio * (max - min);
  return snapValue(raw, min, max, step);
};

const formatValue = (value: number) => {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
};

const getNextFromKeyboard = (
  key: string,
  current: number,
  min: number,
  max: number,
  step: number,
) => {
  const pageDelta = step * 10;
  if (key === 'ArrowRight' || key === 'ArrowUp') return snapValue(current + step, min, max, step);
  if (key === 'ArrowLeft' || key === 'ArrowDown') return snapValue(current - step, min, max, step);
  if (key === 'PageUp') return snapValue(current + pageDelta, min, max, step);
  if (key === 'PageDown') return snapValue(current - pageDelta, min, max, step);
  if (key === 'Home') return min;
  if (key === 'End') return max;
  return current;
};

export const InputSlider = ({
  value,
  min = 0,
  max = 100,
  step = 1,
  mode,
  defaultRangeValue = [25, 75],
  disabled = false,
  loading = false,
  hidden = false,
  indicators = 'off',
  focusMode = 'soft',
  touched,
  error,
  showError,
  focus,
  className,
  prefix,
  suffix,
  showValue = true,
  boxMode = 'boxed',
  onFocus = () => {},
  onBlur = () => {},
  onChange = () => {},
  ...props
}: InputSliderProps) => {
  const draggingThumbRef = useRef<0 | 1 | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const safeBounds = toSafeBounds(min, max);
  const safeStep = toSafeStep(step);
  const safeMode: InputSliderMode = mode ?? (Array.isArray(value) ? 'range' : 'single');
  const [leftValue, rightValue] = resolveValue(
    safeMode,
    value,
    safeBounds.min,
    safeBounds.max,
    safeStep,
    defaultRangeValue,
  );

  const showFocus = focusMode === 'highLight' && !!focus;
  const showSuccess = indicators === 'all' && !error && !!touched;
  const showIndicators = indicators === 'all' && (showSuccess || !!showError);
  const locked = disabled || loading;

  const leftPercent = toPercent(leftValue, safeBounds.min, safeBounds.max);
  const rightPercent = toPercent(rightValue, safeBounds.min, safeBounds.max);
  const rangeLeftPercent = safeMode === 'single' ? 0 : leftPercent;
  const rangeRightPercent = safeMode === 'single' ? leftPercent : rightPercent;

  const resolvedStyles = buildStyles({
    root: [sliderStyleMap.root, className as ClassValue],
    body: boxMode === 'clean' ? sliderStyleMap.bodyClean : sliderStyleMap.body,
    trackWrap: sliderStyleMap.trackWrap,
    track: [sliderStyleMap.track, locked && 'bg-disabled-bg'],
    range: [sliderStyleMap.range, locked && 'bg-disabled-border'],
    thumb: [sliderStyleMap.thumb, locked && 'border-disabled-border bg-disabled-bg'],
    values: sliderStyleMap.values,
  });

  const emitValue = (nextLeft: number, nextRight: number) => {
    if (safeMode === 'single') {
      onChange(nextLeft as never);
      return;
    }
    onChange([nextLeft, nextRight] as never);
  };

  const applyFromThumb = (thumbIndex: 0 | 1, candidate: number) => {
    if (safeMode === 'single') {
      emitValue(candidate, candidate);
      return;
    }

    if (thumbIndex === 0) {
      const nextLeft = Math.min(candidate, rightValue);
      emitValue(nextLeft, rightValue);
      return;
    }

    const nextRight = Math.max(candidate, leftValue);
    emitValue(leftValue, nextRight);
  };

  const pickClosestThumb = (candidate: number): 0 | 1 => {
    if (safeMode === 'single') return 0;
    const distanceToLeft = Math.abs(candidate - leftValue);
    const distanceToRight = Math.abs(candidate - rightValue);
    return distanceToLeft <= distanceToRight ? 0 : 1;
  };

  const stopDragging = () => {
    draggingThumbRef.current = null;
    onBlur();
  };

  const handlePointerMove = (event: globalThis.PointerEvent) => {
    const targetThumb = draggingThumbRef.current;
    const trackElement = trackRef.current;
    if (targetThumb === null || !trackElement) return;
    const candidate = toValueFromPointer(
      event.clientX,
      trackElement,
      safeBounds.min,
      safeBounds.max,
      safeStep,
    );
    applyFromThumb(targetThumb, candidate);
  };

  const handlePointerUp = () => {
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
    stopDragging();
  };

  const startDragging = (thumbIndex: 0 | 1, pointerId: number) => {
    draggingThumbRef.current = thumbIndex;
    onFocus();
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp, { once: true });
    const trackElement = trackRef.current;
    if (trackElement) trackElement.setPointerCapture(pointerId);
  };

  const handleTrackPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (locked || !trackRef.current) return;
    event.preventDefault();
    const candidate = toValueFromPointer(
      event.clientX,
      trackRef.current,
      safeBounds.min,
      safeBounds.max,
      safeStep,
    );
    const thumb = pickClosestThumb(candidate);
    applyFromThumb(thumb, candidate);
    startDragging(thumb, event.pointerId);
  };

  const handleThumbPointerDown = (thumbIndex: 0 | 1) => (event: PointerEvent<HTMLButtonElement>) => {
    if (locked) return;
    event.preventDefault();
    event.stopPropagation();
    startDragging(thumbIndex, event.pointerId);
  };

  const handleThumbKeyDown = (thumbIndex: 0 | 1, currentValue: number) => (
    event: KeyboardEvent<HTMLButtonElement>,
  ) => {
    if (locked) return;
    const next = getNextFromKeyboard(event.key, currentValue, safeBounds.min, safeBounds.max, safeStep);
    if (next === currentValue) return;
    event.preventDefault();
    onFocus();
    applyFromThumb(thumbIndex, next);
  };

  if (hidden) return null;

  const sliderContent = (
    <div className={resolvedStyles.body}>
      <div ref={trackRef} className={resolvedStyles.trackWrap} onPointerDown={handleTrackPointerDown}>
        <div className={resolvedStyles.track}>
          <div
            className={resolvedStyles.range}
            style={{
              left: `${rangeLeftPercent}%`,
              width: `${Math.max(rangeRightPercent - rangeLeftPercent, 0)}%`,
            }}
          />
        </div>
        <button
          type="button"
          role="slider"
          disabled={locked}
          className={cn(resolvedStyles.thumb)}
          aria-label="Slider value"
          aria-valuemin={safeBounds.min}
          aria-valuemax={safeBounds.max}
          aria-valuenow={leftValue}
          style={{ left: `${leftPercent}%` }}
          onPointerDown={handleThumbPointerDown(0)}
          onKeyDown={handleThumbKeyDown(0, leftValue)}
          onFocus={() => onFocus()}
          onBlur={() => {
            if (draggingThumbRef.current === null) onBlur();
          }}
        />
        {safeMode === 'range' ? (
          <button
            type="button"
            role="slider"
            disabled={locked}
            className={cn(resolvedStyles.thumb)}
            aria-label="Slider max value"
            aria-valuemin={safeBounds.min}
            aria-valuemax={safeBounds.max}
            aria-valuenow={rightValue}
            style={{ left: `${rightPercent}%` }}
            onPointerDown={handleThumbPointerDown(1)}
            onKeyDown={handleThumbKeyDown(1, rightValue)}
            onFocus={() => onFocus()}
            onBlur={() => {
              if (draggingThumbRef.current === null) onBlur();
            }}
          />
        ) : null}
      </div>
      {showValue ? (
        <div className={resolvedStyles.values}>
          <span>{formatValue(leftValue)}</span>
          <span>{formatValue(safeMode === 'range' ? rightValue : safeBounds.max)}</span>
        </div>
      ) : null}
    </div>
  );

  return (
    <div className={resolvedStyles.root} {...props}>
      {boxMode === 'clean' ? (
        sliderContent
      ) : (
        <InputFrame
          focus={!!focus}
          showFocus={showFocus}
          showError={!!showError}
          showSuccess={showSuccess}
          disabled={locked}
          hasIndicators={showIndicators}
          indicators={indicators}
          prefix={prefix}
          suffix={suffix}
        >
          {sliderContent}
        </InputFrame>
      )}
    </div>
  );
};

InputSlider.displayName = 'InputSlider';
