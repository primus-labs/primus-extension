import React, { useEffect, useState, useMemo, useCallback, memo } from 'react';
import { useSearchParams } from 'react-router-dom';

import AuthInfoHeader from '@/components/DataSourceDetail/AuthInfoHeader';
import PMask from '@/components/PMask';
import PBack from '@/components/PBack';
import AddressInfoHeader from '@/components/Cred/AddressInfoHeader';
import PolygonIdAddressInfoHeader from '@/components/Cred/PolygonIdAddressInfoHeader';
import SourceGroup from '@/components/DataSourceOverview/SourceGroups/SourceGroup';
import rightArrow from '@/assets/img/rightArrow.svg';

import './index.sass';

type ToolItem = {
  icon: any;
  name: any;
  value: any;
  title: string;
  showName: string;
  disabled?: boolean;
};
interface TransferToChainDialogProps {
  onClose: () => void;
  onSubmit: (name?: string) => void;
  onCancel: () => void;
  title: string;
  desc: string;
  list: ToolItem[];
  showButtonSuffixIcon?: boolean;
  tip: string;
  checked?: boolean;
  backable?: boolean;
  headerType?: string;
  listTitle?: string;
  listSeparator?: string;
  requireItem?: boolean;
  address?: string;
}

const TransferToChainDialog: React.FC<TransferToChainDialogProps> = memo(
  ({
    onClose,
    onSubmit,
    onCancel,
    title,
    desc,
    list,
    showButtonSuffixIcon = false,
    tip,
    checked = true,
    backable = true,
    headerType = 'dataSource',
    listTitle = 'Continue with',
    listSeparator = 'or',
    requireItem = true,
    address,
  }) => {
    const [searchParams] = useSearchParams();
    const fromEvents = searchParams.get('fromEvents');
    const [activeName, setActiveName] = useState<string>();
    const [errorTip, setErrorTip] = useState<string>();
   
    const activeSourceList = useMemo(() => {
      const newL = list.map(i => {
        const j:any= { ...i }
        j.value = i.title
        j.name = i.showName
        return j
      })
      return newL
    }, [list]);

    const handleClickBack = useCallback(() => {
      onCancel();
    }, [onCancel]);

    const handleClickNext = () => {
      if (requireItem) {
        if (!activeName) {
          setErrorTip(tip);
          return;
        }
        onSubmit(activeName);
      } else {
        onSubmit();
      }
    };
  
    const wrapperClassName = useMemo(() => {
      let defaultCN = 'padoDialog TransferToChainDialog';
      if (headerType === 'attestation') {
        defaultCN += ' attestationUpChainDialog';
      }
      if (headerType === 'attestation') {
        defaultCN += ' polygonIdAttestationUpChainDialog';
      }
      return defaultCN;
    }, [headerType]);
    const onChange = useCallback(
      (i: any) => {
        // console.log('222222onChange', i);
        if (!requireItem) {
          return;
        }
        if (i?.disabled) {
          return;
        }
        if (i?.value === activeName) {
          setActiveName(undefined);
        } else {
          setActiveName(i?.value);
          setErrorTip(undefined);
        }
      },
      [,requireItem]
    );
    return (
      <PMask onClose={onClose} closeable={!fromEvents}>
        <div className={wrapperClassName}>
          {!!backable && <PBack onBack={handleClickBack} />}
          <main>
            {headerType === 'dataSource' && (
              <AuthInfoHeader checked={checked} />
            )}
            {headerType === 'attestation' && (
              <AddressInfoHeader address={address as string} />
            )}
            {headerType === 'polygonIdAttestation' && (
              <PolygonIdAddressInfoHeader address={address as string} />
            )}
            <h1>{title}</h1>
            <h2>{desc}</h2>
            <SourceGroup
              onChange={
                onChange}
              list={activeSourceList}
            />
            {/* <ul className="networkList">
              {topList.map((item) => {
                return (
                  <li
                    className={liClassName(item)}
                    key={item.title}
                    onClick={() => handleClickNetwork(item)}
                  >
                    <img src={item.icon} alt="" />
                  </li>
                );
              })}
            </ul> */}
            {/* <div
              className={liClassName(list[0])}
              onClick={() => handleClickNetwork(list[0])}
            >
              <img src={list[0]?.icon} alt="" />
            </div> */}
            {/* <div className="dividerWrapper">
              <i></i>
              <div className="divider">{listSeparator}</div>
              <i></i>
            </div>
            <ul className="networkList">
              {activeList.map((item) => {
                return (
                  <li
                    className={liClassName(item)}
                    key={item.title}
                    onClick={() => handleClickNetwork(item)}
                  >
                    <img src={item.icon} alt="" />
                  </li>
                );
              })}
            </ul> */}
          </main>
          <button className="nextBtn" onClick={handleClickNext}>
            {errorTip && (
              <div className="tipWrapper">
                <div className="errorTip">{errorTip}</div>
              </div>
            )}
            <span>Next</span>
            {showButtonSuffixIcon && <img src={rightArrow} alt="" />}
          </button>
        </div>
      </PMask>
    );
  }
);

export default TransferToChainDialog;
