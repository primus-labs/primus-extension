const packageJson = require('../../package.json');
import BigNumber from 'bignumber.js';

export const ExchangeStoreVersion = '1.0.1';
export const SocailStoreVersion = '1.0.1';
export const padoExtensionVersion = packageJson.version;

export const USDT = 'USDT';
export const USD = 'USD';
export const USDC = 'USDC';
export const DAI = 'DAI';
export const BUSD = 'BUSD';
export const TUSD = 'TUSD';
export const BTC = 'BTC';
export const STABLETOKENLIST = [USDT, USD, USDC, DAI, BUSD, TUSD];
export const ONESECOND = 1000;
export const ONEMINUTE = 60 * ONESECOND;
export const STARTOFFLINETIMEOUT = 3 * ONEMINUTE + '';
export const DEFAULTFETCHTIMEOUT = 1 * ONEMINUTE;
export const BIGZERO = new BigNumber(0);

export const schemaTypeMap = {
  ASSETS_PROOF: 'Assets Proof',
  TOKEN_HOLDINGS: 'Token Holdings',
  IDENTIFICATION_PROOF: 'IDENTIFICATION_PROOF',
};
