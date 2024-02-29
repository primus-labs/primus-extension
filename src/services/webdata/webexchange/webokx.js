import BigNumber from 'bignumber.js';
import { USDT, BTC, STABLETOKENLIST } from '@/config/constants';
import WebExchange from './webexchange';
const BIGZERO = new BigNumber(0);
const BIGONE = new BigNumber(1);
const ONE = 1;
const ZERO = 0;
class WebOKX extends WebExchange {
  constructor() {
    super('okx');
  }

  async getFundingAccountTokenAmountMap() {
    const params = {};
    params.url =
      'https://www.okx.com/v2/asset/balance/asset-overview?valuationUnit=USDT&transferFroms=180%2C6%2C20%2C18&limit=100&t=' +
      new Date().getTime();
    params.method = 'GET';
    const res = await this.request(params);
    res.data.bizBalances.funding.forEach(({ currency, balance }) => {
      this.fundingAccountTokenAmountMap.set(currency, balance);
    });
    // console.log(
    //   'okx fundingAccountTokenAmountMap',
    //   this.fundingAccountTokenAmountMap
    // );
    return this.fundingAccountTokenAmountMap;
  }

  async getTradingAccountTokenAmountMap() {
    const params = {};
    params.url =
      'https://www.okx.com/v2/asset/balance/asset-overview?valuationUnit=USDT&transferFroms=180%2C6%2C20%2C18&limit=100&t=' +
      new Date().getTime();
    params.method = 'GET';
    const res = await this.request(params);
    res.data.bizBalances.trading.forEach(({ currency, balance }) => {
      this.tradingAccountTokenAmountMap.set(currency, balance);
      this.tradingAccountTokenAmountObj[currency] = balance;
    });
    // console.log(
    //   'okx tradingAccountTokenAmountMap',
    //   this.tradingAccountTokenAmountMap
    // );
    return this.tradingAccountTokenAmountMap;
  }

  async getTokenPriceMap() {
    await this.getTotalHoldingTokenSymbolList();
    // transfrom 'X' to 'XUSDT' when you query X's price;
    // ex: ETH => ETHUSDT,// binance=>'ETHUSDT',others:'ETH-USDT'
    // price unit: USD
    // coninbase need filter USD
    let LPSymbols = this.totalHoldingTokenSymbolList
      .filter((i) => !STABLETOKENLIST.includes(i))
      .concat(BTC)
      .map((j) => `${j}-${USDT}`);
    let res;
    //let errorSymbol;
    const params = {};
    params.url =
      'https://www.okx.com/priapi/v5/market/tickers?instType=SPOT&t=' +
      new Date().getTime();
    params.method = 'GET';
    try {
      res = await this.request(params);
      res.data.forEach((lp) => {
        res[lp.instId] = lp.last;
      });
    } catch (e) {
      console.log('fetchTickers error:', this.exName, e);
      return;
    }
    //console.log('fetchTickers res:', this.exName, res);
    this.tokenPriceMap = STABLETOKENLIST.reduce((prev, curr) => {
      prev[curr] = ONE + '';
      return prev;
    }, {});
    LPSymbols.forEach((lpsymbol) => {
      const tokenSymbol = lpsymbol.replace(`-${USDT}`, '');
      if (res[lpsymbol]) {
        this.tokenPriceMap[tokenSymbol] = new BigNumber(res[lpsymbol]).toFixed();
      } else {
        this.tokenPriceMap[tokenSymbol] = ZERO + '';
      }
    });
    return this.tokenPriceMap;
  }

  async getUserInfo() {
    const params = {};
    params.url =
      'https://www.okx.com/v3/users/security/profile?t=' +
      new Date().getTime();
    params.method = 'GET';
    const res = await this.request(params);
    this.userInfo.userName = res.data.petname;
    this.userInfo.userId = res.data.uuid;
  }
}

export default WebOKX;
