import React, { useEffect, useState, useMemo } from 'react';
// import { connect } from 'react-redux'
import rightArrow from '@/assets/img/rightArrow.svg';
import iconChecked from '@/assets/img/iconChecked.svg';
import { getSingleStorageSyncData } from '@/utils/utils'
import './index.sass'

type ToolItem = {
  icon: any;
  title: any
}
interface TransferToChainDialogProps {
  onSubmit: () => void;
  onCancel: () => void;
  // userInfo: object
  title: string;
  desc: string;
  list: ToolItem[];
  headerChecked?: boolean;
  showButtonSuffixIcon?: boolean
}

const TransferToChainDialog: React.FC<TransferToChainDialogProps> = (props) => {
  const { onSubmit, onCancel, title, desc, list, headerChecked = false, showButtonSuffixIcon = false } = props
  const [email, setEmail] = useState<string>()
  const [avatar, setAvatar] = useState<string>()
  const [activeTool, setActiveTool] = useState<ToolItem>()
  const handleClickNext = () => {
    onSubmit()
  }
  const handleClickBack = () => {
    onCancel()
  }
  const handleClickNetwork = (item: ToolItem) => {
    setActiveTool(item)
  }
  const getUserInfo = async () => {
    const userInfo: any = await getSingleStorageSyncData('userInfo');
    if (userInfo) {
      const parseUserInfo = JSON.parse(userInfo)
      const em = parseUserInfo.email
      const { picture } = JSON.parse(parseUserInfo.rawUserInfo);
      setAvatar(picture);

      setEmail(em)
    }
  }
  const activeList = useMemo(() => {
    return list.filter(item => item.title !== activeTool?.title)
  }, [list, activeTool])
  useEffect(() => {
    setActiveTool(list[0])
  }, [list])
  useEffect(() => {
    getUserInfo()
  }, [])

  return (
    <div className="pDialog TransferToChainDialog">
      <main>
        <header className="createAccountDialogHeader">
          <div className="iconBack" onClick={handleClickBack}></div>
          <div className="headerContent">
            {avatar ? <img className="avatar" src={avatar} alt="back" /> : <i></i>}
            <span>{email}</span>
            {/* TODO */}
            {headerChecked && <img className="checked" src={iconChecked} alt="back" />}
          </div>
        </header>
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
  );
};

export default TransferToChainDialog;
// export default connect((store) => store, {})(TransferToChainDialog);
