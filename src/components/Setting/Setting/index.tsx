import React, { useState, useMemo, useEffect } from 'react';
import './index.sass';
import SettingDialog from '@/components/Setting/SettingDialog';
import ResetPasswordDialog from '@/components/Setting/ResetPasswordDialog';
import ExportWalletDialog from '@/components/Setting/ExportWalletDialog';
import ManageDataDialog from '@/components/Setting/ManageDataDialog';
import AddSourceSucDialog from '@/components/DataSourceOverview/AddSourceSucDialog';

interface SettingProps {
  visible: boolean;
  onClose: () => void;
}

const Setting: React.FC<SettingProps> = ({ visible, onClose }) => {
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
      case 'PADO Support':
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
        <ResetPasswordDialog
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
        <ExportWalletDialog
          onClose={() => {
            setExportAddressDialogVisible(false);
          }}
          onSubmit={() => {
            setExportAddressDialogVisible(false);
          }}
        />
      )}
      {manageDataDialogVisible && (
        <ManageDataDialog
          onClose={() => {
            setManageDataDialogVisible(false);
          }}
          onSubmit={() => {
            setManageDataDialogVisible(false);
          }}
        />
      )}
    </>
  );
};

export default Setting;
