import React, { useEffect, useState, useMemo, useCallback, memo } from 'react';
import { useSearchParams } from 'react-router-dom';

import PMask from '@/components/PMask';
import PBack from '@/components/PBack';
import PButton from '@/components/PButton';
import AddressInfoHeader from '@/components/Cred/AddressInfoHeader';
import SourceGroup from '@/components/DataSourceOverview/SourceGroups/SourceGroup';
import rightArrow from '@/assets/img/rightArrow.svg';
import iconPolygonID from '@/assets/img/iconPolygonID.svg';

import './index.scss';
import PBottomErrorTip from '@/components/PBottomErrorTip';

type ToolItem = {
  icon: any;
  name: any;
  value: any;
  title: string;
  showName: string;
  disabled?: boolean;
};
interface TransferToChainDialogProps {
  onClose: () => void;
  onSubmit: (name?: string) => void;
  onCancel: () => void;
  title: string;
  desc: string;
  list: ToolItem[];
  showButtonSuffixIcon?: boolean;
  tip: string;
  checked?: boolean;
  backable?: boolean;
  headerType?: string;
  listTitle?: string;
  listSeparator?: string;
  requireItem?: boolean;
  address?: string;
}

const TransferToChainDialog: React.FC<TransferToChainDialogProps> = memo(
  ({
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
    listTitle = 'Continue with',
    listSeparator = 'or',
    requireItem = true,
    address,
  }) => {
    const [searchParams] = useSearchParams();
    const fromEvents = searchParams.get('fromEvents');
    const [activeName, setActiveName] = useState<string>();
    const [errorTip, setErrorTip] = useState<string>();
   
    const activeSourceList = useMemo(() => {
      const newL = list.map(i => {
        const j:any= { ...i }
        j.value = i.title
        j.name = i.showName
        return j
      })
      return newL
    }, [list]);

    const handleClickBack = useCallback(() => {
      onCancel();
    }, [onCancel]);

    const handleClickNext = () => {
      if (requireItem) {
        if (!activeName) {
          setErrorTip(tip);
          return;
        }
        onSubmit(activeName);
      } else {
        onSubmit();
      }
    };
  
    const wrapperClassName = useMemo(() => {
      let defaultCN = 'padoDialog TransferToChainDialog';
      if (headerType === 'attestation') {
        defaultCN += ' attestationUpChainDialog';
      }
      if (headerType === 'attestation') {
        defaultCN += ' polygonIdAttestationUpChainDialog';
      }
      return defaultCN;
    }, [headerType]);
    const onChange = useCallback(
      (i: any) => {
        // console.log('222222onChange', i);
        if (!requireItem) {
          return;
        }
        if (i?.disabled) {
          return;
        }
        if (i?.value === activeName) {
          setActiveName(undefined);
        } else {
          setActiveName(i?.value);
          setErrorTip(undefined);
        }
      },
      [,requireItem]
    );
    const closeable = useMemo(() => {
      return (
        !fromEvents ||
        fromEvents === 'Scroll' ||
        fromEvents === 'LINEA_DEFI_VOYAGE'
      );
    }, [fromEvents]);
    return (
      <PMask onClose={onClose} closeable={closeable}>
        <div className={wrapperClassName}>
          {!!backable && <PBack onBack={handleClickBack} />}
          <main>
            {headerType === 'attestation' && (
              <AddressInfoHeader address={address as string} />
            )}
            {headerType === 'polygonIdAttestation' && (
              <AddressInfoHeader
                address={address as string}
                icon={iconPolygonID}
              />
            )}
            <header>
              <h1>{title}</h1>
              <h2>{desc}</h2>
            </header>
            <SourceGroup onChange={onChange} list={activeSourceList} />
          </main>
          <footer>
            <PButton text="Select" onClick={handleClickNext} />
            {errorTip && <PBottomErrorTip text={errorTip} />}
          </footer>
        </div>
      </PMask>
    );
  }
);

export default TransferToChainDialog;
