import ccxt from 'ccxt';
import BigNumber from 'bignumber.js';
import { add, mul, gt, div } from '@/utils/utils';
import { USDT,BTC,STABLETOKENLIST } from '@/utils/constants';
const BIGZERO = new BigNumber(0);
const BIGONE = new BigNumber(1);
const ONE = 1;
const ZERO = 0;

class Exchange {
  constructor(exName, exchangeInfo) {
    const { apiKey, secretKey, passphase } = exchangeInfo;
    this.apiKey = apiKey;
    this.secretKey = secretKey;
    this.passphase = passphase;
    this.exchange = null;
    this.exName = exName;
    this.initCctx();
    this.fundingAccountTokenAmountMap = new Map();
    this.tradingAccountTokenAmountMap = new Map();
    this.spotAccountTokenAmountMap = new Map(); // spotAccount = fundingAccount + tradingAccount
    this.flexibleAccountTokenAmountMap = new Map();
    this.spotAccountTokenMap = {};
    this.flexibleAccountTokenMap = {};
    this.totalHoldingTokenSymbolList = [];
    this.totalAccountTokenAmountMap = new Map();
    this.tokenPriceMap = {};
    this.totalAccountTokenMap = {};
    this.totalAccountBalance = BIGZERO;
  }
  initCctx() {
    this.exchange = new ccxt[this.exName]({
      apiKey: this.apiKey,
      secret: this.secretKey,
      password: this.passphase,
    });
    console.log('exchange111')
  }
  async getFundingAccountTokenAmountMap() {
    return this.fundingAccountTokenAmountMap;
  }
  async getTradingAccountTokenAmountMap() {
    return this.tradingAccountTokenAmountMap;
  }
  async getFlexibleAccountTokenAmountMap() {
    return this.flexibleAccountTokenAmountMap;
  }
  async getTotalHoldingTokenSymbolList() {
    if (this.totalHoldingTokenSymbolList.length > 0) {
      return this.totalHoldingTokenSymbolList;
    }
    
    // try {
      await Promise.all([
        this.getFundingAccountTokenAmountMap(),
        this.getTradingAccountTokenAmountMap(),
        this.getFlexibleAccountTokenAmountMap()
      ]);
      console.log('exchange222')
      const duplicateSymbolArr = [
        ...this.fundingAccountTokenAmountMap.keys(),
        ...this.tradingAccountTokenAmountMap.keys(),
        ...this.flexibleAccountTokenAmountMap.keys(),
      ];
      this.totalHoldingTokenSymbolList = [...new Set(duplicateSymbolArr)];
      console.log(
        'totalHoldingTokenSymbolList',
        this.totalHoldingTokenSymbolList
      );
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
    if(this.flexibleAccountTokenAmountMap.size > 0) {
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
      this.totalAccountTokenAmountMap = this.spotAccountTokenAmountMap
    }
    
    console.log('totalAccountTokenAmountMap', this.totalAccountTokenAmountMap);
    return this.totalAccountTokenAmountMap;
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
      .map((j) => (`${j}/${USDT}`));
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
      prev[curr] = ONE+''
      return prev
    }, {})
    LPSymbols.forEach((lpsymbol) => {
      const tokenSymbol = lpsymbol.replace(`/${USDT}`, '');
      if (res[lpsymbol] && res[lpsymbol].last) {
        const { last } = res[lpsymbol];
        this.tokenPriceMap[tokenSymbol] = new BigNumber(last).toFixed()
      } else {
        this.tokenPriceMap[tokenSymbol] = ZERO+''
      }
    });
    console.log('tokenPriceMap: ', this.exName, this.tokenPriceMap);
    return this.tokenPriceMap;
  }
  getTokenMap(amountMap) {
    const obj = this.totalHoldingTokenSymbolList.reduce(
      (prev, curr) => {
        const amount = amountMap.get(curr);
        if (amount) {
          const price = this.tokenPriceMap[curr] || (ZERO + '');
          const value = mul(amount, price).toFixed();
          prev[curr] = {
            symbol: curr,
            amount,
            price,
            value,
          };
        }
        return prev;
      },
      {}
    );
    return obj
  }

  async getTotalAccountTokenMap() {
    await this.getTotalHoldingTokenSymbolList();
    await Promise.all([
      this.getTokenPriceMap(),
      this.getTotalAccountTokenAmountMap(),
    ]);
    this.spotAccountTokenMap = this.getTokenMap(this.spotAccountTokenAmountMap)
    if(this.flexibleAccountTokenAmountMap.size > 0) {
      this.flexibleAccountTokenMap = this.getTokenMap(this.flexibleAccountTokenAmountMap)
      this.totalAccountTokenMap = this.getTokenMap(this.totalAccountTokenAmountMap)
    } else {
      this.totalAccountTokenMap = this.spotAccountTokenMap
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
  async getInfo() {
    try {
      await this.getTotalAccountBalance();
      return this.exchange;
    } catch (error) {
      console.log('exchange getInfo error:', error);
      throw new Error(error)
    }
  }
  async getTokenPrice(symbol) {
    // binance=>'ETHUSDT',others:'ETH-USDT'
    const price = this.tokenPriceMap[symbol];
    if (price) {
      return price;
    }
    const LPSymbol =
      this.exName === 'binance' ? `${symbol}${USDT}` : `${symbol}-${USDT}`;
      try{
        const res = await this.exchange.fetchTickers([LPSymbol]);
        const { last } = res[`${symbol}/${USDT}`];
        // console.log(`binance-getTokenPrice-${symbol}`, last);
        return new BigNumber(last).toFixed();
      }catch{
        return ZERO + ''
      }
    
  }
}
export default Exchange;
