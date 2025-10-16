import React, { memo, useCallback, useMemo } from 'react';
import { ATTESTATIONTYPELIST } from '@/config/attestation';
import PButton from '@/newComponents/PButton';
import './index.scss';
import { useSelector } from 'react-redux';
import { UserState } from '@/types/store';

type NavItem = {
  type: string;
  icon: any;
  desc: any;
  name: string;

  importType?: string;
  provider?: string;
};
interface PDropdownProps {
  onClick?: (item) => void;
  // list: NavItem[];
}

const Cards: React.FC<PDropdownProps> = memo(({ onClick = (item) => {} }) => {
  const theme = useSelector((state: UserState) => state.theme);
  const supportList = useMemo(() => {
    return ATTESTATIONTYPELIST.filter((i) => !!i.show);
  }, []);

  const handleClick = useCallback(
    (i) => {
      // if (i.id === 'On-chain Transactions') {
      // } else {
      onClick(i);
      // }
    },
    [onClick]
  );
  return (
    <ul className="allAttestationTypeCards">
      {supportList.map((i) => {
        return (
          <li
            className={`attestationTypeCard ${i.disabled && 'disabled'}`}
            key={i.name}
          >
            <div className="top">
              <img src={i.icon[theme]} alt="" className="typeIcon" />
              <div className="typeName">{i.name}</div>
            </div>
            <div className="bottom">
              <PButton
                className="createBtn"
                text="Create"
                type="text"
                onClick={() => {
                  handleClick(i);
                }}
                disabled={i.disabled}
              />
            </div>
          </li>
        );
      })}
      {/* <li className="attestationTypeCard addCard" onClick={handleAdd}>
        <PButton
          text="Create new attestations"
          type="text2"
          onClick={() => {}}
          prefix={<i className="iconfont icon-Add"></i>}
          className="createBtn"
        />
      </li> */}
    </ul>
  );
});

export default Cards;
