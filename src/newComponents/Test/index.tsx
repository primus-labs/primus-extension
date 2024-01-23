import React, { useState, useRef, useMemo, memo, useEffect } from 'react';
import './index.scss';

import PPInput from '@/newComponents/PInput';
import PPButton from '@/newComponents/PButton';
import PPTabs from '@/newComponents/PTabs';
import PPTooltip from '@/newComponents/PTooltip';
import PSelect from '@/newComponents/PSelect';

const Test: React.FC = memo(({}) => {
  const tList = [
    { label: 'ABC', value: '1' },
    { label: 'DEFG', value: '2' },
    { label: 'HIGKLI', value: '3' },
  ];
  const [sss, setSss] = useState('');
  const [ttt, setTtt] = useState('3');
  const [ppp, setPpp] = useState('');
  return (
    <div className="test">
      <PPButton text="primary" type="primary" onClick={() => {}} />
      <PPInput
        label="input label"
        placeholder="12345"
        type="password"
        onChange={(ppp) => {
          setPpp(ppp);
        }}
        value={ppp}
      />
      <PSelect
        label="select label"
        placeholder="12345"
        list={tList}
        value={sss}
        onChange={(ppp) => {
          setSss(ppp);
        }}
      />
      <PPTabs
        list={tList}
        onChange={(ppp) => {
          setTtt(ppp);
        }}
        value={ttt}
      />

      <PPTooltip title="hello">
        <PPButton text="tooltip" type="secondary" onClick={() => {}} />
      </PPTooltip>
    </div>
  );
});

export default Test;
