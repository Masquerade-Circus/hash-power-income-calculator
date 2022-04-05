import { BtcSVG } from "./btc.svg";
import { DashSVG } from "./dash.svg";
import { EtcSVG } from "./etc.svg";
import { EthSVG } from "./eth.svg";
import { LtcSVG } from "./ltc.svg";
// We will create a hash power calculator for cryptocurrencies and mining hardward.
// We will use the coingecko-api and minerstats-api.
import Request from "valyrian.js/plugins/request.js";
import { XmrSVG } from "./xmr.svg";
import { ZecSVG } from "./zec.svg";
import { storageService } from "../common/storage-service";

const CoinGeckoRequest = Request.new("https://api.coingecko.com/api/v3", {
  methods: ["get"]
});

const MinerstatRequest = Request.new("https://api.minerstat.com/v2/coins", {
  methods: ["get"]
});

const OneDayInMilliSeconds = 1000 * 60 * 60 * 24;
const ThirtyMinutesInMilliSeconds = 1000 * 60 * 30;

const DefaultCacheTime = ThirtyMinutesInMilliSeconds;

export enum AlgorithmsEnum {
  "SHA-256" = "SHA-256",
  "Scrypt" = "Scrypt",
  "Ethash" = "Ethash",
  "Etchash" = "Etchash",
  "Equihash" = "Equihash",
  "RandomX" = "RandomX",
  "X11" = "X11"
}

export enum CoinSymbolEnum {
  "BTC" = "BTC",
  "ETH" = "ETH",
  "ETC" = "ETC",
  "XMR" = "XMR",
  "ZEC" = "ZEC",
  "DASH" = "DASH",
  "LTC" = "LTC"
}

enum CoinNamesEnum {
  "Bitcoin" = "Bitcoin",
  "Ethereum" = "Ethereum",
  "Ethereum Classic" = "Ethereum Classic",
  "Monero" = "Monero",
  "Zcash" = "Zcash",
  "Dash" = "Dash",
  "Litecoin" = "Litecoin"
}

interface CoinInterface {
  algorithm: AlgorithmsEnum;
  coin: CoinSymbolEnum;
  name: CoinNamesEnum;
  network_hashrate: number;
  price: number;
  reward: number;
  updated: number;
}

export interface CalculationResult {
  mined: number;
  minedFee: number;
  income: number;
  incomeFee: number;
  powerCost: number;
  profit: number;
}

export interface CalculationsResult {
  daily: CalculationResult;
  weekly: CalculationResult;
  monthly: CalculationResult;
  yearly: CalculationResult;
  currency: string;
  price: number;
}

export const CryptoCurrencies = {
  BTC: {
    id: "bitcoin",
    symbol: "BTC",
    name: "Bitcoin",
    icon: BtcSVG(),
    config: {
      hashRateAmount: 40,
      hashRateType: "Th/s",
      power: 2600
    }
  },
  ETH: {
    id: "ethereum",
    symbol: "ETH",
    name: "Ethereum",
    icon: EthSVG(),
    config: {
      hashRateAmount: 200,
      hashRateType: "Mh/s",
      power: 140
    }
  },
  ETC: {
    id: "ethereum-classic",
    symbol: "ETC",
    name: "Ethereum Classic",
    icon: EtcSVG(),
    config: {
      hashRateAmount: 500,
      hashRateType: "Mh/s",
      power: 1000
    }
  },
  XMR: {
    id: "monero",
    symbol: "XMR",
    name: "Monero",
    icon: XmrSVG(),
    config: {
      hashRateAmount: 100,
      hashRateType: "Kh/s",
      power: 1200
    }
  },
  ZEC: {
    id: "zcash",
    symbol: "ZEC",
    name: "Zcash",
    icon: ZecSVG(),
    config: {
      hashRateAmount: 100,
      hashRateType: "Kh/s",
      power: 1000
    }
  },
  DASH: {
    id: "dash",
    symbol: "DASH",
    name: "Dash",
    icon: DashSVG(),
    config: {
      hashRateAmount: 200,
      hashRateType: "Gh/s",
      power: 1110
    }
  },
  LTC: {
    id: "litecoin",
    symbol: "LTC",
    name: "Litecoin",
    icon: LtcSVG(),
    config: {
      hashRateAmount: 5,
      hashRateType: "Gh/s",
      power: 1000
    }
  }
};

const CryptoCurrenciesIds = ["bitcoin", "ethereum", "ethereum-classic", "monero", "zcash", "dash", "litecoin"];

export enum CurrencyEnum {
  "USD" = "USD",
  "EUR" = "EUR",
  "GBP" = "GBP",
  "CAD" = "CAD",
  "AUD" = "AUD",
  "CHF" = "CHF",
  "CNY" = "CNY",
  "RUB" = "RUB",
  "BRL" = "BRL",
  "HKD" = "HKD",
  "JPY" = "JPY",
  "MXN" = "MXN"
}

export enum HashRateStringToNumber {
  "Ph/s" = 1000000000000000,
  "Th/s" = 1000000000000,
  "Gh/s" = 1000000000,
  "Mh/s" = 1000000,
  "Kh/s" = 1000,
  "H/s" = 1
}

