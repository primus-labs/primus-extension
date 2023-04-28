import {okx} from 'ccxt';

export default class CcxtOkx extends okx {

    /*describe() {
        return this.deepExtend(super.describe(),{
            'api': {
                'private': {
                    'get': {
                        'tradingBot/recurring/orders-algo-pending': 1,
                    },
                },
            },
        });
    }*/

    async fetchBalance(params = {}) {
        await this.loadMarkets();
        const [marketType, query] = this.handleMarketTypeAndParams('fetchBalance', undefined, params);
        let method = undefined;
        if (marketType === 'funding') {
            method = 'privateGetAssetBalances';
        }
        else if (marketType === 'savings') {
            method = 'privateGetFinanceSavingsBalance';
        }
        else if (marketType === 'savingsFixed') {
            method = 'privateGetFinanceStakingDefiOrdersActive';
        }
        else {
            method = 'privateGetAccountBalance';
        }
        const request = {
        // 'ccy': 'BTC,ETH', // comma-separated list of currency ids
        };
        const response = await this[method](this.extend(request, query));
        return this.parseBalanceByType(marketType, response); 
    }

}