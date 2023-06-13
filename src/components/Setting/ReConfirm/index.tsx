import React, { useState, useMemo, useEffect } from 'react';
import './index.sass';
import iconInfoColorful from '@/assets/img/iconInfoColorful.svg';
interface SettingProps {
  onCancel: () => void;
  onConfirm: () => void;
}

const Reconfirm: React.FC<SettingProps> = ({ onCancel, onConfirm }) => {
  // const [settingDialogVisible, setSettingDialogVisible] =
  //   useState<boolean>(false);
  const [resetPwdDialogVisible, setResetPwdDialogVisible] =
    useState<boolean>(false);
  const [resetPwdSucDialogVisible, setResetPwdSucDialogVisible] =
    useState<boolean>(false);
  const [exportAddressDialogVisible, setExportAddressDialogVisible] =
    useState<boolean>(false);
  const [manageDataDialogVisible, setManageDataDialogVisible] =
    useState<boolean>(true);
  const onCloseSettingDialog = () => {
    onClose();
  };
  const onChange = (settingType: string) => {
    switch (settingType) {
      case 'Change Password':
        setResetPwdDialogVisible(true);
        break;
      case 'Back up on-chain address':
        setExportAddressDialogVisible(true);
        break;
      case 'Manage your data':
        setManageDataDialogVisible(true);
        break;
      case 'Privacy Policy':
        break;
      case 'Back up on-chain addressPADO Support':
        break;
      default:
        break;
    }
  };
  const onSubmitResetPwdDialog = () => {
    setResetPwdDialogVisible(false);
    setResetPwdSucDialogVisible(true);
  };
  const onSubmitResetPwdSucDialog = () => {
    setResetPwdSucDialogVisible(false);
  };

  return (
    <div className="reconfirm">
      <main className="reconfirmMain">
        <img src={iconInfoColorful} alt="" />
        <p className="title">Are you sure to delete?</p>
        <p className="desc">
          To re-connect, you will need to go through the process again.
        </p>
      </main>
      <footer className="reconfirmFooter">
        <button onClick={onCancel}>Cancel</button>
        <button onClick={onConfirm}>Delete</button>
      </footer>
    </div>
  );
};

export default Reconfirm;
