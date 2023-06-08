import React from 'react';
import './index.sass';
import iconSuc from '@/assets/img/iconSuc.svg';
import iconError from '@/assets/img/iconError.svg';
import iconLoading from '@/assets/img/iconLoading.svg';
import iconInfoColorful from '@/assets/img/iconInfoColorful.svg';
import Bridge from '@/components/DataSourceOverview/Bridge/index';
import PMask from '@/components/PMask';
import type { DataFieldItem } from '@/components/DataSourceOverview/DataSourcesDialog';
import PLoading from '@/components/PLoading';
import AddressInfoHeader from '@/components/Cred/AddressInfoHeader';

interface AddSourceSucDialogProps {
  onClose: () => void;
  activeSource?: DataFieldItem;
  onSubmit: () => void;
  desc?: string;
  title?: string;
  type?: string;
  headerType?: string;
}

const SettingDialog: React.FC<AddSourceSucDialogProps> = ({
  onClose,
  activeSource,
  onSubmit,
  title = 'Congratulations',
  desc = '',
  type = 'suc',
  headerType = 'dataSource',
}) => {
  const icon = activeSource?.icon;
  const handleClickNext = () => {
    onSubmit();
  };
  return (
    <PMask onClose={onClose}>
      <div className='padoDialog settingDialog'>
        <main>
          
        </main>
        <footer>
          
        </footer>
      </div>
    </PMask>
  );
};

export default SettingDialog;
