import { useMemo } from "react";
import useWinWidth from "./useWinWidth";

const useBreakPoint = () => {
  const size = useWinWidth();
  const breakPoint = useMemo(() => {
    let bp = "s";
    const { width } = size;
    if (width < 577) {
      bp = "s";
    } else if (width >= 577 && width < 1024) {
      bp = 'm';
    } else if (width >= 1024 && width < 1365) {
      bp = 'l';
    } else {
      bp = 'xl';
    }
    return bp;
  }, [size]);

  return breakPoint;
};
export default useBreakPoint;
