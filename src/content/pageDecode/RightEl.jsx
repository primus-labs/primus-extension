import React, { useMemo } from 'react';
import PButton from '../PButton';
const RightEl = ({ status, onBack }) => {
  const ElCon = useMemo(() => {
    let el = null;
    // switch (status) {
    //   case 'uninitialized':
    //   case 'initialized':
    //     break;
    //   case 'verifying':
    //     el = <div className="loading-spinner"></div>;
    //     break;
    //   case 'result':
    //     el = <PButton text="Back" onClick={onBack} />;
    //     break;
    // }
    if (['uninitialized', 'initialized'].includes(status)) {
    } else if (status === 'verifying') {
      el = <div className="loading-spinner"></div>;
    } else if (status === 'result') {
      el = <PButton text="Back" onClick={onBack} />;
    }
    return el;
  }, [status, onBack]);

  return <div className={`pado-extension-right ${status}`}>{ElCon}</div>;
};

export default RightEl;
