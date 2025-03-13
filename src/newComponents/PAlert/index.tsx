import React, { useMemo, memo, useCallback } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import useMsgs from '@/hooks/useMsgs';
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
    link = '',
    code = '',
    done = false,
    linkText = 'View details',
  }) => {
    const { deleteMsg } = useMsgs();
    const navigate = useNavigate();
    const location = useLocation();
    const { pathname } = location;
    // console.log('222pathname', location, pathname, link); //delete
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
      deleteMsg(id);
    }, [navigate, deleteMsg, id]);

    return (
      <div className={`pAlert ${type}`}>
        <main>
          <i className={`iconfont ${activeIconName} resultIcon`}></i>
          <div className="content">
            <h1 className="title">{title}</h1>
            {desc && (
              <h2 className="descWrapper">
                <span className="desc">{desc}</span>
                {type === 'warn' && code && (
                  <span className="code">&nbsp;{code}</span>
                )}
              </h2>
            )}
            {link && !link.startsWith(pathname) && (
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
