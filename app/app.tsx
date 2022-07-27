import {
  CalculationResult,
  CalculationsResult,
  CalculatorService,
  CoinSymbolEnum,
  CryptoCurrencies,
  CurrencyEnum
} from "./business-logic/crypto-calculator-service";
import hooksPlugin, { useCallback } from "valyrian.js/plugins/hooks";

import v from "valyrian.js/lib";

v.use(hooksPlugin);

const DefaultCurrency = CurrencyEnum.USD;
const DefaultCoin = CryptoCurrencies.ETH;
const AllowSelectMiner = false;

enum FormToShow {
  "minerSelect" = "minerSelect",
  "manualConfig" = "manualConfig"
}

const DefaultConfig = {
  powerCost: 0.1,
  poolFee: 1
};

const Store = {
  currency: DefaultCurrency,
  coin: DefaultCoin,
  formToShow: FormToShow.manualConfig,
  config: {
    powerCost: DefaultConfig.powerCost,
    poolFee: DefaultConfig.poolFee,
    customPrice: 0,
    BTC: { ...CryptoCurrencies.BTC.config },
    ETH: { ...CryptoCurrencies.ETH.config },
    ETC: { ...CryptoCurrencies.ETC.config },
    LTC: { ...CryptoCurrencies.LTC.config },
    XMR: { ...CryptoCurrencies.XMR.config },
    ZEC: { ...CryptoCurrencies.ZEC.config },
    DASH: { ...CryptoCurrencies.DASH.config }
  },
  result: {} as CalculationsResult
};

function CoinNav() {
  return (
    <nav v-for={Object.keys(CryptoCurrencies)} class="coin-nav flex">
      {(key) => (
        <button
          v-class={{
            active: Store.coin.symbol === key
          }}
          onclick={() => {
            Store.coin = CryptoCurrencies[key];
            Store.config.customPrice = null;
          }}
        >
          {key}
        </button>
      )}
    </nav>
  );
}

function CurrencyNav() {
  return (
    <nav v-for={Object.keys(CurrencyEnum)} class="currency-nav flex flex-column">
      {(key) => (
        <button
          v-class={{
            active: Store.currency === key
          }}
          onclick={() => {
            Store.currency = key;
            Store.config.customPrice = null;
          }}
        >
          {key}
        </button>
      )}
    </nav>
  );
}

function CoinDescription() {
  return (
    <div class="coin-description-top">
      <figure>{Store.coin.icon}</figure>
      <b>{Store.coin.name}</b>
      <small class="flex flex-row">
        <span class="u-p-xs u-no-warp">1 {Store.coin.symbol} = </span>
        <input type="number" v-model={[Store.config, "customPrice"]} step="0.01" class="u-m-0" />
        <span class="u-p-xs u-no-warp">{Store.currency}</span>
      </small>
      <small v-format-money={Store.currency} class="note text-xs">
        {Store.result.realPrice}
      </small>
    </div>
  );
}

function MinerSelect() {
  return <div v-if={Store.formToShow === FormToShow.minerSelect && AllowSelectMiner}></div>;
}

function ManualConfig() {
  return (
    <div v-if={!AllowSelectMiner || Store.formToShow === FormToShow.manualConfig}>
      <form>
        <section>
          <div class="flex flex-hash-power">
            <fieldset>
              <legend>Hash Power</legend>
              <input
                type="number"
                placeholder="Hash power"
                v-model={[Store.config[Store.coin.symbol], "hashRateAmount"]}
                onkeyup={v.update}
              />
            </fieldset>
            <fieldset class="hash-power">
              <legend>&nbsp;</legend>
              <select
                value={Store.config[Store.coin.symbol].hashRateType}
                onchange={(e) => {
                  Store.config[Store.coin.symbol].hashRateType = e.target.value;
                  v.update();
                }}
              >
                <option>Ph/s</option>
                <option>Th/s</option>
                <option>Gh/s</option>
                <option>Mh/s</option>
                <option>Kh/s</option>
                <option>H/s</option>
              </select>
            </fieldset>
          </div>
          <fieldset>
            <legend>Power Consumption (W)</legend>
            <input
              type="number"
              placeholder="Power Consumption (W)"
              v-model={[Store.config[Store.coin.symbol], "power"]}
              onkeyup={v.update}
            />
          </fieldset>
          <fieldset>
            <legend>Power Cost Kw/h ($)</legend>
            <input
              type="number"
              placeholder="Power Cost Kw/h ($)"
              v-model={[Store.config, "powerCost"]}
              onkeyup={v.update}
            />
          </fieldset>
          <fieldset>
            <legend>Pool fee (%)</legend>
            <input type="number" placeholder="Pool fee (%)" v-model={[Store.config, "poolFee"]} onkeyup={v.update} />
          </fieldset>
        </section>
      </form>
    </div>
  );
}

