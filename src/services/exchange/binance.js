import BigNumber from 'bignumber.js';
import { add, gt } from '@/utils/utils';
import { USDT,BUSD,TUSD,BTC,LDO,STABLETOKENLIST } from '@/utils/constants';
import Exchange from './exchange';
import CcxtBinance from './ccxtbinance';
const BIGZERO = new BigNumber(0);
const ONE = 1;
const ZERO = 0;

class Binance extends Exchange {
  constructor(exchangeInfo) {
    super('binance', exchangeInfo);
  }

  initCctx() {
    this.exchange = new CcxtBinance({
      apiKey: this.apiKey,
      secret: this.secretKey,
      password: this.passphase,
    });
  }

  async getFundingAccountTokenAmountMap() {
    const res = await this.exchange.fetchBalance({ type: 'funding' });

    res.info.forEach(({ asset, free, locked, freeze }) => {
      // Tip: funding account balance = free + locked + freeze
      const amt = add(add(free, locked), freeze).toFixed();
      gt(amt, BIGZERO) && this.fundingAccountTokenAmountMap.set(asset, amt);
    });
    // console.log(
    //   'fundingAccountTokenAmountMap',
    //   this.fundingAccountTokenAmountMap
    // );
    return this.fundingAccountTokenAmountMap;
  }

  async getTradingAccountTokenAmountMap() {
    const res = await this.exchange.fetchBalance({ type: 'trading' });
    res.info.balances.forEach(({ asset, free, locked }) => {
      // Tip: trading account balance = free + locked
      const amt = add(free, locked).toFixed();
      gt(amt, BIGZERO) && (!asset.startsWith('LD') || asset === LDO) && this.tradingAccountTokenAmountMap.set(asset, amt);
    });
    // console.log(
    //   'tradingAccountTokenAmountMap',
    //   this.tradingAccountTokenAmountMap
    // );
    return this.tradingAccountTokenAmountMap;
  }

  async getFlexibleAccountTokenAmountMap() {
    const res = await this.exchange.fetchBalance({ type: 'savings' });
    res.info.positionAmountVos.forEach(({ asset, amount }) => {
      // Tip: trading account balance = free + locked
      const amt = new BigNumber(amount).toFixed();
      gt(amt, BIGZERO) && this.flexibleAccountTokenAmountMap.set(asset, amt);
    });
    // console.log(
    //   'flexibleAccountTokenAmountMap',
    //   this.flexibleAccountTokenAmountMap
    // );
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
      prev.set(curr, ONE+'')
      return prev
    }, new Map())
    LPSymbols.forEach((lpsymbol) => {
      const tokenSymbol = lpsymbol.replace(`/${USDT}`, '');
      const BUSDLpsymbol = lpsymbol.replace(`${USDT}`, BUSD);
      const TUSDLpsymbol = lpsymbol.replace(`${USDT}`, TUSD);
      const last = res[lpsymbol]?.last || res[BUSDLpsymbol]?.last || res[TUSDLpsymbol]?.last
      if (last) {
        this.tokenPriceMap.set(tokenSymbol, new BigNumber(last).toFixed());
      } else {
        this.tokenPriceMap.set(tokenSymbol, ZERO+'');
      }
    });
    console.log('tokenPriceMap: ', this.exName, this.tokenPriceMap,res);
    return this.tokenPriceMap;
  }

}
export default Binance;
