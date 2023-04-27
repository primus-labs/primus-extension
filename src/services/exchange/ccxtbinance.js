import { binance } from 'ccxt';

export default class CcxtBinance extends binance {

    async fetchBalance(params = {}) {
        await this.loadMarkets();
        const defaultType = this.safeString2(this.options, 'fetchBalance', 'defaultType', 'spot');
        let type = this.safeString(params, 'type', defaultType);
        let subType = undefined;
        [subType, params] = this.handleSubTypeAndParams('fetchBalance', undefined, params);
        const [marginMode, query] = this.handleMarginModeAndParams('fetchBalance', params);
        let method = 'privateGetAccount';
        const request = {};
        if (this.isLinear(type, subType)) {
            const options = this.safeValue(this.options, type, {});
            const fetchBalanceOptions = this.safeValue(options, 'fetchBalance', {});
            method = this.safeString(fetchBalanceOptions, 'method', 'fapiPrivateV2GetAccount');
            type = 'linear';
        }
        else if (this.isInverse(type, subType)) {
            const options = this.safeValue(this.options, type, {});
            const fetchBalanceOptions = this.safeValue(options, 'fetchBalance', {});
            method = this.safeString(fetchBalanceOptions, 'method', 'dapiPrivateGetAccount');
            type = 'inverse';
        }
        else if (marginMode === 'isolated') {
            method = 'sapiGetMarginIsolatedAccount';
            const paramSymbols = this.safeValue(params, 'symbols');
            if (paramSymbols !== undefined) {
                let symbols = '';
                if (Array.isArray(paramSymbols)) {
                    symbols = this.marketId(paramSymbols[0]);
                    for (let i = 1; i < paramSymbols.length; i++) {
                        const symbol = paramSymbols[i];
                        const id = this.marketId(symbol);
                        symbols += ',' + id;
                    }
                }
                else {
                    symbols = paramSymbols;
                }
                request['symbols'] = symbols;
            }
        }
        else if ((type === 'margin') || (marginMode === 'cross')) {
            method = 'sapiGetMarginAccount';
        }
        else if (type === 'savings') {
            method = 'sapiGetLendingUnionAccount';
        }
        else if (type === 'savingsFixed') {
            method = 'sapiGetLendingProjectPositionList';
        }
        else if (type === 'funding') {
            method = 'sapiPostAssetGetFundingAsset';
        } else if (type === 'bswap') {
            method = 'sapiGetBswapLiquidity';
        }
        const requestParams = this.omit(query, ['type', 'symbols']);
        const response = await this[method](this.extend(request, requestParams));
        return this.parseBalance(response, type, marginMode);
    }

}