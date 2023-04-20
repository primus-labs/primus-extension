import ccxt from 'ccxt';
import BigNumber from 'bignumber.js';
import { add, mul, gt, div } from '@/utils/utils';
const BIGZERO = new BigNumber(0);
const BIGONE = new BigNumber(1);
const ONE = 1;
const USDT = 'USDT';
const USD = 'USD';

class Exchange {
  constructor(exName, exchangeInfo) {
    const { apiKey, secretKey, passphase } = exchangeInfo;
    this.apiKey = apiKey;
    this.secretKey = secretKey;
    this.passphase = passphase;
    this.exchange = null;
    this.exName = exName; //ysm
    this.initCctx();
    this.fundingAccountTokenAmountMap = new Map();
    this.tradingAccountTokenAmountMap = new Map();
    this.totalHoldingTokenSymbolList = [];
    this.totalAccountTokenAmountMap = new Map();
    this.tokenPriceMap = new Map();
    this.totalAccountTokenMap = {};
    this.totalAccountBalance = BIGZERO;
  }
  initCctx() {
    this.exchange = new ccxt[this.exName]({
      apiKey: this.apiKey,
      secret: this.secretKey,
      password: this.passphase,
    });
  }
  async getFundingAccountTokenAmountMap() {
    return this.fundingAccountTokenAmountMap;
  }
  async getTradingAccountTokenAmountMap() {
    return this.tradingAccountTokenAmountMap;
  }
  async getTotalHoldingTokenSymbolList() {
    if (this.totalHoldingTokenSymbolList.length > 0) {
      return this.totalHoldingTokenSymbolList;
    }
    await Promise.all([
      this.getFundingAccountTokenAmountMap(),
      this.getTradingAccountTokenAmountMap(),
    ]);
    const duplicateSymbolArr = [
      ...this.fundingAccountTokenAmountMap.keys(),
      ...this.tradingAccountTokenAmountMap.keys(),
    ];
    this.totalHoldingTokenSymbolList = [...new Set(duplicateSymbolArr)];
    // console.log(
    //   'totalHoldingTokenSymbolList',
    //   this.totalHoldingTokenSymbolList
    // );
    return this.totalHoldingTokenSymbolList;
  }
  async getTotalAccountTokenAmountMap() {
    await this.getTotalHoldingTokenSymbolList();
    this.totalAccountTokenAmountMap = this.totalHoldingTokenSymbolList.reduce(
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
    // console.log('totalAccountTokenAmountMap', this.totalAccountTokenAmountMap);
    return this.totalAccountTokenAmountMap;
  }
  async getTokenPriceMap() {
    await this.getTotalHoldingTokenSymbolList();
    // transfrom 'X' to 'XUSDT' when you query X's price;
    // ex: ETH => ETHUSDT,// binance=>'ETHUSDT',others:'ETH-USDT'
    // price unit: USD
    // coninbase need filter USD
    const LPSymbols = this.totalHoldingTokenSymbolList
      .filter((i) => i !== USDT)
      .filter((i) => i !== USD)
      .map((j) => (this.exName === 'binance' ? `${j}${USDT}` : `${j}-${USDT}`));
    const res = await this.exchange.fetchTickers(LPSymbols);
    this.tokenPriceMap = Object.keys(res).reduce((prev, curr) => {
      const { symbol, last } = res[curr];
      const tokenSymbol = symbol.replace(`/${USDT}`, '');
      return prev.set(tokenSymbol, new BigNumber(last).toFixed());
    }, new Map([[USDT, ONE]]));
    // console.log('tokenPriceMap', this.tokenPriceMap);
    return this.tokenPriceMap;
  }
  async getTotalAccountTokenMap() {
    await this.getTotalHoldingTokenSymbolList();
    await Promise.all([
      this.getTokenPriceMap(),
      this.getTotalAccountTokenAmountMap(),
    ]);
    this.totalAccountTokenMap = this.totalHoldingTokenSymbolList.reduce(
      (prev, curr) => {
        const amount = this.totalAccountTokenAmountMap.get(curr);
        const price = this.tokenPriceMap.get(curr);
        const value = mul(amount, price).toFixed();
        prev[curr] = {
          symbol: curr,
          amount,
          price,
          value,
        };
        return prev;
      },
      {}
    );
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
    await this.getTotalAccountBalance();
    return this.exchange;
  }
  async getTokenPrice(symbol) {
    // binance=>'ETHUSDT',others:'ETH-USDT'
    const price = this.tokenPriceMap.get(symbol);
    if (price) {
      return price;
    }
    const LPSymbol =
      this.exName === 'binance' ? `${symbol}${USDT}` : `${symbol}-${USDT}`;
    const res = await this.exchange.fetchTickers([LPSymbol]);
    const { last } = res[`${symbol}/${USDT}`];
    // console.log(`binance-getTokenPrice-${symbol}`, last);
    return new BigNumber(last).toFixed();
  }
}
export default Exchange;
