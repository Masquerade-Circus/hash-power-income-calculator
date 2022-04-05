// Format money with currency symbol and decimal precision (2) using the Intl.NumberFormat API

import { Directive, IVnode, Valyrian } from "valyrian.js/lib/interfaces";

enum CurrencyToLanguageEnum {
  "USD" = "en-US",
  "EUR" = "es-ES",
  "GBP" = "en-GB",
  "CAD" = "en-CA",
  "AUD" = "en-AU",
  "CHF" = "fr-CH",
  "CNY" = "zh-CN",
  "RUB" = "ru-RU",
  "BRL" = "pt-BR",
  "HKD" = "zh-HK",
  "JPY" = "ja-JP",
  "MXN" = "es-MX"
}

let formatMoney = (amount: number, currency: CurrencyToLanguageEnum, language: string) => {
  let formatter = new Intl.NumberFormat(language, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2
  });
  return formatter.format(amount);
};

let formatNumber = (amount: number, decimalPlaces: number, language: string) => {
  let formatter = new Intl.NumberFormat(language, {
    style: "decimal",
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces
  });
  return formatter.format(amount);
};

export function formatMoneyDirective(currency: CurrencyToLanguageEnum, vnode: IVnode) {
  let child = vnode.children[0];
  if (typeof child === "number") {
    vnode.children[0] = formatMoney(child, currency, CurrencyToLanguageEnum[currency]);
  }
}

export function formatNumberDirective(
  { currency, decimalPlaces }: { currency: CurrencyToLanguageEnum; decimalPlaces: number },
  vnode: IVnode
) {
  let child = vnode.children[0];
  if (typeof child === "number") {
    vnode.children[0] = formatNumber(child, decimalPlaces, CurrencyToLanguageEnum[currency]);
  }
}
