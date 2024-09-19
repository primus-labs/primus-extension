import BigNumber from 'bignumber.js';
import { add, mul, gt, div } from '@/utils/utils';
import { USDT, BTC, STABLETOKENLIST } from '@/config/constants';
import { AuthenticationError } from 'ccxt';

const BIGZERO = new BigNumber(0);
const BIGONE = new BigNumber(1);
const ONE = 1;
const ZERO = 0;

class WebExchange {
  constructor(exName) {
    this.exName = exName;
    this.fundingAccountTokenAmountMap = new Map();
    this.tradingAccountTokenAmountMap = new Map();
    this.tradingAccountTokenAmountObj = {};
    this.spotAccountTokenAmountMap = new Map();
    this.flexibleAccountTokenAmountMap = new Map();
    this.spotAccountTokenMap = {};
    this.flexibleAccountTokenMap = {};
    this.totalHoldingTokenSymbolList = null;
    this.totalAccountTokenAmountMap = new Map();
    this.tokenPriceMap = {};
    this.totalAccountTokenMap = {};
    this.totalAccountBalance = BIGZERO;
    this.userInfo = {};
    this.spot30dVol = 0;
  }

  getVipFeeSummary() {
    
  }
  async getFundingAccountTokenAmountMap() {
    console.log('getFundingAccountTokenAmountMap');
    return this.fundingAccountTokenAmountMap;
  }

  async getTradingAccountTokenAmountMap() {
    return this.tradingAccountTokenAmountMap;
  }

  async getFlexibleAccountTokenAmountMap() {
    return this.flexibleAccountTokenAmountMap;
  }

  async getTotalHoldingTokenSymbolList() {
    if (this.totalHoldingTokenSymbolList !== null) {
      return this.totalHoldingTokenSymbolList;
    }
    // try {
    await Promise.all([
      this.getFundingAccountTokenAmountMap(),
      this.getTradingAccountTokenAmountMap(),
      this.getFlexibleAccountTokenAmountMap(),
    ]);
    const duplicateSymbolArr = [
      ...this.fundingAccountTokenAmountMap.keys(),
      ...this.tradingAccountTokenAmountMap.keys(),
      ...this.flexibleAccountTokenAmountMap.keys(),
    ];
    this.totalHoldingTokenSymbolList = [...new Set(duplicateSymbolArr)];
    return this.totalHoldingTokenSymbolList;
    // }  catch (error) {
    //   console.log('exchange getTotalHoldingTokenSymbolList error', error);
    // }
  }

  async getTotalAccountTokenAmountMap() {
    await this.getTotalHoldingTokenSymbolList();
    this.spotAccountTokenAmountMap = this.totalHoldingTokenSymbolList.reduce(
      (prev, curr) => {
        const amountInFundingAccount =
          this.fundingAccountTokenAmountMap.get(curr) || 0;
        const amountInTradingAccount =
          this.tradingAccountTokenAmountMap.get(curr) || 0;
        return prev.set(
          curr,
          add(amountInFundingAccount, amountInTradingAccount).toFixed()
        );
      },
      new Map()
    );
    if (this.flexibleAccountTokenAmountMap.size > 0) {
      this.totalAccountTokenAmountMap = this.totalHoldingTokenSymbolList.reduce(
        (prev, curr) => {
          const amountInFlexibleAccount =
            this.flexibleAccountTokenAmountMap.get(curr) || 0;
          const amountInSpotAccount =
            this.spotAccountTokenAmountMap.get(curr) || 0;
          return prev.set(
            curr,
            add(amountInFlexibleAccount, amountInSpotAccount).toFixed()
          );
        },
        new Map()
      );
    } else {
      this.totalAccountTokenAmountMap = this.spotAccountTokenAmountMap;
    }

    return this.totalAccountTokenAmountMap;
  }

  async getTokenPriceMap() {
    /*await this.getTotalHoldingTokenSymbolList();
    // transfrom 'X' to 'XUSDT' when you query X's price;
    // ex: ETH => ETHUSDT,// binance=>'ETHUSDT',others:'ETH-USDT'
    // price unit: USD
    // coninbase need filter USD
    let LPSymbols = this.totalHoldingTokenSymbolList
      .filter((i) => !STABLETOKENLIST.includes(i))
      .concat(BTC)
      .map((j) => `${j}/${USDT}`);
    let res;
    //let errorSymbol;
    try {
      res = await this.exchange.fetchTickers();
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
      const tokenSymbol = lpsymbol.replace(`/${USDT}`, '');
      if (res[lpsymbol] && res[lpsymbol].last) {
        const { last } = res[lpsymbol];
        this.tokenPriceMap[tokenSymbol] = new BigNumber(last).toFixed();
      } else {
        this.tokenPriceMap[tokenSymbol] = ZERO + '';
      }
    });
    return this.tokenPriceMap;*/
  }

