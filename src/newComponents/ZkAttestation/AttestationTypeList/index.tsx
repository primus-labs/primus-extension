import React, { memo, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ATTESTATIONTYPELIST } from '@/config/attestation';
import PButton from '@/newComponents/PButton';
import './index.scss';
import { useSelector } from 'react-redux';
import type { UserState } from '@/types/store';
import { BASEVENTNAME } from '@/config/events';

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
  const webProofTypes = useSelector(
    (state: UserState) => state.webProofTypes
  );

  const handleDocusign = async () => {
    const currentWindowTabs = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    const currRequestTemplate = webProofTypes.find(
      (i) =>
        i.dataSource === 'docusign'
    );
    await chrome.runtime.sendMessage({
      type: 'pageDecode',
      name: 'init',
      params: {
        ...currRequestTemplate,
      },
      extensionTabId: currentWindowTabs[0].id,
      operation: 'attest',
    });
  };
  const handleAdd = () => {};
  return (
    <ul className="allAttestationTypeCards">
      {supportList.map((i) => {
        return (
          <li
            className="attestationTypeCard"
            key={i.name}
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
      {/*todo remove*/}
      <li><PButton text={'Docusign Attestation'} onClick={handleDocusign}></PButton>
      </li>
    </ul>
  );
});

export default Cards;
