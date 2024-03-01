import Exchange from './exchange';
import CcxtOkx from './ccxtokx';

class OKX extends Exchange {
  constructor(exchangeInfo) {
    super('okx', exchangeInfo);
  }

  initCctx() {
    this.exchange = new CcxtOkx({
      apiKey: this.apiKey,
      secret: this.secretKey,
      password: this.passphase,
    });
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
      this.tradingAccountTokenAmountObj[ccy] = eq;
    });
    await this.getUserInfo();
    // console.log(
    //   'okx tradingAccountTokenAmountMap',
    //   this.tradingAccountTokenAmountMap
    // );
    return this.tradingAccountTokenAmountMap;
  }

  async getUserInfo() {
    const res = await this.exchange.privateGetAccountConfig();
    this.userId = res.data[0].uid;
  }
}

export default OKX;
