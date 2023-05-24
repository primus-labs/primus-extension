import React from 'react';
import './index.sass';
interface PBackProps {
  onBack: () => void;
}
const PBack:React.FC<PBackProps> = ({ onBack }) => {
  const handleClickBack = () => {
    onBack();
  };
  return <div className="iconBack" onClick={handleClickBack}></div>;
};

export default PBack;
