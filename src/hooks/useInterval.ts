import React, { useRef, useEffect } from 'react';

type UseInterval = (
  callback: () => void,
  delay: number | null,
  switchFlag: boolean,
  immediate: boolean
) => void;
const useInterval: UseInterval = function useInterval(
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
      const id = setInterval(handler, delay);
      console.log('useInterval-set', id);
      immediate && handler();
      return () => {
        console.log('useInterval-clear', id);
        clearInterval(id);
      };
    }
  }, [delay, switchFlag, immediate]);
};
export default useInterval;
