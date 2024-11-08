import {
  LINEASCHEMANAME,
  SCROLLSCHEMANAME,
  BNBSCHEMANAME,
  BNBGREENFIELDSCHEMANAME,
  OPBNBSCHEMANAME,
  BNBSCHEMANAMEMAP,
  SCROLLSCHEMANAMEMAP,
  OPBNBSCHEMANAMEMAP,
} from '@/config/chain';
import { regenerateAttestation } from '@/services/api/cred';
export const schemaNameFn = (networkName) => {
  const formatNetworkName = networkName;
  let Name;
  if (formatNetworkName?.startsWith('Linea')) {
    Name = LINEASCHEMANAME;
  } else if (
    formatNetworkName &&
    (formatNetworkName.indexOf('BSC') > -1 ||
      formatNetworkName.indexOf('BNB Greenfield') > -1)
  ) {
    if (formatNetworkName === 'BSCTestnet') {
      Name = BNBSCHEMANAMEMAP['development'];
    } else {
      Name = BNBSCHEMANAME;
    }
  } else if (formatNetworkName && formatNetworkName.indexOf('Scroll') > -1) {
    if (formatNetworkName === 'Scroll Sepolia') {
      Name = SCROLLSCHEMANAMEMAP['development'];
    } else {
      Name = SCROLLSCHEMANAME;
    }
  } else if (
    formatNetworkName &&
    formatNetworkName.indexOf('BNB Greenfield') > -1
  ) {
    Name = BNBGREENFIELDSCHEMANAME;
  } else if (formatNetworkName && formatNetworkName.indexOf('opBNB') > -1) {
    if (formatNetworkName === 'opBNBTestnet') {
      Name = OPBNBSCHEMANAMEMAP['development'];
    } else {
      Name = OPBNBSCHEMANAME;
    }
  } else if (formatNetworkName && formatNetworkName.startsWith('Sepolia')) {
    //  Sepolia is testnet
    Name = 'EAS-Sepolia';
  } else if (formatNetworkName && formatNetworkName.startsWith('Arbitrum')) {
    Name = 'EAS-Ethereum';
  } else if (formatNetworkName && formatNetworkName.startsWith('Holesky')) {
    Name = 'Verax-Holesky';
  } else {
    Name = 'EAS';
    // Name = 'EAS-Ethereum';
  }
  return Name;
};

export const regenerateAttest = async (orginAttestation, chainName) => {
  const {
    signature,
    sourceUseridHash,
    type,
    dataToBeSigned,
    source,
    rawParam,
    extendedData,
  } = orginAttestation;
  const requestParams = {
    rawParam:
      type === 'BREVIS_TRANSACTION_PROOF#1' || source === 'google'
        ? orginAttestation.rawParam
        : Object.assign(orginAttestation, {
            ext: null,
          }),
    greaterThanBaseValue: true,
    signature,
    newSigFormat: schemaNameFn(chainName),
    sourceUseridHash: sourceUseridHash,
  };
  if (type === 'BREVIS_TRANSACTION_PROOF#1') {
    requestParams.dataToBeSigned = dataToBeSigned;
  }
  if (source === 'chatgpt') {
    requestParams.extendedData = extendedData;
  }
  const regenerateAttestRes = await regenerateAttestation(requestParams);
  return regenerateAttestRes;
};
