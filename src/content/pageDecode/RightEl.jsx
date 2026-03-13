import React, { useMemo } from 'react';
import PButton from '../PButton';
import { STATUS } from './constants';

const RightEl = ({ status, onBack }) => {
  const ElCon = useMemo(() => {
    let el = null;
    switch (status) {
      case STATUS.UNINITIALIZED:
      case STATUS.INITIALIZED:
        break;
      case STATUS.VERIFYING:
        el = <div className="loader2" />;
        break;
      case STATUS.RESULT:
        el = <PButton text="Back" onClick={onBack} />;
        break;
      default:
        break;
    }
    return el;
  }, [status, onBack]);

  return <div className={`pado-extension-right ${status}`}>{ElCon}</div>;
};

export default RightEl;
