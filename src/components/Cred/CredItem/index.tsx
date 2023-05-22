import React, {useState, useEffect} from 'react';
import iconExpand from '@/assets/img/iconExpand.svg';
import iconUpChain from '@/assets/img/iconUpChain.svg';
import iconQRCode from '@/assets/img/iconQRCode.svg';
import './index.sass';

export type CredTypeItemType = {
  type: string;
  icon: any;
  name: string;
  id: string;
  label: string;
  date: string;
  provided: any[];
  expand?: boolean
};

interface CredTypeListProps {
  item: CredTypeItemType;
}
const CredItem: React.FC<CredTypeListProps> = ({ item }) => {
  const [expand, setExpand] = useState(false)
  const handleClick = () => {
    setExpand(flag => !flag)
  }
  useEffect(() => {
    if(item.expand) {
      setExpand(true)
    }
  },[item])
  return (
    <div className="credItem">
      <div className="main" onClick={handleClick}>
        <h1>{item.type}</h1>
        <div className="sourceInfo">
          <div className="descItem">
            <div className="label">Source: &nbsp;</div>
            <div className="value">
              <img src={item?.icon} alt="" className="sourceIcon" />
              <span>{item?.name}</span>
            </div>
          </div>
          {(item.id || item.label) && (
            <div className="descItem">
              <div className="label">ID: &nbsp;</div>
              <div className="value">{item?.id ?? item.label}</div>
            </div>
          )}
        </div>
        <div className="descItem">
          <div className="label">Date: &nbsp;</div>
          <div className="value">{item?.date}</div>
        </div>
        <footer>
          <div className="providedChains">
            {item.provided.map((i) => (
              <img src={i} />
            ))}
          </div>
          <div className="operations">
            <img src={iconUpChain} alt="" />
            <img src={iconQRCode} alt="" />
            <img src={iconExpand} alt="" />
          </div>
        </footer>
      </div>
      {expand &&  <div className="extra">
        <div className="descItem">
          <div className="label">Proof Content</div>
          <div className="value">
            <div className="desc">Assets balance greater than</div>
            <div className="con">$1,000</div>
          </div>
        </div>
        <div className="descItem arow">
          <div className="label">Recipient Add</div>
          <div className="value">0x009d...02fa</div>
        </div>
        <div className="descItem">
          <div className="label">Attested By</div>
          <div className="value">
            <div className="desc">PADO</div>
            <div className="con">0x1234...opiu</div>
          </div>
        </div>
      </div>}
    </div>
  );
};

export default CredItem;
