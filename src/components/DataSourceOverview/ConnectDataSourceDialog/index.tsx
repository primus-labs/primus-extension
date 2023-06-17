import React, { useState, useEffect, memo, useCallback } from 'react';

import PControledInput from '@/components/PControledInput';
import Bridge from '@/components/DataSourceOverview/Bridge/index';
import PMask from '@/components/PMask';
import './index.sass';

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

const ConnectDataDialog: React.FC<ConnectDataDialogProps> = memo(
  ({
    onClose,
    onSubmit,
    activeSource,
    loading = false,
    onCancel,
    activeSourceKeys,
  }) => {
    const requirePassphase = activeSource?.requirePassphase;
    const icon = activeSource?.icon;
    const name = activeSource?.name ?? '';

    const [apiKey, setApiKey] = useState<string>();
    const [secretKey, setSecretKey] = useState<string>();
    const [passphase, setPassphase] = useState<string>();
    const [label, setLabel] = useState<string>();
    const [submitted, setSubmitted] = useState<boolean>(false);

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

    return (
      <PMask onClose={onClose}>
        <div className="padoDialog connectDataSourceDialog">
          <div className="iconBack" onClick={onCancel}></div>
          <main>
            <div className="scrollList scroll">
              <Bridge endIcon={icon} />
              <h1>Connect Data Source</h1>
              {!loading && (
                <>
                  <h2>
                    Please configure with your READ-ONLY API keys. PADO never
                    accesses to your API keys or your data.
                  </h2>

                  <div className="formItem firstFormItem">
                    <h6>API Key</h6>
                    <PControledInput
                      key="apiKey"
                      type="text"
                      placeholder="Please enter your API Key"
                      onChange={handleChangeApiKey}
                      value={apiKey}
                    />
                  </div>
                  {submitted && !apiKey && (
                    <p className="errorTip">Please enter your API Key</p>
                  )}
                  <div className="formItem">
                    <h6>Secret Key</h6>
                    <PControledInput
                      key="secretKey"
                      type="password"
                      placeholder="Please enter your Secret Key"
                      onChange={handleChangeSecretKey}
                      value={secretKey}
                      visible
                    />
                  </div>
                  {submitted && !secretKey && (
                    <p className="errorTip">Please enter your Secret Key</p>
                  )}
                  {requirePassphase && (
                    <>
                      <div className="formItem">
                        <h6>Passphrase</h6>
                        <PControledInput
                          key="passPhase"
                          type="password"
                          placeholder="Please enter your Passphrase"
                          onChange={handleChangePassphase}
                          value={passphase}
                          visible
                        />
                      </div>
                      {submitted && !passphase && (
                        <p className="errorTip">Please enter your Passphrase</p>
                      )}
                    </>
                  )}
                  <div className="formItem lastFormItem">
                    <h6>Label API Key (Optional)</h6>
                    <PControledInput
                      key="label"
                      placeholder="Please enter your API Key Label"
                      onChange={handleChangeLabel}
                      value={label}
                    />
                  </div>
                  <div className="ctipWrapper">
                    <span>How to get API Key & Secret key?</span>
                    <a href="https://padolabs.org/" target="_blank">
                      Click here
                    </a>
                  </div>
                </>
              )}
            </div>
          </main>
          <button className="nextBtn" onClick={handleClickNext}>
            Next
          </button>
        </div>
      </PMask>
    );
  }
);

export default ConnectDataDialog;
