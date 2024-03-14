import React from 'react';
import { padoExtensionVersion } from '@/config/constants';
import './index.scss';

const Footer: React.FC = ({}) => {
  return (
    <div className="pageFooter">
      <div className="version">Version {padoExtensionVersion}</div>
      {/* <div className="policy">Privacy Policy</div> */}
    </div>
  );
};

export default Footer;
