import React, { useState } from 'react';
import type { ChangeEvent } from 'react';
import type { DataSourceType } from '../AssetsDetail'
import { getCurrentDate } from '@/utils/utils'
import PMask from '@/components/PMask'

import './index.sass'

interface GetDataDialogProps {
  onClose: () => void;
  dataSource?: DataSourceType;
  onSubmit: (proofs: string[]) => void
}

const CreateAttesationDialog: React.FC<GetDataDialogProps> = ({ onClose, onSubmit, dataSource }) => {
  console.log('CreateAttesationDialog', dataSource)
  const [list, setList] = useState([
    {
      label: 'User Qualification Proof ',
      value: 'L1 User',
      disabled: false,
      defaultValue: false
    },
    {
      label: 'Assets Balance Proof',
      value: '> $1000',
      disabled: false,
      defaultValue: false
    },
    {
      label: 'PADO Signature',
      value: 'Required',
      disabled: true,
      defaultValue: true
    },
  ])
  const [proofs, setProofs] = useState<string[]>(['PADO Signature'])
  const handleClickNext = () => {
    onSubmit(proofs)
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>, label: string) => {
    // console.log(e, label)
    const curChecked = e.target.checked
    const newProofs = curChecked ? proofs.concat(label) : proofs.filter(item => item !== label)
    setProofs(newProofs)
  }
  return (
    <PMask onClose={onClose}>
      <div className="padoDialog createAttesationDialog">
        <main>
          <div className="scrollList">
            <h1>Create Attestation</h1>
            <div className="descItems">
              <div className="descItem">
                <div className="label">Data Source:</div>
                <div className="value">
                  <img src={dataSource?.icon} alt="" />
                  <span>{dataSource?.name}</span>
                </div>
              </div>
              <div className="descItem">
                <div className="label">Accessed Date:</div>
                <div className="value">
                  <span>{getCurrentDate()}</span>
                </div>
              </div>
            </div>
            <div className="formItems">
              {list && list.map(item => {
                return (<label className="formItem">
                  <input className="checkbox" name="proof" type="checkbox" defaultChecked={item.defaultValue} disabled={item.disabled} onChange={(e) => handleChange(e, item.label)} />

                  <div className="descItem">
                    <div className="label">{item.label}</div>
                    <div className="value">{item.value} </div>
                  </div>
                </label>)
              })}
            </div>
          </div>
        </main>
        <button className="nextBtn" onClick={handleClickNext}>
          Next
        </button>
      </div>
    </PMask>
  );
};

export default CreateAttesationDialog;
