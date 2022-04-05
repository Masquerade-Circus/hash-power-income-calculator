import "./business-logic/crypto-calculator-service";

import { formatMoneyDirective, formatNumberDirective } from "./common/format-number";

import { App } from "./app";
import v from "valyrian.js/lib";

v.directive("format-number", formatNumberDirective);
v.directive("format-money", formatMoneyDirective);

v.mount("body", App);
