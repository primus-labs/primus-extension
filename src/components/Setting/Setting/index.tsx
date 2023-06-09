import React, { useState, useMemo, useEffect } from 'react';
import './index.sass';
import PMask from '@/components/PMask';
import { formatAddress } from '@/utils/utils';

import iconArrow from '@/assets/img/iconArrowLeft2.svg';
import SettingDialog from '@/components/Setting/SettingDialog';
import ResetPassword from '@/components/Setting/ResetPassword';
interface SettingProps {
  visible: boolean;
}

const Setting: React.FC<SettingProps> = ({ visible }) => {
  // const [settingDialogVisible, setSettingDialogVisible] =
  //   useState<boolean>(false);
  const [resetPwdDialogVisible, setResetPwdDialogVisible] =
    useState<boolean>(false);
  const onCloseSettingDialog = () => {};
  const onChange = (settingType: string) => {
    switch (settingType) {
      case 'Change Password':
        setResetPwdDialogVisible(true);
        break;
      case 'Back up on-chain address':
        break;
      case 'Manage your data':
        break;
      case 'Privacy Policy':
        break;
      case 'Back up on-chain addressPADO Support':
        break;
      default:
        break;
    }
  };
  useEffect(() => {
    console.log('1', resetPwdDialogVisible);
  }, [resetPwdDialogVisible]);
  return (
    <>
      {visible && (
        <SettingDialog onClose={onCloseSettingDialog} onChange={onChange} />
      )}
      {resetPwdDialogVisible && (
        <ResetPassword onClose={() => {}} onSubmit={() => {}} />
      )}
    </>
  );
};

export default Setting;
