import React, { useState } from 'react';
import PInput from '@/components/PInput/index';
import Bridge from '@/components/Bridge/index';
import PMask from '@/components/PMask';
import './index.sass';
// import PLoading from '@/components/PLoading'
import type { DataFieldItem } from '@/components/DataSourceOverview/DataSourcesDialog';

export type GetDataFormProps = {
  name: string;
  apiKey: string;
  secretKey: string;
  passphase?: string;
};
interface ConnectDataDialogProps {
  onClose: () => void;
  activeSource?: DataFieldItem;
  onSubmit: (form: GetDataFormProps) => void;
  loading?: boolean;
}

const ConnectDataDialog: React.FC<ConnectDataDialogProps> = ({
  onClose,
  onSubmit,
  activeSource,
  loading = false,
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
    setSubmitted(true)
    if (loading) {
      return;
    }
    if (!apiKey || !secretKey || (requirePassphase && !passphase)) {
      return;
    }
    setSubmitted(false)
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

  const handleChangeApiKey = (val: string) => {
    setApiKey(val);
  };
  const handleChangeSecretKey = (val: string) => {
    setSecretKey(val);
  };
  const handleChangePassphase = (val: string) => {
    setPassphase(val);
  };
  const handleChangeLabel = (val: string) => {
    setLabel(val);
  };

  return (
    <PMask onClose={onClose}>
      <div className="padoDialog connectDataSourceDialog">
        <main>
          <div
            className={requirePassphase ? 'scrollList scroll' : 'scrollList'}
          >
            <h1>Connect Data Source</h1>
            {/* {loading && <div className="loadingSection">
              <PLoading />
              <h1 className="title">Data being requested</h1>
              <h2 className="desc">It may take a few minutes</h2>
            </div >} */}
            {!loading && (
              <>
                <h2>
                  Please configure with your READ-ONLY API keys. PADO never
                  accesses to your API keys or your data.
                </h2>
                <Bridge endIcon={icon} />
                <div className="formItem firstFormItem">
                  <h6>API Key</h6>
                  <PInput
                    key="apiKey"
                    type="text"
                    placeholder="Please enter your API Key"
                    onChange={handleChangeApiKey}
                  />
                </div>
                {submitted && !apiKey && (
                      <p className="errorTip">
                        Please enter your API Key
                      </p>
                    )}
                <div className="formItem">
                  <h6>Secret Key</h6>
                  <PInput
                    key="secretKey"
                    type="password"
                    placeholder="Please enter your Secret Key"
                    onChange={handleChangeSecretKey}
                    visible
                  />
                </div>
                {submitted && !secretKey && (
                      <p className="errorTip">
                        Please enter your Secret Key
                      </p>
                    )}
                {requirePassphase && (
                  <>
                    <div className="formItem">
                      <h6>Passphase</h6>
                      <PInput
                        key="passPhase"
                        type="password"
                        placeholder="Please enter your Passphase"
                        onChange={handleChangePassphase}
                        visible
                      />
                    </div>
                    {submitted && !passphase && (
                      <p className="errorTip">
                        Please enter your Passphase
                      </p>
                    )}
                  </>
                )}
                <div className="formItem lastFormItem">
                  <h6>Label API Key (Optional)</h6>
                  <PInput
                    key="label"
                    placeholder="Please enter your API key label"
                    onChange={handleChangeLabel}
                  />
                </div>
                {/* {submitted && !label && (
                  <p className="errorTip">Please enter your API key label</p>
                )} */}
                <div className="tipWrapper">
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
};

export default ConnectDataDialog;
