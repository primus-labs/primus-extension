import React from 'react';
import iconDataSourceBinance from '@/assets/img/iconDataSourceBinance.svg';
import iconDataSourceTwitter from '@/assets/img/iconDataSourceTwitter.svg';
import iconDataSourceOKX from '@/assets/img/iconDataSourceOKX.svg';
import './index.sass'

export type DataFieldItem = {
  icon: any;
  name: string;
  title: string
}
interface CretateAccountDialogProps {
  onSubmit: (name: DataFieldItem) => void,
  // onCancel: () => void
}
const DataFieldsDialog: React.FC<CretateAccountDialogProps> = ({ onSubmit }) => {
  const networkList = [
    {
      icon: iconDataSourceBinance,
      title: 'Assets Detail',
      name: 'binance'
    },
    {
      icon: iconDataSourceTwitter,
      title: '3',
      name: 'twitter'
    },
    {
      icon: iconDataSourceOKX,
      title: 'Performance Detail',
      name: 'okx',
    },
  ]
  const handleClickNext = () => {
    // onSubmit()// TODO
  }

  const handleClickData = (item: DataFieldItem) => {
    onSubmit(item)
  }

  return (
    <div className="dataFieldsDialog">
      <header className="header">
        <h1>Data Fields</h1>
        <h2>Securely validate your data with PADO's MPC technology and store it locally to fully protect your privacy and security.</h2>
      </header>
      <main>
        <ul className="dataList">
          {networkList.map(item => {
            return (<li className="networkItem" key={item.title} onClick={() => { handleClickData(item) }}>
              <img src={item.icon} alt="" />
              <p>{item.title}</p>
            </li>)
          })}
        </ul>
      </main>
      <button className="nextBtn" onClick={handleClickNext}>
        Select
      </button>
    </div>
  );
};

export default DataFieldsDialog;
