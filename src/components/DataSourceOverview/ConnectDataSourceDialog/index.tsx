import React, { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import PControledInput from '@/components/PControledInput';
import PInput from '@/components/PInput';
import Bridge from '@/components/DataSourceOverview/Bridge/index';
import PMask from '@/components/PMask';
import PButton from '@/components/PButton';
import PBack from '@/components/PBack';
// import iconTooltip from '@/assets/img/credit/iconTooltip.svg'
import IconTooltip from '@/components/Icons/IconTooltip';
import './index.scss';

import type { DataFieldItem } from '@/components/DataSourceOverview/DataSourcesDialog';

export type GetDataFormProps = {
  name: string;
  apiKey: string;
  secretKey: string;
  passphase?: string;
  label?: string;
};
interface ConnectDataDialogProps {
  onClose: () => void;
  activeSource?: DataFieldItem;
  onSubmit: (form: GetDataFormProps) => void;
  loading?: boolean;
  onCancel: () => void;
  activeSourceKeys?: GetDataFormProps;
}
const guideMap = {
  Binance:
    'https://docs.padolabs.org/Exchanges-API-Setup/Binance-API-Key-Setup',
  Coinbase:
    'https://docs.padolabs.org/Exchanges-API-Setup/Coinbase-API-Key-Setup',
  KuCoin: 'https://docs.padolabs.org/Exchanges-API-Setup/Kucoin-API-Key-Setup',
  Bybit: 'https://docs.padolabs.org/Exchanges-API-Setup/Bybit-API-Key-Setup',
  OKX: 'https://docs.padolabs.org/Exchanges-API-Setup/OKX-API-Key-Setup',
  Gate: 'https://docs.padolabs.org/Exchanges-API-Setup/Gate-API-Key-Setup',
  Huobi: 'https://docs.padolabs.org/Exchanges-API-Setup/Huobi-API-Key-Setup',
  Bitget: 'https://docs.padolabs.org/Exchanges-API-Setup/Bitget-API-Key-Setup',
  MEXC: 'https://docs.padolabs.org/Exchanges-API-Setup/MEXC-API-Key-Setup',
};

const ConnectDataDialog: React.FC<ConnectDataDialogProps> = memo(
  ({
    onClose,
    onSubmit,
    activeSource,
    loading = false,
    onCancel,
    activeSourceKeys,
  }) => {
    const [searchParams] = useSearchParams();
    const fromEvents = searchParams.get('fromEvents');
    const requirePassphase = activeSource?.requirePassphase;
    const icon = activeSource?.icon;
    const name = activeSource?.name ?? '';

    const [apiKey, setApiKey] = useState<string>();
    const [secretKey, setSecretKey] = useState<string>();
    const [passphase, setPassphase] = useState<string>();
    const [label, setLabel] = useState<string>();
    const [submitted, setSubmitted] = useState<boolean>(false);

    const activeGuideUrl = useMemo(() => {
      if (name) {
        return guideMap[name as keyof typeof guideMap];
      } else {
        return '';
      }
    }, [name]);
    const handleClickNext = () => {
      setSubmitted(true);
      if (loading) {
        return;
      }
      if (!apiKey || !secretKey || (requirePassphase && !passphase)) {
        return;
      }
      setSubmitted(false);
      const form = {
        name: name.toLowerCase(),
        apiKey,
        secretKey,
        passphase,
        label,
      };
      requirePassphase && (form.passphase = passphase);
      onSubmit(form);
    };

    const handleChangeApiKey = useCallback((val: string) => {
      setApiKey(val);
    }, []);
    const handleChangeSecretKey = useCallback((val: string) => {
      setSecretKey(val);
    }, []);
    const handleChangePassphase = useCallback((val: string) => {
      setPassphase(val);
    }, []);
    const handleChangeLabel = useCallback((val: string) => {
      setLabel(val);
    }, []);

    useEffect(() => {
      if (activeSourceKeys) {
        const { apiKey, secretKey, passphase, label } = activeSourceKeys;
        setApiKey(apiKey);
        setSecretKey(secretKey);
        passphase && setPassphase(passphase);
        label && setLabel(label);
      }
    }, [activeSourceKeys]);
    const onClickApiKeyTip = useCallback(() => {
      window.open(activeGuideUrl);
    }, [activeGuideUrl]);

    return (
      <PMask onClose={onClose} closeable={!fromEvents}>
        <div className="padoDialog connectDataSourceDialog">
          <PBack onBack={onCancel} />
          <main>
            <Bridge endIcon={icon} />
            <header>
              <h1>Connect Your Data</h1>
              <h2>Please configure with your READ-ONLY API keys.</h2>
            </header>
            <div className="scrollList scroll formContent">
              <PInput
                key="apiKey"
                type="text"
                placeholder="Please enter your API Key"
                onChange={handleChangeApiKey}
                value={apiKey}
                label="API Key"
                tooltip={{ link: activeGuideUrl }}
                errorTip={
                  submitted && !apiKey ? 'Please enter your API Key' : undefined
                }
              />
              <PInput
                key="secretKey"
                type="password"
                placeholder="Please enter your Secret Key"
                onChange={handleChangeSecretKey}
                value={secretKey}
                visible
                label="Secret Key"
                errorTip={
                  submitted && !secretKey
                    ? 'Please enter your Secret Key'
                    : undefined
                }
              />
              {requirePassphase && (
                <PInput
                  key="passPhase"
                  type="password"
                  placeholder="Please enter your Passphrase"
                  onChange={handleChangePassphase}
                  value={passphase}
                  visible
                  label="Passphrase"
                  errorTip={
                    submitted && !passphase
                      ? 'Please enter your Passphrase'
                      : undefined
                  }
                />
              )}
              <PInput
                key="label"
                placeholder="Please set your Label"
                onChange={handleChangeLabel}
                value={label}
                label="Label (Optional)"
              />
            </div>
          </main>
          <PButton text="Next" onClick={handleClickNext}></PButton>
        </div>
      </PMask>
    );
  }
);

export default ConnectDataDialog;
