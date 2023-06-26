import React, { useRef, useEffect } from 'react';

type UseTimeout = (
  callback: () => void,
  delay: number | null,
  switchFlag: boolean,
  immediate: boolean
) => void;
const useTimeout: UseTimeout = function useTimeout(
  callback,
  delay,
  switchFlag = true,
  immediate = false
) {
  const savedCallback = useRef(() => {});
  useEffect(() => {
    savedCallback.current = callback;
  });

  useEffect(() => {
    if (delay !== null && switchFlag) {
      const handler = () => savedCallback.current();
      const id = setTimeout(handler, delay);
      console.log('useTimeout-set', id);
      immediate && handler();
      return () => {
        console.log('useTimeout--clear', id);
        clearTimeout(id);
      };
    }
  }, [delay, switchFlag, immediate]);
};
export default useTimeout
