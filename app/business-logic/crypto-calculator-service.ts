// We will create a hash power calculator for cryptocurrencies and mining hardward.
// We will use the coingecko-api and minerstats-api.
import Request from "valyrian.js/plugins/request.js";
import { storageService } from "../common/storage-service";

const CoinGeckoRequest = Request.new("https://api.coingecko.com/api/v3", {
  methods: ["get"]
});

const MinerstatRequest = Request.new("https://api.minerstat.com/v2/coins", {
  methods: ["get"]
});

const OneDayInMilliSeconds = 1000 * 60 * 60 * 24;

enum AlgorithmsEnum {
  "SHA-256" = "SHA-256",
  "Scrypt" = "Scrypt",
  "Ethash" = "Ethash",
  "Etchash" = "Etchash",
  "Equihash" = "Equihash",
  "RandomX" = "RandomX",
  "X11" = "X11"
}

enum CoinEnum {
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
  coin: CoinEnum;
  name: CoinNamesEnum;
  network_hashrate: number;
  price: number;
  reward: number;
  updated: number;
}

interface CalculationResult {
  mined: number;
  income: number;
  powerCost: number;
  profit: number;
}

interface CalculationsResult {
  daily: CalculationResult;
  weekly: CalculationResult;
  monthly: CalculationResult;
  yearly: CalculationResult;
  currency: string;
  price: number;
}

export const CryptoCurrencies = {
  BTC: { id: "bitcoin", symbol: "btc", name: "Bitcoin" },
  ETH: { id: "ethereum", symbol: "eth", name: "Ethereum" },
  ETC: { id: "ethereum-classic", symbol: "etc", name: "Ethereum Classic" },
  XMR: { id: "monero", symbol: "xmr", name: "Monero" },
  ZEC: { id: "zcash", symbol: "zec", name: "Zcash" },
  DASH: { id: "dash", symbol: "dash", name: "Dash" },
  LTC: { id: "litecoin", symbol: "ltc", name: "Litecoin" }
};

const CryptoCurrenciesIds = ["bitcoin", "ethereum", "ethereum-classic", "monero", "zcash", "dash", "litecoin"];

export enum CurrencyEnum {
  "usd" = "usd",
  "eur" = "eur",
  "gbp" = "gbp",
  "cad" = "cad",
  "aud" = "aud",
  "chf" = "chf",
  "cny" = "cny",
  "rub" = "rub",
  "brl" = "brl",
  "hkd" = "hkd",
  "jpy" = "jpy",
  "mxn" = "mxn"
}

export class CalculatorService {
  private useCache = (path): boolean => {
    let dateNow = Date.now();
    let cache = storageService.get(path);
    if (cache) {
      let cacheDate = cache.date;
      if (dateNow - cacheDate < OneDayInMilliSeconds) {
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
      vs_currencies: Object.keys(CurrencyEnum).join(",")
    });
    this.setCache("prices", response);
    return response;
  }

  async getCoinsData(): Promise<CoinInterface[]> {
    if (this.useCache("coinsData")) {
      return storageService.get("coinsData.value");
    }
    const response = await MinerstatRequest.get("/", {
      list: Object.keys(CoinEnum).join(",")
    });
    this.setCache("coinsData", response);
    return response;
  }

  async calculateConForHashRate({
    coinName,
    hashRate,
    power,
    powerCost,
    currency,
    algorithm
  }: {
    coinName: CoinEnum;
    hashRate: number;
    power: number;
    powerCost: number;
    currency: string;
    algorithm: AlgorithmsEnum;
  }): Promise<CalculationsResult> {
    let coins = await this.getCoinsData();
    let pricesForAllCoins = await this.getPrices();

    if (!coins || !pricesForAllCoins) {
      throw new Error("Could not load data");
    }

    let coin = coins.find((coin) => coin.coin === coinName);

    if (!coin || !CryptoCurrencies[coinName] || !pricesForAllCoins[CryptoCurrencies[coinName].id]) {
      throw new Error("Coin not found");
    }

    if (coin.algorithm !== algorithm) {
      throw new Error("Algorithm not supported");
    }

    let price =
      pricesForAllCoins[CryptoCurrencies[coinName].id][currency] ||
      pricesForAllCoins[CryptoCurrencies[coinName].id].usd;

    const reward = coin.reward * hashRate;
    const dailyMined = reward * 24;
    const dailyIncome = dailyMined * price;
    const dailyPowerCost = (powerCost / 1000) * power * 24;
    const dailyProfit = dailyIncome - dailyPowerCost;

    return {
      daily: {
        mined: dailyMined,
        income: dailyIncome,
        powerCost: dailyPowerCost,
        profit: dailyProfit
      },
      weekly: {
        mined: dailyMined * 7,
        income: dailyIncome * 7,
        powerCost: dailyPowerCost * 7,
        profit: dailyProfit * 7
      },
      monthly: {
        mined: dailyMined * 30,
        income: dailyIncome * 30,
        powerCost: dailyPowerCost * 30,
        profit: dailyProfit * 30
      },
      yearly: {
        mined: dailyMined * 365,
        income: dailyIncome * 365,
        powerCost: dailyPowerCost * 365,
        profit: dailyProfit * 365
      },
      currency,
      price
    };
  }
}

async function main() {
  const calculatorService = new CalculatorService();
  let results = await calculatorService.calculateConForHashRate({
    coinName: CoinEnum.ETH,
    hashRate: 3000000000,
    power: 2600,
    powerCost: 0.1,
    currency: "usd",
    algorithm: AlgorithmsEnum.Ethash
  });
  console.log(results);
}

main();
