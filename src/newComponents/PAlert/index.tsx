import React, { useMemo, memo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import PButton from '@/newComponents/PButton';
import PClose from '@/newComponents/PClose';

import './index.scss';
import { useSelector } from 'react-redux';
import type { Msg } from '@/types/store';

const PAlert: React.FC<Msg> = memo(
  ({
    type = 'suc',
    title = '',
    desc = '',
    link = '/',
    code = '',
    done = false,
  }) => {
    const navigate = useNavigate();

    const activeIconName = useMemo(() => {
      let cN = '';
      if (type === 'suc') {
        cN = 'icon-iconResultSuc';
      } else if (type === 'error') {
        cN = 'icon-iconResultError';
      } else if (type === 'warn') {
        cN = 'icon-iconInfoColorful';
      } else if (type === 'info') {
        cN = 'icon-iconInfoColorful';
      }
      return cN;
    }, [type]);
    const handleDetail = useCallback(() => {
      navigate(link);
    }, [navigate]);
    return (
      <div className={`pAlert ${type}`}>
        <main>
          <i className={`iconfont ${activeIconName} resultIcon`}></i>
          <div className="content">
            <h1>{title}</h1>
            {desc && (
              <h2>
                <span className="desc">{desc}</span>
                {type === 'warn' && code && (
                  <span className="code">&nbsp;Error code:{code}</span>
                )}
              </h2>
            )}
            {type === 'suc' && link && (
              <PButton
                text="View details"
                type="text2"
                onClick={handleDetail}
              />
            )}
          </div>
          <PClose onClick={() => {}} />
        </main>
      </div>
    );
  }
);

export default PAlert;