  getTokenMap(amountMap) {
    const obj = this.totalHoldingTokenSymbolList.reduce((prev, curr) => {
      const amount = amountMap.get(curr);
      if (amount) {
        const price = this.tokenPriceMap[curr] || ZERO + '';
        const value = mul(amount, price).toFixed();
        // hidden tokens value less than
        if (gt(value, '0.01')) {
          prev[curr] = {
            symbol: curr,
            amount,
            price,
            value,
          };
        }
      }
      return prev;
    }, {});
    return obj;
  }

  async getTotalAccountTokenMap() {
    await this.getTotalHoldingTokenSymbolList();
    await Promise.all([
      this.getTokenPriceMap(),
      this.getTotalAccountTokenAmountMap(),
    ]);
    this.spotAccountTokenMap = this.getTokenMap(this.spotAccountTokenAmountMap);
    if (this.flexibleAccountTokenAmountMap.size > 0) {
      this.flexibleAccountTokenMap = this.getTokenMap(
        this.flexibleAccountTokenAmountMap
      );
      this.totalAccountTokenMap = this.getTokenMap(
        this.totalAccountTokenAmountMap
      );
    } else {
      this.totalAccountTokenMap = this.spotAccountTokenMap;
    }
    // console.log('totalAccountTokenMap', this.totalAccountTokenMap);
    return this.totalAccountTokenMap;
  }

  async getTotalAccountBalance() {
    await this.getTotalAccountTokenMap();
    const totalAccBal = Object.keys(this.totalAccountTokenMap).reduce(
      (prev, curr) => {
        prev = add(prev, this.totalAccountTokenMap[curr].value);
        return prev;
      },
      BIGZERO
    );
    this.totalAccountBalance = totalAccBal.toFixed();
    // console.log('totalAccountBalance', this.totalAccountBalance);
    return this.totalAccountBalance;
  }

  async getUserInfo() {}

  async getInfo() {
    try {
      await Promise.all([
        this.getTotalAccountBalance(),
        this.getUserInfo(),
        this.getVipFeeSummary(),
      ]);
      //return this.exchange;
    } catch (error) {
      console.log('exchange getInfo error:', error);
      throw new Error(error);
    }
  }

  async request(fetchParams) {
    let { method, url, data = {}, config, extHeader } = fetchParams;

    if (method === 'GET') {
      let dataStr = '';
      Object.keys(data).forEach((key) => {
        dataStr += key + '=' + data[key] + '&';
      });
      if (dataStr !== '') {
        dataStr = dataStr.substr(0, dataStr.lastIndexOf('&'));
        url = url + '?' + dataStr;
      }
    }
    const controller = new AbortController();
    const signal = controller.signal;
    const timeout = config?.timeout ?? 10 * 1000;
    const timeoutTimer = setTimeout(() => {
      controller.abort();
    }, timeout);
    const authInfoName = this.exName + '-auth';
    const headerStr = await chrome.storage.local.get(authInfoName);
    const header = JSON.parse(headerStr[authInfoName]);
    if (extHeader) {
      extHeader.forEach((value, key) => {
        header[key] = value;
      });
    }
    let requestConfig = {
      method: method,
      headers: header,
      cache: config?.cache ?? 'default', //  default | no-store | reload | no-cache | force-cache | only-if-cached 。
      signal: signal,
    };

    if (method === 'POST') {
      Object.defineProperty(requestConfig, 'body', {
        value: JSON.stringify(data),
      });
      requestConfig.headers['Content-Type'] = 'application/json';
    }
    try {
      const response = await fetch(url, requestConfig);
      if (response.status === 401) {
        console.log(`response code from ${this.exName} is:${response.status}`);
        throw new AuthenticationError('AuthenticationError');
      }
      const responseJson = await response.json();
      clearTimeout(timeoutTimer);
      return responseJson;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log(`fetch ${url} timeout`);
        console.log(error);
      } else {
        console.log(error);
        throw new Error(error);
      }
    } finally {
      clearTimeout(timeoutTimer);
    }
  }
}

export default WebExchange;
