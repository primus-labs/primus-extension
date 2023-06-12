import React, { useState, useMemo, useEffect } from 'react';
import './index.sass';
import PMask from '@/components/PMask';
import { formatAddress } from '@/utils/utils';

import iconArrow from '@/assets/img/iconArrowLeft2.svg';
import SettingDialog from '@/components/Setting/SettingDialog';
import ResetPassword from '@/components/Setting/ResetPassword';
import ExportAddress from '@/components/Setting/ExportAddress';
import AddSourceSucDialog from '@/components/DataSourceOverview/AddSourceSucDialog';

interface SettingProps {
  visible: boolean;
}

const Setting: React.FC<SettingProps> = ({ visible }) => {
  // const [settingDialogVisible, setSettingDialogVisible] =
  //   useState<boolean>(false);
  const [resetPwdDialogVisible, setResetPwdDialogVisible] =
    useState<boolean>(false);
  const [resetPwdSucDialogVisible, setResetPwdSucDialogVisible] =
    useState<boolean>(false);
  const [exportAddressDialogVisible, setExportAddressDialogVisible] =
    useState<boolean>(false);
  const onCloseSettingDialog = () => {};
  const onChange = (settingType: string) => {
    switch (settingType) {
      case 'Change Password':
        setResetPwdDialogVisible(true);
        break;
      case 'Back up on-chain address':
        setExportAddressDialogVisible(true);
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
  const onSubmitResetPwdDialog = () => {
    setResetPwdDialogVisible(false);
    setResetPwdSucDialogVisible(true);
  };
  const onSubmitResetPwdSucDialog = () => {
    setResetPwdSucDialogVisible(false);
  };

  return (
    <>
      {visible && (
        <SettingDialog onClose={onCloseSettingDialog} onChange={onChange} />
      )}
      {resetPwdDialogVisible && (
        <ResetPassword
          onClose={() => {
            setResetPwdDialogVisible(false);
          }}
          onSubmit={onSubmitResetPwdDialog}
        />
      )}
      {resetPwdSucDialogVisible && (
        <AddSourceSucDialog
          headerType="setting"
          type="suc"
          title="Congratulations"
          desc="Your password has been setup."
          onClose={() => {
            setResetPwdSucDialogVisible(false);
          }}
          onSubmit={onSubmitResetPwdSucDialog}
        />
      )}
      {exportAddressDialogVisible && (
        <ExportAddress
          onClose={() => {
            setExportAddressDialogVisible(false);
          }}
          onSubmit={() => {
            setExportAddressDialogVisible(false);
          }}
        />
      )}
    </>
  );
};

export default Setting;
