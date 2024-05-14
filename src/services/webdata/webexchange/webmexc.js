import WebExchange from './webexchange';
import BigNumber from 'bignumber.js';

import { USDT, BTC, STABLETOKENLIST, BUSD, TUSD } from '@/config/constants';

const ONE = 1;
const ZERO = 0;

class WebMexc extends WebExchange {
  constructor() {
    super('mexc');
  }

  async getTradingAccountTokenAmountMap() {
    const params = {};
    params.url =
      'https://www.mexc.com/api/platform/asset/api/asset/spot/convert/v2';
    params.method = 'GET';
    const res = await this.request(params);
    res.data.assets.forEach(({ currency, total }) => {
      if (Number(total) > 0) {
        this.tradingAccountTokenAmountMap.set(currency, total);
        this.tradingAccountTokenAmountObj[currency] = total;
      }
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
      .map((j) => `${j}${USDT}`);
    let res;
    //let errorSymbol;
    const params = {};
    params.url = 'https://api.mexc.com/api/v3/ticker/price';
    params.method = 'GET';
    try {
      res = await this.request(params);
      res.forEach((lp) => {
        res[lp.symbol] = lp.price;
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
      const tokenSymbol = lpsymbol.replace(`${USDT}`, '');
      const last = res[lpsymbol];
      if (last) {
        this.tokenPriceMap[tokenSymbol] = new BigNumber(last).toFixed();
      } else {
        this.tokenPriceMap[tokenSymbol] = ZERO + '';
      }
    });
    return this.tokenPriceMap;
  }

  async getUserInfo() {
    const params = {};
    params.url = 'https://www.mexc.com/ucenter/api/user_info';
    params.method = 'GET';
    const res = await this.request(params);
    this.userInfo.userName = res.data.digitalId;
    this.userInfo.userId = res.data.digitalId;
    console.log(res.data.digitalId);
  }
}

export default WebMexc;
