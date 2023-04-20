import Exchange from './exchange';

class OKX extends Exchange {
  constructor(exchangeInfo) {
    super('okx', exchangeInfo);
  }

  async getFundingAccountTokenAmountMap() {
    const res = await this.exchange.fetchBalance({ type: 'funding' });

    res.info.data.forEach(({ ccy, bal }) => {
      this.fundingAccountTokenAmountMap.set(ccy, bal);
    });
    // console.log(
    //   'okx fundingAccountTokenAmountMap',
    //   this.fundingAccountTokenAmountMap
    // );
    return this.fundingAccountTokenAmountMap;
  }

  async getTradingAccountTokenAmountMap() {
    const res = await this.exchange.fetchBalance({ type: 'trading' });
    res.info.data[0].details.forEach(({ ccy, eq }) => {
      this.tradingAccountTokenAmountMap.set(ccy, eq);
    });
    // console.log(
    //   'okx tradingAccountTokenAmountMap',
    //   this.tradingAccountTokenAmountMap
    // );
    return this.tradingAccountTokenAmountMap;
  }
}

export default OKX;
