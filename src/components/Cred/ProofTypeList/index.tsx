import React from 'react'
// import iconAssetProof from '@/assets/img/iconAssetsProof.svg'
// import iconTokenHoldings from '@/assets/img/iconTokenHoldings.svg'
// import iconQualifications from '@/assets/img/iconQualifications.svg'
import { useSelector } from 'react-redux';
import type { UserState,  } from '@/store/reducers';
import type {PROOFTYPEITEM} from '@/types/cred'
import './index.sass'

interface CredTypeListProps {
  onChange: (title: string) => void
}
const ProofTypeList: React.FC<CredTypeListProps> = ({ onChange }) => {
  const proofTypes = useSelector((state: UserState) => state.proofTypes);
  const handleChange = (item: PROOFTYPEITEM) => {
    if (item.enabled === 1) {
      return;
    }
    onChange(item.credTitle);
  };
 return (
   <section className="credTypeListWrapper">
     <ul className="credTypeList">
       {proofTypes.map((item) => (
         <li
           className={
             item.enabled === 1 ? 'credTypeItem disabled' : 'credTypeItem'
           }
           onClick={() => {
             handleChange(item);
           }}
           key={item.credTitle}
         >
           <img className="icon" src={item.credLogoUrl} alt="" />
           <div className="con">
             <h5 className="title">{item.credTitle}</h5>
             <h6 className="desc">{item.credIntroduce}</h6>
           </div>
         </li>
       ))}
     </ul>
   </section>
 );
}

export default ProofTypeList