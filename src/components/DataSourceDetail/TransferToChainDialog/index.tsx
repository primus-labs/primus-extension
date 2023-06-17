import React, { useEffect, useState, useMemo, useCallback, memo } from 'react';

import AuthInfoHeader from '@/components/DataSourceDetail/AuthInfoHeader';
import PMask from '@/components/PMask';
import AddressInfoHeader from '@/components/Cred/AddressInfoHeader';
import rightArrow from '@/assets/img/rightArrow.svg';

import './index.sass';

type ToolItem = {
  icon: any;
  title: any;
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
  }) => {
    const [activeName, setActiveName] = useState<string>();
    const [errorTip, setErrorTip] = useState<string>();

    const activeList = useMemo(() => {
      return list.filter((item, idx) => idx !== 0);
    }, [list]);

    const liClassName = useCallback(
      (item: ToolItem) => {
        let liCN = 'networkItem';
        if (!requireItem) {
          liCN += ' forbid';
        }
        if (item?.title === activeName) {
          liCN += ' active';
        }
        if (item?.disabled) {
          liCN += ' forbid';
          liCN += ' disabled';
        }
        return liCN;
      },
      [activeName, requireItem]
    );
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
    const handleClickNetwork = (item: ToolItem | undefined) => {
      if (!requireItem) {
        return;
      }
      if (item?.disabled) {
        return;
      }
      if (item?.title === activeName) {
        setActiveName(undefined);
      } else {
        setActiveName(item?.title);
        setErrorTip(undefined);
      }
    };

    // useEffect(() => {
    // setActiveTool(list[0]);
    // setActiveName(list[0].title)
    // }, [list]);

    return (
      <PMask onClose={onClose}>
        <div
          className={
            headerType === 'attestation'
              ? 'padoDialog TransferToChainDialog'
              : 'padoDialog TransferToChainDialog attestationUpChainDialog'
          }
        >
          <main>
            {headerType === 'dataSource' && (
              <AuthInfoHeader
                onBack={handleClickBack}
                checked={checked}
                backable={backable}
              />
            )}
            {headerType === 'attestation' && <AddressInfoHeader />}
            <h1>{title}</h1>
            <h2>{desc}</h2>
            <h6>{listTitle}</h6>
            <div
              className={liClassName(list[0])}
              onClick={() => handleClickNetwork(list[0])}
            >
              <img src={list[0]?.icon} alt="" />
            </div>
            <div className="dividerWrapper">
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
            </ul>
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
