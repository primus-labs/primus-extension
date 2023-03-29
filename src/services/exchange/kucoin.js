import { kucoin } from 'ccxt';
import BigNumber from 'bignumber.js';
import { add, mul, gt } from '@/utils/utils';
const BIGZERO = new BigNumber(0);
const BIGONE = new BigNumber(1);
const ONE = 1;
const USDT = 'USDT';

class KuCoin {
    constructor(exchangeInfo) {
        const { apiKey, secretKey, password} = exchangeInfo;
        this.apiKey = apiKey;
        this.secretKey = secretKey;
        this.password = password;
        this.exchange = null;
        this.fundingAccountTokenAmountMap = new Map();
        this.tradingAccountTokenAmountMap = new Map();
        this.totalAccountTokenAmountMap = new Map();
        this.totalHoldingTokenSymbolList = [];
        this.tokenPriceMap = new Map();
        this.totalAccountBalance = BIGZERO;
        this.totalAccountTokenMap = {};
        this.initCctx();
    }
    initCctx() {
        this.exchange = new kucoin({
            apiKey: this.apiKey,
            secret: this.secretKey,
            password: this.password
        });
    }
    async getFundingAccountTokenAmountMap() {
        const res = await this.exchange.fetchBalance({'type': 'main'});
        console.log("res",res)
        res.info.data.forEach(({ currency, balance }) => {
            // Tip: funding account balance = free + locked + freeze
            const amt = new BigNumber(balance);
            gt(amt, BIGZERO) && this.fundingAccountTokenAmountMap.set(currency, amt);
        });
        console.log(
            'fundingAccountTokenAmountMap',
            this.fundingAccountTokenAmountMap
        );
        return this.fundingAccountTokenAmountMap;
    }
    async getTradingAccountTokenAmountMap() {
        const res = await this.exchange.fetchBalance({ 'type': 'trade' });
        res.info.data.forEach(({ currency, balance }) => {
            // Tip: trading account balance = free + locked
            const amt =  new BigNumber(balance);
            gt(amt, BIGZERO) && this.tradingAccountTokenAmountMap.set(currency, amt);
        });
        console.log(
            'tradingAccountTokenAmountMap',
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
            'totalHoldingTokenSymbolList',
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
        console.log('totalAccountTokenAmountMap', this.totalAccountTokenAmountMap);
        return this.totalAccountTokenAmountMap;
    }
    async getTokenPriceMap() {
        await this.getTotalHoldingTokenSymbolList();
        // transfrom 'X' to 'XUSDT' when you query X's price;
        // ex: ETH => ETHUSDT
        // price unit: USD
        const LPSymbols = this.totalHoldingTokenSymbolList
            .filter((i) => i !== USDT)
            .map((j) => `${j}-${USDT}`);
        console.log("symbol",LPSymbols)
        const res = await this.exchange.fetchTickers(LPSymbols);
        console.log("symbol res",LPSymbols)

        this.tokenPriceMap = Object.keys(res).reduce((prev, curr) => {
            const { symbol, last } = res[curr];
            const tokenSymbol = symbol.replace(`/${USDT}`, '');
            return prev.set(tokenSymbol, new BigNumber(last).toFixed());
        }, new Map([[USDT, ONE]]));
        console.log('tokenPriceMap', this.tokenPriceMap);
        return this.tokenPriceMap;
    }
    async getTotalAccountTokenMap() {
        await Promise.all([
            this.getTokenPriceMap(),
            this.getTotalAccountTokenAmountMap(),
        ]);
        console.log("tokenPriceMap-----")
        this.totalAccountTokenMap = this.totalHoldingTokenSymbolList.reduce(
            (prev, curr) => {
                console.log("prev",prev)
                console.log("curr",curr)
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
        console.log('------totalAccountTokenMap', this.totalAccountTokenMap);
        return this.totalAccountTokenMap;
    }
    async getTotalAccountBalance() {
        await this.getTotalAccountTokenMap();
        console.log("-----",this.totalAccountTokenMap)
        const totalAccBal = Object.keys(this.totalAccountTokenMap).reduce(
            (prev, curr) => {
                console.log("prev",prev)
                console.log("curr",curr)
                prev = add(prev, this.totalAccountTokenMap[curr].value);
                return prev;
            },
            BIGZERO
        );
        console.log("totalAccBal",totalAccBal)
        this.totalAccountBalance = totalAccBal.toFixed();
        console.log('totalAccountBalance', this.totalAccountBalance);
        return this.totalAccountBalance;
    }
    async getInfo() {
        await this.getTotalAccountBalance();
        return this.exchange;
    }
}
export default KuCoin;