import React, { memo, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ATTESTATIONTYPELIST } from '@/config/attestation';
import PButton from '@/newComponents/PButton';
import './index.scss';

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
  
  const supportList = useMemo(() => {
    return ATTESTATIONTYPELIST.filter((i) => !i.disabled);
  }, []);

  const handleAdd = () => {};
  return (
    <ul className="allAttestationTypeCards">
      {supportList.map((i) => {
        return (
          <li
            className="attestationTypeCard"
            key={i.name}
            onClick={() => {
              onClick(i);
            }}
          >
            <div className="top">
              <img src={i.icon} alt="" className="typeIcon" />
              <div className="typeName">{i.name}</div>
            </div>
            <div className="bottom">
              <PButton
                className="createBtn"
                text="Create"
                type="text"
                onClick={() => {onClick(i);}}
              />
            </div>
          </li>
        );
      })}
      <li className="attestationTypeCard addCard" onClick={handleAdd}>
        <PButton
          text="Create new attestations"
          type="text2"
          onClick={() => {}}
          prefix={<i className="iconfont icon-Add"></i>}
          className="createBtn"
        />
      </li>
    </ul>
  );
});

export default Cards;