function ConfigSection() {
  return (
    <div class="config">
      <nav v-if={AllowSelectMiner}>
        <button
          v-class={{
            active: Store.formToShow === FormToShow.minerSelect
          }}
        >
          Miner List
        </button>
        <button
          v-class={{
            active: Store.formToShow === FormToShow.manualConfig
          }}
        >
          Manual
        </button>
      </nav>
      <section>
        <MinerSelect />
        <ManualConfig />
      </section>
    </div>
  );
}

enum ResultByEnum {
  "daily" = "Day",
  "weekly" = "Week",
  "monthly" = "Month",
  "yearly" = "Year"
}

function ResultBy({ by }: { by: string }) {
  let result = Store.result[by] as CalculationResult;
  let byString = ResultByEnum[by];
  if (result === undefined) {
    return (
      <tr>
        <td colspan="4"> - </td>
      </tr>
    );
  }

  return (
    <tr>
      <td>
        <small>Mined/{byString}</small>
        <b
          v-format-number={{
            currency: Store.currency,
            decimalPlaces: 6
          }}
        >
          {result.mined}
        </b>
        <small>
          Pool fee: <span v-format-number={{ currency: Store.currency, decimalPlaces: 6 }}>{result.minedFee}</span>
        </small>
      </td>
      <td>
        <small>Income/{byString}</small>
        <b v-format-money={Store.currency}>{result.income}</b>
        <small>
          Pool fee <span v-format-money={Store.currency}>{result.incomeFee}</span>
        </small>
      </td>
      <td>
        <small>Power cost/{byString}</small>
        <b v-format-money={Store.currency}>{result.powerCost}</b>
      </td>
      <td>
        <small>Profit/{byString}</small>
        <b v-format-money={Store.currency}>{result.profit}</b>
      </td>
    </tr>
  );
}

function Results() {
  if (Store.result.daily === undefined) {
    return <div>Loading...</div>;
  }

  return (
    <tr class="results">
      <td colspan="2">
        <dl>
          <dt>
            <dd>
              Cost by <span class="text-sm">{Store.coin.name}</span> mined
            </dd>
            <dd>
              <b v-format-money={Store.currency}>{Store.result.costPerMinedCoin}</b>
            </dd>
          </dt>
          <dt>
            <dd>Electricity BreakEven</dd>
            <dd>
              <b v-format-money={Store.currency}>{Store.result.electricityPriceBreakEven}</b>
            </dd>
          </dt>
          <dt>
            <dd>Hashprice</dd>
            <dd>
              <b v-format-money={Store.currency}>{Store.result.hashPrice}</b>
            </dd>
          </dt>
        </dl>
      </td>
      <td colspan="2">
        <b>Profit by month</b>
        <b v-format-money={Store.currency}>{Store.result.monthly.profit}</b>
      </td>
    </tr>
  );
}

const calculatorService = new CalculatorService();

async function computeProfit() {
  console.log("Computing profit...");
  if (Store.config[Store.coin.symbol] === undefined || Store.config[Store.coin.symbol].hashRateAmount === undefined) {
    return;
  }

  if (Store.config.powerCost === undefined) {
    Store.config.powerCost === 0;
  }
  if (Store.config.poolFee === undefined) {
    Store.config.poolFee === 0;
  }

  const hashRate = calculatorService.getHashRateFromString(
    Store.config[Store.coin.symbol].hashRateType,
    Store.config[Store.coin.symbol].hashRateAmount
  );

  let results = await calculatorService.calculateCoinForHashRate({
    customPrice: Store.config.customPrice,
    coinSymbol: CoinSymbolEnum[Store.coin.symbol],
    hashRate,
    power: Store.config[Store.coin.symbol].power,
    powerCost: Store.config.powerCost,
    currency: Store.currency,
    poolFee: Store.config.poolFee / 100
  });

  Store.result = results;
  Store.config.customPrice = results.price;
  console.log("Done computing profit.");
  v.update();
}

export function App() {
  useCallback(
    () => computeProfit(),
    [
      Store.config.customPrice,
      Store.coin.symbol,
      Store.currency,
      Store.config[Store.coin.symbol].hashRateAmount,
      Store.config[Store.coin.symbol].hashRateType,
      Store.config[Store.coin.symbol].power,
      Store.config.powerCost,
      Store.config.poolFee
    ]
  );
  return [
    <CoinNav />,
    <article class="flex">
      <CurrencyNav />
      <section class="coin-container flex flex-1">
        <div class="coin-description">
          <CoinDescription />
          <ConfigSection />
        </div>

        <table class="coin-result flex-1">
          <tbody>
            <ResultBy by="daily" />
            <ResultBy by="weekly" />
            <ResultBy by="monthly" />
            <ResultBy by="yearly" />
            <Results />
          </tbody>
        </table>
      </section>
    </article>,
    <small class="note text-sm text-right">Data is updated every 30 minutes</small>
  ];
}
