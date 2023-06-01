import React, { useEffect, useState, useMemo, useCallback } from 'react';
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
  onSubmit: (name: string) => void;
  onCancel: () => void;
  title: string;
  desc: string;
  list: ToolItem[];
  showButtonSuffixIcon?: boolean;
  tip: string;
  checked?: boolean;
  backable?: boolean;
  headerType?: string;
}

const TransferToChainDialog: React.FC<TransferToChainDialogProps> = (props) => {
  const {
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
  } = props;
  const [activeName, setActiveName] = useState<string>();
  const [errorTip, setErrorTip] = useState<string>();
  const handleClickNext = () => {
    if (!activeName) {
      setErrorTip(tip);
      return;
    }
    onSubmit(activeName);
  };
  const handleClickBack = () => {
    onCancel();
  };
  const handleClickNetwork = (item: ToolItem | undefined) => {
    if (item?.disabled) {
      return
    }
    if (item?.title === activeName) {
      setActiveName(undefined);
    } else {
      setActiveName(item?.title);
      setErrorTip(undefined);
    }
  };

  const activeList = useMemo(() => {
    return list.filter((item,idx) => idx !== 0);
  }, [list]);
  useEffect(() => {
    // setActiveTool(list[0]);
    // setActiveName(list[0].title)
  }, [list]);
  const liClassName = useCallback(
    (item: ToolItem) => {
      let liCN = 'networkItem';
      if (item?.title === activeName) {
        liCN += ' active';
      }
      if (item?.disabled) {
        liCN += ' disabled';
      }
      return liCN;
    },
    [activeName]
  );
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
          <h6>Continue with</h6>
          <div
            className={liClassName(list[0])}
            onClick={() => handleClickNetwork(list[0])}
          >
            <img src={list[0]?.icon} alt="" />
          </div>
          <div className="dividerWrapper">
            <i></i>
            <div className="divider">or</div>
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
};

export default TransferToChainDialog;
