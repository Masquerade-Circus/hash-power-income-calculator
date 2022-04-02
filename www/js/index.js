(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target, mod));

  // node_modules/valyrian.js/plugins/request.js
  var require_request = __commonJS({
    "node_modules/valyrian.js/plugins/request.js"(exports, module) {
      var isNodeJs2 = Boolean(typeof process !== "undefined" && process.versions && process.versions.node);
      function serialize(obj, prefix) {
        return Object.keys(obj).map((p) => {
          let k = prefix ? `${prefix}[${p}]` : p;
          return typeof obj[p] === "object" ? serialize(obj[p], k) : `${encodeURIComponent(k)}=${encodeURIComponent(obj[p])}`;
        }).join("&");
      }
      function parseUrl(url, options = {}) {
        let u = /^https?/gi.test(url) ? url : options.urls.base + url;
        let parts = u.split("?");
        u = parts[0].trim().replace(/^\/\//, "/").replace(/\/$/, "").trim();
        if (parts[1]) {
          u += `?${parts[1]}`;
        }
        if (isNodeJs2 && typeof options.urls.node === "string") {
          options.urls.node = options.urls.node;
          if (typeof options.urls.api === "string") {
            options.urls.api = options.urls.api.replace(/\/$/gi, "").trim();
            u = u.replace(options.urls.api, options.urls.node);
          }
          if (!/^https?/gi.test(u)) {
            u = options.urls.node + u;
          }
        }
        return u;
      }
      function Request2(baseUrl = "", options = {}) {
        let url = baseUrl.replace(/\/$/gi, "").trim();
        options.urls = options.urls || {};
        let opts = {
          methods: ["get", "post", "put", "patch", "delete"],
          ...options,
          urls: {
            node: options.urls.node || null,
            api: options.urls.api || null,
            base: options.urls.base ? options.urls.base + url : url
          }
        };
        async function request2(method, url2, data, options2 = {}) {
          let innerOptions = {
            method: method.toLowerCase(),
            headers: {},
            resolveWithFullResponse: false,
            ...opts,
            ...options2
          };
          if (!innerOptions.headers.Accept) {
            innerOptions.headers.Accept = "application/json";
          }
          let acceptType = innerOptions.headers.Accept;
          let contentType = innerOptions.headers["Content-Type"] || innerOptions.headers["content-type"] || "";
          if (innerOptions.methods.indexOf(method) === -1) {
            throw new Error("Method not allowed");
          }
          if (data) {
            if (innerOptions.method === "get" && typeof data === "object") {
              url2 += `?${serialize(data)}`;
            }
            if (innerOptions.method !== "get") {
              if (/json/gi.test(contentType)) {
                innerOptions.body = JSON.stringify(data);
              } else {
                let formData;
                if (data instanceof FormData) {
                  formData = data;
                } else {
                  formData = new FormData();
                  for (let i in data) {
                    formData.append(i, data[i]);
                  }
                }
                innerOptions.body = formData;
              }
            }
          }
          let response = await fetch(parseUrl(url2, opts), innerOptions);
          if (!response.ok) {
            let err = new Error(response.statusText);
            err.response = response;
            throw err;
          }
          if (innerOptions.resolveWithFullResponse) {
            return response;
          }
          if (/text/gi.test(acceptType)) {
            return response.text();
          }
          if (/json/gi.test(acceptType)) {
            return response.json();
          }
          return response;
        }
        request2.new = (baseUrl2, options2) => Request2(baseUrl2, { ...opts, ...options2 });
        request2.options = (key, value) => {
          let result = opts;
          if (typeof key === "undefined") {
            return result;
          }
          let parsed = key.split(".");
          let next;
          while (parsed.length) {
            next = parsed.shift();
            let nextIsArray = next.indexOf("[") > -1;
            if (nextIsArray) {
              let idx = next.replace(/\D/gi, "");
              next = next.split("[")[0];
              parsed.unshift(idx);
            }
            if (parsed.length > 0 && typeof result[next] !== "object") {
              result[next] = nextIsArray ? [] : {};
            }
            if (parsed.length === 0 && typeof value !== "undefined") {
              result[next] = value;
            }
            result = result[next];
          }
          return result;
        };
        opts.methods.forEach((method) => request2[method] = (url2, data, options2) => request2(method, url2, data, options2));
        return request2;
      }
      var request = Request2();
      request.default = request;
      module.exports = request;
    }
  });

  // app/business-logic/crypto-calculator-service.ts
  var import_request = __toESM(require_request());

  // app/common/storage-service.ts
  var Key = "hash-power-income-calculator";
  var StorageService = class {
    db;
    constructor() {
      this.db = window.localStorage || window.sessionStorage;
    }
    getDb() {
      let obj;
      try {
        obj = JSON.parse(this.db.getItem(Key) || "{}");
      } catch (e) {
        obj = {};
      }
      return obj;
    }
    get(key, fallback = null) {
      let result = this.getDb();
      let parsed = key.split(".");
      let next;
      while (parsed.length) {
        next = parsed.shift();
        if (next in result === false || parsed.length > 0 && typeof result[next] !== "object") {
          return fallback;
        }
        result = result[next];
      }
      return result === null || typeof result === "undefined" ? fallback : result;
    }
    set(key, value) {
      let result = this.getDb();
      let finalResult = result;
      let parsed = key.split(".");
      let next;
      while (parsed.length) {
        next = parsed.shift();
        if (next in result === false || parsed.length > 0 && typeof result[next] !== "object") {
          result[next] = {};
        }
        if (parsed.length === 0) {
          if (value === null) {
            delete result[next];
          } else {
            result[next] = value;
          }
        }
        result = result[next];
      }
      this.db.setItem(Key, JSON.stringify(finalResult));
    }
  };
  var storageService = new StorageService();

  // app/business-logic/crypto-calculator-service.ts
  var CoinGeckoRequest = import_request.default.new("https://api.coingecko.com/api/v3", {
    methods: ["get"]
  });
  var MinerstatRequest = import_request.default.new("https://api.minerstat.com/v2/coins", {
    methods: ["get"]
  });
  var OneDayInMilliSeconds = 1e3 * 60 * 60 * 24;
  var CoinEnum = /* @__PURE__ */ ((CoinEnum2) => {
    CoinEnum2["BTC"] = "BTC";
    CoinEnum2["ETH"] = "ETH";
    CoinEnum2["ETC"] = "ETC";
    CoinEnum2["XMR"] = "XMR";
    CoinEnum2["ZEC"] = "ZEC";
    CoinEnum2["DASH"] = "DASH";
    CoinEnum2["LTC"] = "LTC";
    return CoinEnum2;
  })(CoinEnum || {});
  var CryptoCurrencies = {
    BTC: { id: "bitcoin", symbol: "btc", name: "Bitcoin" },
    ETH: { id: "ethereum", symbol: "eth", name: "Ethereum" },
    ETC: { id: "ethereum-classic", symbol: "etc", name: "Ethereum Classic" },
    XMR: { id: "monero", symbol: "xmr", name: "Monero" },
    ZEC: { id: "zcash", symbol: "zec", name: "Zcash" },
    DASH: { id: "dash", symbol: "dash", name: "Dash" },
    LTC: { id: "litecoin", symbol: "ltc", name: "Litecoin" }
  };
  var CryptoCurrenciesIds = ["bitcoin", "ethereum", "ethereum-classic", "monero", "zcash", "dash", "litecoin"];
  var CurrencyEnum = /* @__PURE__ */ ((CurrencyEnum2) => {
    CurrencyEnum2["usd"] = "usd";
    CurrencyEnum2["eur"] = "eur";
    CurrencyEnum2["gbp"] = "gbp";
    CurrencyEnum2["cad"] = "cad";
    CurrencyEnum2["aud"] = "aud";
    CurrencyEnum2["chf"] = "chf";
    CurrencyEnum2["cny"] = "cny";
    CurrencyEnum2["rub"] = "rub";
    CurrencyEnum2["brl"] = "brl";
    CurrencyEnum2["hkd"] = "hkd";
    CurrencyEnum2["jpy"] = "jpy";
    CurrencyEnum2["mxn"] = "mxn";
    return CurrencyEnum2;
  })(CurrencyEnum || {});
  var CalculatorService = class {
    useCache = (path) => {
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
    setCache(path, value) {
      let dateNow = Date.now();
      storageService.set(path, {
        value,
        date: dateNow
      });
    }
    async ping() {
      if (this.useCache("ping")) {
        return storageService.get("ping.value");
      }
      const response = await CoinGeckoRequest.get("/ping");
      this.setCache("ping", response);
      return response;
    }
    async getCoinsList() {
      if (this.useCache("coinsList")) {
        return storageService.get("coinsList.value");
      }
      const response = await CoinGeckoRequest.get("/coins/list");
      this.setCache("coinsList", response);
      return response;
    }
    async getSupportedCurrencies() {
      if (this.useCache("supportedCurrencies")) {
        return storageService.get("supportedCurrencies.value");
      }
      const response = await CoinGeckoRequest.get("/simple/supported_vs_currencies");
      this.setCache("supportedCurrencies", response);
      return response;
    }
    async getPrices() {
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
    async getCoinsData() {
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
    }) {
      let coins = await this.getCoinsData();
      let pricesForAllCoins = await this.getPrices();
      if (!coins || !pricesForAllCoins) {
        throw new Error("Could not load data");
      }
      let coin = coins.find((coin2) => coin2.coin === coinName);
      if (!coin || !CryptoCurrencies[coinName] || !pricesForAllCoins[CryptoCurrencies[coinName].id]) {
        throw new Error("Coin not found");
      }
      if (coin.algorithm !== algorithm) {
        throw new Error("Algorithm not supported");
      }
      let price = pricesForAllCoins[CryptoCurrencies[coinName].id][currency] || pricesForAllCoins[CryptoCurrencies[coinName].id].usd;
      const reward = coin.reward * hashRate;
      const dailyMined = reward * 24;
      const dailyIncome = dailyMined * price;
      const dailyPowerCost = powerCost / 1e3 * power * 24;
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
  };
  async function main() {
    const calculatorService = new CalculatorService();
    let results = await calculatorService.calculateConForHashRate({
      coinName: "ETH" /* ETH */,
      hashRate: 3e9,
      power: 2600,
      powerCost: 0.1,
      currency: "usd",
      algorithm: "Ethash" /* Ethash */
    });
    console.log(results);
  }
  main();

  // node_modules/valyrian.js/lib/index.ts
  var ComponentString = "__component__";
  var TextString = "#text";
  var isNodeJs = Boolean(typeof process !== "undefined" && process.versions && process.versions.node);
  var Und = void 0;
  var Vnode = function Vnode2(tag, props, children) {
    this.props = props;
    this.children = children;
    this.tag = tag;
  };
  function isVnode(object) {
    return object instanceof Vnode;
  }
  function isComponent(component) {
    return typeof component === "function" || typeof component === "object" && component !== null && "view" in component;
  }
  function isVnodeComponent(vnode) {
    return vnode instanceof Vnode && vnode.tag === ComponentString;
  }
  function createDomElement(tag, isSVG = false) {
    return isSVG ? document.createElementNS("http://www.w3.org/2000/svg", tag) : document.createElement(tag);
  }
  function domToVnode(dom) {
    if (dom.nodeType === 3) {
      let vnode = v(TextString, {}, []);
      vnode.nodeValue = dom.nodeValue;
      vnode.dom = dom;
      return vnode;
    }
    if (dom.nodeType === 1) {
      let children = [];
      for (let i = 0; i < dom.childNodes.length; i++) {
        let child = domToVnode(dom.childNodes[i]);
        if (child) {
          children.push(child);
        }
      }
      let props = {};
      [].forEach.call(dom.attributes, (prop) => props[prop.nodeName] = prop.nodeValue);
      let vnode = v(dom.tagName.toLowerCase(), props, ...children);
      vnode.dom = dom;
      return vnode;
    }
  }
  var trust = (htmlString) => {
    let div = createDomElement("div");
    div.innerHTML = htmlString.trim();
    return [].map.call(div.childNodes, (item) => domToVnode(item));
  };
  var reservedProps = {
    key: true,
    state: true,
    oncreate: true,
    onupdate: true,
    onremove: true,
    shouldupdate: true,
    "v-once": true,
    "v-if": true,
    "v-unless": true,
    "v-for": true,
    "v-show": true,
    "v-class": true,
    "v-html": true,
    "v-model": true
  };
  var eventListenerNames = {};
  var onCleanupList = [];
  var onMountList = [];
  var onUpdateList = [];
  var onUnmountList = [];
  var current = {};
  function eventListener(e) {
    let dom = e.target;
    let name = `v-on${e.type}`;
    while (dom) {
      if (dom[name]) {
        dom[name](e, dom);
        if (!e.defaultPrevented) {
          update();
        }
        return;
      }
      dom = dom.parentNode;
    }
  }
  function onCleanup(callback) {
    if (onCleanupList.indexOf(callback) === -1) {
      onCleanupList.push(callback);
    }
  }
  function onUnmount(callback) {
    if (onUnmountList.indexOf(callback) === -1) {
      onUnmountList.push(callback);
    }
  }
  function onMount(callback) {
    if (onMountList.indexOf(callback) === -1) {
      onMountList.push(callback);
    }
  }
  function onUpdate(callback) {
    if (onUpdateList.indexOf(callback) === -1) {
      onUpdateList.push(callback);
    }
  }
  function mount(container, component) {
    let appContainer = null;
    if (isNodeJs) {
      appContainer = typeof container === "string" ? createDomElement(container === "svg" ? "svg" : "div", container === "svg") : container;
    } else {
      appContainer = typeof container === "string" ? document.querySelectorAll(container)[0] : container;
    }
    if (!appContainer) {
      throw new Error("Container not found");
    }
    let vnodeComponent;
    if (isVnodeComponent(component)) {
      vnodeComponent = component;
    } else if (isComponent(component)) {
      vnodeComponent = v(component, {});
    } else {
      throw new Error("Component must be a Valyrian Component or a Vnode component");
    }
    if (v.isMounted) {
      unmount();
    }
    v.component = vnodeComponent;
    v.container = appContainer;
    v.mainVnode = domToVnode(appContainer);
    return update();
  }
  function callCallbackList(list) {
    for (let i = 0; i < list.length; i++) {
      list[i]();
    }
    list = [];
  }
  function update() {
    if (v.component && v.mainVnode) {
      onCleanupList.length && callCallbackList(onCleanupList);
      let oldVnode = v.mainVnode;
      v.mainVnode = new Vnode(v.mainVnode.tag, v.mainVnode.props, [v.component]);
      v.mainVnode.dom = oldVnode.dom;
      patch(v.mainVnode, oldVnode);
      oldVnode = null;
      if (v.isMounted === false) {
        onMountList.length && callCallbackList(onMountList);
        v.isMounted = true;
      } else {
        onUpdateList.length && callCallbackList(onUpdateList);
      }
      if (isNodeJs) {
        return v.mainVnode.dom.innerHTML;
      }
    }
  }
  function unmount() {
    if (v.isMounted && v.mainVnode && v.component) {
      onCleanupList.length && callCallbackList(onCleanupList);
      onUnmountList.length && callCallbackList(onUnmountList);
      let oldVnode = v.mainVnode;
      v.mainVnode = new Vnode(v.mainVnode.tag, v.mainVnode.props, []);
      v.mainVnode.dom = oldVnode.dom;
      v.mainVnode.isSVG = oldVnode.isSVG;
      patch(v.mainVnode, oldVnode);
      oldVnode = null;
      v.component = null;
      v.isMounted = false;
      if (isNodeJs) {
        return v.mainVnode.dom.innerHTML;
      }
    }
  }
  var emptyVnode = new Vnode("__empty__", {}, []);
  function onremove(vnode) {
    for (let i = 0; i < vnode.children.length; i++) {
      vnode.children[i].tag !== TextString && onremove(vnode.children[i]);
    }
    vnode.props.onremove && vnode.props.onremove(vnode);
  }
  function sharedSetAttribute(prop, value, vnode, oldVnode) {
    if (reservedProps[prop]) {
      if (directives[prop]) {
        return directives[prop](vnode.props[prop], vnode, oldVnode);
      }
      return;
    }
    if (typeof value === "function") {
      if (prop in eventListenerNames === false) {
        eventListenerNames[prop] = true;
        v.container.addEventListener(prop.slice(2), eventListener);
      }
      vnode.dom[`v-${prop}`] = value;
      return;
    }
    if (prop in vnode.dom && vnode.isSVG === false) {
      if (vnode.dom[prop] != value) {
        vnode.dom[prop] = value;
      }
      return;
    }
    if (!oldVnode || oldVnode.props[prop] !== value) {
      if (value === false) {
        vnode.dom.removeAttribute(prop);
      } else {
        vnode.dom.setAttribute(prop, value);
      }
    }
  }
  function setAttribute(name, value, vnode, oldVnode) {
    vnode.props[name] = value;
    sharedSetAttribute(name, value, vnode, oldVnode);
  }
  function setAttributes(vnode, oldVnode) {
    for (let prop in vnode.props) {
      if (sharedSetAttribute(prop, vnode.props[prop], vnode, oldVnode) === false) {
        return;
      }
    }
    if (oldVnode) {
      for (let prop in oldVnode.props) {
        if (prop in vnode.props === false && typeof oldVnode.props[prop] !== "function" && prop in reservedProps === false) {
          if (prop in oldVnode.dom && vnode.isSVG === false) {
            oldVnode.dom[prop] = null;
          } else {
            oldVnode.dom.removeAttribute(prop);
          }
        }
      }
    }
  }
  function patch(newVnode, oldVnode = emptyVnode) {
    current.vnode = newVnode;
    current.oldVnode = oldVnode === emptyVnode ? Und : oldVnode;
    let newTree = newVnode.children;
    let oldTree = oldVnode.children;
    for (let i = 0; i < newTree.length; i++) {
      let childVnode = newTree[i];
      if (childVnode instanceof Vnode) {
        if (childVnode.tag !== TextString) {
          if (childVnode.tag === ComponentString) {
            let component = childVnode.component;
            current.component = component;
            let result = ("view" in component ? component.view : component).call(component, childVnode.props, ...childVnode.children);
            newTree.splice(i--, 1, result);
            continue;
          }
          childVnode.isSVG = newVnode.isSVG || childVnode.tag === "svg";
        }
      } else if (Array.isArray(childVnode)) {
        newTree.splice(i--, 1, ...childVnode);
      } else if (childVnode === null || childVnode === Und) {
        newTree.splice(i--, 1);
      } else {
        newTree[i] = new Vnode(TextString, {}, []);
        newTree[i].nodeValue = childVnode;
      }
    }
    let oldTreeLength = oldTree.length;
    let newTreeLength = newTree.length;
    if (newTreeLength === 0) {
      for (let i = 0; i < oldTreeLength; i++) {
        oldTree[i].tag !== TextString && onremove(oldTree[i]);
      }
      newVnode.dom.textContent = "";
      return;
    }
    if (oldTreeLength && "key" in newTree[0].props && "key" in oldTree[0].props) {
      let oldKeyedList = {};
      for (let i = 0; i < oldTreeLength; i++) {
        oldKeyedList[oldTree[i].props.key] = i;
      }
      let newKeyedList = {};
      for (let i = 0; i < newTreeLength; i++) {
        newKeyedList[newTree[i].props.key] = i;
      }
      for (let i = 0; i < newTreeLength; i++) {
        let childVnode = newTree[i];
        let oldChildVnode = oldTree[oldKeyedList[childVnode.props.key]];
        let shouldPatch = true;
        if (oldChildVnode) {
          childVnode.dom = oldChildVnode.dom;
          if ("v-once" in childVnode.props || childVnode.props.shouldupdate && childVnode.props.shouldupdate(childVnode, oldChildVnode) === false) {
            childVnode.children = oldChildVnode.children;
            shouldPatch = false;
          } else {
            setAttributes(childVnode, oldChildVnode);
            if (v.isMounted) {
              childVnode.props.onupdate && childVnode.props.onupdate(childVnode, oldChildVnode);
            } else {
              childVnode.props.oncreate && childVnode.props.oncreate(childVnode);
            }
          }
        } else {
          childVnode.dom = createDomElement(childVnode.tag, childVnode.isSVG);
          setAttributes(childVnode);
          childVnode.props.oncreate && childVnode.props.oncreate(childVnode);
        }
        if (newVnode.dom.childNodes[i] === Und) {
          newVnode.dom.appendChild(childVnode.dom);
        } else if (newVnode.dom.childNodes[i] !== childVnode.dom) {
          oldTree[i] && newKeyedList[oldTree[i].props.key] === Und && onremove(oldTree[i]);
          newVnode.dom.replaceChild(childVnode.dom, newVnode.dom.childNodes[i]);
        }
        shouldPatch && patch(childVnode, oldChildVnode);
      }
      for (let i = newTreeLength; i < oldTreeLength; i++) {
        if (newKeyedList[oldTree[i].props.key] === Und) {
          let oldChildVnode = oldTree[i];
          onremove(oldChildVnode);
          oldChildVnode.dom.parentNode && oldChildVnode.dom.parentNode.removeChild(oldChildVnode.dom);
        }
      }
      return;
    }
    for (let i = 0; i < newTreeLength; i++) {
      let newChildVnode = newTree[i];
      if (i < oldTreeLength) {
        let oldChildVnode = oldTree[i];
        if (newChildVnode.tag === TextString) {
          if (oldChildVnode.tag === TextString) {
            newChildVnode.dom = oldChildVnode.dom;
            if (newChildVnode.dom.nodeValue != newChildVnode.nodeValue) {
              newChildVnode.dom.nodeValue = newChildVnode.nodeValue;
            }
            continue;
          }
          newChildVnode.dom = document.createTextNode(newChildVnode.nodeValue);
          onremove(oldChildVnode);
          newVnode.dom.replaceChild(newChildVnode.dom, oldChildVnode.dom);
          continue;
        }
        if (oldChildVnode.tag === newChildVnode.tag) {
          newChildVnode.dom = oldChildVnode.dom;
          if (newChildVnode.props["v-once"] || newChildVnode.props.shouldupdate && newChildVnode.props.shouldupdate(newChildVnode, oldChildVnode) === false) {
            newChildVnode.children = oldChildVnode.children;
            continue;
          }
          setAttributes(newChildVnode, oldChildVnode);
          if (v.isMounted) {
            newChildVnode.props.onupdate && newChildVnode.props.onupdate(newChildVnode, oldChildVnode);
          } else {
            newChildVnode.props.oncreate && newChildVnode.props.oncreate(newChildVnode);
          }
          patch(newChildVnode, oldChildVnode);
          continue;
        }
        newChildVnode.dom = createDomElement(newChildVnode.tag, newChildVnode.isSVG);
        setAttributes(newChildVnode);
        oldChildVnode.tag !== TextString && onremove(oldChildVnode);
        newChildVnode.props.oncreate && newChildVnode.props.oncreate(newChildVnode);
        newVnode.dom.replaceChild(newChildVnode.dom, oldChildVnode.dom);
        patch(newChildVnode, emptyVnode);
        continue;
      }
      if (newChildVnode.tag === TextString) {
        newChildVnode.dom = document.createTextNode(newChildVnode.nodeValue);
        newVnode.dom.appendChild(newChildVnode.dom);
        continue;
      }
      newChildVnode.dom = createDomElement(newChildVnode.tag, newChildVnode.isSVG);
      setAttributes(newChildVnode);
      newVnode.dom.appendChild(newChildVnode.dom);
      newChildVnode.props.oncreate && newChildVnode.props.oncreate(newChildVnode);
      patch(newChildVnode, emptyVnode);
    }
    for (let i = newTreeLength; i < oldTreeLength; i++) {
      let oldChildVnode = oldTree[i];
      oldChildVnode.tag !== TextString && onremove(oldChildVnode);
      oldChildVnode.dom.parentNode && oldChildVnode.dom.parentNode.removeChild(oldChildVnode.dom);
    }
  }
  function directive(name, directive2) {
    let fullName = `v-${name}`;
    directives[fullName] = directive2;
    reservedProps[fullName] = true;
  }
  function hideDirective(test) {
    return (bool, vnode, oldVnode) => {
      let value = test ? bool : !bool;
      if (value) {
        let newdom = document.createTextNode("");
        if (oldVnode && oldVnode.dom && oldVnode.dom.parentNode) {
          oldVnode.tag !== TextString && onremove(oldVnode);
          oldVnode.dom.parentNode.replaceChild(newdom, oldVnode.dom);
        }
        vnode.tag = TextString;
        vnode.children = [];
        vnode.props = {};
        vnode.dom = newdom;
        return false;
      }
    };
  }
  var directives = {
    "v-if": hideDirective(false),
    "v-unless": hideDirective(true),
    "v-for": (set, vnode) => {
      vnode.children = set.map(vnode.children[0]);
    },
    "v-show": (bool, vnode) => {
      vnode.dom.style.display = bool ? "" : "none";
    },
    "v-class": (classes, vnode) => {
      for (let name in classes) {
        vnode.dom.classList.toggle(name, classes[name]);
      }
    },
    "v-html": (html, vnode) => {
      vnode.children = [trust(html)];
    },
    "v-model": ([model, property, event], vnode, oldVnode) => {
      let value;
      let handler;
      if (vnode.tag === "input") {
        event = event || "oninput";
        switch (vnode.props.type) {
          case "checkbox": {
            if (Array.isArray(model[property])) {
              handler = (e) => {
                let val = e.target.value;
                let idx = model[property].indexOf(val);
                if (idx === -1) {
                  model[property].push(val);
                } else {
                  model[property].splice(idx, 1);
                }
              };
              value = model[property].indexOf(vnode.dom.value) !== -1;
            } else if ("value" in vnode.props) {
              handler = () => {
                if (model[property] === vnode.props.value) {
                  model[property] = null;
                } else {
                  model[property] = vnode.props.value;
                }
              };
              value = model[property] === vnode.props.value;
            } else {
              handler = () => model[property] = !model[property];
              value = model[property];
            }
            setAttribute("checked", value, vnode, oldVnode);
            break;
          }
          case "radio": {
            setAttribute("checked", model[property] === vnode.dom.value, vnode, oldVnode);
            break;
          }
          default: {
            setAttribute("value", model[property], vnode, oldVnode);
          }
        }
      } else if (vnode.tag === "select") {
        event = event || "onclick";
        if (vnode.props.multiple) {
          handler = (e) => {
            let val = e.target.value;
            if (e.ctrlKey) {
              let idx = model[property].indexOf(val);
              if (idx === -1) {
                model[property].push(val);
              } else {
                model[property].splice(idx, 1);
              }
            } else {
              model[property].splice(0, model[property].length);
              model[property].push(val);
            }
          };
          vnode.children.forEach((child) => {
            if (child.tag === "option") {
              let value2 = "value" in child.props ? child.props.value : child.children.join("").trim();
              child.props.selected = model[property].indexOf(value2) !== -1;
            }
          });
        } else {
          vnode.children.forEach((child) => {
            if (child.tag === "option") {
              let value2 = "value" in child.props ? child.props.value : child.children.join("").trim();
              child.props.selected = value2 === model[property];
            }
          });
        }
      } else if (vnode.tag === "textarea") {
        event = event || "oninput";
        vnode.children = [model[property]];
      }
      if (!vnode.props[event]) {
        if (!handler) {
          handler = (e) => model[property] = e.target.value;
        }
        setAttribute(event, handler, vnode, oldVnode);
      }
    }
  };
  var plugins = /* @__PURE__ */ new Map();
  function use(plugin, options) {
    if (plugins.has(plugin)) {
      return plugins.get(plugin);
    }
    let result = plugin(v, options);
    plugins.set(plugin, result);
    return result;
  }
  var v = function v2(tagOrComponent, props, ...children) {
    if (typeof tagOrComponent === "string") {
      return new Vnode(tagOrComponent, props || {}, children);
    }
    const vnode = new Vnode("__component__", props || {}, children);
    vnode.component = tagOrComponent;
    return vnode;
  };
  v.fragment = (props, ...children) => {
    return children;
  };
  v.current = current;
  v.directives = directives;
  v.reservedProps = reservedProps;
  v.isVnode = isVnode;
  v.isComponent = isComponent;
  v.isVnodeComponent = isVnodeComponent;
  v.isMounted = false;
  v.isNodeJs = isNodeJs;
  v.trust = trust;
  v.onCleanup = onCleanup;
  v.onUnmount = onUnmount;
  v.onMount = onMount;
  v.onUpdate = onUpdate;
  v.mount = mount;
  v.unmount = unmount;
  v.update = update;
  v.setAttribute = setAttribute;
  v.directive = directive;
  v.use = use;
  var lib_default = v;

  // app/index.tsx
  lib_default.mount("body", () => /* @__PURE__ */ lib_default("div", null, "Hello World"));
})();
