import React, { useState } from 'react';
import type { ChangeEvent } from 'react';
import type { DataSourceType } from '@/components/AssetsDetail'
import { getCurrentDate } from '@/utils/utils'
import './index.sass'

interface GetDataDialogProps {
  dataSource?: DataSourceType;
  onSubmit: (proofs: string[]) => void
}

const CreateAttesationDialog: React.FC<GetDataDialogProps> = ({ onSubmit, dataSource }) => {
  const [list, setList] = useState([
    {
      label: 'Create Qualification Proof',
      value: '< 100days',
      disabled: false,
      defaultValue: false
    },
    {
      label: 'Create Balance Proof',
      value: '< $1000',
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
    <div className="createAttesationDialog">
      <main>
        <div className="scrollList">
          <h1>Create Attestation</h1>
          <div className="descItems">
            <div className="descItem">
              <div className="label">Data Source:</div>
              <div className="value">
                <img src={dataSource?.icon} alt="" />
                <span>{dataSource?.name} API</span>
              </div>
            </div>
            <div className="descItem">
              <div className="label">Accessed Date：</div>
              <div className="value">
                <span>After {getCurrentDate()}</span>
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
  );
};

export default CreateAttesationDialog;
