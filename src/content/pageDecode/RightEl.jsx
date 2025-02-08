import React, { useMemo } from 'react';
import PButton from '../PButton';
const RightEl = ({ status, onBack }) => {
  const ElCon = useMemo(() => {
    let el = null;
    switch (status) {
      case 'uninitialized':
      case 'initialized':
        break;
      case 'verifying':
        el = <div className="loading-spinner"></div>;
        // el = <div className="loader"></div>;
        break;
      case 'result':
        el = <PButton text="Back" onClick={onBack} />;
        break;
    }
    return el;
  }, [status, onBack]);

  return <div className={`pado-extension-right ${status}`}>{ElCon}</div>;
};

export default RightEl;
