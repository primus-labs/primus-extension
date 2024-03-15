import React, { useMemo, memo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import useMsgs from '@/hooks/useMsgs'
import PButton from '@/newComponents/PButton';
import PClose from '@/newComponents/PClose';
import './index.scss';
import type { Msg } from '@/types/store';

const PAlert: React.FC<Msg> = memo(
  ({
    id,
    type = 'suc',
    title = '',
    desc = '',
    link = '/',
    code = '',
    done = false,
    linkText = 'View details',
  }) => {
    const { deleteMsg } = useMsgs();
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
            {link && (
              <PButton
                text={linkText}
                type="text2"
                onClick={handleDetail}
                className="detailBtn"
              />
            )}
          </div>
          <PClose
            onClick={() => {
              deleteMsg(id);
            }}
          />
        </main>
      </div>
    );
  }
);

export default PAlert;