export class CalculatorService {
  private useCache = (path): boolean => {
    let dateNow = Date.now();
    let cache = storageService.get(path);
    if (cache) {
      let cacheDate = cache.date;
      if (dateNow - cacheDate < DefaultCacheTime) {
        return true;
      }
    }
    return false;
  };

  private setCache(path: string, value: any): void {
    let dateNow = Date.now();
    storageService.set(path, {
      value,
      date: dateNow
    });
  }

  async ping(): Promise<any> {
    if (this.useCache("ping")) {
      return storageService.get("ping.value");
    }

    const response = await CoinGeckoRequest.get("/ping");
    this.setCache("ping", response);
    return response;
  }

  async getCoinsList(): Promise<any> {
    if (this.useCache("coinsList")) {
      return storageService.get("coinsList.value");
    }
    const response = await CoinGeckoRequest.get("/coins/list");
    this.setCache("coinsList", response);
    return response;
  }

  async getSupportedCurrencies(): Promise<any> {
    if (this.useCache("supportedCurrencies")) {
      return storageService.get("supportedCurrencies.value");
    }
    const response = await CoinGeckoRequest.get("/simple/supported_vs_currencies");
    this.setCache("supportedCurrencies", response);
    return response;
  }

  async getPrices(): Promise<any> {
    if (this.useCache("prices")) {
      return storageService.get("prices.value");
    }
    const response = await CoinGeckoRequest.get("/simple/price", {
      ids: CryptoCurrenciesIds.join(","),
      vs_currencies: Object.keys(CurrencyEnum)
        .map((key) => key.toLowerCase())
        .join(",")
    });
    this.setCache("prices", response);
    return response;
  }

  async getCoinsData(): Promise<CoinInterface[]> {
    if (this.useCache("coinsData")) {
      return storageService.get("coinsData.value");
    }
    const response = await MinerstatRequest.get("/", {
      list: Object.keys(CoinSymbolEnum).join(",")
    });
    this.setCache("coinsData", response);
    return response;
  }

  getHashRateFromString(hashRateString: HashRateStringToNumber, amount: number) {
    const hashRate = amount * Number(HashRateStringToNumber[hashRateString]);
    return hashRate;
  }

  async calculateCoinForHashRate({
    coinSymbol,
    hashRate,
    power,
    powerCost,
    currency,
    algorithm,
    poolFee
  }: {
    coinSymbol: CoinSymbolEnum;
    hashRate: number;
    power: number;
    powerCost: number;
    currency: string;
    algorithm?: AlgorithmsEnum;
    poolFee: number;
  }): Promise<CalculationsResult> {
    let coins = await this.getCoinsData();
    let pricesForAllCoins = await this.getPrices();

    if (!coins || !pricesForAllCoins) {
      throw new Error("Could not load data");
    }

    let coin = coins.find((coin) => coin.coin === coinSymbol);

    if (!coin || !CryptoCurrencies[coinSymbol] || !pricesForAllCoins[CryptoCurrencies[coinSymbol].id]) {
      throw new Error("Coin not found");
    }

    if (algorithm && coin.algorithm !== algorithm) {
      throw new Error("Algorithm not supported");
    }

    let currencyLowerCased = (currency || "usd").toLowerCase();

    let price =
      pricesForAllCoins[CryptoCurrencies[coinSymbol].id][currencyLowerCased] ||
      pricesForAllCoins[CryptoCurrencies[coinSymbol].id].usd;

    const reward = coin.reward * hashRate;
    const fee = reward * poolFee;
    const rewardWithoutFee = reward - fee;
    const dailyMined = rewardWithoutFee * 24;
    const dailyMinedFee = fee * 24;
    const dailyIncome = dailyMined * price;
    const dailyIncomeFee = dailyMinedFee * price;
    const dailyPowerCost = (powerCost / 1000) * power * 24;
    const dailyProfit = dailyIncome - dailyPowerCost;

    return {
      daily: {
        mined: dailyMined,
        minedFee: dailyMinedFee,
        income: dailyIncome,
        incomeFee: dailyIncomeFee,
        powerCost: dailyPowerCost,
        profit: dailyProfit
      },
      weekly: {
        mined: dailyMined * 7,
        minedFee: dailyMinedFee * 7,
        income: dailyIncome * 7,
        incomeFee: dailyIncomeFee * 7,
        powerCost: dailyPowerCost * 7,
        profit: dailyProfit * 7
      },
      monthly: {
        mined: dailyMined * 30,
        minedFee: dailyMinedFee * 30,
        income: dailyIncome * 30,
        incomeFee: dailyIncomeFee * 30,
        powerCost: dailyPowerCost * 30,
        profit: dailyProfit * 30
      },
      yearly: {
        mined: dailyMined * 365,
        minedFee: dailyMinedFee * 365,
        income: dailyIncome * 365,
        incomeFee: dailyIncomeFee * 365,
        powerCost: dailyPowerCost * 365,
        profit: dailyProfit * 365
      },
      currency,
      price
    };
  }
}
