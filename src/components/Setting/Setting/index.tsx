import React, { useState, useCallback,memo } from 'react';
import { useNavigate } from 'react-router-dom';


import SettingDialog from '@/components/Setting/SettingDialog';
import ResetPasswordDialog from '@/components/Setting/ResetPasswordDialog';
import ExportWalletDialog from '@/components/Setting/ExportWalletDialog';
import ManageDataDialog from '@/components/Setting/ManageDataDialog';
import AddSourceSucDialog from '@/components/DataSourceOverview/AddSourceSucDialog';
import './index.scss';

interface SettingProps {
  onClose: () => void;
}

const Setting: React.FC<SettingProps> = memo(({ onClose }) => {
  const navigate = useNavigate();
  const [resetPwdDialogVisible, setResetPwdDialogVisible] =
    useState<boolean>(false);
  const [resetPwdSucDialogVisible, setResetPwdSucDialogVisible] =
    useState<boolean>(false);
  const [exportAddressDialogVisible, setExportAddressDialogVisible] =
    useState<boolean>(false);
  const [manageDataDialogVisible, setManageDataDialogVisible] =
    useState<boolean>(false);
  const onCloseSettingDialog = useCallback(() => {
    onClose();
  }, [onClose]);
  const onChange = useCallback((settingType: string) => {
    switch (settingType) {
      case 'Change Password':
        setResetPwdDialogVisible(true);
        break;
      case 'Backup Account':
        setExportAddressDialogVisible(true);
        break;
      case 'Manage Data':
        setManageDataDialogVisible(true);
        break;
      // case 'Privacy Policy':
      //   break;
      // case 'PADO Support':
      //   break;
      default:
        break;
    }
  }, []);
  const onSubmitResetPwdDialog = useCallback(() => {
    setResetPwdDialogVisible(false);
    setResetPwdSucDialogVisible(true);
  }, []);
  const onSubmitResetPwdSucDialog = useCallback(() => {
    navigate('/lock');
  }, [navigate]);
  const onCloseDialog = useCallback(() => {
    onClose();
  }, [onClose]);
  const onBackResetPasswordDialog = useCallback(() => {
    setResetPwdDialogVisible(false);
  }, []);

  const onBackExportWalletDialog = useCallback(() => {
    setExportAddressDialogVisible(false);
  }, []);
  const onBackManageDataDialog = useCallback(() => {
    setManageDataDialogVisible(false);
  }, []);

  return (
    <div className="mySetting">
      {!resetPwdDialogVisible &&
        !resetPwdSucDialogVisible &&
        !exportAddressDialogVisible &&
        !manageDataDialogVisible && (
          <SettingDialog onClose={onCloseSettingDialog} onChange={onChange} />
        )}

      {resetPwdDialogVisible && (
        <ResetPasswordDialog
          onClose={onCloseDialog}
          onSubmit={onSubmitResetPwdDialog}
          onBack={onBackResetPasswordDialog}
        />
      )}
      {resetPwdSucDialogVisible && (
        <AddSourceSucDialog
          headerEl={<div className="holderH"></div>}
          type="suc"
          title="Congratulations"
          desc="Your password has been setup."
          onClose={onSubmitResetPwdSucDialog}
          onSubmit={onSubmitResetPwdSucDialog}
        />
      )}
      {exportAddressDialogVisible && (
        <ExportWalletDialog
          onBack={onBackExportWalletDialog}
          onClose={onCloseDialog}
          onSubmit={onCloseDialog}
        />
      )}
      {manageDataDialogVisible && (
        <ManageDataDialog
          onClose={onCloseDialog}
          onBack={onBackManageDataDialog}
          onSubmit={onCloseDialog}
        />
      )}
    </div>
  );
});

export default Setting;
