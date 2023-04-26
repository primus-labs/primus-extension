import React, { useEffect, useState, useMemo } from 'react';
import AuthInfoHeader from '@/components/AuthInfoHeader'
import PMask from '@/components/PMask'
import rightArrow from '@/assets/img/rightArrow.svg';
import iconChecked from '@/assets/img/iconChecked.svg';
import { getSingleStorageSyncData } from '@/utils/utils'
import './index.sass'

type ToolItem = {
  icon: any;
  title: any
}
interface TransferToChainDialogProps {
  onClose: () => void;
  onSubmit: () => void;
  onCancel: () => void;
  // userInfo: object
  title: string;
  desc: string;
  list: ToolItem[];
  showButtonSuffixIcon?: boolean;
  tip: string;
}

const TransferToChainDialog: React.FC<TransferToChainDialogProps> = (props) => {
  const { onClose, onSubmit, onCancel, title, desc, list, showButtonSuffixIcon = false ,tip} = props
  const [activeTool, setActiveTool] = useState<ToolItem>()
  const [activeName, setActiveName] = useState<string>()
  const [errorTip, setErrorTip] = useState<string>()
  const handleClickNext = () => {
    if(!activeName) {
      setErrorTip(tip)
      return
    }
    onSubmit()
  }
  const handleClickBack = () => {
    
    onCancel()
  }
  const handleClickNetwork = (item: ToolItem |undefined) => {
    if (item?.title === activeName) {
      setActiveName(undefined)
    } else {
      setActiveName(item?.title)
      setErrorTip(undefined)
    }
  }

  const activeList = useMemo(() => {
    return list.filter(item => item.title !== activeTool?.title)
  }, [list, activeTool])
  useEffect(() => {
    setActiveTool(list[0])
    // setActiveName(list[0].title)
  }, [list])


  return (
    <PMask onClose={onClose}>
      <div className="padoDialog TransferToChainDialog">
        <main>
          <AuthInfoHeader onBack={handleClickBack} checked={true} />
          <h1>{title}</h1>
          <h2>{desc}</h2>
          <h6>Continue with</h6>
          <div
            className={activeTool?.title===activeName ? "activeNetwork networkItem active": "activeNetwork networkItem"}
            onClick={() => handleClickNetwork(activeTool)}>
            <img src={activeTool?.icon} alt="ETH" />
          </div>
          <div className="dividerWrapper">
            <i></i>
            <div className="divider">or</div>
            <i></i>
          </div>
          <ul className="networkList">
            {activeList.map(item => {
              return (<li className={item.title===activeName ? "networkItem active": "networkItem"} key={item.title} onClick={() => handleClickNetwork(item)}>
                <img src={item.icon} alt="" />
              </li>)
            })}
          </ul>
          {errorTip && <div className="errorTip">
            {errorTip}
          </div>}
        </main>
        <button className="nextBtn" onClick={handleClickNext}>
          <span>Next</span>
          {showButtonSuffixIcon && <img src={rightArrow} alt="right arrow" />}
        </button>
      </div>
    </PMask>
  );
};

export default TransferToChainDialog;