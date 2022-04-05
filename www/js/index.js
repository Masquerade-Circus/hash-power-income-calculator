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

  // node_modules/valyrian.js/plugins/hooks.js
  var require_hooks = __commonJS({
    "node_modules/valyrian.js/plugins/hooks.js"(exports, module) {
      var v3 = {
        current: {}
      };
      function createHook({ create, update: update2, remove, returnValue }) {
        return (...args) => {
          let { component, vnode, oldVnode } = v3.current;
          if (vnode.components === void 0) {
            vnode.components = [];
            v3.onUnmount(() => Reflect.deleteProperty(vnode, "components"));
          }
          if (vnode.components.indexOf(component) === -1) {
            vnode.components.push(component);
          }
          if (component.hooks === void 0) {
            component.hooks = [];
            v3.onUnmount(() => Reflect.deleteProperty(component, "hooks"));
          }
          let hook;
          if (!oldVnode || !oldVnode.components || oldVnode.components[vnode.components.length - 1] !== component) {
            hook = create(...args);
            component.hooks.push(hook);
            if (remove) {
              v3.onUnmount(() => remove(hook));
            }
          } else {
            hook = component.hooks[component.hooks.length - 1];
            if (update2) {
              update2(hook, ...args);
            }
          }
          if (returnValue) {
            return returnValue(hook);
          }
          return hook;
        };
      }
      var useState = createHook({
        create: (value) => {
          let state = value;
          let setState = (value2) => state = value2;
          let stateObj = /* @__PURE__ */ Object.create(null);
          stateObj.toJSON = stateObj.toString = stateObj.valueOf = () => typeof state === "function" ? state() : state;
          return [stateObj, setState];
        }
      });
      var useEffect = createHook({
        create: (effect, changes) => {
          let hook = { effect, prev: [] };
          if (changes === null) {
            hook.onRemove = effect;
            return hook;
          }
          hook.prev = changes;
          hook.onCleanup = hook.effect();
          return hook;
        },
        update: (hook, effect, changes) => {
          if (typeof changes === "undefined") {
            hook.prev = changes;
            if (typeof hook.onCleanup === "function") {
              hook.onCleanup();
            }
            hook.onCleanup = hook.effect();
            return;
          }
          if (Array.isArray(changes)) {
            for (let i = 0, l = changes.length; i < l; i++) {
              if (changes[i] !== hook.prev[i]) {
                hook.prev = changes;
                if (typeof hook.onCleanup === "function") {
                  hook.onCleanup();
                }
                hook.onCleanup = hook.effect();
                return;
              }
            }
          }
        },
        remove: (hook) => {
          if (typeof hook.onCleanup === "function") {
            hook.onCleanup();
          }
          if (typeof hook.onRemove === "function") {
            hook.onRemove();
          }
        }
      });
      var useRef = createHook({
        create: (initialValue) => {
          v3.directive("ref", (ref, vnode) => {
            ref.current = vnode.dom;
          });
          return { current: initialValue };
        }
      });
      var useCallback2 = createHook({
        create: (callback, changes) => {
          callback();
          return { callback, changes };
        },
        update: (hook, callback, changes) => {
          for (let i = 0, l = changes.length; i < l; i++) {
            if (changes[i] !== hook.changes[i]) {
              hook.changes = changes;
              hook.callback();
              return;
            }
          }
        }
      });
      var useMemo = createHook({
        create: (callback, changes) => {
          return { callback, changes, value: callback() };
        },
        update: (hook, callback, changes) => {
          for (let i = 0, l = changes.length; i < l; i++) {
            if (changes[i] !== hook.changes[i]) {
              hook.changes = changes;
              hook.value = callback();
              return;
            }
          }
        },
        returnValue: (hook) => {
          return hook.value;
        }
      });
      function plugin(vInstance) {
        v3 = vInstance;
      }
      plugin.createHook = createHook;
      plugin.useState = useState;
      plugin.useEffect = useEffect;
      plugin.useRef = useRef;
      plugin.useCallback = useCallback2;
      plugin.useMemo = useMemo;
      plugin.default = plugin;
      module.exports = plugin;
    }
  });

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

  // app/business-logic/btc.svg.tsx
  function BtcSVG() {
    return /* @__PURE__ */ lib_default("svg", {
      xmlns: "http://www.w3.org/2000/svg",
      "xml:space": "preserve",
      width: "100%",
      height: "100%",
      version: "1.1",
      "shape-rendering": "geometricPrecision",
      "text-rendering": "geometricPrecision",
      "image-rendering": "optimizeQuality",
      "fill-rule": "evenodd",
      "clip-rule": "evenodd",
      viewBox: "0 0 4091.27 4091.73",
      "xmlns:xlink": "http://www.w3.org/1999/xlink",
      "xmlns:xodm": "http://www.corel.com/coreldraw/odm/2003"
    }, /* @__PURE__ */ lib_default("g", {
      id: "Layer_x0020_1"
    }, /* @__PURE__ */ lib_default("metadata", {
      id: "CorelCorpID_0Corel-Layer"
    }), /* @__PURE__ */ lib_default("g", {
      id: "_1421344023328"
    }, /* @__PURE__ */ lib_default("path", {
      fill: "#F7931A",
      "fill-rule": "nonzero",
      d: "M4030.06 2540.77c-273.24,1096.01 -1383.32,1763.02 -2479.46,1489.71 -1095.68,-273.24 -1762.69,-1383.39 -1489.33,-2479.31 273.12,-1096.13 1383.2,-1763.19 2479,-1489.95 1096.06,273.24 1763.03,1383.51 1489.76,2479.57l0.02 -0.02z"
    }), /* @__PURE__ */ lib_default("path", {
      fill: "white",
      "fill-rule": "nonzero",
      d: "M2947.77 1754.38c40.72,-272.26 -166.56,-418.61 -450,-516.24l91.95 -368.8 -224.5 -55.94 -89.51 359.09c-59.02,-14.72 -119.63,-28.59 -179.87,-42.34l90.16 -361.46 -224.36 -55.94 -92 368.68c-48.84,-11.12 -96.81,-22.11 -143.35,-33.69l0.26 -1.16 -309.59 -77.31 -59.72 239.78c0,0 166.56,38.18 163.05,40.53 90.91,22.69 107.35,82.87 104.62,130.57l-104.74 420.15c6.26,1.59 14.38,3.89 23.34,7.49 -7.49,-1.86 -15.46,-3.89 -23.73,-5.87l-146.81 588.57c-11.11,27.62 -39.31,69.07 -102.87,53.33 2.25,3.26 -163.17,-40.72 -163.17,-40.72l-111.46 256.98 292.15 72.83c54.35,13.63 107.61,27.89 160.06,41.3l-92.9 373.03 224.24 55.94 92 -369.07c61.26,16.63 120.71,31.97 178.91,46.43l-91.69 367.33 224.51 55.94 92.89 -372.33c382.82,72.45 670.67,43.24 791.83,-303.02 97.63,-278.78 -4.86,-439.58 -206.26,-544.44 146.69,-33.83 257.18,-130.31 286.64,-329.61l-0.07 -0.05zm-512.93 719.26c-69.38,278.78 -538.76,128.08 -690.94,90.29l123.28 -494.2c152.17,37.99 640.17,113.17 567.67,403.91zm69.43 -723.3c-63.29,253.58 -453.96,124.75 -580.69,93.16l111.77 -448.21c126.73,31.59 534.85,90.55 468.94,355.05l-0.02 0z"
    }))));
  }

  // app/business-logic/dash.svg.tsx
  function DashSVG() {
    return /* @__PURE__ */ lib_default("svg", {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 513.4 416.8"
    }, /* @__PURE__ */ lib_default("defs", null, /* @__PURE__ */ lib_default("style", null, `.cls-1 {
        fill: #008de4;
      }`)), /* @__PURE__ */ lib_default("title", null, "d"), /* @__PURE__ */ lib_default("g", {
      id: "Layer_2",
      "data-name": "Layer 2"
    }, /* @__PURE__ */ lib_default("g", {
      id: "Layer_1-2",
      "data-name": "Layer 1"
    }, /* @__PURE__ */ lib_default("path", {
      class: "cls-1",
      d: "M336.25,0H149.35l-15.5,86.6,168.7.2c83.1,0,107.6,30.2,106.9,80.2-.4,25.6-11.5,69-16.3,83.1-12.8,37.5-39.1,80.2-137.7,80.1l-164-.1L76,416.8h186.5c65.8,0,93.7-7.7,123.4-21.3,65.7-30.5,104.8-95.3,120.5-179.9C529.65,89.6,500.65,0,336.25,0"
    }), /* @__PURE__ */ lib_default("path", {
      class: "cls-1",
      d: "M68.7,164.9c-49,0-56,31.9-60.6,51.2C2,241.3,0,251.6,0,251.6H191.4c49,0,56-31.9,60.6-51.2,6.1-25.2,8.1-35.5,8.1-35.5Z"
    }))));
  }

  // app/business-logic/etc.svg.tsx
  function EtcSVG() {
    return /* @__PURE__ */ lib_default("svg", {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 1543 2499.2"
    }, /* @__PURE__ */ lib_default("defs", null, /* @__PURE__ */ lib_default("style", null, `.cls-1{fill:#3ab83a;}.cls-2{fill:#0b8311;}.cls-3{fill:#146714;}`)), /* @__PURE__ */ lib_default("title", null, "e"), /* @__PURE__ */ lib_default("g", {
      id: "Layer_2",
      "data-name": "Layer 2"
    }, /* @__PURE__ */ lib_default("g", {
      id: "svg8"
    }, /* @__PURE__ */ lib_default("g", {
      id: "layer5"
    }, /* @__PURE__ */ lib_default("g", {
      id: "g1627"
    }, /* @__PURE__ */ lib_default("path", {
      id: "path1599",
      class: "cls-1",
      d: "M0,1361.05c271.87,144.38,555.56,295.51,774.67,412.45L1543,1361.05c-278.2,413.29-510,757.36-768.33,1138.15C515.88,2119.25,230.08,1700,0,1361.05Zm29.55-114L775.51,849l736.25,395.14L775.93,1642.63ZM774.67,721.47,0,1129.28,771.29,0,1543,1131.81,774.67,721.47Z"
    }), /* @__PURE__ */ lib_default("path", {
      id: "path1593",
      class: "cls-2",
      d: "M774.67,1773.5,1543,1361.05C1264.8,1774.34,774.67,2499.2,774.67,2499.2ZM775.51,849l736.25,395.14L775.93,1642.63,775.51,849Zm-.84-127.5L771.29,0,1543,1131.81Z"
    }), /* @__PURE__ */ lib_default("path", {
      id: "path1603",
      class: "cls-2",
      d: "M29.55,1247.06l746,61.22,736.25-63.75L775.93,1643.05Z"
    }), /* @__PURE__ */ lib_default("path", {
      id: "path1606",
      class: "cls-3",
      d: "M775.51,1308.28l736.25-63.75L775.93,1643.05l-.42-334.77Z"
    }))))));
  }

  // app/business-logic/eth.svg.tsx
  function EthSVG() {
    return /* @__PURE__ */ lib_default("svg", {
      xmlns: "http://www.w3.org/2000/svg",
      "xml:space": "preserve",
      width: "100%",
      height: "100%",
      version: "1.1",
      "shape-rendering": "geometricPrecision",
      "text-rendering": "geometricPrecision",
      "image-rendering": "optimizeQuality",
      "fill-rule": "evenodd",
      "clip-rule": "evenodd",
      viewBox: "0 0 784.37 1277.39",
      "xmlns:xlink": "http://www.w3.org/1999/xlink",
      "xmlns:xodm": "http://www.corel.com/coreldraw/odm/2003"
    }, /* @__PURE__ */ lib_default("g", {
      id: "Layer_x0020_1"
    }, /* @__PURE__ */ lib_default("metadata", {
      id: "CorelCorpID_0Corel-Layer"
    }), /* @__PURE__ */ lib_default("g", {
      id: "_1421394342400"
    }, /* @__PURE__ */ lib_default("g", null, /* @__PURE__ */ lib_default("polygon", {
      fill: "#343434",
      "fill-rule": "nonzero",
      points: "392.07,0 383.5,29.11 383.5,873.74 392.07,882.29 784.13,650.54 "
    }), /* @__PURE__ */ lib_default("polygon", {
      fill: "#8C8C8C",
      "fill-rule": "nonzero",
      points: "392.07,0 -0,650.54 392.07,882.29 392.07,472.33 "
    }), /* @__PURE__ */ lib_default("polygon", {
      fill: "#3C3C3B",
      "fill-rule": "nonzero",
      points: "392.07,956.52 387.24,962.41 387.24,1263.28 392.07,1277.38 784.37,724.89 "
    }), /* @__PURE__ */ lib_default("polygon", {
      fill: "#8C8C8C",
      "fill-rule": "nonzero",
      points: "392.07,1277.38 392.07,956.52 -0,724.89 "
    }), /* @__PURE__ */ lib_default("polygon", {
      fill: "#141414",
      "fill-rule": "nonzero",
      points: "392.07,882.29 784.13,650.54 392.07,472.33 "
    }), /* @__PURE__ */ lib_default("polygon", {
      fill: "#393939",
      "fill-rule": "nonzero",
      points: "0,650.54 392.07,882.29 392.07,472.33 "
    })))));
  }

  // app/business-logic/ltc.svg.tsx
  function LtcSVG() {
    return /* @__PURE__ */ lib_default("svg", {
      id: "Layer_1",
      "data-name": "Layer 1",
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 82.6 82.6"
    }, /* @__PURE__ */ lib_default("title", null, "litecoin-ltc-logo"), /* @__PURE__ */ lib_default("circle", {
      cx: "41.3",
      cy: "41.3",
      r: "36.83",
      style: "fill:#fff"
    }), /* @__PURE__ */ lib_default("path", {
      d: "M41.3,0A41.3,41.3,0,1,0,82.6,41.3h0A41.18,41.18,0,0,0,41.54,0ZM42,42.7,37.7,57.2h23a1.16,1.16,0,0,1,1.2,1.12v.38l-2,6.9a1.49,1.49,0,0,1-1.5,1.1H23.2l5.9-20.1-6.6,2L24,44l6.6-2,8.3-28.2a1.51,1.51,0,0,1,1.5-1.1h8.9a1.16,1.16,0,0,1,1.2,1.12v.38L43.5,38l6.6-2-1.4,4.8Z",
      style: "fill:#345d9d"
    }));
  }

  // app/business-logic/crypto-calculator-service.ts
  var import_request = __toESM(require_request());

  // app/business-logic/xmr.svg.tsx
  function XmrSVG() {
    return /* @__PURE__ */ lib_default("svg", {
      id: "Layer_1",
      "data-name": "Layer 1",
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 3756.09 3756.49"
    }, /* @__PURE__ */ lib_default("title", null, "monero"), /* @__PURE__ */ lib_default("path", {
      d: "M4128,2249.81C4128,3287,3287.26,4127.86,2250,4127.86S372,3287,372,2249.81,1212.76,371.75,2250,371.75,4128,1212.54,4128,2249.81Z",
      transform: "translate(-371.96 -371.75)",
      style: "fill:#fff"
    }), /* @__PURE__ */ lib_default("path", {
      id: "_149931032",
      "data-name": " 149931032",
      d: "M2250,371.75c-1036.89,0-1879.12,842.06-1877.8,1878,0.26,207.26,33.31,406.63,95.34,593.12h561.88V1263L2250,2483.57,3470.52,1263v1579.9h562c62.12-186.48,95-385.85,95.37-593.12C4129.66,1212.76,3287,372,2250,372Z",
      transform: "translate(-371.96 -371.75)",
      style: "fill:#f26822"
    }), /* @__PURE__ */ lib_default("path", {
      id: "_149931160",
      "data-name": " 149931160",
      d: "M1969.3,2764.17l-532.67-532.7v994.14H1029.38l-384.29.07c329.63,540.8,925.35,902.56,1604.91,902.56S3525.31,3766.4,3855,3225.6H3063.25V2231.47l-532.7,532.7-280.61,280.61-280.62-280.61h0Z",
      transform: "translate(-371.96 -371.75)",
      style: "fill:#4d4d4d"
    }));
  }

  // app/business-logic/zec.svg.tsx
  function ZecSVG() {
    return /* @__PURE__ */ lib_default("svg", {
      xmlns: "http://www.w3.org/2000/svg",
      "xmlns:xlink": "http://www.w3.org/1999/xlink",
      viewBox: "0 0 2500 2500"
    }, /* @__PURE__ */ lib_default("defs", null, /* @__PURE__ */ lib_default("style", null, `.cls-1{fill:url(#linear-gradient);}`), /* @__PURE__ */ lib_default("linearGradient", {
      id: "linear-gradient",
      x1: "782.84",
      y1: "165.91",
      x2: "799.34",
      y2: "165.91",
      gradientTransform: "translate(-81568.2 55372.05) rotate(-45) scale(122.41)",
      gradientUnits: "userSpaceOnUse"
    }, /* @__PURE__ */ lib_default("stop", {
      offset: "0",
      "stop-color": "#cf8724"
    }), /* @__PURE__ */ lib_default("stop", {
      offset: "1",
      "stop-color": "#fdce58"
    }))), /* @__PURE__ */ lib_default("title", null, "z"), /* @__PURE__ */ lib_default("g", {
      id: "Layer_2",
      "data-name": "Layer 2"
    }, /* @__PURE__ */ lib_default("g", {
      id: "Layer_1-2",
      "data-name": "Layer 1"
    }, /* @__PURE__ */ lib_default("path", {
      class: "cls-1",
      d: "M1263.05,2297.61c-569.6,0-1034.57-465.43-1034.57-1034.56,0-569.6,465.44-1034.57,1034.57-1034.57,569.6,0,1034.56,465.44,1034.56,1034.57C2297.61,1832.65,1832.65,2297.61,1263.05,2297.61Z"
    }), /* @__PURE__ */ lib_default("path", {
      d: "M1250,2500C562.5,2500,0,1937.5,0,1250S562.5,0,1250,0,2500,562.5,2500,1250,1937.5,2500,1250,2500Zm0-2222.06c-534.56,0-972.06,437.5-972.06,972.06s437.5,972.06,972.06,972.06,972.06-437.5,972.06-972.06S1784.56,277.94,1250,277.94Z"
    }), /* @__PURE__ */ lib_default("path", {
      d: "M1221.05,1588.59h541.67v270.84h-319.6v229.16H1165.18V1866.53H831.85c0-90.44-13.73-180.4,7.1-263.73,7.1-41.67,55.4-83.34,90.43-125,104.17-125,208.34-250,319.61-375,41.66-48.77,83.33-90.44,132.1-145.83H860.26V686.13h305.39V457h270.84V679h333.33c0,90.43,13.73,180.4-7.1,263.73-7.1,41.67-55.4,83.33-90.44,125-104.16,125-208.33,250-319.6,375C1311,1491.53,1269.35,1539.82,1221.05,1588.59Z"
    }))));
  }

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
  var ThirtyMinutesInMilliSeconds = 1e3 * 60 * 30;
  var DefaultCacheTime = ThirtyMinutesInMilliSeconds;
  var CoinSymbolEnum = /* @__PURE__ */ ((CoinSymbolEnum2) => {
    CoinSymbolEnum2["BTC"] = "BTC";
    CoinSymbolEnum2["ETH"] = "ETH";
    CoinSymbolEnum2["ETC"] = "ETC";
    CoinSymbolEnum2["XMR"] = "XMR";
    CoinSymbolEnum2["ZEC"] = "ZEC";
    CoinSymbolEnum2["DASH"] = "DASH";
    CoinSymbolEnum2["LTC"] = "LTC";
    return CoinSymbolEnum2;
  })(CoinSymbolEnum || {});
  var CryptoCurrencies = {
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
        power: 1e3
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
        power: 1e3
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
        power: 1e3
      }
    }
  };
  var CryptoCurrenciesIds = ["bitcoin", "ethereum", "ethereum-classic", "monero", "zcash", "dash", "litecoin"];
  var CurrencyEnum = /* @__PURE__ */ ((CurrencyEnum2) => {
    CurrencyEnum2["USD"] = "USD";
    CurrencyEnum2["EUR"] = "EUR";
    CurrencyEnum2["GBP"] = "GBP";
    CurrencyEnum2["CAD"] = "CAD";
    CurrencyEnum2["AUD"] = "AUD";
    CurrencyEnum2["CHF"] = "CHF";
    CurrencyEnum2["CNY"] = "CNY";
    CurrencyEnum2["RUB"] = "RUB";
    CurrencyEnum2["BRL"] = "BRL";
    CurrencyEnum2["HKD"] = "HKD";
    CurrencyEnum2["JPY"] = "JPY";
    CurrencyEnum2["MXN"] = "MXN";
    return CurrencyEnum2;
  })(CurrencyEnum || {});
  var HashRateStringToNumber = /* @__PURE__ */ ((HashRateStringToNumber2) => {
    HashRateStringToNumber2[HashRateStringToNumber2["Ph/s"] = 1e15] = "Ph/s";
    HashRateStringToNumber2[HashRateStringToNumber2["Th/s"] = 1e12] = "Th/s";
    HashRateStringToNumber2[HashRateStringToNumber2["Gh/s"] = 1e9] = "Gh/s";
    HashRateStringToNumber2[HashRateStringToNumber2["Mh/s"] = 1e6] = "Mh/s";
    HashRateStringToNumber2[HashRateStringToNumber2["Kh/s"] = 1e3] = "Kh/s";
    HashRateStringToNumber2[HashRateStringToNumber2["H/s"] = 1] = "H/s";
    return HashRateStringToNumber2;
  })(HashRateStringToNumber || {});
  var CalculatorService = class {
    useCache = (path) => {
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
        vs_currencies: Object.keys(CurrencyEnum).map((key) => key.toLowerCase()).join(",")
      });
      this.setCache("prices", response);
      return response;
    }
    async getCoinsData() {
      if (this.useCache("coinsData")) {
        return storageService.get("coinsData.value");
      }
      const response = await MinerstatRequest.get("/", {
        list: Object.keys(CoinSymbolEnum).join(",")
      });
      this.setCache("coinsData", response);
      return response;
    }
    getHashRateFromString(hashRateString, amount) {
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
    }) {
      let coins = await this.getCoinsData();
      let pricesForAllCoins = await this.getPrices();
      if (!coins || !pricesForAllCoins) {
        throw new Error("Could not load data");
      }
      let coin = coins.find((coin2) => coin2.coin === coinSymbol);
      if (!coin || !CryptoCurrencies[coinSymbol] || !pricesForAllCoins[CryptoCurrencies[coinSymbol].id]) {
        throw new Error("Coin not found");
      }
      if (algorithm && coin.algorithm !== algorithm) {
        throw new Error("Algorithm not supported");
      }
      let currencyLowerCased = (currency || "usd").toLowerCase();
      let price = pricesForAllCoins[CryptoCurrencies[coinSymbol].id][currencyLowerCased] || pricesForAllCoins[CryptoCurrencies[coinSymbol].id].usd;
      const reward = coin.reward * hashRate;
      const fee = reward * poolFee;
      const rewardWithoutFee = reward - fee;
      const dailyMined = rewardWithoutFee * 24;
      const dailyMinedFee = fee * 24;
      const dailyIncome = dailyMined * price;
      const dailyIncomeFee = dailyMinedFee * price;
      const dailyPowerCost = powerCost / 1e3 * power * 24;
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
  };

  // app/common/format-number.ts
  var CurrencyToLanguageEnum = /* @__PURE__ */ ((CurrencyToLanguageEnum2) => {
    CurrencyToLanguageEnum2["USD"] = "en-US";
    CurrencyToLanguageEnum2["EUR"] = "es-ES";
    CurrencyToLanguageEnum2["GBP"] = "en-GB";
    CurrencyToLanguageEnum2["CAD"] = "en-CA";
    CurrencyToLanguageEnum2["AUD"] = "en-AU";
    CurrencyToLanguageEnum2["CHF"] = "fr-CH";
    CurrencyToLanguageEnum2["CNY"] = "zh-CN";
    CurrencyToLanguageEnum2["RUB"] = "ru-RU";
    CurrencyToLanguageEnum2["BRL"] = "pt-BR";
    CurrencyToLanguageEnum2["HKD"] = "zh-HK";
    CurrencyToLanguageEnum2["JPY"] = "ja-JP";
    CurrencyToLanguageEnum2["MXN"] = "es-MX";
    return CurrencyToLanguageEnum2;
  })(CurrencyToLanguageEnum || {});
  var formatMoney = (amount, currency, language) => {
    let formatter = new Intl.NumberFormat(language, {
      style: "currency",
      currency,
      minimumFractionDigits: 2
    });
    return formatter.format(amount);
  };
  var formatNumber = (amount, decimalPlaces, language) => {
    let formatter = new Intl.NumberFormat(language, {
      style: "decimal",
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces
    });
    return formatter.format(amount);
  };
  function formatMoneyDirective(currency, vnode) {
    let child = vnode.children[0];
    if (typeof child === "number") {
      vnode.children[0] = formatMoney(child, currency, CurrencyToLanguageEnum[currency]);
    }
  }
  function formatNumberDirective({ currency, decimalPlaces }, vnode) {
    let child = vnode.children[0];
    if (typeof child === "number") {
      vnode.children[0] = formatNumber(child, decimalPlaces, CurrencyToLanguageEnum[currency]);
    }
  }

  // app/app.tsx
  var import_hooks = __toESM(require_hooks());
  lib_default.use(import_hooks.default);
  var DefaultCurrency = "USD" /* USD */;
  var DefaultCoin = CryptoCurrencies.ETH;
  var AllowSelectMiner = false;
  var DefaultConfig = {
    powerCost: 0.1,
    poolFee: 1
  };
  var Store = {
    currency: DefaultCurrency,
    coin: DefaultCoin,
    formToShow: "manualConfig" /* manualConfig */,
    config: {
      powerCost: DefaultConfig.powerCost,
      poolFee: DefaultConfig.poolFee,
      BTC: { ...CryptoCurrencies.BTC.config },
      ETH: { ...CryptoCurrencies.ETH.config },
      ETC: { ...CryptoCurrencies.ETC.config },
      LTC: { ...CryptoCurrencies.LTC.config },
      XMR: { ...CryptoCurrencies.XMR.config },
      ZEC: { ...CryptoCurrencies.ZEC.config },
      DASH: { ...CryptoCurrencies.DASH.config }
    },
    result: {}
  };
  function CoinNav() {
    return /* @__PURE__ */ lib_default("nav", {
      "v-for": Object.keys(CryptoCurrencies),
      class: "coin-nav flex"
    }, (key) => /* @__PURE__ */ lib_default("button", {
      "v-class": {
        active: Store.coin.symbol === key
      },
      onclick: () => Store.coin = CryptoCurrencies[key]
    }, key));
  }
  function CurrencyNav() {
    return /* @__PURE__ */ lib_default("nav", {
      "v-for": Object.keys(CurrencyEnum),
      class: "currency-nav flex flex-column"
    }, (key) => /* @__PURE__ */ lib_default("button", {
      "v-class": {
        active: Store.currency === key
      },
      onclick: () => Store.currency = key
    }, key));
  }
  function CoinDescription() {
    return /* @__PURE__ */ lib_default("div", {
      class: "coin-description-top"
    }, /* @__PURE__ */ lib_default("figure", null, Store.coin.icon), /* @__PURE__ */ lib_default("b", null, Store.coin.name), /* @__PURE__ */ lib_default("small", null, "1 ", Store.coin.symbol, " = ", Store.result.price, " ", Store.currency));
  }
  function MinerSelect() {
    return /* @__PURE__ */ lib_default("div", {
      "v-if": Store.formToShow === "minerSelect" /* minerSelect */ && AllowSelectMiner
    });
  }
  function ManualConfig() {
    return /* @__PURE__ */ lib_default("div", {
      "v-if": !AllowSelectMiner || Store.formToShow === "manualConfig" /* manualConfig */
    }, /* @__PURE__ */ lib_default("form", null, /* @__PURE__ */ lib_default("section", null, /* @__PURE__ */ lib_default("div", {
      class: "flex flex-hash-power"
    }, /* @__PURE__ */ lib_default("fieldset", null, /* @__PURE__ */ lib_default("legend", null, "Hash Power"), /* @__PURE__ */ lib_default("input", {
      type: "number",
      placeholder: "Hash power",
      "v-model": [Store.config[Store.coin.symbol], "hashRateAmount"],
      onkeyup: lib_default.update
    })), /* @__PURE__ */ lib_default("fieldset", {
      class: "hash-power"
    }, /* @__PURE__ */ lib_default("legend", null, "\xA0"), /* @__PURE__ */ lib_default("select", {
      value: Store.config[Store.coin.symbol].hashRateType,
      onchange: (e) => {
        Store.config[Store.coin.symbol].hashRateType = e.target.value;
        lib_default.update();
      }
    }, /* @__PURE__ */ lib_default("option", null, "Ph/s"), /* @__PURE__ */ lib_default("option", null, "Th/s"), /* @__PURE__ */ lib_default("option", null, "Gh/s"), /* @__PURE__ */ lib_default("option", null, "Mh/s"), /* @__PURE__ */ lib_default("option", null, "Kh/s"), /* @__PURE__ */ lib_default("option", null, "H/s")))), /* @__PURE__ */ lib_default("fieldset", null, /* @__PURE__ */ lib_default("legend", null, "Power Consumption (w)"), /* @__PURE__ */ lib_default("input", {
      type: "number",
      placeholder: "Power Consumption (w)",
      "v-model": [Store.config[Store.coin.symbol], "power"],
      onkeyup: lib_default.update
    })), /* @__PURE__ */ lib_default("fieldset", null, /* @__PURE__ */ lib_default("legend", null, "Power Cost Kw/h ($)"), /* @__PURE__ */ lib_default("input", {
      type: "number",
      placeholder: "Power Cost Kw/h ($)",
      "v-model": [Store.config, "powerCost"],
      onkeyup: lib_default.update
    })), /* @__PURE__ */ lib_default("fieldset", null, /* @__PURE__ */ lib_default("legend", null, "Pool fee (%)"), /* @__PURE__ */ lib_default("input", {
      type: "number",
      placeholder: "Pool fee (%)",
      "v-model": [Store.config, "poolFee"],
      onkeyup: lib_default.update
    })))));
  }
  function ConfigSection() {
    return /* @__PURE__ */ lib_default("div", {
      class: "config"
    }, /* @__PURE__ */ lib_default("nav", {
      "v-if": AllowSelectMiner
    }, /* @__PURE__ */ lib_default("button", {
      "v-class": {
        active: Store.formToShow === "minerSelect" /* minerSelect */
      }
    }, "Miner List"), /* @__PURE__ */ lib_default("button", {
      "v-class": {
        active: Store.formToShow === "manualConfig" /* manualConfig */
      }
    }, "Manual")), /* @__PURE__ */ lib_default("section", null, /* @__PURE__ */ lib_default(MinerSelect, null), /* @__PURE__ */ lib_default(ManualConfig, null)));
  }
  var ResultByEnum = /* @__PURE__ */ ((ResultByEnum2) => {
    ResultByEnum2["daily"] = "Day";
    ResultByEnum2["weekly"] = "Week";
    ResultByEnum2["monthly"] = "Month";
    ResultByEnum2["yearly"] = "Year";
    return ResultByEnum2;
  })(ResultByEnum || {});
  function ResultBy({ by }) {
    let result = Store.result[by];
    let byString = ResultByEnum[by];
    if (result === void 0) {
      return /* @__PURE__ */ lib_default("tr", null, /* @__PURE__ */ lib_default("td", {
        colspan: "4"
      }, " - "));
    }
    return /* @__PURE__ */ lib_default("tr", null, /* @__PURE__ */ lib_default("td", null, /* @__PURE__ */ lib_default("small", null, "Mined/", byString), /* @__PURE__ */ lib_default("b", {
      "v-format-number": {
        currency: Store.currency,
        decimalPlaces: 6
      }
    }, result.mined), /* @__PURE__ */ lib_default("small", null, "Pool fee: ", /* @__PURE__ */ lib_default("span", {
      "v-format-number": { currency: Store.currency, decimalPlaces: 6 }
    }, result.minedFee))), /* @__PURE__ */ lib_default("td", null, /* @__PURE__ */ lib_default("small", null, "Income/", byString), /* @__PURE__ */ lib_default("b", {
      "v-format-money": Store.currency
    }, result.income), /* @__PURE__ */ lib_default("small", null, "Pool fee ", /* @__PURE__ */ lib_default("span", {
      "v-format-money": Store.currency
    }, result.incomeFee))), /* @__PURE__ */ lib_default("td", null, /* @__PURE__ */ lib_default("small", null, "Power cost/", byString), /* @__PURE__ */ lib_default("b", {
      "v-format-money": Store.currency
    }, result.powerCost)), /* @__PURE__ */ lib_default("td", null, /* @__PURE__ */ lib_default("small", null, "Profit/", byString), /* @__PURE__ */ lib_default("b", {
      "v-format-money": Store.currency
    }, result.profit)));
  }
  function Results() {
    if (Store.result.daily === void 0) {
      return /* @__PURE__ */ lib_default("div", null, "Loading...");
    }
    return /* @__PURE__ */ lib_default("tr", {
      class: "results"
    }, /* @__PURE__ */ lib_default("td", {
      colspan: "2"
    }, /* @__PURE__ */ lib_default("b", null, "Profit by day"), /* @__PURE__ */ lib_default("b", {
      "v-format-money": Store.currency
    }, Store.result.daily.profit)), /* @__PURE__ */ lib_default("td", {
      colspan: "2"
    }, /* @__PURE__ */ lib_default("b", null, "Profit by month"), /* @__PURE__ */ lib_default("b", {
      "v-format-money": Store.currency
    }, Store.result.monthly.profit)));
  }
  var calculatorService = new CalculatorService();
  async function computeProfit() {
    console.log("Computing profit...");
    if (Store.config[Store.coin.symbol] === void 0 || Store.config[Store.coin.symbol].hashRateAmount === void 0) {
      return;
    }
    if (Store.config.powerCost === void 0) {
      Store.config.powerCost === 0;
    }
    if (Store.config.poolFee === void 0) {
      Store.config.poolFee === 0;
    }
    const hashRate = calculatorService.getHashRateFromString(Store.config[Store.coin.symbol].hashRateType, Store.config[Store.coin.symbol].hashRateAmount);
    let results = await calculatorService.calculateCoinForHashRate({
      coinSymbol: CoinSymbolEnum[Store.coin.symbol],
      hashRate,
      power: Store.config[Store.coin.symbol].power,
      powerCost: Store.config.powerCost,
      currency: Store.currency,
      poolFee: Store.config.poolFee / 100
    });
    Store.result = results;
    console.log("Done computing profit.");
    lib_default.update();
  }
  function App() {
    (0, import_hooks.useCallback)(() => computeProfit(), [
      Store.coin.symbol,
      Store.currency,
      Store.config[Store.coin.symbol].hashRateAmount,
      Store.config[Store.coin.symbol].hashRateType,
      Store.config[Store.coin.symbol].power,
      Store.config.powerCost,
      Store.config.poolFee
    ]);
    return [
      /* @__PURE__ */ lib_default(CoinNav, null),
      /* @__PURE__ */ lib_default("article", {
        class: "flex"
      }, /* @__PURE__ */ lib_default(CurrencyNav, null), /* @__PURE__ */ lib_default("section", {
        class: "coin-container flex flex-1"
      }, /* @__PURE__ */ lib_default("div", {
        class: "coin-description"
      }, /* @__PURE__ */ lib_default(CoinDescription, null), /* @__PURE__ */ lib_default(ConfigSection, null)), /* @__PURE__ */ lib_default("table", {
        class: "coin-result flex-1"
      }, /* @__PURE__ */ lib_default("tbody", null, /* @__PURE__ */ lib_default(ResultBy, {
        by: "daily"
      }), /* @__PURE__ */ lib_default(ResultBy, {
        by: "weekly"
      }), /* @__PURE__ */ lib_default(ResultBy, {
        by: "monthly"
      }), /* @__PURE__ */ lib_default(ResultBy, {
        by: "yearly"
      }), /* @__PURE__ */ lib_default(Results, null))))),
      /* @__PURE__ */ lib_default("small", {
        class: "note"
      }, "Data is updated every 30 minutes")
    ];
  }

  // app/index.tsx
  lib_default.directive("format-number", formatNumberDirective);
  lib_default.directive("format-money", formatMoneyDirective);
  lib_default.mount("body", App);
})();
