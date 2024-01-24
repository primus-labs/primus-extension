import React, {
  useState,
  useRef,
  useMemo,
  memo,
  useEffect,
  useCallback,
} from 'react';
import { useDispatch } from 'react-redux';
import { setThemeAction } from '@/store/actions';
import type { Dispatch } from 'react';
import './index.scss';

import PPInput from '@/newComponents/PInput';
import PPButton from '@/newComponents/PButton';
import PPTabs from '@/newComponents/PTabs';
import PPTooltip from '@/newComponents/PTooltip';
import PSelect from '@/newComponents/PSelect';
import Sidebar from '@/newComponents/Sidebar'

const Test: React.FC = memo(({}) => {
  const dispatch: Dispatch<any> = useDispatch();
  const tList = [
    { label: 'ABC', value: '1' },
    { label: 'DEFG', value: '2' },
    { label: 'HIGKLI', value: '3', disabled: true },
  ];
  const [sss, setSss] = useState('');
  const [ttt, setTtt] = useState('1');
  const [ppp, setPpp] = useState('');
  const handleClick = useCallback(() => {
    dispatch(setThemeAction());
  }, [dispatch]);
  return (
    <div className="test">
      <div className="left">
        <Sidebar/>
      </div>
      <div className="right">
        <section className="pSection">
          <div className="pRow">
            <PPButton text="primary" type="primary" onClick={handleClick} />
            <PPButton
              text="disabled"
              type="primary"
              disabled
              onClick={() => {}}
            />
            <PPButton
              text="sButton"
              type="primary"
              size="s"
              onClick={() => {}}
            />
          </div>
          <div className="pRow">
            <PPButton text="secondary" type="secondary" onClick={() => {}} />
            <PPButton
              text="disabled"
              type="secondary"
              disabled
              onClick={() => {}}
            />
          </div>
          <div className="pRow">
            <PPButton text="text" type="text" onClick={() => {}} />
            <PPButton text="disabled" type="text" disabled onClick={() => {}} />
          </div>
          <div className="pRow">
            <PPButton
              type="icon"
              icon={<i className="iconfont icon-Add"></i>}
              onClick={() => {}}
            />
            <PPButton
              type="icon"
              icon={<i className="iconfont icon-Add"></i>}
              disabled
              onClick={() => {}}
            />
          </div>
        </section>
        <section className="pSection">
          <div className="pRow">
            <PSelect
              label="select label"
              placeholder="placeholder"
              list={tList}
              value={sss}
              onChange={(ppp) => {
                setSss(ppp);
              }}
            />
            <PSelect
              placeholder="placeholder"
              list={tList}
              value={'1'}
              onChange={(ppp) => {
                setSss(ppp);
              }}
              disabled
            />
          </div>
        </section>
        <section className="pSection">
          <div className="pRow">
            <PPInput
              label="input label"
              placeholder="placeholder"
              type="text"
              onChange={(ppp) => {
                setPpp(ppp);
              }}
              value={ppp}
            />

            <PPInput
              label="input label"
              placeholder="placeholder"
              type="password"
              onChange={(ppp) => {
                setPpp(ppp);
              }}
              value={ppp}
              errorTip="error"
            />
            <PPInput
              placeholder="placeholder"
              type="text"
              onChange={(ppp) => {
                setPpp(ppp);
              }}
              value={'111'}
              disabled
              helpTip="help text"
            />
          </div>
        </section>
        <section className="pSection">
          <div className="pRow">
            <PPTabs
              list={tList}
              onChange={(ppp) => {
                setTtt(ppp);
              }}
              value={ttt}
            />
          </div>
        </section>
        <section className="pSection">
          <div className="pRow"></div>
        </section>

        <PPTooltip title="hello">
          <PPButton text="tooltip" type="secondary" onClick={() => {}} />
        </PPTooltip>
      </div>
    </div>
  );
});

export default Test;
