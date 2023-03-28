import { okx } from 'ccxt';
import BigNumber from 'bignumber.js';
import { add, mul } from '@/utils/utils';

const BIGZERO = new BigNumber(0);
const ONE = 1;
const USDT = 'USDT';

class OKX {
  constructor(exchangeInfo) {
    console.log('okx constructor',exchangeInfo);
    const { apiKey, secretKey, passphase } = exchangeInfo;
    this.apiKey = apiKey;
    this.secretKey = secretKey;
    this.passphase = passphase;
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
    this.exchange = new okx({
      apiKey: this.apiKey,
      secret: this.secretKey,
      password: this.passphase
    });
  }

  async getFundingAccountTokenAmountMap() {
    const res = await this.exchange.fetchBalance({ type: 'funding' });

    res.info.data.forEach(({ ccy, bal }) => {
      this.fundingAccountTokenAmountMap.set(ccy, bal);
    });
    console.log(
      'okx fundingAccountTokenAmountMap',
      this.fundingAccountTokenAmountMap
    );
    return this.fundingAccountTokenAmountMap;
  }

  async getTradingAccountTokenAmountMap() {
    const res = await this.exchange.fetchBalance({ type: 'trading' });
    res.info.data[0].details.forEach(({ ccy, eq }) => {
      this.tradingAccountTokenAmountMap.set(ccy, eq);
    });
    console.log(
      'okx tradingAccountTokenAmountMap',
      this.tradingAccountTokenAmountMap
    );
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
    console.log(
      'okx totalHoldingTokenSymbolList',
      this.totalHoldingTokenSymbolList
    );
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
    console.log('okx totalAccountTokenAmountMap', this.totalAccountTokenAmountMap);
    return this.totalAccountTokenAmountMap;
  }

  async getTokenPriceMap() {
    await this.getTotalHoldingTokenSymbolList();
    const LPSymbols = this.totalHoldingTokenSymbolList
      .filter((i) => i !== USDT)
      .map((j) => `${j}-${USDT}`);
    const res = await this.exchange.fetchTickers(LPSymbols);
    this.tokenPriceMap = Object.keys(res).reduce((prev, curr) => {
      const { symbol, last } = res[curr];
      const tokenSymbol = symbol.replace(`/${USDT}`, '');
      return prev.set(tokenSymbol, new BigNumber(last).toFixed());
    }, new Map([[USDT, ONE]]));
    console.log('okx tokenPriceMap', this.tokenPriceMap);
    return this.tokenPriceMap;
  }

  async getTotalAccountTokenMap() {
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
    console.log('okx totalAccountTokenMap', this.totalAccountTokenMap);
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
    console.log('okx totalAccountBalance', this.totalAccountBalance);
    return this.totalAccountBalance;
  }

  async getInfo() {
    await this.getTotalAccountBalance();
    return this.exchange;
  }

}

export default OKX;