import React, { useState } from 'react';
import PInput from '@/components/PInput/index'
import Bridge from '@/components/Bridge/index'
import PMask from '@/components/PMask'
import './index.sass'
// import PLoading from '@/components/PLoading'
import type { DataFieldItem } from '@/components/DataSourceOverview/DataSourcesDialog'

export type GetDataFormProps = {
  name: string;
  apiKey: string;
  secretKey: string;
  passphase?: string;
}
interface ConnectDataDialogProps {
  onClose: () => void;
  activeSource?: DataFieldItem;
  onSubmit: (form: GetDataFormProps) => void;
  loading?: boolean;
}

const ConnectDataDialog: React.FC<ConnectDataDialogProps> = ({ onClose, onSubmit, activeSource, loading=false }) => {
  const requirePassphase = activeSource?.requirePassphase
  const icon = activeSource?.icon
  const name = activeSource?.name ?? ''
  const [apiKey, setApiKey] = useState<string>()
  const [secretKey, setSecretKey] = useState<string>()
  const [passphase, setPassphase] = useState<string>()
  const handleClickNext = () => {
    if (loading) {
      return
    }
    if (!apiKey || !secretKey || (requirePassphase && !passphase)) {
      return
    }
    const form = {
      name: name.toLowerCase(),
      apiKey,
      secretKey,
      passphase
    }
    requirePassphase && (form.passphase = passphase)
    onSubmit(form)
  }

  const handleChangeApiKey = (val: string) => {
    setApiKey(val)
  }
  const handleChangeSecretKey = (val: string) => {
    setSecretKey(val)
  }
  const handleChangePassphase = (val: string) => {
    setPassphase(val)
  }

  return (
    <PMask onClose={onClose}>
      <div className="padoDialog connectDataSourceDialog">
        <main>
          <div className={requirePassphase ? "scrollList scroll" : "scrollList"}>
            <h1>Connect Data Source</h1>
            {/* {loading && <div className="loadingSection">
              <PLoading />
              <h1 className="title">Data being requested</h1>
              <h2 className="desc">It may take a few minutes</h2>
            </div >} */}
            {
              !loading && <>
                <h2>Please configure with your READ-ONLY API keys. PADO never accesses to your API keys or your data.</h2>
                <Bridge endIcon={icon} />
                <div className="formItem">
                  <h6>API Key</h6>
                  <PInput key="apiKey" type="text" onChange={handleChangeApiKey}  />
                </div>
                <div className="formItem">
                  <h6>Secret Key</h6>
                  <PInput key="secretKey" type="password" placeholder="Please enter Secret Key" onChange={handleChangeSecretKey}  />
                </div>
                {requirePassphase && <div className="formItem lastFormItem">
                  {/* TODO */}
                  <h6>PassPhase</h6>
                  <PInput key="passPhase" type="password" placeholder="" onChange={handleChangePassphase} visible />
                </div>}
                <div className="tipWrapper">
                  <span>How to get API Key&Secret key?</span>
                  <a href="https://padolabs.org/" target="_blank">Click here</a>
                </div>
              </>}

          </div >
        </main >
        <button className="nextBtn" onClick={handleClickNext}>
          Next
        </button>
      </div >
    </PMask >
  );
};

export default ConnectDataDialog;
