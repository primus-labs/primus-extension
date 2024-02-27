import React, { memo, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ATTESTATIONTYPELIST } from '@/config/attestation';
import dayjs from 'dayjs';
import utc from 'dayjs-plugin-utc';
import { ATTESTATIONTYPEMAP } from '@/config/attestation';
import type { SyntheticEvent } from 'react';

import PTag from '@/newComponents/PTag';
import PButton from '@/newComponents/PButton';
import connectData from '@/assets/newImg/dataSource/connectedData.svg';
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
  onClick?: (item: NavItem) => void;

  // list: NavItem[];
}

const Cards: React.FC<PDropdownProps> = memo(
  ({ onClick = (item: NavItem) => {} }) => {
    const [searchParams] = useSearchParams();
    const dataSourceName = searchParams.get('dataSourceName');
    const supportList = useMemo(() => {
      return ATTESTATIONTYPELIST.filter((i) => !i.disabled);
    }, []);
    const handleDetail = useCallback((i) => {
      onClick && onClick(i);
    }, []);
    return (
      <ul className="allAttestationTypeCards">
        {supportList.map((i) => {
          return (
            <li
              className="attestationTypeCard"
              onClick={() => {
                handleDetail(i);
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
                  onClick={() => {
                    handleDetail(i);
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    );
  }
);

export default Cards;
