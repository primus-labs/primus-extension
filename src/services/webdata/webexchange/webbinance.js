import WebExchange from './webexchange';
import BigNumber from 'bignumber.js';

import { USDT, BTC, STABLETOKENLIST, BUSD, TUSD,BETH } from '@/config/constants';
import { gt } from '@/utils/utils';

const ONE = 1;
const ZERO = 0;

class WebBinance extends WebExchange {
  constructor() {
    super('binance');
  }

  async getFundingAccountTokenAmountMap() {
    const params = {};
    params.url =
      'https://www.binance.com/bapi/asset/v3/private/asset-service/asset/get-ledger-asset';
    params.method = 'POST';
    const bodyParam = {
      needBtcValuation: true,
      quoteAsset: BTC,
    };
    params.data = bodyParam;
    const res = await this.request(params);
    console.log(res);
    res.data.forEach(({ asset, free,locked }) => {
      this.fundingAccountTokenAmountMap.set(asset, free+locked);
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
      'https://www.binance.com/bapi/asset/v3/private/asset-service/asset/get-user-asset';
    params.method = 'POST';
    const bodyParam = {
      needBtcValuation: true,
      quoteAsset: 'BTC',
    };
    params.data = bodyParam;
    const res = await this.request(params);
    console.log('trading:', res);
    res.data.forEach(({ asset, free, locked }) => {
      this.tradingAccountTokenAmountMap.set(asset, free + locked);
      this.tradingAccountTokenAmountObj[asset] = free + locked;
    });
    // console.log(
    //   'okx tradingAccountTokenAmountMap',
    //   this.tradingAccountTokenAmountMap
    // );
    return this.tradingAccountTokenAmountMap;
  }

  async getFlexibleAccountTokenAmountMap() {
    let maxPage = 1;
    for (let page = 1; page <= maxPage; page++) {
      const params = {};
      params.url =
        'https://www.binance.com/bapi/earn/v2/private/lending/daily/token/position?pageIndex=' +
        page +
        '&pageSize=20';
      params.method = 'GET';
      const res = await this.request(params);
      console.log('Flexible', res);
      res.data.forEach(({ asset, freeAmount }) => {
        const amt = new BigNumber(freeAmount).toFixed();
        this.flexibleAccountTokenAmountMap.set(asset, amt);
      });
      maxPage = res.total;
    }
    return this.flexibleAccountTokenAmountMap;
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
      .concat(BETH)
      .map((j) => `${j}${USDT}`);
    let res;
    //let errorSymbol;
    const params = {};
    params.url = 'https://api.binance.com/api/v3/ticker/price';
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
      const BUSDLpsymbol = lpsymbol.replace(`${USDT}`, BUSD);
      const TUSDLpsymbol = lpsymbol.replace(`${USDT}`, TUSD);
      const last = res[lpsymbol] || res[BUSDLpsymbol] || res[TUSDLpsymbol];
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
    params.url =
      'https://www.binance.com/bapi/accounts/v1/private/account/user/base-detail';
    params.method = 'POST';
    const res = await this.request(params);
    this.userInfo.userName = res.data.userId;
    this.userInfo.userId = res.data.userId;
    console.log(res.data.mobileNo);
  }
}

export default WebBinance;
