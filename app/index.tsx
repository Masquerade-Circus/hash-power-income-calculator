import "./business-logic/crypto-calculator-service";

import { directive, mount, v } from "valyrian.js";
import { formatMoneyDirective, formatNumberDirective } from "./common/format-number";

import { App } from "./app";

directive("format-number", formatNumberDirective);
directive("format-money", formatMoneyDirective);

mount("body", App);
