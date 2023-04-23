import React, { useEffect, useState, useMemo } from 'react';
// import { connect } from 'react-redux'
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
  showButtonSuffixIcon?: boolean
}

const TransferToChainDialog: React.FC<TransferToChainDialogProps> = (props) => {
  const { onClose, onSubmit, onCancel, title, desc, list, showButtonSuffixIcon = false } = props
  const [activeTool, setActiveTool] = useState<ToolItem>()
  const handleClickNext = () => {
    onSubmit()
  }
  const handleClickBack = () => {
    onCancel()
  }
  const handleClickNetwork = (item: ToolItem) => {
    // setActiveTool(item)
  }

  const activeList = useMemo(() => {
    return list.filter(item => item.title !== activeTool?.title)
  }, [list, activeTool])
  useEffect(() => {
    setActiveTool(list[0])
  }, [list])


  return (
    <PMask onClose={onClose}>
      <div className="padoDialog TransferToChainDialog">
        <main>
          <AuthInfoHeader onBack={handleClickBack} checked={true} />
          <h1>{title}</h1>
          <h2>{desc}</h2>
          <h6>Continue with</h6>
          <div className="activeNetwork networkItem">
            <img src={activeTool?.icon} alt="ETH" />
          </div>
          <div className="dividerWrapper">
            <i></i>
            <div className="divider">or</div>
            <i></i>
          </div>
          <ul className="networkList">
            {activeList.map(item => {
              return (<li className="networkItem" key={item.title} onClick={() => handleClickNetwork(item)}>
                <img src={item.icon} alt="" />
              </li>)
            })}
          </ul>
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
// export default connect((store) => store, {})(TransferToChainDialog);
