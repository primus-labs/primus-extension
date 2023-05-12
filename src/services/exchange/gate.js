import BigNumber from 'bignumber.js';
import Exchange from './exchange';

class GATEIO extends Exchange {
    constructor(exchangeInfo) {
        /**
         * just need api-key and secret
         */
        super('gateio', exchangeInfo);
    }

    async getTradingAccountTokenAmountMap() {
        const res = await this.exchange.fetchBalance({type:"spot"});
        // console.log('res', res);
        res.info.forEach(({ currency, available, locked }) => {
            // Tip: funding account balance = free + locked + freeze
            const freeBigNumber = new BigNumber(available);
            const lockedBigBumber = new BigNumber(locked);
            this.tradingAccountTokenAmountMap.set(currency, freeBigNumber.plus(lockedBigBumber));
        });
        // console.log(
        //   'fundingAccountTokenAmountMap',
        //   this.fundingAccountTokenAmountMap
        // );
        return this.tradingAccountTokenAmountMap;
    }
}
export default GATEIO;
