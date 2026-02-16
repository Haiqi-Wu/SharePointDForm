/**
 * 防抖 Hook
 */

import * as React from 'react';

/**
 * 防抖回调函数
 * @param callback 原始回调函数
 * @param delay 延迟时间（毫秒），默认 300ms
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): T {
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const callbackRef = React.useRef(callback);

  // 更新 callback ref
  React.useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // 清理定时器
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const debouncedCallback = React.useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  ) as T;

  return debouncedCallback;
}

/**
 * 立即执行挂起的防抖函数
 */
export function useFlushDebounce(): () => void {
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const flush = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return flush;
}

/**
 * 防抖值
 * @param value 原始值
 * @param delay 延迟时间（毫秒），默认 300ms
 */
export function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
