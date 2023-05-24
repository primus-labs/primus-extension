import React from 'react'
import iconAssetProof from '@/assets/img/iconAssetsProof.svg'
import iconTokenHoldings from '@/assets/img/iconTokenHoldings.svg'
import iconQualifications from '@/assets/img/iconQualifications.svg'
import './index.sass'
type CredTypeItemType = {
  icon: any,
  title: string;
  desc: string;
  disabled?: boolean
}
const credTypeList:CredTypeItemType[] = [
  {
    icon: iconAssetProof,
    title: 'Assets Proof',
    desc: 'Proof of deposits, investment portfolios, etc.',
  },
  {
    icon: iconTokenHoldings,
    title: 'Token Holdings',
    desc: 'Proof ownership of a specific amount of a kind of Token.',
  },
  {
    icon: iconQualifications,
    title: 'Qualifications',
    desc: 'Proof user level or verification status.',
    disabled: true
  },
]
interface CredTypeListProps {
  onChange: (title: string) => void
}
const ProofTypeList: React.FC<CredTypeListProps> = ({onChange}) => {
  const handleChange = (item:CredTypeItemType) => {
    if (item.disabled) {
      return
    }
    onChange(item.title)
  }
 return (
   <section className="credTypeListWrapper">
     <ul className="credTypeList">
       {credTypeList.map((item) => (
         <li
           className={item.disabled ? 'credTypeItem disabled' : 'credTypeItem'}
           onClick={() => {
             handleChange(item);
           }}
           key={item.title}
         >
           <img className="icon" src={item.icon} alt="" />
           <div className="con">
             <h5 className="title">{item.title}</h5>
             <h6 className="desc">{item.desc}</h6>
           </div>
         </li>
       ))}
     </ul>
   </section>
 );
}

export default ProofTypeList