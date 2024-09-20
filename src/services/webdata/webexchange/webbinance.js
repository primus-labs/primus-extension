import WebExchange from './webexchange';
import BigNumber from 'bignumber.js';

import { USDT, BTC, STABLETOKENLIST, BUSD, TUSD } from '@/config/constants';
import { gt } from '@/utils/utils';

const ONE = 1;
const ZERO = 0;

class WebBinance extends WebExchange {
  constructor() {
    super('binance');
    this.tradingAccountFreeTokenAmountObj = {};
  }

  async getVipFeeSummary() {
    const params = {};
    params.url =
      'https://www.binance.com/bapi/accounts/v1/private/vip/vip-portal/vip-fee/vip-fee-summary';
    params.method = 'GET';
    const res = await this.request(params);
    if (res.code === '000000') {
      this.spot30dVol = res.data.spot30dVol;
    }
    return this.spot30dVol;
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
    res.data.forEach(({ asset, free, locked }) => {
      this.fundingAccountTokenAmountMap.set(
        asset,
        Number(free) + Number(locked)
      );
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
      this.tradingAccountTokenAmountMap.set(
        asset,
        Number(free) + Number(locked)
      );
      this.tradingAccountTokenAmountObj[asset] = Number(free) + Number(locked);
      if (gt(Number(free), 0)) {
        this.tradingAccountFreeTokenAmountObj[asset] = Number(free);
      }
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
    //get from lanchpad
    let needBreak = false;
    let lanchPadPage = 1;
    while (!needBreak) {
      const params = {};
      params.url =
        'https://www.binance.com/bapi/lending/v2/private/launchpool/positions?pageIndex=' +
        lanchPadPage +
        '&pageSize=20&hasAmount=true';
      params.method = 'GET';
      const res = await this.request(params);
      console.log('LanchPad', res);
      if (
        res.data.total === '0' ||
        res.data.total === 0 ||
        res.data.positions.length === 0
      ) {
        needBreak = true;
        break;
      }
      res.data.positions.forEach(({ asset, amount }) => {
        const amt = new BigNumber(amount).toFixed();
        if (this.flexibleAccountTokenAmountMap.has(asset)) {
          //if asset exists, need to plus
          const oldAmt = this.flexibleAccountTokenAmountMap.get(asset);
          this.flexibleAccountTokenAmountMap.set(
            asset,
            new BigNumber(oldAmt).plus(amt).toFixed()
          );
        } else {
          this.flexibleAccountTokenAmountMap.set(asset, amt);
        }
      });
      lanchPadPage = lanchPadPage + 1;
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
    const ethPrice = res['ETHUSDT'];
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
    this.tokenPriceMap['BETH'] = ethPrice;
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
