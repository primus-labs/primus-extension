import React, { useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import './index.scss';
import { useSelector } from 'react-redux';
import type { Msg, UserState } from '@/types/store';
import PAlert from '@/newComponents/PAlert';

const PMsgs = memo(() => {
  const msgs = useSelector((state: UserState) => state.msgs);
  const navigate = useNavigate();
  // console.log('222msgs', msgs);//delete
  const filterdList = useMemo(() => {
    return Object.keys(msgs)
      .filter((m) => !msgs[m].done)
      .map((i) => msgs[i]);
  }, [msgs]);

  return (
    <div className="pMsgs">
      {filterdList.map((m) => {
        return <PAlert {...m} key={m.id} />;
      })}
    </div>
  );
});

export default PMsgs;
