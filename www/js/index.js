(() => {
  // node_modules/valyrian.js/dist/index.mjs
  var textTag = "#text";
  var isNodeJs = Boolean(typeof process !== "undefined" && process.versions && process.versions.node);
  function createDomElement(tag, isSVG = false) {
    return isSVG ? document.createElementNS("http://www.w3.org/2000/svg", tag) : document.createElement(tag);
  }
  var Vnode = function Vnode2(tag, props, children) {
    this.tag = tag;
    this.props = props;
    this.children = children;
  };
  function isComponent(component) {
    return component && (typeof component === "function" || typeof component === "object" && "view" in component);
  }
  var isVnode = (object) => {
    return object instanceof Vnode;
  };
  var isVnodeComponent = (object) => {
    return isVnode(object) && isComponent(object.tag);
  };
  function domToVnode(dom) {
    let children = [];
    for (let i = 0, l = dom.childNodes.length; i < l; i++) {
      let childDom = dom.childNodes[i];
      if (childDom.nodeType === 3) {
        let vnode2 = new Vnode(textTag, {}, []);
        vnode2.dom = childDom;
        children.push(vnode2);
        continue;
      }
      if (childDom.nodeType === 1) {
        children.push(domToVnode(childDom));
      }
    }
    let props = {};
    for (let i = 0, l = dom.attributes.length; i < l; i++) {
      let attr = dom.attributes[i];
      props[attr.nodeName] = attr.nodeValue;
    }
    let vnode = new Vnode(dom.tagName.toLowerCase(), props, children);
    vnode.dom = dom;
    return vnode;
  }
  function trust(htmlString) {
    let div = createDomElement("div");
    div.innerHTML = htmlString.trim();
    return [].map.call(div.childNodes, (item) => domToVnode(item));
  }
  var mainComponent = null;
  var mainVnode = null;
  var isMounted = false;
  var current = {
    vnode: null,
    oldVnode: null,
    component: null
  };
  var reservedProps = {
    key: true,
    state: true,
    "v-keep": true,
    "v-if": true,
    "v-unless": true,
    "v-for": true,
    "v-show": true,
    "v-class": true,
    "v-html": true,
    "v-model": true,
    "v-create": true,
    "v-update": true,
    "v-cleanup": true
  };
  var onCleanupSet = /* @__PURE__ */ new Set();
  var onMountSet = /* @__PURE__ */ new Set();
  var onUpdateSet = /* @__PURE__ */ new Set();
  var onUnmountSet = /* @__PURE__ */ new Set();
  function onCleanup(callback) {
    onCleanupSet.add(callback);
  }
  function onUnmount(callback) {
    onUnmountSet.add(callback);
  }
  function callSet(set) {
    for (let callback of set) {
      callback();
    }
    set.clear();
  }
  var eventListenerNames = {};
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
  var hideDirective = (test) => (bool, vnode, oldnode) => {
    let value = test ? bool : !bool;
    if (value) {
      let newdom = document.createTextNode("");
      if (oldnode && oldnode.dom && oldnode.dom.parentNode) {
        oldnode.dom.parentNode.replaceChild(newdom, oldnode.dom);
      }
      vnode.tag = "#text";
      vnode.children = [];
      vnode.props = {};
      vnode.dom = newdom;
      return false;
    }
  };
  var directives = {
    "v-if": hideDirective(false),
    "v-unless": hideDirective(true),
    "v-for": (set, vnode) => {
      let newChildren = [];
      let callback = vnode.children[0];
      for (let i = 0, l = set.length; i < l; i++) {
        newChildren.push(callback(set[i], i));
      }
      vnode.children = newChildren;
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
      if (oldVnode && oldVnode.dom === vnode.dom) {
        let [oldModel, oldProperty, oldEvent] = oldVnode.props["v-model"] || [];
        if (oldModel === model && oldProperty === property && oldEvent === event) {
          return;
        }
      }
      let value;
      let handler = (e) => model[property] = e.target.value;
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
            sharedSetAttribute("checked", value, vnode);
            break;
          }
          case "radio": {
            sharedSetAttribute("checked", model[property] === vnode.dom.value, vnode);
            break;
          }
          default: {
            sharedSetAttribute("value", model[property], vnode);
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
      let prevHandler = vnode.props[event];
      sharedSetAttribute(
        event,
        (e) => {
          handler(e);
          if (prevHandler) {
            prevHandler(e);
          }
        },
        vnode,
        oldVnode
      );
    },
    "v-create": (callback, vnode, oldVnode) => {
      if (!oldVnode) {
        callback(vnode);
      }
    },
    "v-update": (callback, vnode, oldVnode) => {
      if (oldVnode) {
        callback(vnode, oldVnode);
      }
    },
    "v-cleanup": (callback, vnode, oldVnode) => {
      onCleanup(() => callback(vnode, oldVnode));
    }
  };
  function directive(name, directive2) {
    let directiveName = `v-${name}`;
    directives[directiveName] = directive2;
    reservedProps[directiveName] = true;
  }
  function sharedSetAttribute(name, value, newVnode, oldVnode) {
    if (typeof value === "function") {
      if (name in eventListenerNames === false) {
        mainVnode.dom.addEventListener(name.slice(2), eventListener);
        eventListenerNames[name] = true;
      }
      newVnode.dom[`v-${name}`] = value;
      return;
    }
    if (name in newVnode.dom && newVnode.isSVG === false) {
      if (newVnode.dom[name] != value) {
        newVnode.dom[name] = value;
      }
      return;
    }
    if (!oldVnode || value !== oldVnode.props[name]) {
      if (value === false) {
        newVnode.dom.removeAttribute(name);
      } else {
        newVnode.dom.setAttribute(name, value);
      }
    }
  }
  function updateAttributes(newVnode, oldVnode) {
    if (oldVnode) {
      for (let name in oldVnode.props) {
        if (name in newVnode.props === false && name in eventListenerNames === false && name in reservedProps === false) {
          if (name in newVnode.dom && newVnode.isSVG === false) {
            newVnode.dom[name] = null;
          } else {
            newVnode.dom.removeAttribute(name);
          }
        }
      }
    }
    for (let name in newVnode.props) {
      if (name in reservedProps) {
        if (name in directives && directives[name](newVnode.props[name], newVnode, oldVnode) === false) {
          break;
        }
        continue;
      }
      sharedSetAttribute(name, newVnode.props[name], newVnode, oldVnode);
    }
  }
  function patch(newVnode, oldVnode) {
    let newTree = newVnode.children;
    let oldTree = oldVnode?.children || [];
    let oldTreeLength = oldTree.length;
    if (oldTreeLength && newTree[0] instanceof Vnode && "key" in newTree[0].props && "key" in oldTree[0].props) {
      let newTreeLength = newTree.length;
      let oldKeyedList = {};
      for (let i = 0; i < oldTreeLength; i++) {
        oldKeyedList[oldTree[i].props.key] = i;
      }
      let newKeyedList = {};
      for (let i = 0; i < newTreeLength; i++) {
        newKeyedList[newTree[i].props.key] = i;
      }
      for (let i = 0; i < newTreeLength; i++) {
        let newChild = newTree[i];
        let oldChild = oldTree[oldKeyedList[newChild.props.key]];
        let shouldPatch = true;
        if (oldChild) {
          newChild.dom = oldChild.dom;
          if ("v-keep" in newChild.props && newChild.props["v-keep"] === oldChild.props["v-keep"]) {
            newChild.children = oldChild.children;
            shouldPatch = false;
          } else {
            updateAttributes(newChild, oldChild);
          }
        } else {
          newChild.dom = createDomElement(newChild.tag, newChild.isSVG);
          updateAttributes(newChild);
        }
        if (!newVnode.dom.childNodes[i]) {
          newVnode.dom.appendChild(newChild.dom);
        } else if (newVnode.dom.childNodes[i] !== newChild.dom) {
          newVnode.dom.replaceChild(newChild.dom, newVnode.dom.childNodes[i]);
        }
        shouldPatch && patch(newChild, oldChild);
      }
      for (let i = newTreeLength; i < oldTreeLength; i++) {
        if (!newKeyedList[oldTree[i].props.key]) {
          oldTree[i].dom.parentNode && oldTree[i].dom.parentNode.removeChild(oldTree[i].dom);
        }
      }
      return;
    }
    if (newTree.length === 0) {
      newVnode.dom.textContent = "";
      return;
    }
    current.vnode = newVnode;
    current.oldVnode = oldVnode;
    for (let i = 0; i < newTree.length; i++) {
      let newChild = newTree[i];
      if (newChild instanceof Vnode && newChild.tag !== textTag) {
        if (typeof newChild.tag !== "string") {
          current.component = newChild.tag;
          newTree.splice(
            i--,
            1,
            ("view" in newChild.tag ? newChild.tag.view.bind(newChild.tag) : newChild.tag.bind(newChild.tag))(
              newChild.props,
              ...newChild.children
            )
          );
          continue;
        }
        newChild.isSVG = newVnode.isSVG || newChild.tag === "svg";
        if (i < oldTreeLength) {
          let oldChild = oldTree[i];
          if (newChild.tag === oldChild.tag) {
            newChild.dom = oldChild.dom;
            if ("v-keep" in newChild.props && newChild.props["v-keep"] === oldChild.props["v-keep"]) {
              newChild.children = oldChild.children;
              continue;
            }
            updateAttributes(newChild, oldChild);
            patch(newChild, oldChild);
            continue;
          }
          newChild.dom = createDomElement(newChild.tag, newChild.isSVG);
          updateAttributes(newChild);
          newVnode.dom.replaceChild(newChild.dom, oldChild.dom);
          patch(newChild);
          continue;
        }
        newChild.dom = createDomElement(newChild.tag, newChild.isSVG);
        updateAttributes(newChild);
        newVnode.dom.appendChild(newChild.dom);
        patch(newChild);
        continue;
      }
      if (Array.isArray(newChild)) {
        newTree.splice(i--, 1, ...newChild);
        continue;
      }
      if (newChild === null || newChild === void 0) {
        newTree.splice(i--, 1);
        continue;
      }
      newTree[i] = new Vnode(textTag, {}, []);
      if (newChild instanceof Vnode) {
        newTree[i].dom = newChild.dom;
        newChild = newChild.dom.textContent;
      }
      if (i < oldTreeLength) {
        let oldChild = oldTree[i];
        if (oldChild.tag === textTag) {
          newTree[i].dom = oldChild.dom;
          if (newChild != oldChild.dom.textContent) {
            oldChild.dom.textContent = newChild;
          }
          continue;
        }
        newTree[i].dom = document.createTextNode(newChild);
        newVnode.dom.replaceChild(newTree[i].dom, oldChild.dom);
        continue;
      }
      newTree[i].dom = document.createTextNode(newChild);
      newVnode.dom.appendChild(newTree[i].dom);
    }
    for (let i = newTree.length; i < oldTreeLength; i++) {
      newVnode.dom.removeChild(oldTree[i].dom);
    }
  }
  function update() {
    if (mainVnode) {
      callSet(onCleanupSet);
      let oldMainVnode = mainVnode;
      mainVnode = new Vnode(oldMainVnode.tag, oldMainVnode.props, [mainComponent]);
      mainVnode.dom = oldMainVnode.dom;
      mainVnode.isSVG = oldMainVnode.isSVG;
      patch(mainVnode, oldMainVnode);
      callSet(isMounted ? onUpdateSet : onMountSet);
      isMounted = true;
      current.vnode = null;
      current.oldVnode = null;
      current.component = null;
      if (isNodeJs) {
        return mainVnode.dom.innerHTML;
      }
    }
  }
  function unmount() {
    if (mainVnode) {
      mainComponent = new Vnode(() => null, {}, []);
      let result = update();
      callSet(onUnmountSet);
      for (let name in eventListenerNames) {
        mainVnode.dom.removeEventListener(name.slice(2).toLowerCase(), eventListener);
        Reflect.deleteProperty(eventListenerNames, name);
      }
      mainComponent = null;
      mainVnode = null;
      isMounted = false;
      current.vnode = null;
      current.oldVnode = null;
      current.component = null;
      return result;
    }
  }
  function mount(dom, component) {
    let container = typeof dom === "string" ? isNodeJs ? createDomElement(dom, dom === "svg") : document.querySelectorAll(dom)[0] : dom;
    let vnodeComponent = isVnodeComponent(component) ? component : isComponent(component) ? new Vnode(component, {}, []) : new Vnode(() => component, {}, []);
    if (mainComponent && mainComponent.tag !== vnodeComponent.tag) {
      unmount();
    }
    mainComponent = vnodeComponent;
    mainVnode = domToVnode(container);
    return update();
  }
  var v = (tagOrComponent, props = {}, ...children) => {
    return new Vnode(tagOrComponent, props || {}, children);
  };
  v.fragment = (props, ...children) => children;

  // app/business-logic/btc.svg.tsx
  function BtcSVG() {
    return /* @__PURE__ */ v("svg", {
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
    }, /* @__PURE__ */ v("g", {
      id: "Layer_x0020_1"
    }, /* @__PURE__ */ v("metadata", {
      id: "CorelCorpID_0Corel-Layer"
    }), /* @__PURE__ */ v("g", {
      id: "_1421344023328"
    }, /* @__PURE__ */ v("path", {
      fill: "#F7931A",
      "fill-rule": "nonzero",
      d: "M4030.06 2540.77c-273.24,1096.01 -1383.32,1763.02 -2479.46,1489.71 -1095.68,-273.24 -1762.69,-1383.39 -1489.33,-2479.31 273.12,-1096.13 1383.2,-1763.19 2479,-1489.95 1096.06,273.24 1763.03,1383.51 1489.76,2479.57l0.02 -0.02z"
    }), /* @__PURE__ */ v("path", {
      fill: "white",
      "fill-rule": "nonzero",
      d: "M2947.77 1754.38c40.72,-272.26 -166.56,-418.61 -450,-516.24l91.95 -368.8 -224.5 -55.94 -89.51 359.09c-59.02,-14.72 -119.63,-28.59 -179.87,-42.34l90.16 -361.46 -224.36 -55.94 -92 368.68c-48.84,-11.12 -96.81,-22.11 -143.35,-33.69l0.26 -1.16 -309.59 -77.31 -59.72 239.78c0,0 166.56,38.18 163.05,40.53 90.91,22.69 107.35,82.87 104.62,130.57l-104.74 420.15c6.26,1.59 14.38,3.89 23.34,7.49 -7.49,-1.86 -15.46,-3.89 -23.73,-5.87l-146.81 588.57c-11.11,27.62 -39.31,69.07 -102.87,53.33 2.25,3.26 -163.17,-40.72 -163.17,-40.72l-111.46 256.98 292.15 72.83c54.35,13.63 107.61,27.89 160.06,41.3l-92.9 373.03 224.24 55.94 92 -369.07c61.26,16.63 120.71,31.97 178.91,46.43l-91.69 367.33 224.51 55.94 92.89 -372.33c382.82,72.45 670.67,43.24 791.83,-303.02 97.63,-278.78 -4.86,-439.58 -206.26,-544.44 146.69,-33.83 257.18,-130.31 286.64,-329.61l-0.07 -0.05zm-512.93 719.26c-69.38,278.78 -538.76,128.08 -690.94,90.29l123.28 -494.2c152.17,37.99 640.17,113.17 567.67,403.91zm69.43 -723.3c-63.29,253.58 -453.96,124.75 -580.69,93.16l111.77 -448.21c126.73,31.59 534.85,90.55 468.94,355.05l-0.02 0z"
    }))));
  }

  // app/business-logic/dash.svg.tsx
  function DashSVG() {
    return /* @__PURE__ */ v("svg", {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 513.4 416.8"
    }, /* @__PURE__ */ v("defs", null, /* @__PURE__ */ v("style", null, `.cls-1 {
        fill: #008de4;
      }`)), /* @__PURE__ */ v("title", null, "d"), /* @__PURE__ */ v("g", {
      id: "Layer_2",
      "data-name": "Layer 2"
    }, /* @__PURE__ */ v("g", {
      id: "Layer_1-2",
      "data-name": "Layer 1"
    }, /* @__PURE__ */ v("path", {
      class: "cls-1",
      d: "M336.25,0H149.35l-15.5,86.6,168.7.2c83.1,0,107.6,30.2,106.9,80.2-.4,25.6-11.5,69-16.3,83.1-12.8,37.5-39.1,80.2-137.7,80.1l-164-.1L76,416.8h186.5c65.8,0,93.7-7.7,123.4-21.3,65.7-30.5,104.8-95.3,120.5-179.9C529.65,89.6,500.65,0,336.25,0"
    }), /* @__PURE__ */ v("path", {
      class: "cls-1",
      d: "M68.7,164.9c-49,0-56,31.9-60.6,51.2C2,241.3,0,251.6,0,251.6H191.4c49,0,56-31.9,60.6-51.2,6.1-25.2,8.1-35.5,8.1-35.5Z"
    }))));
  }

  // app/business-logic/etc.svg.tsx
  function EtcSVG() {
    return /* @__PURE__ */ v("svg", {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 1543 2499.2"
    }, /* @__PURE__ */ v("defs", null, /* @__PURE__ */ v("style", null, `.cls-1{fill:#3ab83a;}.cls-2{fill:#0b8311;}.cls-3{fill:#146714;}`)), /* @__PURE__ */ v("title", null, "e"), /* @__PURE__ */ v("g", {
      id: "Layer_2",
      "data-name": "Layer 2"
    }, /* @__PURE__ */ v("g", {
      id: "svg8"
    }, /* @__PURE__ */ v("g", {
      id: "layer5"
    }, /* @__PURE__ */ v("g", {
      id: "g1627"
    }, /* @__PURE__ */ v("path", {
      id: "path1599",
      class: "cls-1",
      d: "M0,1361.05c271.87,144.38,555.56,295.51,774.67,412.45L1543,1361.05c-278.2,413.29-510,757.36-768.33,1138.15C515.88,2119.25,230.08,1700,0,1361.05Zm29.55-114L775.51,849l736.25,395.14L775.93,1642.63ZM774.67,721.47,0,1129.28,771.29,0,1543,1131.81,774.67,721.47Z"
    }), /* @__PURE__ */ v("path", {
      id: "path1593",
      class: "cls-2",
      d: "M774.67,1773.5,1543,1361.05C1264.8,1774.34,774.67,2499.2,774.67,2499.2ZM775.51,849l736.25,395.14L775.93,1642.63,775.51,849Zm-.84-127.5L771.29,0,1543,1131.81Z"
    }), /* @__PURE__ */ v("path", {
      id: "path1603",
      class: "cls-2",
      d: "M29.55,1247.06l746,61.22,736.25-63.75L775.93,1643.05Z"
    }), /* @__PURE__ */ v("path", {
      id: "path1606",
      class: "cls-3",
      d: "M775.51,1308.28l736.25-63.75L775.93,1643.05l-.42-334.77Z"
    }))))));
  }

  // app/business-logic/ltc.svg.tsx
  function LtcSVG() {
    return /* @__PURE__ */ v("svg", {
      id: "Layer_1",
      "data-name": "Layer 1",
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 82.6 82.6"
    }, /* @__PURE__ */ v("title", null, "litecoin-ltc-logo"), /* @__PURE__ */ v("circle", {
      cx: "41.3",
      cy: "41.3",
      r: "36.83",
      style: "fill:#fff"
    }), /* @__PURE__ */ v("path", {
      d: "M41.3,0A41.3,41.3,0,1,0,82.6,41.3h0A41.18,41.18,0,0,0,41.54,0ZM42,42.7,37.7,57.2h23a1.16,1.16,0,0,1,1.2,1.12v.38l-2,6.9a1.49,1.49,0,0,1-1.5,1.1H23.2l5.9-20.1-6.6,2L24,44l6.6-2,8.3-28.2a1.51,1.51,0,0,1,1.5-1.1h8.9a1.16,1.16,0,0,1,1.2,1.12v.38L43.5,38l6.6-2-1.4,4.8Z",
      style: "fill:#345d9d"
    }));
  }

  // app/business-logic/xmr.svg.tsx
  function XmrSVG() {
    return /* @__PURE__ */ v("svg", {
      id: "Layer_1",
      "data-name": "Layer 1",
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 3756.09 3756.49"
    }, /* @__PURE__ */ v("title", null, "monero"), /* @__PURE__ */ v("path", {
      d: "M4128,2249.81C4128,3287,3287.26,4127.86,2250,4127.86S372,3287,372,2249.81,1212.76,371.75,2250,371.75,4128,1212.54,4128,2249.81Z",
      transform: "translate(-371.96 -371.75)",
      style: "fill:#fff"
    }), /* @__PURE__ */ v("path", {
      id: "_149931032",
      "data-name": " 149931032",
      d: "M2250,371.75c-1036.89,0-1879.12,842.06-1877.8,1878,0.26,207.26,33.31,406.63,95.34,593.12h561.88V1263L2250,2483.57,3470.52,1263v1579.9h562c62.12-186.48,95-385.85,95.37-593.12C4129.66,1212.76,3287,372,2250,372Z",
      transform: "translate(-371.96 -371.75)",
      style: "fill:#f26822"
    }), /* @__PURE__ */ v("path", {
      id: "_149931160",
      "data-name": " 149931160",
      d: "M1969.3,2764.17l-532.67-532.7v994.14H1029.38l-384.29.07c329.63,540.8,925.35,902.56,1604.91,902.56S3525.31,3766.4,3855,3225.6H3063.25V2231.47l-532.7,532.7-280.61,280.61-280.62-280.61h0Z",
      transform: "translate(-371.96 -371.75)",
      style: "fill:#4d4d4d"
    }));
  }

  // app/business-logic/zec.svg.tsx
  function ZecSVG() {
    return /* @__PURE__ */ v("svg", {
      xmlns: "http://www.w3.org/2000/svg",
      "xmlns:xlink": "http://www.w3.org/1999/xlink",
      viewBox: "0 0 2500 2500"
    }, /* @__PURE__ */ v("defs", null, /* @__PURE__ */ v("style", null, `.cls-1{fill:url(#linear-gradient);}`), /* @__PURE__ */ v("linearGradient", {
      id: "linear-gradient",
      x1: "782.84",
      y1: "165.91",
      x2: "799.34",
      y2: "165.91",
      gradientTransform: "translate(-81568.2 55372.05) rotate(-45) scale(122.41)",
      gradientUnits: "userSpaceOnUse"
    }, /* @__PURE__ */ v("stop", {
      offset: "0",
      "stop-color": "#cf8724"
    }), /* @__PURE__ */ v("stop", {
      offset: "1",
      "stop-color": "#fdce58"
    }))), /* @__PURE__ */ v("title", null, "z"), /* @__PURE__ */ v("g", {
      id: "Layer_2",
      "data-name": "Layer 2"
    }, /* @__PURE__ */ v("g", {
      id: "Layer_1-2",
      "data-name": "Layer 1"
    }, /* @__PURE__ */ v("path", {
      class: "cls-1",
      d: "M1263.05,2297.61c-569.6,0-1034.57-465.43-1034.57-1034.56,0-569.6,465.44-1034.57,1034.57-1034.57,569.6,0,1034.56,465.44,1034.56,1034.57C2297.61,1832.65,1832.65,2297.61,1263.05,2297.61Z"
    }), /* @__PURE__ */ v("path", {
      d: "M1250,2500C562.5,2500,0,1937.5,0,1250S562.5,0,1250,0,2500,562.5,2500,1250,1937.5,2500,1250,2500Zm0-2222.06c-534.56,0-972.06,437.5-972.06,972.06s437.5,972.06,972.06,972.06,972.06-437.5,972.06-972.06S1784.56,277.94,1250,277.94Z"
    }), /* @__PURE__ */ v("path", {
      d: "M1221.05,1588.59h541.67v270.84h-319.6v229.16H1165.18V1866.53H831.85c0-90.44-13.73-180.4,7.1-263.73,7.1-41.67,55.4-83.34,90.43-125,104.17-125,208.34-250,319.61-375,41.66-48.77,83.33-90.44,132.1-145.83H860.26V686.13h305.39V457h270.84V679h333.33c0,90.43,13.73,180.4-7.1,263.73-7.1,41.67-55.4,83.33-90.44,125-104.16,125-208.33,250-319.6,375C1311,1491.53,1269.35,1539.82,1221.05,1588.59Z"
    }))));
  }

  // node_modules/valyrian.js/dist/request/index.mjs
  function serialize(obj, prefix = "") {
    return Object.keys(obj).map((prop) => {
      let k = prefix ? `${prefix}[${prop}]` : prop;
      return typeof obj[prop] === "object" ? serialize(obj[prop], k) : `${encodeURIComponent(k)}=${encodeURIComponent(obj[prop])}`;
    }).join("&");
  }
  function parseUrl(url, options) {
    let u = /^https?/gi.test(url) ? url : options.urls.base + url;
    let parts = u.split("?");
    u = parts[0].trim().replace(/^\/\//, "/").replace(/\/$/, "").trim();
    if (parts[1]) {
      u += `?${parts[1]}`;
    }
    if (isNodeJs && typeof options.urls.node === "string") {
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
  var defaultOptions = { allowedMethods: ["get", "post", "put", "patch", "delete"] };
  function Requester(baseUrl = "", options = defaultOptions) {
    let url = baseUrl.replace(/\/$/gi, "").trim();
    if (!options.urls) {
      options.urls = {
        base: "",
        node: null,
        api: null
      };
    }
    if (!options.allowedMethods) {
      options.allowedMethods = defaultOptions.allowedMethods;
    }
    let opts = {
      ...options,
      urls: {
        node: options.urls.node || null,
        api: options.urls.api || null,
        base: options.urls.base ? options.urls.base + url : url
      }
    };
    const request2 = async function request3(method, url2, data, options2 = {}) {
      let innerOptions = {
        method: method.toUpperCase(),
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
      if (innerOptions.allowedMethods.indexOf(method) === -1) {
        throw new Error("Method not allowed");
      }
      if (data) {
        if (innerOptions.method === "GET" && typeof data === "object") {
          url2 += `?${serialize(data)}`;
        }
        if (innerOptions.method !== "GET") {
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
      let body = null;
      if (!response.ok) {
        let err = new Error(response.statusText);
        err.response = response;
        if (/text/gi.test(acceptType)) {
          err.body = await response.text();
        }
        if (/json/gi.test(acceptType)) {
          try {
            err.body = await response.json();
          } catch (error) {
          }
        }
        throw err;
      }
      if (innerOptions.resolveWithFullResponse) {
        return response;
      }
      if (/text/gi.test(acceptType)) {
        body = await response.text();
        return body;
      }
      if (/json/gi.test(acceptType)) {
        try {
          body = await response.json();
          return body;
        } catch (error) {
        }
      }
      return response;
    };
    request2.new = (baseUrl2, options2) => Requester(baseUrl2, { ...opts, ...options2 });
    request2.setOption = (key, value) => {
      let result = opts;
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
    request2.getOptions = (key) => {
      if (!key) {
        return opts;
      }
      let result = opts;
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
          return null;
        }
        if (parsed.length === 0) {
          return result[next];
        }
        result = result[next];
      }
    };
    opts.allowedMethods.forEach(
      (method) => request2[method] = (url2, data, options2) => request2(method, url2, data, options2)
    );
    return request2;
  }
  var request = Requester();

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
  var CoinGeckoRequest = request.new("https://api.coingecko.com/api/v3", {
    allowedMethods: ["get"]
  });
  var MinerstatRequest = request.new("https://api.minerstat.com/v2/coins", {
    allowedMethods: ["get"]
  });
  var ThirtyMinutesInMilliSeconds = 1e3 * 60 * 30;
  var DefaultCacheTime = ThirtyMinutesInMilliSeconds;
  var CoinSymbolEnum = /* @__PURE__ */ ((CoinSymbolEnum2) => {
    CoinSymbolEnum2["BTC"] = "BTC";
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
  var CryptoCurrenciesIds = ["bitcoin", "ethereum-classic", "monero", "zcash", "dash", "litecoin"];
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
      return amount * Number(HashRateStringToNumber[hashRateString]);
    }
    async calculateCoinForHashRate({
      coinSymbol,
      hashRate,
      power,
      powerCost,
      currency,
      algorithm,
      poolFee,
      customPrice,
      customDailyMined
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
      let realPrice = pricesForAllCoins[CryptoCurrencies[coinSymbol].id][currencyLowerCased] || pricesForAllCoins[CryptoCurrencies[coinSymbol].id].usd;
      let coinPrice = customPrice || realPrice;
      let coinRewardPerDayMined = coin.reward * hashRate * 24;
      let dailyMinedFee = coinRewardPerDayMined * poolFee;
      let dailyMined = coinRewardPerDayMined - dailyMinedFee;
      if (customDailyMined) {
        dailyMined = customDailyMined;
        let intPoolFee = poolFee * 100;
        dailyMinedFee = dailyMined / (100 - intPoolFee) * intPoolFee;
        coinRewardPerDayMined = dailyMined + dailyMinedFee;
      }
      const dailyIncome = dailyMined * coinPrice;
      const dailyIncomeFee = dailyMinedFee * coinPrice;
      const dailyPowerCost = powerCost / 1e3 * power * 24;
      const dailyProfit = dailyIncome - dailyPowerCost;
      const costPerMinedCoin = (dailyPowerCost + dailyIncomeFee) / dailyMined;
      const electricityPriceBreakEven = dailyMined * coinPrice * 1e3 / power * 24;
      const hashPrice = coinRewardPerDayMined * coinPrice;
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
        price: coinPrice,
        realPrice,
        costPerMinedCoin,
        electricityPriceBreakEven,
        hashPrice
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

  // node_modules/valyrian.js/dist/hooks/index.mjs
  var createHook = function createHook2({
    onCreate,
    onUpdate: onUpdateHook,
    onCleanup: onCleanupHook,
    onRemove,
    returnValue
  }) {
    return (...args) => {
      let { component, vnode, oldVnode } = current;
      if (!vnode.components) {
        vnode.components = [];
        onUnmount(() => Reflect.deleteProperty(vnode, "components"));
      }
      if (vnode.components.indexOf(component) === -1) {
        vnode.components.push(component);
      }
      if (!component.hooks) {
        component.hooks = [];
        onUnmount(() => Reflect.deleteProperty(component, "hooks"));
      }
      let hook = void 0;
      if (!oldVnode || !oldVnode.components || oldVnode.components[vnode.components.length - 1] !== component) {
        hook = onCreate(...args);
        component.hooks.push(hook);
        if (onRemove) {
          onUnmount(() => onRemove(hook));
        }
      } else {
        if ("calls" in component === false) {
          component.calls = -1;
          onUnmount(() => Reflect.deleteProperty(component, "calls"));
        }
        onCleanup(() => component.calls = -1);
        component.calls++;
        hook = component.hooks[component.calls];
        if (onUpdateHook) {
          onUpdateHook(hook, ...args);
        }
      }
      if (onCleanupHook) {
        onCleanup(() => onCleanupHook(hook));
      }
      if (returnValue) {
        return returnValue(hook);
      }
      return hook;
    };
  };
  var updateTimeout;
  function delayedUpdate() {
    clearTimeout(updateTimeout);
    updateTimeout = setTimeout(update);
  }
  var useState = createHook({
    onCreate: (value) => {
      let stateObj = /* @__PURE__ */ Object.create(null);
      stateObj.value = value;
      stateObj.toJSON = stateObj.toString = stateObj.valueOf = () => typeof stateObj.value === "function" ? stateObj.value() : stateObj.value;
      return [
        stateObj,
        (value2) => {
          if (stateObj.value !== value2) {
            stateObj.value = value2;
            delayedUpdate();
          }
        }
      ];
    }
  });
  var useEffect = createHook({
    onCreate: (effect, changes) => {
      let hook = { effect, prev: [] };
      if (changes === null) {
        hook.onRemove = effect;
        return hook;
      }
      hook.prev = changes;
      hook.onCleanup = hook.effect();
      return hook;
    },
    onUpdate: (hook, effect, changes) => {
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
    onRemove: (hook) => {
      if (typeof hook.onCleanup === "function") {
        hook.onCleanup();
      }
      if (typeof hook.onRemove === "function") {
        hook.onRemove();
      }
    }
  });
  var useRef = createHook({
    onCreate: (initialValue) => {
      directive("ref", (ref, vnode) => {
        ref.current = vnode.dom;
      });
      return { current: initialValue };
    }
  });
  var useCallback = createHook({
    onCreate: (callback, changes) => {
      callback();
      return { callback, changes };
    },
    onUpdate: (hook, callback, changes) => {
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
    onCreate: (callback, changes) => {
      return { callback, changes, value: callback() };
    },
    onUpdate: (hook, callback, changes) => {
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

  // app/app.tsx
  var DefaultCurrency = "USD" /* USD */;
  var DefaultCoin = CryptoCurrencies.BTC;
  var AllowSelectMiner = false;
  var DefaultConfig = {
    powerCost: 0.1,
    poolFee: 1
  };
  var Store = {
    loading: true,
    currency: DefaultCurrency,
    coin: DefaultCoin,
    formToShow: "manualConfig" /* manualConfig */,
    config: {
      powerCost: DefaultConfig.powerCost,
      poolFee: DefaultConfig.poolFee,
      customPrice: null,
      customDailyMined: null,
      BTC: { ...CryptoCurrencies.BTC.config },
      ETC: { ...CryptoCurrencies.ETC.config },
      LTC: { ...CryptoCurrencies.LTC.config },
      XMR: { ...CryptoCurrencies.XMR.config },
      ZEC: { ...CryptoCurrencies.ZEC.config },
      DASH: { ...CryptoCurrencies.DASH.config }
    },
    result: {}
  };
  function CoinNav() {
    return /* @__PURE__ */ v("nav", {
      "v-for": Object.keys(CryptoCurrencies),
      class: "coin-nav flex"
    }, (key) => /* @__PURE__ */ v("button", {
      "v-class": {
        active: Store.coin.symbol === key
      },
      onclick: () => Store.coin = CryptoCurrencies[key]
    }, key));
  }
  function CurrencyNav() {
    return /* @__PURE__ */ v("nav", {
      "v-for": Object.keys(CurrencyEnum),
      class: "currency-nav flex flex-column"
    }, (key) => /* @__PURE__ */ v("button", {
      "v-class": {
        active: Store.currency === key
      },
      onclick: () => Store.currency = key
    }, key));
  }
  function CoinDescription() {
    return /* @__PURE__ */ v("div", {
      class: "coin-description-top"
    }, /* @__PURE__ */ v("figure", null, Store.coin.icon), /* @__PURE__ */ v("b", null, Store.coin.name), /* @__PURE__ */ v("small", {
      class: "flex flex-row"
    }, /* @__PURE__ */ v("span", {
      class: "u-p-xs u-no-warp"
    }, "1 ", Store.coin.symbol, " = "), /* @__PURE__ */ v("input", {
      type: "number",
      "v-model": [Store.config, "customPrice"],
      step: "0.01",
      class: "u-m-0"
    }), /* @__PURE__ */ v("span", {
      class: "u-p-xs u-no-warp"
    }, Store.currency)), /* @__PURE__ */ v("small", {
      "v-format-money": Store.currency,
      class: "note text-xs"
    }, Store.result.realPrice));
  }
  function MinerSelect() {
    return /* @__PURE__ */ v("div", {
      "v-if": Store.formToShow === "minerSelect" /* minerSelect */ && AllowSelectMiner
    });
  }
  function ManualConfig() {
    return /* @__PURE__ */ v("div", {
      "v-if": !AllowSelectMiner || Store.formToShow === "manualConfig" /* manualConfig */
    }, /* @__PURE__ */ v("form", null, /* @__PURE__ */ v("section", null, /* @__PURE__ */ v("div", {
      class: "flex flex-hash-power"
    }, /* @__PURE__ */ v("fieldset", null, /* @__PURE__ */ v("legend", null, "Hash Power"), /* @__PURE__ */ v("input", {
      type: "number",
      placeholder: "Hash power",
      "v-model": [Store.config[Store.coin.symbol], "hashRateAmount"]
    })), /* @__PURE__ */ v("fieldset", {
      class: "hash-power"
    }, /* @__PURE__ */ v("legend", null, "\xA0"), /* @__PURE__ */ v("select", {
      "v-model": [Store.config[Store.coin.symbol], "hashRateType"]
    }, /* @__PURE__ */ v("option", null, "Ph/s"), /* @__PURE__ */ v("option", null, "Th/s"), /* @__PURE__ */ v("option", null, "Gh/s"), /* @__PURE__ */ v("option", null, "Mh/s"), /* @__PURE__ */ v("option", null, "Kh/s"), /* @__PURE__ */ v("option", null, "H/s")))), /* @__PURE__ */ v("fieldset", null, /* @__PURE__ */ v("legend", null, "Power Consumption (W)"), /* @__PURE__ */ v("input", {
      type: "number",
      placeholder: "Power Consumption (W)",
      "v-model": [Store.config[Store.coin.symbol], "power"]
    })), /* @__PURE__ */ v("fieldset", null, /* @__PURE__ */ v("legend", null, "Power Cost Kw/h ($)"), /* @__PURE__ */ v("input", {
      type: "number",
      placeholder: "Power Cost Kw/h ($)",
      "v-model": [Store.config, "powerCost"]
    })), /* @__PURE__ */ v("fieldset", null, /* @__PURE__ */ v("legend", null, "Pool fee (%)"), /* @__PURE__ */ v("input", {
      type: "number",
      placeholder: "Pool fee (%)",
      "v-model": [Store.config, "poolFee"]
    })))));
  }
  function ConfigSection() {
    return /* @__PURE__ */ v("div", {
      class: "config"
    }, /* @__PURE__ */ v("nav", {
      "v-if": AllowSelectMiner
    }, /* @__PURE__ */ v("button", {
      "v-class": {
        active: Store.formToShow === "minerSelect" /* minerSelect */
      }
    }, "Miner List"), /* @__PURE__ */ v("button", {
      "v-class": {
        active: Store.formToShow === "manualConfig" /* manualConfig */
      }
    }, "Manual")), /* @__PURE__ */ v("section", null, /* @__PURE__ */ v(MinerSelect, null), /* @__PURE__ */ v(ManualConfig, null)));
  }
  var ResultByStringEnum = /* @__PURE__ */ ((ResultByStringEnum2) => {
    ResultByStringEnum2["daily"] = "Day";
    ResultByStringEnum2["weekly"] = "Week";
    ResultByStringEnum2["monthly"] = "Month";
    ResultByStringEnum2["yearly"] = "Year";
    return ResultByStringEnum2;
  })(ResultByStringEnum || {});
  function ResultBy({ by }) {
    let result = Store.result[by];
    let byString = ResultByStringEnum[by];
    if (result === void 0) {
      return /* @__PURE__ */ v("tr", null, /* @__PURE__ */ v("td", {
        colspan: "4"
      }, " - "));
    }
    let decimalPlacesString = Store.config.customDailyMined >= 1 ? 5 : 5e-6;
    return /* @__PURE__ */ v("tr", null, /* @__PURE__ */ v("td", null, /* @__PURE__ */ v("small", null, "Mined/", byString), /* @__PURE__ */ v("input", {
      "v-if": by === "daily" /* daily */,
      type: "number",
      "v-model": [Store.config, "customDailyMined"],
      step: decimalPlacesString,
      class: "u-m-0"
    }), /* @__PURE__ */ v("b", {
      "v-if": by !== "daily" /* daily */,
      "v-format-number": {
        currency: Store.currency,
        decimalPlaces: 6
      }
    }, result.mined), /* @__PURE__ */ v("small", null, "Pool fee: ", /* @__PURE__ */ v("span", {
      "v-format-number": { currency: Store.currency, decimalPlaces: 6 }
    }, result.minedFee))), /* @__PURE__ */ v("td", null, /* @__PURE__ */ v("small", null, "Income/", byString), /* @__PURE__ */ v("b", {
      "v-format-money": Store.currency
    }, result.income), /* @__PURE__ */ v("small", null, "Pool fee ", /* @__PURE__ */ v("span", {
      "v-format-money": Store.currency
    }, result.incomeFee))), /* @__PURE__ */ v("td", null, /* @__PURE__ */ v("small", null, "Power cost/", byString), /* @__PURE__ */ v("b", {
      "v-format-money": Store.currency
    }, result.powerCost)), /* @__PURE__ */ v("td", null, /* @__PURE__ */ v("small", null, "Profit/", byString), /* @__PURE__ */ v("b", {
      "v-format-money": Store.currency
    }, result.profit)));
  }
  function Results() {
    if (Store.loading) {
      return /* @__PURE__ */ v("div", null, "Loading...");
    }
    return /* @__PURE__ */ v("tr", {
      class: "results"
    }, /* @__PURE__ */ v("td", {
      colspan: "2"
    }, /* @__PURE__ */ v("dl", null, /* @__PURE__ */ v("dt", null, /* @__PURE__ */ v("dd", null, "Cost by ", /* @__PURE__ */ v("span", {
      class: "text-sm"
    }, Store.coin.name), " mined"), /* @__PURE__ */ v("dd", null, /* @__PURE__ */ v("b", {
      "v-format-money": Store.currency
    }, Store.result.costPerMinedCoin))), /* @__PURE__ */ v("dt", null, /* @__PURE__ */ v("dd", null, "Electricity BreakEven"), /* @__PURE__ */ v("dd", null, /* @__PURE__ */ v("b", {
      "v-format-money": Store.currency
    }, Store.result.electricityPriceBreakEven))), /* @__PURE__ */ v("dt", null, /* @__PURE__ */ v("dd", null, "Hashprice"), /* @__PURE__ */ v("dd", null, /* @__PURE__ */ v("b", {
      "v-format-money": Store.currency
    }, Store.result.hashPrice))))), /* @__PURE__ */ v("td", {
      colspan: "2"
    }, /* @__PURE__ */ v("b", null, "Profit by month"), /* @__PURE__ */ v("b", {
      "v-format-money": Store.currency
    }, Store.result.monthly.profit)));
  }
  var calculatorService = new CalculatorService();
  async function computeProfit() {
    if (Store.config[Store.coin.symbol] === void 0 || Store.config[Store.coin.symbol].hashRateAmount === void 0) {
      return;
    }
    Store.loading = true;
    if (Store.config.powerCost === void 0) {
      Store.config.powerCost === 0;
    }
    if (Store.config.poolFee === void 0) {
      Store.config.poolFee === 0;
    }
    const hashRate = calculatorService.getHashRateFromString(
      Store.config[Store.coin.symbol].hashRateType,
      Store.config[Store.coin.symbol].hashRateAmount
    );
    let results = await calculatorService.calculateCoinForHashRate({
      customPrice: Store.config.customPrice,
      customDailyMined: Store.config.customDailyMined,
      coinSymbol: CoinSymbolEnum[Store.coin.symbol],
      hashRate,
      power: Store.config[Store.coin.symbol].power,
      powerCost: Store.config.powerCost,
      currency: Store.currency,
      poolFee: Store.config.poolFee / 100
    });
    Store.result = results;
    Store.config.customPrice = results.price;
    Store.config.customDailyMined = results.daily.mined;
    Store.loading = false;
    update();
  }
  function App() {
    let ref = useRef(null);
    useEffect(() => {
      Store.config.customPrice = null;
    }, [Store.coin.symbol, Store.currency]);
    useEffect(() => {
      Store.config.customDailyMined = null;
    }, [
      Store.coin.symbol,
      Store.currency,
      Store.config[Store.coin.symbol].hashRateAmount,
      Store.config[Store.coin.symbol].hashRateType,
      Store.config[Store.coin.symbol].power,
      Store.config.powerCost,
      Store.config.poolFee
    ]);
    useEffect(computeProfit, []);
    useEffect(() => {
      if (ref.current) {
        computeProfit();
      }
    }, [
      Store.config.customDailyMined,
      Store.config.customPrice,
      Store.coin.symbol,
      Store.currency,
      Store.config[Store.coin.symbol].hashRateAmount,
      Store.config[Store.coin.symbol].hashRateType,
      Store.config[Store.coin.symbol].power,
      Store.config.powerCost,
      Store.config.poolFee
    ]);
    return [
      /* @__PURE__ */ v(CoinNav, null),
      /* @__PURE__ */ v("article", {
        class: "flex",
        "v-ref": ref
      }, /* @__PURE__ */ v(CurrencyNav, null), /* @__PURE__ */ v("section", {
        class: "coin-container flex flex-1"
      }, /* @__PURE__ */ v("div", {
        class: "coin-description"
      }, /* @__PURE__ */ v(CoinDescription, null), /* @__PURE__ */ v(ConfigSection, null)), /* @__PURE__ */ v("table", {
        class: "coin-result flex-1"
      }, /* @__PURE__ */ v("tbody", null, /* @__PURE__ */ v(ResultBy, {
        by: "daily"
      }), /* @__PURE__ */ v(ResultBy, {
        by: "weekly"
      }), /* @__PURE__ */ v(ResultBy, {
        by: "monthly"
      }), /* @__PURE__ */ v(ResultBy, {
        by: "yearly"
      }), /* @__PURE__ */ v(Results, null))))),
      /* @__PURE__ */ v("small", {
        class: "note text-sm text-right"
      }, "Data is updated every 30 minutes")
    ];
  }

  // app/index.tsx
  directive("format-number", formatNumberDirective);
  directive("format-money", formatMoneyDirective);
  mount("body", App);
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vbm9kZV9tb2R1bGVzL3ZhbHlyaWFuLmpzL2Rpc3QvaW5kZXgubWpzIiwgIi4uL2FwcC9idXNpbmVzcy1sb2dpYy9idGMuc3ZnLnRzeCIsICIuLi9hcHAvYnVzaW5lc3MtbG9naWMvZGFzaC5zdmcudHN4IiwgIi4uL2FwcC9idXNpbmVzcy1sb2dpYy9ldGMuc3ZnLnRzeCIsICIuLi9hcHAvYnVzaW5lc3MtbG9naWMvbHRjLnN2Zy50c3giLCAiLi4vYXBwL2J1c2luZXNzLWxvZ2ljL3htci5zdmcudHN4IiwgIi4uL2FwcC9idXNpbmVzcy1sb2dpYy96ZWMuc3ZnLnRzeCIsICIuLi9ub2RlX21vZHVsZXMvdmFseXJpYW4uanMvZGlzdC9yZXF1ZXN0L2luZGV4Lm1qcyIsICIuLi9hcHAvY29tbW9uL3N0b3JhZ2Utc2VydmljZS50cyIsICIuLi9hcHAvYnVzaW5lc3MtbG9naWMvY3J5cHRvLWNhbGN1bGF0b3Itc2VydmljZS50cyIsICIuLi9hcHAvY29tbW9uL2Zvcm1hdC1udW1iZXIudHMiLCAiLi4vbm9kZV9tb2R1bGVzL3ZhbHlyaWFuLmpzL2Rpc3QvaG9va3MvaW5kZXgubWpzIiwgIi4uL2FwcC9hcHAudHN4IiwgIi4uL2FwcC9pbmRleC50c3giXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8vIGxpYi9pbmRleC50c1xudmFyIHRleHRUYWcgPSBcIiN0ZXh0XCI7XG52YXIgaXNOb2RlSnMgPSBCb29sZWFuKHR5cGVvZiBwcm9jZXNzICE9PSBcInVuZGVmaW5lZFwiICYmIHByb2Nlc3MudmVyc2lvbnMgJiYgcHJvY2Vzcy52ZXJzaW9ucy5ub2RlKTtcbmZ1bmN0aW9uIGNyZWF0ZURvbUVsZW1lbnQodGFnLCBpc1NWRyA9IGZhbHNlKSB7XG4gIHJldHVybiBpc1NWRyA/IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsIHRhZykgOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZyk7XG59XG52YXIgVm5vZGUgPSBmdW5jdGlvbiBWbm9kZTIodGFnLCBwcm9wcywgY2hpbGRyZW4pIHtcbiAgdGhpcy50YWcgPSB0YWc7XG4gIHRoaXMucHJvcHMgPSBwcm9wcztcbiAgdGhpcy5jaGlsZHJlbiA9IGNoaWxkcmVuO1xufTtcbmZ1bmN0aW9uIGlzQ29tcG9uZW50KGNvbXBvbmVudCkge1xuICByZXR1cm4gY29tcG9uZW50ICYmICh0eXBlb2YgY29tcG9uZW50ID09PSBcImZ1bmN0aW9uXCIgfHwgdHlwZW9mIGNvbXBvbmVudCA9PT0gXCJvYmplY3RcIiAmJiBcInZpZXdcIiBpbiBjb21wb25lbnQpO1xufVxudmFyIGlzVm5vZGUgPSAob2JqZWN0KSA9PiB7XG4gIHJldHVybiBvYmplY3QgaW5zdGFuY2VvZiBWbm9kZTtcbn07XG52YXIgaXNWbm9kZUNvbXBvbmVudCA9IChvYmplY3QpID0+IHtcbiAgcmV0dXJuIGlzVm5vZGUob2JqZWN0KSAmJiBpc0NvbXBvbmVudChvYmplY3QudGFnKTtcbn07XG5mdW5jdGlvbiBkb21Ub1Zub2RlKGRvbSkge1xuICBsZXQgY2hpbGRyZW4gPSBbXTtcbiAgZm9yIChsZXQgaSA9IDAsIGwgPSBkb20uY2hpbGROb2Rlcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICBsZXQgY2hpbGREb20gPSBkb20uY2hpbGROb2Rlc1tpXTtcbiAgICBpZiAoY2hpbGREb20ubm9kZVR5cGUgPT09IDMpIHtcbiAgICAgIGxldCB2bm9kZTIgPSBuZXcgVm5vZGUodGV4dFRhZywge30sIFtdKTtcbiAgICAgIHZub2RlMi5kb20gPSBjaGlsZERvbTtcbiAgICAgIGNoaWxkcmVuLnB1c2godm5vZGUyKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBpZiAoY2hpbGREb20ubm9kZVR5cGUgPT09IDEpIHtcbiAgICAgIGNoaWxkcmVuLnB1c2goZG9tVG9Wbm9kZShjaGlsZERvbSkpO1xuICAgIH1cbiAgfVxuICBsZXQgcHJvcHMgPSB7fTtcbiAgZm9yIChsZXQgaSA9IDAsIGwgPSBkb20uYXR0cmlidXRlcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICBsZXQgYXR0ciA9IGRvbS5hdHRyaWJ1dGVzW2ldO1xuICAgIHByb3BzW2F0dHIubm9kZU5hbWVdID0gYXR0ci5ub2RlVmFsdWU7XG4gIH1cbiAgbGV0IHZub2RlID0gbmV3IFZub2RlKGRvbS50YWdOYW1lLnRvTG93ZXJDYXNlKCksIHByb3BzLCBjaGlsZHJlbik7XG4gIHZub2RlLmRvbSA9IGRvbTtcbiAgcmV0dXJuIHZub2RlO1xufVxuZnVuY3Rpb24gdHJ1c3QoaHRtbFN0cmluZykge1xuICBsZXQgZGl2ID0gY3JlYXRlRG9tRWxlbWVudChcImRpdlwiKTtcbiAgZGl2LmlubmVySFRNTCA9IGh0bWxTdHJpbmcudHJpbSgpO1xuICByZXR1cm4gW10ubWFwLmNhbGwoZGl2LmNoaWxkTm9kZXMsIChpdGVtKSA9PiBkb21Ub1Zub2RlKGl0ZW0pKTtcbn1cbnZhciBtYWluQ29tcG9uZW50ID0gbnVsbDtcbnZhciBtYWluVm5vZGUgPSBudWxsO1xudmFyIGlzTW91bnRlZCA9IGZhbHNlO1xudmFyIGN1cnJlbnQgPSB7XG4gIHZub2RlOiBudWxsLFxuICBvbGRWbm9kZTogbnVsbCxcbiAgY29tcG9uZW50OiBudWxsXG59O1xudmFyIHJlc2VydmVkUHJvcHMgPSB7XG4gIGtleTogdHJ1ZSxcbiAgc3RhdGU6IHRydWUsXG4gIFwidi1rZWVwXCI6IHRydWUsXG4gIFwidi1pZlwiOiB0cnVlLFxuICBcInYtdW5sZXNzXCI6IHRydWUsXG4gIFwidi1mb3JcIjogdHJ1ZSxcbiAgXCJ2LXNob3dcIjogdHJ1ZSxcbiAgXCJ2LWNsYXNzXCI6IHRydWUsXG4gIFwidi1odG1sXCI6IHRydWUsXG4gIFwidi1tb2RlbFwiOiB0cnVlLFxuICBcInYtY3JlYXRlXCI6IHRydWUsXG4gIFwidi11cGRhdGVcIjogdHJ1ZSxcbiAgXCJ2LWNsZWFudXBcIjogdHJ1ZVxufTtcbnZhciBvbkNsZWFudXBTZXQgPSAvKiBAX19QVVJFX18gKi8gbmV3IFNldCgpO1xudmFyIG9uTW91bnRTZXQgPSAvKiBAX19QVVJFX18gKi8gbmV3IFNldCgpO1xudmFyIG9uVXBkYXRlU2V0ID0gLyogQF9fUFVSRV9fICovIG5ldyBTZXQoKTtcbnZhciBvblVubW91bnRTZXQgPSAvKiBAX19QVVJFX18gKi8gbmV3IFNldCgpO1xuZnVuY3Rpb24gb25Nb3VudChjYWxsYmFjaykge1xuICBvbk1vdW50U2V0LmFkZChjYWxsYmFjayk7XG59XG5mdW5jdGlvbiBvblVwZGF0ZShjYWxsYmFjaykge1xuICBvblVwZGF0ZVNldC5hZGQoY2FsbGJhY2spO1xufVxuZnVuY3Rpb24gb25DbGVhbnVwKGNhbGxiYWNrKSB7XG4gIG9uQ2xlYW51cFNldC5hZGQoY2FsbGJhY2spO1xufVxuZnVuY3Rpb24gb25Vbm1vdW50KGNhbGxiYWNrKSB7XG4gIG9uVW5tb3VudFNldC5hZGQoY2FsbGJhY2spO1xufVxuZnVuY3Rpb24gY2FsbFNldChzZXQpIHtcbiAgZm9yIChsZXQgY2FsbGJhY2sgb2Ygc2V0KSB7XG4gICAgY2FsbGJhY2soKTtcbiAgfVxuICBzZXQuY2xlYXIoKTtcbn1cbnZhciBldmVudExpc3RlbmVyTmFtZXMgPSB7fTtcbmZ1bmN0aW9uIGV2ZW50TGlzdGVuZXIoZSkge1xuICBsZXQgZG9tID0gZS50YXJnZXQ7XG4gIGxldCBuYW1lID0gYHYtb24ke2UudHlwZX1gO1xuICB3aGlsZSAoZG9tKSB7XG4gICAgaWYgKGRvbVtuYW1lXSkge1xuICAgICAgZG9tW25hbWVdKGUsIGRvbSk7XG4gICAgICBpZiAoIWUuZGVmYXVsdFByZXZlbnRlZCkge1xuICAgICAgICB1cGRhdGUoKTtcbiAgICAgIH1cbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZG9tID0gZG9tLnBhcmVudE5vZGU7XG4gIH1cbn1cbnZhciBoaWRlRGlyZWN0aXZlID0gKHRlc3QpID0+IChib29sLCB2bm9kZSwgb2xkbm9kZSkgPT4ge1xuICBsZXQgdmFsdWUgPSB0ZXN0ID8gYm9vbCA6ICFib29sO1xuICBpZiAodmFsdWUpIHtcbiAgICBsZXQgbmV3ZG9tID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoXCJcIik7XG4gICAgaWYgKG9sZG5vZGUgJiYgb2xkbm9kZS5kb20gJiYgb2xkbm9kZS5kb20ucGFyZW50Tm9kZSkge1xuICAgICAgb2xkbm9kZS5kb20ucGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQobmV3ZG9tLCBvbGRub2RlLmRvbSk7XG4gICAgfVxuICAgIHZub2RlLnRhZyA9IFwiI3RleHRcIjtcbiAgICB2bm9kZS5jaGlsZHJlbiA9IFtdO1xuICAgIHZub2RlLnByb3BzID0ge307XG4gICAgdm5vZGUuZG9tID0gbmV3ZG9tO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufTtcbnZhciBkaXJlY3RpdmVzID0ge1xuICBcInYtaWZcIjogaGlkZURpcmVjdGl2ZShmYWxzZSksXG4gIFwidi11bmxlc3NcIjogaGlkZURpcmVjdGl2ZSh0cnVlKSxcbiAgXCJ2LWZvclwiOiAoc2V0LCB2bm9kZSkgPT4ge1xuICAgIGxldCBuZXdDaGlsZHJlbiA9IFtdO1xuICAgIGxldCBjYWxsYmFjayA9IHZub2RlLmNoaWxkcmVuWzBdO1xuICAgIGZvciAobGV0IGkgPSAwLCBsID0gc2V0Lmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgbmV3Q2hpbGRyZW4ucHVzaChjYWxsYmFjayhzZXRbaV0sIGkpKTtcbiAgICB9XG4gICAgdm5vZGUuY2hpbGRyZW4gPSBuZXdDaGlsZHJlbjtcbiAgfSxcbiAgXCJ2LXNob3dcIjogKGJvb2wsIHZub2RlKSA9PiB7XG4gICAgdm5vZGUuZG9tLnN0eWxlLmRpc3BsYXkgPSBib29sID8gXCJcIiA6IFwibm9uZVwiO1xuICB9LFxuICBcInYtY2xhc3NcIjogKGNsYXNzZXMsIHZub2RlKSA9PiB7XG4gICAgZm9yIChsZXQgbmFtZSBpbiBjbGFzc2VzKSB7XG4gICAgICB2bm9kZS5kb20uY2xhc3NMaXN0LnRvZ2dsZShuYW1lLCBjbGFzc2VzW25hbWVdKTtcbiAgICB9XG4gIH0sXG4gIFwidi1odG1sXCI6IChodG1sLCB2bm9kZSkgPT4ge1xuICAgIHZub2RlLmNoaWxkcmVuID0gW3RydXN0KGh0bWwpXTtcbiAgfSxcbiAgXCJ2LW1vZGVsXCI6IChbbW9kZWwsIHByb3BlcnR5LCBldmVudF0sIHZub2RlLCBvbGRWbm9kZSkgPT4ge1xuICAgIGlmIChvbGRWbm9kZSAmJiBvbGRWbm9kZS5kb20gPT09IHZub2RlLmRvbSkge1xuICAgICAgbGV0IFtvbGRNb2RlbCwgb2xkUHJvcGVydHksIG9sZEV2ZW50XSA9IG9sZFZub2RlLnByb3BzW1widi1tb2RlbFwiXSB8fCBbXTtcbiAgICAgIGlmIChvbGRNb2RlbCA9PT0gbW9kZWwgJiYgb2xkUHJvcGVydHkgPT09IHByb3BlcnR5ICYmIG9sZEV2ZW50ID09PSBldmVudCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuICAgIGxldCB2YWx1ZTtcbiAgICBsZXQgaGFuZGxlciA9IChlKSA9PiBtb2RlbFtwcm9wZXJ0eV0gPSBlLnRhcmdldC52YWx1ZTtcbiAgICBpZiAodm5vZGUudGFnID09PSBcImlucHV0XCIpIHtcbiAgICAgIGV2ZW50ID0gZXZlbnQgfHwgXCJvbmlucHV0XCI7XG4gICAgICBzd2l0Y2ggKHZub2RlLnByb3BzLnR5cGUpIHtcbiAgICAgICAgY2FzZSBcImNoZWNrYm94XCI6IHtcbiAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShtb2RlbFtwcm9wZXJ0eV0pKSB7XG4gICAgICAgICAgICBoYW5kbGVyID0gKGUpID0+IHtcbiAgICAgICAgICAgICAgbGV0IHZhbCA9IGUudGFyZ2V0LnZhbHVlO1xuICAgICAgICAgICAgICBsZXQgaWR4ID0gbW9kZWxbcHJvcGVydHldLmluZGV4T2YodmFsKTtcbiAgICAgICAgICAgICAgaWYgKGlkeCA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICBtb2RlbFtwcm9wZXJ0eV0ucHVzaCh2YWwpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG1vZGVsW3Byb3BlcnR5XS5zcGxpY2UoaWR4LCAxKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHZhbHVlID0gbW9kZWxbcHJvcGVydHldLmluZGV4T2Yodm5vZGUuZG9tLnZhbHVlKSAhPT0gLTE7XG4gICAgICAgICAgfSBlbHNlIGlmIChcInZhbHVlXCIgaW4gdm5vZGUucHJvcHMpIHtcbiAgICAgICAgICAgIGhhbmRsZXIgPSAoKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChtb2RlbFtwcm9wZXJ0eV0gPT09IHZub2RlLnByb3BzLnZhbHVlKSB7XG4gICAgICAgICAgICAgICAgbW9kZWxbcHJvcGVydHldID0gbnVsbDtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBtb2RlbFtwcm9wZXJ0eV0gPSB2bm9kZS5wcm9wcy52YWx1ZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHZhbHVlID0gbW9kZWxbcHJvcGVydHldID09PSB2bm9kZS5wcm9wcy52YWx1ZTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaGFuZGxlciA9ICgpID0+IG1vZGVsW3Byb3BlcnR5XSA9ICFtb2RlbFtwcm9wZXJ0eV07XG4gICAgICAgICAgICB2YWx1ZSA9IG1vZGVsW3Byb3BlcnR5XTtcbiAgICAgICAgICB9XG4gICAgICAgICAgc2hhcmVkU2V0QXR0cmlidXRlKFwiY2hlY2tlZFwiLCB2YWx1ZSwgdm5vZGUpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJyYWRpb1wiOiB7XG4gICAgICAgICAgc2hhcmVkU2V0QXR0cmlidXRlKFwiY2hlY2tlZFwiLCBtb2RlbFtwcm9wZXJ0eV0gPT09IHZub2RlLmRvbS52YWx1ZSwgdm5vZGUpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGRlZmF1bHQ6IHtcbiAgICAgICAgICBzaGFyZWRTZXRBdHRyaWJ1dGUoXCJ2YWx1ZVwiLCBtb2RlbFtwcm9wZXJ0eV0sIHZub2RlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodm5vZGUudGFnID09PSBcInNlbGVjdFwiKSB7XG4gICAgICBldmVudCA9IGV2ZW50IHx8IFwib25jbGlja1wiO1xuICAgICAgaWYgKHZub2RlLnByb3BzLm11bHRpcGxlKSB7XG4gICAgICAgIGhhbmRsZXIgPSAoZSkgPT4ge1xuICAgICAgICAgIGxldCB2YWwgPSBlLnRhcmdldC52YWx1ZTtcbiAgICAgICAgICBpZiAoZS5jdHJsS2V5KSB7XG4gICAgICAgICAgICBsZXQgaWR4ID0gbW9kZWxbcHJvcGVydHldLmluZGV4T2YodmFsKTtcbiAgICAgICAgICAgIGlmIChpZHggPT09IC0xKSB7XG4gICAgICAgICAgICAgIG1vZGVsW3Byb3BlcnR5XS5wdXNoKHZhbCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBtb2RlbFtwcm9wZXJ0eV0uc3BsaWNlKGlkeCwgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG1vZGVsW3Byb3BlcnR5XS5zcGxpY2UoMCwgbW9kZWxbcHJvcGVydHldLmxlbmd0aCk7XG4gICAgICAgICAgICBtb2RlbFtwcm9wZXJ0eV0ucHVzaCh2YWwpO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgdm5vZGUuY2hpbGRyZW4uZm9yRWFjaCgoY2hpbGQpID0+IHtcbiAgICAgICAgICBpZiAoY2hpbGQudGFnID09PSBcIm9wdGlvblwiKSB7XG4gICAgICAgICAgICBsZXQgdmFsdWUyID0gXCJ2YWx1ZVwiIGluIGNoaWxkLnByb3BzID8gY2hpbGQucHJvcHMudmFsdWUgOiBjaGlsZC5jaGlsZHJlbi5qb2luKFwiXCIpLnRyaW0oKTtcbiAgICAgICAgICAgIGNoaWxkLnByb3BzLnNlbGVjdGVkID0gbW9kZWxbcHJvcGVydHldLmluZGV4T2YodmFsdWUyKSAhPT0gLTE7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZub2RlLmNoaWxkcmVuLmZvckVhY2goKGNoaWxkKSA9PiB7XG4gICAgICAgICAgaWYgKGNoaWxkLnRhZyA9PT0gXCJvcHRpb25cIikge1xuICAgICAgICAgICAgbGV0IHZhbHVlMiA9IFwidmFsdWVcIiBpbiBjaGlsZC5wcm9wcyA/IGNoaWxkLnByb3BzLnZhbHVlIDogY2hpbGQuY2hpbGRyZW4uam9pbihcIlwiKS50cmltKCk7XG4gICAgICAgICAgICBjaGlsZC5wcm9wcy5zZWxlY3RlZCA9IHZhbHVlMiA9PT0gbW9kZWxbcHJvcGVydHldO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh2bm9kZS50YWcgPT09IFwidGV4dGFyZWFcIikge1xuICAgICAgZXZlbnQgPSBldmVudCB8fCBcIm9uaW5wdXRcIjtcbiAgICAgIHZub2RlLmNoaWxkcmVuID0gW21vZGVsW3Byb3BlcnR5XV07XG4gICAgfVxuICAgIGxldCBwcmV2SGFuZGxlciA9IHZub2RlLnByb3BzW2V2ZW50XTtcbiAgICBzaGFyZWRTZXRBdHRyaWJ1dGUoXG4gICAgICBldmVudCxcbiAgICAgIChlKSA9PiB7XG4gICAgICAgIGhhbmRsZXIoZSk7XG4gICAgICAgIGlmIChwcmV2SGFuZGxlcikge1xuICAgICAgICAgIHByZXZIYW5kbGVyKGUpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgdm5vZGUsXG4gICAgICBvbGRWbm9kZVxuICAgICk7XG4gIH0sXG4gIFwidi1jcmVhdGVcIjogKGNhbGxiYWNrLCB2bm9kZSwgb2xkVm5vZGUpID0+IHtcbiAgICBpZiAoIW9sZFZub2RlKSB7XG4gICAgICBjYWxsYmFjayh2bm9kZSk7XG4gICAgfVxuICB9LFxuICBcInYtdXBkYXRlXCI6IChjYWxsYmFjaywgdm5vZGUsIG9sZFZub2RlKSA9PiB7XG4gICAgaWYgKG9sZFZub2RlKSB7XG4gICAgICBjYWxsYmFjayh2bm9kZSwgb2xkVm5vZGUpO1xuICAgIH1cbiAgfSxcbiAgXCJ2LWNsZWFudXBcIjogKGNhbGxiYWNrLCB2bm9kZSwgb2xkVm5vZGUpID0+IHtcbiAgICBvbkNsZWFudXAoKCkgPT4gY2FsbGJhY2sodm5vZGUsIG9sZFZub2RlKSk7XG4gIH1cbn07XG5mdW5jdGlvbiBkaXJlY3RpdmUobmFtZSwgZGlyZWN0aXZlMikge1xuICBsZXQgZGlyZWN0aXZlTmFtZSA9IGB2LSR7bmFtZX1gO1xuICBkaXJlY3RpdmVzW2RpcmVjdGl2ZU5hbWVdID0gZGlyZWN0aXZlMjtcbiAgcmVzZXJ2ZWRQcm9wc1tkaXJlY3RpdmVOYW1lXSA9IHRydWU7XG59XG5mdW5jdGlvbiBzaGFyZWRTZXRBdHRyaWJ1dGUobmFtZSwgdmFsdWUsIG5ld1Zub2RlLCBvbGRWbm9kZSkge1xuICBpZiAodHlwZW9mIHZhbHVlID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICBpZiAobmFtZSBpbiBldmVudExpc3RlbmVyTmFtZXMgPT09IGZhbHNlKSB7XG4gICAgICBtYWluVm5vZGUuZG9tLmFkZEV2ZW50TGlzdGVuZXIobmFtZS5zbGljZSgyKSwgZXZlbnRMaXN0ZW5lcik7XG4gICAgICBldmVudExpc3RlbmVyTmFtZXNbbmFtZV0gPSB0cnVlO1xuICAgIH1cbiAgICBuZXdWbm9kZS5kb21bYHYtJHtuYW1lfWBdID0gdmFsdWU7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmIChuYW1lIGluIG5ld1Zub2RlLmRvbSAmJiBuZXdWbm9kZS5pc1NWRyA9PT0gZmFsc2UpIHtcbiAgICBpZiAobmV3Vm5vZGUuZG9tW25hbWVdICE9IHZhbHVlKSB7XG4gICAgICBuZXdWbm9kZS5kb21bbmFtZV0gPSB2YWx1ZTtcbiAgICB9XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmICghb2xkVm5vZGUgfHwgdmFsdWUgIT09IG9sZFZub2RlLnByb3BzW25hbWVdKSB7XG4gICAgaWYgKHZhbHVlID09PSBmYWxzZSkge1xuICAgICAgbmV3Vm5vZGUuZG9tLnJlbW92ZUF0dHJpYnV0ZShuYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmV3Vm5vZGUuZG9tLnNldEF0dHJpYnV0ZShuYW1lLCB2YWx1ZSk7XG4gICAgfVxuICB9XG59XG5mdW5jdGlvbiBzZXRBdHRyaWJ1dGUobmFtZSwgdmFsdWUsIG5ld1Zub2RlLCBvbGRWbm9kZSkge1xuICBpZiAobmFtZSBpbiByZXNlcnZlZFByb3BzKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIG5ld1Zub2RlLnByb3BzW25hbWVdID0gdmFsdWU7XG4gIHNoYXJlZFNldEF0dHJpYnV0ZShuYW1lLCB2YWx1ZSwgbmV3Vm5vZGUsIG9sZFZub2RlKTtcbn1cbmZ1bmN0aW9uIHVwZGF0ZUF0dHJpYnV0ZXMobmV3Vm5vZGUsIG9sZFZub2RlKSB7XG4gIGlmIChvbGRWbm9kZSkge1xuICAgIGZvciAobGV0IG5hbWUgaW4gb2xkVm5vZGUucHJvcHMpIHtcbiAgICAgIGlmIChuYW1lIGluIG5ld1Zub2RlLnByb3BzID09PSBmYWxzZSAmJiBuYW1lIGluIGV2ZW50TGlzdGVuZXJOYW1lcyA9PT0gZmFsc2UgJiYgbmFtZSBpbiByZXNlcnZlZFByb3BzID09PSBmYWxzZSkge1xuICAgICAgICBpZiAobmFtZSBpbiBuZXdWbm9kZS5kb20gJiYgbmV3Vm5vZGUuaXNTVkcgPT09IGZhbHNlKSB7XG4gICAgICAgICAgbmV3Vm5vZGUuZG9tW25hbWVdID0gbnVsbDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBuZXdWbm9kZS5kb20ucmVtb3ZlQXR0cmlidXRlKG5hbWUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGZvciAobGV0IG5hbWUgaW4gbmV3Vm5vZGUucHJvcHMpIHtcbiAgICBpZiAobmFtZSBpbiByZXNlcnZlZFByb3BzKSB7XG4gICAgICBpZiAobmFtZSBpbiBkaXJlY3RpdmVzICYmIGRpcmVjdGl2ZXNbbmFtZV0obmV3Vm5vZGUucHJvcHNbbmFtZV0sIG5ld1Zub2RlLCBvbGRWbm9kZSkgPT09IGZhbHNlKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIHNoYXJlZFNldEF0dHJpYnV0ZShuYW1lLCBuZXdWbm9kZS5wcm9wc1tuYW1lXSwgbmV3Vm5vZGUsIG9sZFZub2RlKTtcbiAgfVxufVxuZnVuY3Rpb24gcGF0Y2gobmV3Vm5vZGUsIG9sZFZub2RlKSB7XG4gIGxldCBuZXdUcmVlID0gbmV3Vm5vZGUuY2hpbGRyZW47XG4gIGxldCBvbGRUcmVlID0gb2xkVm5vZGU/LmNoaWxkcmVuIHx8IFtdO1xuICBsZXQgb2xkVHJlZUxlbmd0aCA9IG9sZFRyZWUubGVuZ3RoO1xuICBpZiAob2xkVHJlZUxlbmd0aCAmJiBuZXdUcmVlWzBdIGluc3RhbmNlb2YgVm5vZGUgJiYgXCJrZXlcIiBpbiBuZXdUcmVlWzBdLnByb3BzICYmIFwia2V5XCIgaW4gb2xkVHJlZVswXS5wcm9wcykge1xuICAgIGxldCBuZXdUcmVlTGVuZ3RoID0gbmV3VHJlZS5sZW5ndGg7XG4gICAgbGV0IG9sZEtleWVkTGlzdCA9IHt9O1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgb2xkVHJlZUxlbmd0aDsgaSsrKSB7XG4gICAgICBvbGRLZXllZExpc3Rbb2xkVHJlZVtpXS5wcm9wcy5rZXldID0gaTtcbiAgICB9XG4gICAgbGV0IG5ld0tleWVkTGlzdCA9IHt9O1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbmV3VHJlZUxlbmd0aDsgaSsrKSB7XG4gICAgICBuZXdLZXllZExpc3RbbmV3VHJlZVtpXS5wcm9wcy5rZXldID0gaTtcbiAgICB9XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuZXdUcmVlTGVuZ3RoOyBpKyspIHtcbiAgICAgIGxldCBuZXdDaGlsZCA9IG5ld1RyZWVbaV07XG4gICAgICBsZXQgb2xkQ2hpbGQgPSBvbGRUcmVlW29sZEtleWVkTGlzdFtuZXdDaGlsZC5wcm9wcy5rZXldXTtcbiAgICAgIGxldCBzaG91bGRQYXRjaCA9IHRydWU7XG4gICAgICBpZiAob2xkQ2hpbGQpIHtcbiAgICAgICAgbmV3Q2hpbGQuZG9tID0gb2xkQ2hpbGQuZG9tO1xuICAgICAgICBpZiAoXCJ2LWtlZXBcIiBpbiBuZXdDaGlsZC5wcm9wcyAmJiBuZXdDaGlsZC5wcm9wc1tcInYta2VlcFwiXSA9PT0gb2xkQ2hpbGQucHJvcHNbXCJ2LWtlZXBcIl0pIHtcbiAgICAgICAgICBuZXdDaGlsZC5jaGlsZHJlbiA9IG9sZENoaWxkLmNoaWxkcmVuO1xuICAgICAgICAgIHNob3VsZFBhdGNoID0gZmFsc2U7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdXBkYXRlQXR0cmlidXRlcyhuZXdDaGlsZCwgb2xkQ2hpbGQpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBuZXdDaGlsZC5kb20gPSBjcmVhdGVEb21FbGVtZW50KG5ld0NoaWxkLnRhZywgbmV3Q2hpbGQuaXNTVkcpO1xuICAgICAgICB1cGRhdGVBdHRyaWJ1dGVzKG5ld0NoaWxkKTtcbiAgICAgIH1cbiAgICAgIGlmICghbmV3Vm5vZGUuZG9tLmNoaWxkTm9kZXNbaV0pIHtcbiAgICAgICAgbmV3Vm5vZGUuZG9tLmFwcGVuZENoaWxkKG5ld0NoaWxkLmRvbSk7XG4gICAgICB9IGVsc2UgaWYgKG5ld1Zub2RlLmRvbS5jaGlsZE5vZGVzW2ldICE9PSBuZXdDaGlsZC5kb20pIHtcbiAgICAgICAgbmV3Vm5vZGUuZG9tLnJlcGxhY2VDaGlsZChuZXdDaGlsZC5kb20sIG5ld1Zub2RlLmRvbS5jaGlsZE5vZGVzW2ldKTtcbiAgICAgIH1cbiAgICAgIHNob3VsZFBhdGNoICYmIHBhdGNoKG5ld0NoaWxkLCBvbGRDaGlsZCk7XG4gICAgfVxuICAgIGZvciAobGV0IGkgPSBuZXdUcmVlTGVuZ3RoOyBpIDwgb2xkVHJlZUxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoIW5ld0tleWVkTGlzdFtvbGRUcmVlW2ldLnByb3BzLmtleV0pIHtcbiAgICAgICAgb2xkVHJlZVtpXS5kb20ucGFyZW50Tm9kZSAmJiBvbGRUcmVlW2ldLmRvbS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKG9sZFRyZWVbaV0uZG9tKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmIChuZXdUcmVlLmxlbmd0aCA9PT0gMCkge1xuICAgIG5ld1Zub2RlLmRvbS50ZXh0Q29udGVudCA9IFwiXCI7XG4gICAgcmV0dXJuO1xuICB9XG4gIGN1cnJlbnQudm5vZGUgPSBuZXdWbm9kZTtcbiAgY3VycmVudC5vbGRWbm9kZSA9IG9sZFZub2RlO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IG5ld1RyZWUubGVuZ3RoOyBpKyspIHtcbiAgICBsZXQgbmV3Q2hpbGQgPSBuZXdUcmVlW2ldO1xuICAgIGlmIChuZXdDaGlsZCBpbnN0YW5jZW9mIFZub2RlICYmIG5ld0NoaWxkLnRhZyAhPT0gdGV4dFRhZykge1xuICAgICAgaWYgKHR5cGVvZiBuZXdDaGlsZC50YWcgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgY3VycmVudC5jb21wb25lbnQgPSBuZXdDaGlsZC50YWc7XG4gICAgICAgIG5ld1RyZWUuc3BsaWNlKFxuICAgICAgICAgIGktLSxcbiAgICAgICAgICAxLFxuICAgICAgICAgIChcInZpZXdcIiBpbiBuZXdDaGlsZC50YWcgPyBuZXdDaGlsZC50YWcudmlldy5iaW5kKG5ld0NoaWxkLnRhZykgOiBuZXdDaGlsZC50YWcuYmluZChuZXdDaGlsZC50YWcpKShcbiAgICAgICAgICAgIG5ld0NoaWxkLnByb3BzLFxuICAgICAgICAgICAgLi4ubmV3Q2hpbGQuY2hpbGRyZW5cbiAgICAgICAgICApXG4gICAgICAgICk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgbmV3Q2hpbGQuaXNTVkcgPSBuZXdWbm9kZS5pc1NWRyB8fCBuZXdDaGlsZC50YWcgPT09IFwic3ZnXCI7XG4gICAgICBpZiAoaSA8IG9sZFRyZWVMZW5ndGgpIHtcbiAgICAgICAgbGV0IG9sZENoaWxkID0gb2xkVHJlZVtpXTtcbiAgICAgICAgaWYgKG5ld0NoaWxkLnRhZyA9PT0gb2xkQ2hpbGQudGFnKSB7XG4gICAgICAgICAgbmV3Q2hpbGQuZG9tID0gb2xkQ2hpbGQuZG9tO1xuICAgICAgICAgIGlmIChcInYta2VlcFwiIGluIG5ld0NoaWxkLnByb3BzICYmIG5ld0NoaWxkLnByb3BzW1widi1rZWVwXCJdID09PSBvbGRDaGlsZC5wcm9wc1tcInYta2VlcFwiXSkge1xuICAgICAgICAgICAgbmV3Q2hpbGQuY2hpbGRyZW4gPSBvbGRDaGlsZC5jaGlsZHJlbjtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICB1cGRhdGVBdHRyaWJ1dGVzKG5ld0NoaWxkLCBvbGRDaGlsZCk7XG4gICAgICAgICAgcGF0Y2gobmV3Q2hpbGQsIG9sZENoaWxkKTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBuZXdDaGlsZC5kb20gPSBjcmVhdGVEb21FbGVtZW50KG5ld0NoaWxkLnRhZywgbmV3Q2hpbGQuaXNTVkcpO1xuICAgICAgICB1cGRhdGVBdHRyaWJ1dGVzKG5ld0NoaWxkKTtcbiAgICAgICAgbmV3Vm5vZGUuZG9tLnJlcGxhY2VDaGlsZChuZXdDaGlsZC5kb20sIG9sZENoaWxkLmRvbSk7XG4gICAgICAgIHBhdGNoKG5ld0NoaWxkKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBuZXdDaGlsZC5kb20gPSBjcmVhdGVEb21FbGVtZW50KG5ld0NoaWxkLnRhZywgbmV3Q2hpbGQuaXNTVkcpO1xuICAgICAgdXBkYXRlQXR0cmlidXRlcyhuZXdDaGlsZCk7XG4gICAgICBuZXdWbm9kZS5kb20uYXBwZW5kQ2hpbGQobmV3Q2hpbGQuZG9tKTtcbiAgICAgIHBhdGNoKG5ld0NoaWxkKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBpZiAoQXJyYXkuaXNBcnJheShuZXdDaGlsZCkpIHtcbiAgICAgIG5ld1RyZWUuc3BsaWNlKGktLSwgMSwgLi4ubmV3Q2hpbGQpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGlmIChuZXdDaGlsZCA9PT0gbnVsbCB8fCBuZXdDaGlsZCA9PT0gdm9pZCAwKSB7XG4gICAgICBuZXdUcmVlLnNwbGljZShpLS0sIDEpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIG5ld1RyZWVbaV0gPSBuZXcgVm5vZGUodGV4dFRhZywge30sIFtdKTtcbiAgICBpZiAobmV3Q2hpbGQgaW5zdGFuY2VvZiBWbm9kZSkge1xuICAgICAgbmV3VHJlZVtpXS5kb20gPSBuZXdDaGlsZC5kb207XG4gICAgICBuZXdDaGlsZCA9IG5ld0NoaWxkLmRvbS50ZXh0Q29udGVudDtcbiAgICB9XG4gICAgaWYgKGkgPCBvbGRUcmVlTGVuZ3RoKSB7XG4gICAgICBsZXQgb2xkQ2hpbGQgPSBvbGRUcmVlW2ldO1xuICAgICAgaWYgKG9sZENoaWxkLnRhZyA9PT0gdGV4dFRhZykge1xuICAgICAgICBuZXdUcmVlW2ldLmRvbSA9IG9sZENoaWxkLmRvbTtcbiAgICAgICAgaWYgKG5ld0NoaWxkICE9IG9sZENoaWxkLmRvbS50ZXh0Q29udGVudCkge1xuICAgICAgICAgIG9sZENoaWxkLmRvbS50ZXh0Q29udGVudCA9IG5ld0NoaWxkO1xuICAgICAgICB9XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgbmV3VHJlZVtpXS5kb20gPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShuZXdDaGlsZCk7XG4gICAgICBuZXdWbm9kZS5kb20ucmVwbGFjZUNoaWxkKG5ld1RyZWVbaV0uZG9tLCBvbGRDaGlsZC5kb20pO1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIG5ld1RyZWVbaV0uZG9tID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUobmV3Q2hpbGQpO1xuICAgIG5ld1Zub2RlLmRvbS5hcHBlbmRDaGlsZChuZXdUcmVlW2ldLmRvbSk7XG4gIH1cbiAgZm9yIChsZXQgaSA9IG5ld1RyZWUubGVuZ3RoOyBpIDwgb2xkVHJlZUxlbmd0aDsgaSsrKSB7XG4gICAgbmV3Vm5vZGUuZG9tLnJlbW92ZUNoaWxkKG9sZFRyZWVbaV0uZG9tKTtcbiAgfVxufVxuZnVuY3Rpb24gdXBkYXRlKCkge1xuICBpZiAobWFpblZub2RlKSB7XG4gICAgY2FsbFNldChvbkNsZWFudXBTZXQpO1xuICAgIGxldCBvbGRNYWluVm5vZGUgPSBtYWluVm5vZGU7XG4gICAgbWFpblZub2RlID0gbmV3IFZub2RlKG9sZE1haW5Wbm9kZS50YWcsIG9sZE1haW5Wbm9kZS5wcm9wcywgW21haW5Db21wb25lbnRdKTtcbiAgICBtYWluVm5vZGUuZG9tID0gb2xkTWFpblZub2RlLmRvbTtcbiAgICBtYWluVm5vZGUuaXNTVkcgPSBvbGRNYWluVm5vZGUuaXNTVkc7XG4gICAgcGF0Y2gobWFpblZub2RlLCBvbGRNYWluVm5vZGUpO1xuICAgIGNhbGxTZXQoaXNNb3VudGVkID8gb25VcGRhdGVTZXQgOiBvbk1vdW50U2V0KTtcbiAgICBpc01vdW50ZWQgPSB0cnVlO1xuICAgIGN1cnJlbnQudm5vZGUgPSBudWxsO1xuICAgIGN1cnJlbnQub2xkVm5vZGUgPSBudWxsO1xuICAgIGN1cnJlbnQuY29tcG9uZW50ID0gbnVsbDtcbiAgICBpZiAoaXNOb2RlSnMpIHtcbiAgICAgIHJldHVybiBtYWluVm5vZGUuZG9tLmlubmVySFRNTDtcbiAgICB9XG4gIH1cbn1cbmZ1bmN0aW9uIHVubW91bnQoKSB7XG4gIGlmIChtYWluVm5vZGUpIHtcbiAgICBtYWluQ29tcG9uZW50ID0gbmV3IFZub2RlKCgpID0+IG51bGwsIHt9LCBbXSk7XG4gICAgbGV0IHJlc3VsdCA9IHVwZGF0ZSgpO1xuICAgIGNhbGxTZXQob25Vbm1vdW50U2V0KTtcbiAgICBmb3IgKGxldCBuYW1lIGluIGV2ZW50TGlzdGVuZXJOYW1lcykge1xuICAgICAgbWFpblZub2RlLmRvbS5yZW1vdmVFdmVudExpc3RlbmVyKG5hbWUuc2xpY2UoMikudG9Mb3dlckNhc2UoKSwgZXZlbnRMaXN0ZW5lcik7XG4gICAgICBSZWZsZWN0LmRlbGV0ZVByb3BlcnR5KGV2ZW50TGlzdGVuZXJOYW1lcywgbmFtZSk7XG4gICAgfVxuICAgIG1haW5Db21wb25lbnQgPSBudWxsO1xuICAgIG1haW5Wbm9kZSA9IG51bGw7XG4gICAgaXNNb3VudGVkID0gZmFsc2U7XG4gICAgY3VycmVudC52bm9kZSA9IG51bGw7XG4gICAgY3VycmVudC5vbGRWbm9kZSA9IG51bGw7XG4gICAgY3VycmVudC5jb21wb25lbnQgPSBudWxsO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbn1cbmZ1bmN0aW9uIG1vdW50KGRvbSwgY29tcG9uZW50KSB7XG4gIGxldCBjb250YWluZXIgPSB0eXBlb2YgZG9tID09PSBcInN0cmluZ1wiID8gaXNOb2RlSnMgPyBjcmVhdGVEb21FbGVtZW50KGRvbSwgZG9tID09PSBcInN2Z1wiKSA6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoZG9tKVswXSA6IGRvbTtcbiAgbGV0IHZub2RlQ29tcG9uZW50ID0gaXNWbm9kZUNvbXBvbmVudChjb21wb25lbnQpID8gY29tcG9uZW50IDogaXNDb21wb25lbnQoY29tcG9uZW50KSA/IG5ldyBWbm9kZShjb21wb25lbnQsIHt9LCBbXSkgOiBuZXcgVm5vZGUoKCkgPT4gY29tcG9uZW50LCB7fSwgW10pO1xuICBpZiAobWFpbkNvbXBvbmVudCAmJiBtYWluQ29tcG9uZW50LnRhZyAhPT0gdm5vZGVDb21wb25lbnQudGFnKSB7XG4gICAgdW5tb3VudCgpO1xuICB9XG4gIG1haW5Db21wb25lbnQgPSB2bm9kZUNvbXBvbmVudDtcbiAgbWFpblZub2RlID0gZG9tVG9Wbm9kZShjb250YWluZXIpO1xuICByZXR1cm4gdXBkYXRlKCk7XG59XG52YXIgdiA9ICh0YWdPckNvbXBvbmVudCwgcHJvcHMgPSB7fSwgLi4uY2hpbGRyZW4pID0+IHtcbiAgcmV0dXJuIG5ldyBWbm9kZSh0YWdPckNvbXBvbmVudCwgcHJvcHMgfHwge30sIGNoaWxkcmVuKTtcbn07XG52LmZyYWdtZW50ID0gKHByb3BzLCAuLi5jaGlsZHJlbikgPT4gY2hpbGRyZW47XG5leHBvcnQge1xuICBWbm9kZSxcbiAgY3JlYXRlRG9tRWxlbWVudCxcbiAgY3VycmVudCxcbiAgZGlyZWN0aXZlLFxuICBkaXJlY3RpdmVzLFxuICBpc0NvbXBvbmVudCxcbiAgaXNOb2RlSnMsXG4gIGlzVm5vZGUsXG4gIGlzVm5vZGVDb21wb25lbnQsXG4gIG1vdW50LFxuICBvbkNsZWFudXAsXG4gIG9uTW91bnQsXG4gIG9uVW5tb3VudCxcbiAgb25VcGRhdGUsXG4gIHBhdGNoLFxuICByZXNlcnZlZFByb3BzLFxuICBzZXRBdHRyaWJ1dGUsXG4gIHRydXN0LFxuICB1bm1vdW50LFxuICB1cGRhdGUsXG4gIHVwZGF0ZUF0dHJpYnV0ZXMsXG4gIHZcbn07XG4iLCAiLyogZXNsaW50LWRpc2FibGUgbWF4LWxlbiAqL1xuaW1wb3J0IHsgdiB9IGZyb20gXCJ2YWx5cmlhbi5qc1wiO1xuXG5leHBvcnQgZnVuY3Rpb24gQnRjU1ZHKCkge1xuICByZXR1cm4gKFxuICAgIDxzdmdcbiAgICAgIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIlxuICAgICAgeG1sOnNwYWNlPVwicHJlc2VydmVcIlxuICAgICAgd2lkdGg9XCIxMDAlXCJcbiAgICAgIGhlaWdodD1cIjEwMCVcIlxuICAgICAgdmVyc2lvbj1cIjEuMVwiXG4gICAgICBzaGFwZS1yZW5kZXJpbmc9XCJnZW9tZXRyaWNQcmVjaXNpb25cIlxuICAgICAgdGV4dC1yZW5kZXJpbmc9XCJnZW9tZXRyaWNQcmVjaXNpb25cIlxuICAgICAgaW1hZ2UtcmVuZGVyaW5nPVwib3B0aW1pemVRdWFsaXR5XCJcbiAgICAgIGZpbGwtcnVsZT1cImV2ZW5vZGRcIlxuICAgICAgY2xpcC1ydWxlPVwiZXZlbm9kZFwiXG4gICAgICB2aWV3Qm94PVwiMCAwIDQwOTEuMjcgNDA5MS43M1wiXG4gICAgICB4bWxuczp4bGluaz1cImh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmtcIlxuICAgICAgeG1sbnM6eG9kbT1cImh0dHA6Ly93d3cuY29yZWwuY29tL2NvcmVsZHJhdy9vZG0vMjAwM1wiXG4gICAgPlxuICAgICAgPGcgaWQ9XCJMYXllcl94MDAyMF8xXCI+XG4gICAgICAgIDxtZXRhZGF0YSBpZD1cIkNvcmVsQ29ycElEXzBDb3JlbC1MYXllclwiIC8+XG4gICAgICAgIDxnIGlkPVwiXzE0MjEzNDQwMjMzMjhcIj5cbiAgICAgICAgICA8cGF0aFxuICAgICAgICAgICAgZmlsbD1cIiNGNzkzMUFcIlxuICAgICAgICAgICAgZmlsbC1ydWxlPVwibm9uemVyb1wiXG4gICAgICAgICAgICBkPVwiTTQwMzAuMDYgMjU0MC43N2MtMjczLjI0LDEwOTYuMDEgLTEzODMuMzIsMTc2My4wMiAtMjQ3OS40NiwxNDg5LjcxIC0xMDk1LjY4LC0yNzMuMjQgLTE3NjIuNjksLTEzODMuMzkgLTE0ODkuMzMsLTI0NzkuMzEgMjczLjEyLC0xMDk2LjEzIDEzODMuMiwtMTc2My4xOSAyNDc5LC0xNDg5Ljk1IDEwOTYuMDYsMjczLjI0IDE3NjMuMDMsMTM4My41MSAxNDg5Ljc2LDI0NzkuNTdsMC4wMiAtMC4wMnpcIlxuICAgICAgICAgIC8+XG4gICAgICAgICAgPHBhdGhcbiAgICAgICAgICAgIGZpbGw9XCJ3aGl0ZVwiXG4gICAgICAgICAgICBmaWxsLXJ1bGU9XCJub256ZXJvXCJcbiAgICAgICAgICAgIGQ9XCJNMjk0Ny43NyAxNzU0LjM4YzQwLjcyLC0yNzIuMjYgLTE2Ni41NiwtNDE4LjYxIC00NTAsLTUxNi4yNGw5MS45NSAtMzY4LjggLTIyNC41IC01NS45NCAtODkuNTEgMzU5LjA5Yy01OS4wMiwtMTQuNzIgLTExOS42MywtMjguNTkgLTE3OS44NywtNDIuMzRsOTAuMTYgLTM2MS40NiAtMjI0LjM2IC01NS45NCAtOTIgMzY4LjY4Yy00OC44NCwtMTEuMTIgLTk2LjgxLC0yMi4xMSAtMTQzLjM1LC0zMy42OWwwLjI2IC0xLjE2IC0zMDkuNTkgLTc3LjMxIC01OS43MiAyMzkuNzhjMCwwIDE2Ni41NiwzOC4xOCAxNjMuMDUsNDAuNTMgOTAuOTEsMjIuNjkgMTA3LjM1LDgyLjg3IDEwNC42MiwxMzAuNTdsLTEwNC43NCA0MjAuMTVjNi4yNiwxLjU5IDE0LjM4LDMuODkgMjMuMzQsNy40OSAtNy40OSwtMS44NiAtMTUuNDYsLTMuODkgLTIzLjczLC01Ljg3bC0xNDYuODEgNTg4LjU3Yy0xMS4xMSwyNy42MiAtMzkuMzEsNjkuMDcgLTEwMi44Nyw1My4zMyAyLjI1LDMuMjYgLTE2My4xNywtNDAuNzIgLTE2My4xNywtNDAuNzJsLTExMS40NiAyNTYuOTggMjkyLjE1IDcyLjgzYzU0LjM1LDEzLjYzIDEwNy42MSwyNy44OSAxNjAuMDYsNDEuM2wtOTIuOSAzNzMuMDMgMjI0LjI0IDU1Ljk0IDkyIC0zNjkuMDdjNjEuMjYsMTYuNjMgMTIwLjcxLDMxLjk3IDE3OC45MSw0Ni40M2wtOTEuNjkgMzY3LjMzIDIyNC41MSA1NS45NCA5Mi44OSAtMzcyLjMzYzM4Mi44Miw3Mi40NSA2NzAuNjcsNDMuMjQgNzkxLjgzLC0zMDMuMDIgOTcuNjMsLTI3OC43OCAtNC44NiwtNDM5LjU4IC0yMDYuMjYsLTU0NC40NCAxNDYuNjksLTMzLjgzIDI1Ny4xOCwtMTMwLjMxIDI4Ni42NCwtMzI5LjYxbC0wLjA3IC0wLjA1em0tNTEyLjkzIDcxOS4yNmMtNjkuMzgsMjc4Ljc4IC01MzguNzYsMTI4LjA4IC02OTAuOTQsOTAuMjlsMTIzLjI4IC00OTQuMmMxNTIuMTcsMzcuOTkgNjQwLjE3LDExMy4xNyA1NjcuNjcsNDAzLjkxem02OS40MyAtNzIzLjNjLTYzLjI5LDI1My41OCAtNDUzLjk2LDEyNC43NSAtNTgwLjY5LDkzLjE2bDExMS43NyAtNDQ4LjIxYzEyNi43MywzMS41OSA1MzQuODUsOTAuNTUgNDY4Ljk0LDM1NS4wNWwtMC4wMiAwelwiXG4gICAgICAgICAgLz5cbiAgICAgICAgPC9nPlxuICAgICAgPC9nPlxuICAgIDwvc3ZnPlxuICApO1xufVxuIiwgIi8qIGVzbGludC1kaXNhYmxlIG1heC1sZW4gKi9cbmltcG9ydCB7IHYgfSBmcm9tIFwidmFseXJpYW4uanNcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIERhc2hTVkcoKSB7XG4gIHJldHVybiAoXG4gICAgPHN2ZyB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgdmlld0JveD1cIjAgMCA1MTMuNCA0MTYuOFwiPlxuICAgICAgPGRlZnM+XG4gICAgICAgIDxzdHlsZT5cbiAgICAgICAgICB7YC5jbHMtMSB7XG4gICAgICAgIGZpbGw6ICMwMDhkZTQ7XG4gICAgICB9YH1cbiAgICAgICAgPC9zdHlsZT5cbiAgICAgIDwvZGVmcz5cbiAgICAgIDx0aXRsZT5kPC90aXRsZT5cbiAgICAgIDxnIGlkPVwiTGF5ZXJfMlwiIGRhdGEtbmFtZT1cIkxheWVyIDJcIj5cbiAgICAgICAgPGcgaWQ9XCJMYXllcl8xLTJcIiBkYXRhLW5hbWU9XCJMYXllciAxXCI+XG4gICAgICAgICAgPHBhdGhcbiAgICAgICAgICAgIGNsYXNzPVwiY2xzLTFcIlxuICAgICAgICAgICAgZD1cIk0zMzYuMjUsMEgxNDkuMzVsLTE1LjUsODYuNiwxNjguNy4yYzgzLjEsMCwxMDcuNiwzMC4yLDEwNi45LDgwLjItLjQsMjUuNi0xMS41LDY5LTE2LjMsODMuMS0xMi44LDM3LjUtMzkuMSw4MC4yLTEzNy43LDgwLjFsLTE2NC0uMUw3Niw0MTYuOGgxODYuNWM2NS44LDAsOTMuNy03LjcsMTIzLjQtMjEuMyw2NS43LTMwLjUsMTA0LjgtOTUuMywxMjAuNS0xNzkuOUM1MjkuNjUsODkuNiw1MDAuNjUsMCwzMzYuMjUsMFwiXG4gICAgICAgICAgLz5cbiAgICAgICAgICA8cGF0aFxuICAgICAgICAgICAgY2xhc3M9XCJjbHMtMVwiXG4gICAgICAgICAgICBkPVwiTTY4LjcsMTY0LjljLTQ5LDAtNTYsMzEuOS02MC42LDUxLjJDMiwyNDEuMywwLDI1MS42LDAsMjUxLjZIMTkxLjRjNDksMCw1Ni0zMS45LDYwLjYtNTEuMiw2LjEtMjUuMiw4LjEtMzUuNSw4LjEtMzUuNVpcIlxuICAgICAgICAgIC8+XG4gICAgICAgIDwvZz5cbiAgICAgIDwvZz5cbiAgICA8L3N2Zz5cbiAgKTtcbn1cbiIsICIvKiBlc2xpbnQtZGlzYWJsZSBtYXgtbGVuICovXG5pbXBvcnQgeyB2IH0gZnJvbSBcInZhbHlyaWFuLmpzXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBFdGNTVkcoKSB7XG4gIHJldHVybiAoXG4gICAgPHN2ZyB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgdmlld0JveD1cIjAgMCAxNTQzIDI0OTkuMlwiPlxuICAgICAgPGRlZnM+XG4gICAgICAgIDxzdHlsZT57YC5jbHMtMXtmaWxsOiMzYWI4M2E7fS5jbHMtMntmaWxsOiMwYjgzMTE7fS5jbHMtM3tmaWxsOiMxNDY3MTQ7fWB9PC9zdHlsZT5cbiAgICAgIDwvZGVmcz5cbiAgICAgIDx0aXRsZT5lPC90aXRsZT5cbiAgICAgIDxnIGlkPVwiTGF5ZXJfMlwiIGRhdGEtbmFtZT1cIkxheWVyIDJcIj5cbiAgICAgICAgPGcgaWQ9XCJzdmc4XCI+XG4gICAgICAgICAgPGcgaWQ9XCJsYXllcjVcIj5cbiAgICAgICAgICAgIDxnIGlkPVwiZzE2MjdcIj5cbiAgICAgICAgICAgICAgPHBhdGhcbiAgICAgICAgICAgICAgICBpZD1cInBhdGgxNTk5XCJcbiAgICAgICAgICAgICAgICBjbGFzcz1cImNscy0xXCJcbiAgICAgICAgICAgICAgICBkPVwiTTAsMTM2MS4wNWMyNzEuODcsMTQ0LjM4LDU1NS41NiwyOTUuNTEsNzc0LjY3LDQxMi40NUwxNTQzLDEzNjEuMDVjLTI3OC4yLDQxMy4yOS01MTAsNzU3LjM2LTc2OC4zMywxMTM4LjE1QzUxNS44OCwyMTE5LjI1LDIzMC4wOCwxNzAwLDAsMTM2MS4wNVptMjkuNTUtMTE0TDc3NS41MSw4NDlsNzM2LjI1LDM5NS4xNEw3NzUuOTMsMTY0Mi42M1pNNzc0LjY3LDcyMS40NywwLDExMjkuMjgsNzcxLjI5LDAsMTU0MywxMTMxLjgxLDc3NC42Nyw3MjEuNDdaXCJcbiAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgPHBhdGhcbiAgICAgICAgICAgICAgICBpZD1cInBhdGgxNTkzXCJcbiAgICAgICAgICAgICAgICBjbGFzcz1cImNscy0yXCJcbiAgICAgICAgICAgICAgICBkPVwiTTc3NC42NywxNzczLjUsMTU0MywxMzYxLjA1QzEyNjQuOCwxNzc0LjM0LDc3NC42NywyNDk5LjIsNzc0LjY3LDI0OTkuMlpNNzc1LjUxLDg0OWw3MzYuMjUsMzk1LjE0TDc3NS45MywxNjQyLjYzLDc3NS41MSw4NDlabS0uODQtMTI3LjVMNzcxLjI5LDAsMTU0MywxMTMxLjgxWlwiXG4gICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgIDxwYXRoIGlkPVwicGF0aDE2MDNcIiBjbGFzcz1cImNscy0yXCIgZD1cIk0yOS41NSwxMjQ3LjA2bDc0Niw2MS4yMiw3MzYuMjUtNjMuNzVMNzc1LjkzLDE2NDMuMDVaXCIgLz5cbiAgICAgICAgICAgICAgPHBhdGggaWQ9XCJwYXRoMTYwNlwiIGNsYXNzPVwiY2xzLTNcIiBkPVwiTTc3NS41MSwxMzA4LjI4bDczNi4yNS02My43NUw3NzUuOTMsMTY0My4wNWwtLjQyLTMzNC43N1pcIiAvPlxuICAgICAgICAgICAgPC9nPlxuICAgICAgICAgIDwvZz5cbiAgICAgICAgPC9nPlxuICAgICAgPC9nPlxuICAgIDwvc3ZnPlxuICApO1xufVxuIiwgIi8qIGVzbGludC1kaXNhYmxlIG1heC1sZW4gKi9cbmltcG9ydCB7IHYgfSBmcm9tIFwidmFseXJpYW4uanNcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIEx0Y1NWRygpIHtcbiAgcmV0dXJuIChcbiAgICA8c3ZnIGlkPVwiTGF5ZXJfMVwiIGRhdGEtbmFtZT1cIkxheWVyIDFcIiB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgdmlld0JveD1cIjAgMCA4Mi42IDgyLjZcIj5cbiAgICAgIDx0aXRsZT5saXRlY29pbi1sdGMtbG9nbzwvdGl0bGU+XG4gICAgICA8Y2lyY2xlIGN4PVwiNDEuM1wiIGN5PVwiNDEuM1wiIHI9XCIzNi44M1wiIHN0eWxlPVwiZmlsbDojZmZmXCIgLz5cbiAgICAgIDxwYXRoXG4gICAgICAgIGQ9XCJNNDEuMywwQTQxLjMsNDEuMywwLDEsMCw4Mi42LDQxLjNoMEE0MS4xOCw0MS4xOCwwLDAsMCw0MS41NCwwWk00Miw0Mi43LDM3LjcsNTcuMmgyM2ExLjE2LDEuMTYsMCwwLDEsMS4yLDEuMTJ2LjM4bC0yLDYuOWExLjQ5LDEuNDksMCwwLDEtMS41LDEuMUgyMy4ybDUuOS0yMC4xLTYuNiwyTDI0LDQ0bDYuNi0yLDguMy0yOC4yYTEuNTEsMS41MSwwLDAsMSwxLjUtMS4xaDguOWExLjE2LDEuMTYsMCwwLDEsMS4yLDEuMTJ2LjM4TDQzLjUsMzhsNi42LTItMS40LDQuOFpcIlxuICAgICAgICBzdHlsZT1cImZpbGw6IzM0NWQ5ZFwiXG4gICAgICAvPlxuICAgIDwvc3ZnPlxuICApO1xufVxuIiwgIi8qIGVzbGludC1kaXNhYmxlIG1heC1sZW4gKi9cbmltcG9ydCB7IHYgfSBmcm9tIFwidmFseXJpYW4uanNcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIFhtclNWRygpIHtcbiAgcmV0dXJuIChcbiAgICA8c3ZnIGlkPVwiTGF5ZXJfMVwiIGRhdGEtbmFtZT1cIkxheWVyIDFcIiB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgdmlld0JveD1cIjAgMCAzNzU2LjA5IDM3NTYuNDlcIj5cbiAgICAgIDx0aXRsZT5tb25lcm88L3RpdGxlPlxuICAgICAgPHBhdGhcbiAgICAgICAgZD1cIk00MTI4LDIyNDkuODFDNDEyOCwzMjg3LDMyODcuMjYsNDEyNy44NiwyMjUwLDQxMjcuODZTMzcyLDMyODcsMzcyLDIyNDkuODEsMTIxMi43NiwzNzEuNzUsMjI1MCwzNzEuNzUsNDEyOCwxMjEyLjU0LDQxMjgsMjI0OS44MVpcIlxuICAgICAgICB0cmFuc2Zvcm09XCJ0cmFuc2xhdGUoLTM3MS45NiAtMzcxLjc1KVwiXG4gICAgICAgIHN0eWxlPVwiZmlsbDojZmZmXCJcbiAgICAgIC8+XG4gICAgICA8cGF0aFxuICAgICAgICBpZD1cIl8xNDk5MzEwMzJcIlxuICAgICAgICBkYXRhLW5hbWU9XCIgMTQ5OTMxMDMyXCJcbiAgICAgICAgZD1cIk0yMjUwLDM3MS43NWMtMTAzNi44OSwwLTE4NzkuMTIsODQyLjA2LTE4NzcuOCwxODc4LDAuMjYsMjA3LjI2LDMzLjMxLDQwNi42Myw5NS4zNCw1OTMuMTJoNTYxLjg4VjEyNjNMMjI1MCwyNDgzLjU3LDM0NzAuNTIsMTI2M3YxNTc5LjloNTYyYzYyLjEyLTE4Ni40OCw5NS0zODUuODUsOTUuMzctNTkzLjEyQzQxMjkuNjYsMTIxMi43NiwzMjg3LDM3MiwyMjUwLDM3MlpcIlxuICAgICAgICB0cmFuc2Zvcm09XCJ0cmFuc2xhdGUoLTM3MS45NiAtMzcxLjc1KVwiXG4gICAgICAgIHN0eWxlPVwiZmlsbDojZjI2ODIyXCJcbiAgICAgIC8+XG4gICAgICA8cGF0aFxuICAgICAgICBpZD1cIl8xNDk5MzExNjBcIlxuICAgICAgICBkYXRhLW5hbWU9XCIgMTQ5OTMxMTYwXCJcbiAgICAgICAgZD1cIk0xOTY5LjMsMjc2NC4xN2wtNTMyLjY3LTUzMi43djk5NC4xNEgxMDI5LjM4bC0zODQuMjkuMDdjMzI5LjYzLDU0MC44LDkyNS4zNSw5MDIuNTYsMTYwNC45MSw5MDIuNTZTMzUyNS4zMSwzNzY2LjQsMzg1NSwzMjI1LjZIMzA2My4yNVYyMjMxLjQ3bC01MzIuNyw1MzIuNy0yODAuNjEsMjgwLjYxLTI4MC42Mi0yODAuNjFoMFpcIlxuICAgICAgICB0cmFuc2Zvcm09XCJ0cmFuc2xhdGUoLTM3MS45NiAtMzcxLjc1KVwiXG4gICAgICAgIHN0eWxlPVwiZmlsbDojNGQ0ZDRkXCJcbiAgICAgIC8+XG4gICAgPC9zdmc+XG4gICk7XG59XG4iLCAiLyogZXNsaW50LWRpc2FibGUgbWF4LWxlbiAqL1xuaW1wb3J0IHsgdiB9IGZyb20gXCJ2YWx5cmlhbi5qc1wiO1xuXG5leHBvcnQgZnVuY3Rpb24gWmVjU1ZHKCkge1xuICByZXR1cm4gKFxuICAgIDxzdmcgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHhtbG5zOnhsaW5rPVwiaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGlua1wiIHZpZXdCb3g9XCIwIDAgMjUwMCAyNTAwXCI+XG4gICAgICA8ZGVmcz5cbiAgICAgICAgPHN0eWxlPntgLmNscy0xe2ZpbGw6dXJsKCNsaW5lYXItZ3JhZGllbnQpO31gfTwvc3R5bGU+XG4gICAgICAgIDxsaW5lYXJHcmFkaWVudFxuICAgICAgICAgIGlkPVwibGluZWFyLWdyYWRpZW50XCJcbiAgICAgICAgICB4MT1cIjc4Mi44NFwiXG4gICAgICAgICAgeTE9XCIxNjUuOTFcIlxuICAgICAgICAgIHgyPVwiNzk5LjM0XCJcbiAgICAgICAgICB5Mj1cIjE2NS45MVwiXG4gICAgICAgICAgZ3JhZGllbnRUcmFuc2Zvcm09XCJ0cmFuc2xhdGUoLTgxNTY4LjIgNTUzNzIuMDUpIHJvdGF0ZSgtNDUpIHNjYWxlKDEyMi40MSlcIlxuICAgICAgICAgIGdyYWRpZW50VW5pdHM9XCJ1c2VyU3BhY2VPblVzZVwiXG4gICAgICAgID5cbiAgICAgICAgICA8c3RvcCBvZmZzZXQ9XCIwXCIgc3RvcC1jb2xvcj1cIiNjZjg3MjRcIiAvPlxuICAgICAgICAgIDxzdG9wIG9mZnNldD1cIjFcIiBzdG9wLWNvbG9yPVwiI2ZkY2U1OFwiIC8+XG4gICAgICAgIDwvbGluZWFyR3JhZGllbnQ+XG4gICAgICA8L2RlZnM+XG4gICAgICA8dGl0bGU+ejwvdGl0bGU+XG4gICAgICA8ZyBpZD1cIkxheWVyXzJcIiBkYXRhLW5hbWU9XCJMYXllciAyXCI+XG4gICAgICAgIDxnIGlkPVwiTGF5ZXJfMS0yXCIgZGF0YS1uYW1lPVwiTGF5ZXIgMVwiPlxuICAgICAgICAgIDxwYXRoXG4gICAgICAgICAgICBjbGFzcz1cImNscy0xXCJcbiAgICAgICAgICAgIGQ9XCJNMTI2My4wNSwyMjk3LjYxYy01NjkuNiwwLTEwMzQuNTctNDY1LjQzLTEwMzQuNTctMTAzNC41NiwwLTU2OS42LDQ2NS40NC0xMDM0LjU3LDEwMzQuNTctMTAzNC41Nyw1NjkuNiwwLDEwMzQuNTYsNDY1LjQ0LDEwMzQuNTYsMTAzNC41N0MyMjk3LjYxLDE4MzIuNjUsMTgzMi42NSwyMjk3LjYxLDEyNjMuMDUsMjI5Ny42MVpcIlxuICAgICAgICAgIC8+XG4gICAgICAgICAgPHBhdGggZD1cIk0xMjUwLDI1MDBDNTYyLjUsMjUwMCwwLDE5MzcuNSwwLDEyNTBTNTYyLjUsMCwxMjUwLDAsMjUwMCw1NjIuNSwyNTAwLDEyNTAsMTkzNy41LDI1MDAsMTI1MCwyNTAwWm0wLTIyMjIuMDZjLTUzNC41NiwwLTk3Mi4wNiw0MzcuNS05NzIuMDYsOTcyLjA2czQzNy41LDk3Mi4wNiw5NzIuMDYsOTcyLjA2LDk3Mi4wNi00MzcuNSw5NzIuMDYtOTcyLjA2UzE3ODQuNTYsMjc3Ljk0LDEyNTAsMjc3Ljk0WlwiIC8+XG4gICAgICAgICAgPHBhdGggZD1cIk0xMjIxLjA1LDE1ODguNTloNTQxLjY3djI3MC44NGgtMzE5LjZ2MjI5LjE2SDExNjUuMThWMTg2Ni41M0g4MzEuODVjMC05MC40NC0xMy43My0xODAuNCw3LjEtMjYzLjczLDcuMS00MS42Nyw1NS40LTgzLjM0LDkwLjQzLTEyNSwxMDQuMTctMTI1LDIwOC4zNC0yNTAsMzE5LjYxLTM3NSw0MS42Ni00OC43Nyw4My4zMy05MC40NCwxMzIuMS0xNDUuODNIODYwLjI2VjY4Ni4xM2gzMDUuMzlWNDU3aDI3MC44NFY2NzloMzMzLjMzYzAsOTAuNDMsMTMuNzMsMTgwLjQtNy4xLDI2My43My03LjEsNDEuNjctNTUuNCw4My4zMy05MC40NCwxMjUtMTA0LjE2LDEyNS0yMDguMzMsMjUwLTMxOS42LDM3NUMxMzExLDE0OTEuNTMsMTI2OS4zNSwxNTM5LjgyLDEyMjEuMDUsMTU4OC41OVpcIiAvPlxuICAgICAgICA8L2c+XG4gICAgICA8L2c+XG4gICAgPC9zdmc+XG4gICk7XG59XG4iLCAiLy8gbGliL3JlcXVlc3QvaW5kZXgudHNcbmltcG9ydCB7IGlzTm9kZUpzIH0gZnJvbSBcInZhbHlyaWFuLmpzXCI7XG5mdW5jdGlvbiBzZXJpYWxpemUob2JqLCBwcmVmaXggPSBcIlwiKSB7XG4gIHJldHVybiBPYmplY3Qua2V5cyhvYmopLm1hcCgocHJvcCkgPT4ge1xuICAgIGxldCBrID0gcHJlZml4ID8gYCR7cHJlZml4fVske3Byb3B9XWAgOiBwcm9wO1xuICAgIHJldHVybiB0eXBlb2Ygb2JqW3Byb3BdID09PSBcIm9iamVjdFwiID8gc2VyaWFsaXplKG9ialtwcm9wXSwgaykgOiBgJHtlbmNvZGVVUklDb21wb25lbnQoayl9PSR7ZW5jb2RlVVJJQ29tcG9uZW50KG9ialtwcm9wXSl9YDtcbiAgfSkuam9pbihcIiZcIik7XG59XG5mdW5jdGlvbiBwYXJzZVVybCh1cmwsIG9wdGlvbnMpIHtcbiAgbGV0IHUgPSAvXmh0dHBzPy9naS50ZXN0KHVybCkgPyB1cmwgOiBvcHRpb25zLnVybHMuYmFzZSArIHVybDtcbiAgbGV0IHBhcnRzID0gdS5zcGxpdChcIj9cIik7XG4gIHUgPSBwYXJ0c1swXS50cmltKCkucmVwbGFjZSgvXlxcL1xcLy8sIFwiL1wiKS5yZXBsYWNlKC9cXC8kLywgXCJcIikudHJpbSgpO1xuICBpZiAocGFydHNbMV0pIHtcbiAgICB1ICs9IGA/JHtwYXJ0c1sxXX1gO1xuICB9XG4gIGlmIChpc05vZGVKcyAmJiB0eXBlb2Ygb3B0aW9ucy51cmxzLm5vZGUgPT09IFwic3RyaW5nXCIpIHtcbiAgICBvcHRpb25zLnVybHMubm9kZSA9IG9wdGlvbnMudXJscy5ub2RlO1xuICAgIGlmICh0eXBlb2Ygb3B0aW9ucy51cmxzLmFwaSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgb3B0aW9ucy51cmxzLmFwaSA9IG9wdGlvbnMudXJscy5hcGkucmVwbGFjZSgvXFwvJC9naSwgXCJcIikudHJpbSgpO1xuICAgICAgdSA9IHUucmVwbGFjZShvcHRpb25zLnVybHMuYXBpLCBvcHRpb25zLnVybHMubm9kZSk7XG4gICAgfVxuICAgIGlmICghL15odHRwcz8vZ2kudGVzdCh1KSkge1xuICAgICAgdSA9IG9wdGlvbnMudXJscy5ub2RlICsgdTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHU7XG59XG52YXIgZGVmYXVsdE9wdGlvbnMgPSB7IGFsbG93ZWRNZXRob2RzOiBbXCJnZXRcIiwgXCJwb3N0XCIsIFwicHV0XCIsIFwicGF0Y2hcIiwgXCJkZWxldGVcIl0gfTtcbmZ1bmN0aW9uIFJlcXVlc3RlcihiYXNlVXJsID0gXCJcIiwgb3B0aW9ucyA9IGRlZmF1bHRPcHRpb25zKSB7XG4gIGxldCB1cmwgPSBiYXNlVXJsLnJlcGxhY2UoL1xcLyQvZ2ksIFwiXCIpLnRyaW0oKTtcbiAgaWYgKCFvcHRpb25zLnVybHMpIHtcbiAgICBvcHRpb25zLnVybHMgPSB7XG4gICAgICBiYXNlOiBcIlwiLFxuICAgICAgbm9kZTogbnVsbCxcbiAgICAgIGFwaTogbnVsbFxuICAgIH07XG4gIH1cbiAgaWYgKCFvcHRpb25zLmFsbG93ZWRNZXRob2RzKSB7XG4gICAgb3B0aW9ucy5hbGxvd2VkTWV0aG9kcyA9IGRlZmF1bHRPcHRpb25zLmFsbG93ZWRNZXRob2RzO1xuICB9XG4gIGxldCBvcHRzID0ge1xuICAgIC4uLm9wdGlvbnMsXG4gICAgdXJsczoge1xuICAgICAgbm9kZTogb3B0aW9ucy51cmxzLm5vZGUgfHwgbnVsbCxcbiAgICAgIGFwaTogb3B0aW9ucy51cmxzLmFwaSB8fCBudWxsLFxuICAgICAgYmFzZTogb3B0aW9ucy51cmxzLmJhc2UgPyBvcHRpb25zLnVybHMuYmFzZSArIHVybCA6IHVybFxuICAgIH1cbiAgfTtcbiAgY29uc3QgcmVxdWVzdDIgPSBhc3luYyBmdW5jdGlvbiByZXF1ZXN0MyhtZXRob2QsIHVybDIsIGRhdGEsIG9wdGlvbnMyID0ge30pIHtcbiAgICBsZXQgaW5uZXJPcHRpb25zID0ge1xuICAgICAgbWV0aG9kOiBtZXRob2QudG9VcHBlckNhc2UoKSxcbiAgICAgIGhlYWRlcnM6IHt9LFxuICAgICAgcmVzb2x2ZVdpdGhGdWxsUmVzcG9uc2U6IGZhbHNlLFxuICAgICAgLi4ub3B0cyxcbiAgICAgIC4uLm9wdGlvbnMyXG4gICAgfTtcbiAgICBpZiAoIWlubmVyT3B0aW9ucy5oZWFkZXJzLkFjY2VwdCkge1xuICAgICAgaW5uZXJPcHRpb25zLmhlYWRlcnMuQWNjZXB0ID0gXCJhcHBsaWNhdGlvbi9qc29uXCI7XG4gICAgfVxuICAgIGxldCBhY2NlcHRUeXBlID0gaW5uZXJPcHRpb25zLmhlYWRlcnMuQWNjZXB0O1xuICAgIGxldCBjb250ZW50VHlwZSA9IGlubmVyT3B0aW9ucy5oZWFkZXJzW1wiQ29udGVudC1UeXBlXCJdIHx8IGlubmVyT3B0aW9ucy5oZWFkZXJzW1wiY29udGVudC10eXBlXCJdIHx8IFwiXCI7XG4gICAgaWYgKGlubmVyT3B0aW9ucy5hbGxvd2VkTWV0aG9kcy5pbmRleE9mKG1ldGhvZCkgPT09IC0xKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJNZXRob2Qgbm90IGFsbG93ZWRcIik7XG4gICAgfVxuICAgIGlmIChkYXRhKSB7XG4gICAgICBpZiAoaW5uZXJPcHRpb25zLm1ldGhvZCA9PT0gXCJHRVRcIiAmJiB0eXBlb2YgZGF0YSA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICB1cmwyICs9IGA/JHtzZXJpYWxpemUoZGF0YSl9YDtcbiAgICAgIH1cbiAgICAgIGlmIChpbm5lck9wdGlvbnMubWV0aG9kICE9PSBcIkdFVFwiKSB7XG4gICAgICAgIGlmICgvanNvbi9naS50ZXN0KGNvbnRlbnRUeXBlKSkge1xuICAgICAgICAgIGlubmVyT3B0aW9ucy5ib2R5ID0gSlNPTi5zdHJpbmdpZnkoZGF0YSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbGV0IGZvcm1EYXRhO1xuICAgICAgICAgIGlmIChkYXRhIGluc3RhbmNlb2YgRm9ybURhdGEpIHtcbiAgICAgICAgICAgIGZvcm1EYXRhID0gZGF0YTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZm9ybURhdGEgPSBuZXcgRm9ybURhdGEoKTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgaW4gZGF0YSkge1xuICAgICAgICAgICAgICBmb3JtRGF0YS5hcHBlbmQoaSwgZGF0YVtpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlubmVyT3B0aW9ucy5ib2R5ID0gZm9ybURhdGE7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgbGV0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2gocGFyc2VVcmwodXJsMiwgb3B0cyksIGlubmVyT3B0aW9ucyk7XG4gICAgbGV0IGJvZHkgPSBudWxsO1xuICAgIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICAgIGxldCBlcnIgPSBuZXcgRXJyb3IocmVzcG9uc2Uuc3RhdHVzVGV4dCk7XG4gICAgICBlcnIucmVzcG9uc2UgPSByZXNwb25zZTtcbiAgICAgIGlmICgvdGV4dC9naS50ZXN0KGFjY2VwdFR5cGUpKSB7XG4gICAgICAgIGVyci5ib2R5ID0gYXdhaXQgcmVzcG9uc2UudGV4dCgpO1xuICAgICAgfVxuICAgICAgaWYgKC9qc29uL2dpLnRlc3QoYWNjZXB0VHlwZSkpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBlcnIuYm9keSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdGhyb3cgZXJyO1xuICAgIH1cbiAgICBpZiAoaW5uZXJPcHRpb25zLnJlc29sdmVXaXRoRnVsbFJlc3BvbnNlKSB7XG4gICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgfVxuICAgIGlmICgvdGV4dC9naS50ZXN0KGFjY2VwdFR5cGUpKSB7XG4gICAgICBib2R5ID0gYXdhaXQgcmVzcG9uc2UudGV4dCgpO1xuICAgICAgcmV0dXJuIGJvZHk7XG4gICAgfVxuICAgIGlmICgvanNvbi9naS50ZXN0KGFjY2VwdFR5cGUpKSB7XG4gICAgICB0cnkge1xuICAgICAgICBib2R5ID0gYXdhaXQgcmVzcG9uc2UuanNvbigpO1xuICAgICAgICByZXR1cm4gYm9keTtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXNwb25zZTtcbiAgfTtcbiAgcmVxdWVzdDIubmV3ID0gKGJhc2VVcmwyLCBvcHRpb25zMikgPT4gUmVxdWVzdGVyKGJhc2VVcmwyLCB7IC4uLm9wdHMsIC4uLm9wdGlvbnMyIH0pO1xuICByZXF1ZXN0Mi5zZXRPcHRpb24gPSAoa2V5LCB2YWx1ZSkgPT4ge1xuICAgIGxldCByZXN1bHQgPSBvcHRzO1xuICAgIGxldCBwYXJzZWQgPSBrZXkuc3BsaXQoXCIuXCIpO1xuICAgIGxldCBuZXh0O1xuICAgIHdoaWxlIChwYXJzZWQubGVuZ3RoKSB7XG4gICAgICBuZXh0ID0gcGFyc2VkLnNoaWZ0KCk7XG4gICAgICBsZXQgbmV4dElzQXJyYXkgPSBuZXh0LmluZGV4T2YoXCJbXCIpID4gLTE7XG4gICAgICBpZiAobmV4dElzQXJyYXkpIHtcbiAgICAgICAgbGV0IGlkeCA9IG5leHQucmVwbGFjZSgvXFxEL2dpLCBcIlwiKTtcbiAgICAgICAgbmV4dCA9IG5leHQuc3BsaXQoXCJbXCIpWzBdO1xuICAgICAgICBwYXJzZWQudW5zaGlmdChpZHgpO1xuICAgICAgfVxuICAgICAgaWYgKHBhcnNlZC5sZW5ndGggPiAwICYmIHR5cGVvZiByZXN1bHRbbmV4dF0gIT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgcmVzdWx0W25leHRdID0gbmV4dElzQXJyYXkgPyBbXSA6IHt9O1xuICAgICAgfVxuICAgICAgaWYgKHBhcnNlZC5sZW5ndGggPT09IDAgJiYgdHlwZW9mIHZhbHVlICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIHJlc3VsdFtuZXh0XSA9IHZhbHVlO1xuICAgICAgfVxuICAgICAgcmVzdWx0ID0gcmVzdWx0W25leHRdO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuICByZXF1ZXN0Mi5nZXRPcHRpb25zID0gKGtleSkgPT4ge1xuICAgIGlmICgha2V5KSB7XG4gICAgICByZXR1cm4gb3B0cztcbiAgICB9XG4gICAgbGV0IHJlc3VsdCA9IG9wdHM7XG4gICAgbGV0IHBhcnNlZCA9IGtleS5zcGxpdChcIi5cIik7XG4gICAgbGV0IG5leHQ7XG4gICAgd2hpbGUgKHBhcnNlZC5sZW5ndGgpIHtcbiAgICAgIG5leHQgPSBwYXJzZWQuc2hpZnQoKTtcbiAgICAgIGxldCBuZXh0SXNBcnJheSA9IG5leHQuaW5kZXhPZihcIltcIikgPiAtMTtcbiAgICAgIGlmIChuZXh0SXNBcnJheSkge1xuICAgICAgICBsZXQgaWR4ID0gbmV4dC5yZXBsYWNlKC9cXEQvZ2ksIFwiXCIpO1xuICAgICAgICBuZXh0ID0gbmV4dC5zcGxpdChcIltcIilbMF07XG4gICAgICAgIHBhcnNlZC51bnNoaWZ0KGlkeCk7XG4gICAgICB9XG4gICAgICBpZiAocGFyc2VkLmxlbmd0aCA+IDAgJiYgdHlwZW9mIHJlc3VsdFtuZXh0XSAhPT0gXCJvYmplY3RcIikge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICAgIGlmIChwYXJzZWQubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiByZXN1bHRbbmV4dF07XG4gICAgICB9XG4gICAgICByZXN1bHQgPSByZXN1bHRbbmV4dF07XG4gICAgfVxuICB9O1xuICBvcHRzLmFsbG93ZWRNZXRob2RzLmZvckVhY2goXG4gICAgKG1ldGhvZCkgPT4gcmVxdWVzdDJbbWV0aG9kXSA9ICh1cmwyLCBkYXRhLCBvcHRpb25zMikgPT4gcmVxdWVzdDIobWV0aG9kLCB1cmwyLCBkYXRhLCBvcHRpb25zMilcbiAgKTtcbiAgcmV0dXJuIHJlcXVlc3QyO1xufVxudmFyIHJlcXVlc3QgPSBSZXF1ZXN0ZXIoKTtcbmV4cG9ydCB7XG4gIHJlcXVlc3Rcbn07XG4iLCAiLyogZXNsaW50LWRpc2FibGUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueSAqL1xuY29uc3QgS2V5ID0gXCJoYXNoLXBvd2VyLWluY29tZS1jYWxjdWxhdG9yXCI7XG5leHBvcnQgY2xhc3MgU3RvcmFnZVNlcnZpY2Uge1xuICBkYjogU3RvcmFnZTtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5kYiA9IHdpbmRvdy5sb2NhbFN0b3JhZ2UgfHwgd2luZG93LnNlc3Npb25TdG9yYWdlO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXREYigpOiBSZWNvcmQ8c3RyaW5nIHwgbnVtYmVyIHwgc3ltYm9sLCBhbnk+IHtcbiAgICBsZXQgb2JqO1xuXG4gICAgdHJ5IHtcbiAgICAgIG9iaiA9IEpTT04ucGFyc2UodGhpcy5kYi5nZXRJdGVtKEtleSkgfHwgXCJ7fVwiKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBvYmogPSB7fTtcbiAgICB9XG4gICAgcmV0dXJuIG9iajtcbiAgfVxuXG4gIGdldChrZXk6IHN0cmluZywgZmFsbGJhY2sgPSBudWxsKTogYW55IHwgbnVsbCB7XG4gICAgbGV0IHJlc3VsdCA9IHRoaXMuZ2V0RGIoKTtcblxuICAgIGxldCBwYXJzZWQgPSBrZXkuc3BsaXQoXCIuXCIpO1xuICAgIGxldCBuZXh0O1xuXG4gICAgd2hpbGUgKHBhcnNlZC5sZW5ndGgpIHtcbiAgICAgIG5leHQgPSBwYXJzZWQuc2hpZnQoKTtcbiAgICAgIGlmIChuZXh0IGluIHJlc3VsdCA9PT0gZmFsc2UgfHwgKHBhcnNlZC5sZW5ndGggPiAwICYmIHR5cGVvZiByZXN1bHRbbmV4dF0gIT09IFwib2JqZWN0XCIpKSB7XG4gICAgICAgIHJldHVybiBmYWxsYmFjaztcbiAgICAgIH1cblxuICAgICAgcmVzdWx0ID0gcmVzdWx0W25leHRdO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQgPT09IG51bGwgfHwgdHlwZW9mIHJlc3VsdCA9PT0gXCJ1bmRlZmluZWRcIiA/IGZhbGxiYWNrIDogcmVzdWx0O1xuICB9XG5cbiAgc2V0KGtleTogc3RyaW5nLCB2YWx1ZTogYW55KSB7XG4gICAgbGV0IHJlc3VsdCA9IHRoaXMuZ2V0RGIoKTtcbiAgICBsZXQgZmluYWxSZXN1bHQgPSByZXN1bHQ7XG5cbiAgICBsZXQgcGFyc2VkID0ga2V5LnNwbGl0KFwiLlwiKTtcbiAgICBsZXQgbmV4dDogc3RyaW5nIHwgbnVtYmVyO1xuXG4gICAgd2hpbGUgKHBhcnNlZC5sZW5ndGgpIHtcbiAgICAgIG5leHQgPSBwYXJzZWQuc2hpZnQoKTtcbiAgICAgIGlmIChuZXh0IGluIHJlc3VsdCA9PT0gZmFsc2UgfHwgKHBhcnNlZC5sZW5ndGggPiAwICYmIHR5cGVvZiByZXN1bHRbbmV4dF0gIT09IFwib2JqZWN0XCIpKSB7XG4gICAgICAgIHJlc3VsdFtuZXh0XSA9IHt9O1xuICAgICAgfVxuXG4gICAgICBpZiAocGFyc2VkLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBpZiAodmFsdWUgPT09IG51bGwpIHtcbiAgICAgICAgICBkZWxldGUgcmVzdWx0W25leHRdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlc3VsdFtuZXh0XSA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJlc3VsdCA9IHJlc3VsdFtuZXh0XTtcbiAgICB9XG5cbiAgICB0aGlzLmRiLnNldEl0ZW0oS2V5LCBKU09OLnN0cmluZ2lmeShmaW5hbFJlc3VsdCkpO1xuICB9XG59XG5cbmV4cG9ydCBjb25zdCBzdG9yYWdlU2VydmljZSA9IG5ldyBTdG9yYWdlU2VydmljZSgpO1xuIiwgImltcG9ydCB7IEJ0Y1NWRyB9IGZyb20gXCIuL2J0Yy5zdmdcIjtcbmltcG9ydCB7IERhc2hTVkcgfSBmcm9tIFwiLi9kYXNoLnN2Z1wiO1xuaW1wb3J0IHsgRXRjU1ZHIH0gZnJvbSBcIi4vZXRjLnN2Z1wiO1xuaW1wb3J0IHsgRXRoU1ZHIH0gZnJvbSBcIi4vZXRoLnN2Z1wiO1xuaW1wb3J0IHsgTHRjU1ZHIH0gZnJvbSBcIi4vbHRjLnN2Z1wiO1xuaW1wb3J0IHsgWG1yU1ZHIH0gZnJvbSBcIi4veG1yLnN2Z1wiO1xuaW1wb3J0IHsgWmVjU1ZHIH0gZnJvbSBcIi4vemVjLnN2Z1wiO1xuLy8gV2Ugd2lsbCBjcmVhdGUgYSBoYXNoIHBvd2VyIGNhbGN1bGF0b3IgZm9yIGNyeXB0b2N1cnJlbmNpZXMgYW5kIG1pbmluZyBoYXJkd2FyZC5cbi8vIFdlIHdpbGwgdXNlIHRoZSBjb2luZ2Vja28tYXBpIGFuZCBtaW5lcnN0YXRzLWFwaS5cbmltcG9ydCB7IHJlcXVlc3QgfSBmcm9tIFwidmFseXJpYW4uanMvcmVxdWVzdFwiO1xuaW1wb3J0IHsgc3RvcmFnZVNlcnZpY2UgfSBmcm9tIFwiLi4vY29tbW9uL3N0b3JhZ2Utc2VydmljZVwiO1xuXG5jb25zdCBDb2luR2Vja29SZXF1ZXN0ID0gcmVxdWVzdC5uZXcoXCJodHRwczovL2FwaS5jb2luZ2Vja28uY29tL2FwaS92M1wiLCB7XG4gIGFsbG93ZWRNZXRob2RzOiBbXCJnZXRcIl1cbn0pO1xuXG5jb25zdCBNaW5lcnN0YXRSZXF1ZXN0ID0gcmVxdWVzdC5uZXcoXCJodHRwczovL2FwaS5taW5lcnN0YXQuY29tL3YyL2NvaW5zXCIsIHtcbiAgYWxsb3dlZE1ldGhvZHM6IFtcImdldFwiXVxufSk7XG5cbmNvbnN0IFRoaXJ0eU1pbnV0ZXNJbk1pbGxpU2Vjb25kcyA9IDEwMDAgKiA2MCAqIDMwO1xuXG5jb25zdCBEZWZhdWx0Q2FjaGVUaW1lID0gVGhpcnR5TWludXRlc0luTWlsbGlTZWNvbmRzO1xuXG5leHBvcnQgZW51bSBBbGdvcml0aG1zRW51bSB7XG4gIFwiU0hBLTI1NlwiID0gXCJTSEEtMjU2XCIsXG4gIFwiU2NyeXB0XCIgPSBcIlNjcnlwdFwiLFxuICBcIkV0aGFzaFwiID0gXCJFdGhhc2hcIixcbiAgXCJFdGNoYXNoXCIgPSBcIkV0Y2hhc2hcIixcbiAgXCJFcXVpaGFzaFwiID0gXCJFcXVpaGFzaFwiLFxuICBcIlJhbmRvbVhcIiA9IFwiUmFuZG9tWFwiLFxuICBcIlgxMVwiID0gXCJYMTFcIlxufVxuXG5leHBvcnQgZW51bSBDb2luU3ltYm9sRW51bSB7XG4gIFwiQlRDXCIgPSBcIkJUQ1wiLFxuICBcIkVUQ1wiID0gXCJFVENcIixcbiAgXCJYTVJcIiA9IFwiWE1SXCIsXG4gIFwiWkVDXCIgPSBcIlpFQ1wiLFxuICBcIkRBU0hcIiA9IFwiREFTSFwiLFxuICBcIkxUQ1wiID0gXCJMVENcIlxufVxuXG5lbnVtIENvaW5OYW1lc0VudW0ge1xuICBcIkJpdGNvaW5cIiA9IFwiQml0Y29pblwiLFxuICBcIkV0aGVyZXVtIENsYXNzaWNcIiA9IFwiRXRoZXJldW0gQ2xhc3NpY1wiLFxuICBcIk1vbmVyb1wiID0gXCJNb25lcm9cIixcbiAgXCJaY2FzaFwiID0gXCJaY2FzaFwiLFxuICBcIkRhc2hcIiA9IFwiRGFzaFwiLFxuICBcIkxpdGVjb2luXCIgPSBcIkxpdGVjb2luXCJcbn1cblxuaW50ZXJmYWNlIENvaW5JbnRlcmZhY2Uge1xuICBhbGdvcml0aG06IEFsZ29yaXRobXNFbnVtO1xuICBjb2luOiBDb2luU3ltYm9sRW51bTtcbiAgbmFtZTogQ29pbk5hbWVzRW51bTtcbiAgbmV0d29ya19oYXNocmF0ZTogbnVtYmVyO1xuICBwcmljZTogbnVtYmVyO1xuICByZXdhcmQ6IG51bWJlcjtcbiAgdXBkYXRlZDogbnVtYmVyO1xufVxuXG5pbnRlcmZhY2UgUHJpY2VJdGVtSW50ZXJmYWNlIHtcbiAgYXVkOiBudW1iZXI7XG4gIGJybDogbnVtYmVyO1xuICBjYWQ6IG51bWJlcjtcbiAgY2hmOiBudW1iZXI7XG4gIGNueTogbnVtYmVyO1xuICBldXI6IG51bWJlcjtcbiAgZ2JwOiBudW1iZXI7XG4gIGhrZDogbnVtYmVyO1xuICBqcHk6IG51bWJlcjtcbiAgbXhuOiBudW1iZXI7XG4gIHJ1YjogbnVtYmVyO1xuICB1c2Q6IG51bWJlcjtcbn1cblxuaW50ZXJmYWNlIFByaWNlc0ludGVyZmFjZSB7XG4gIGJpdGNvaW46IFByaWNlSXRlbUludGVyZmFjZTtcbiAgZGFzaDogUHJpY2VJdGVtSW50ZXJmYWNlO1xuICBcImV0aGVyZXVtLWNsYXNzaWNcIjogUHJpY2VJdGVtSW50ZXJmYWNlO1xuICBsaXRlY29pbjogUHJpY2VJdGVtSW50ZXJmYWNlO1xuICBtb25lcm86IFByaWNlSXRlbUludGVyZmFjZTtcbiAgemNhc2g6IFByaWNlSXRlbUludGVyZmFjZTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBDYWxjdWxhdGlvblJlc3VsdCB7XG4gIG1pbmVkOiBudW1iZXI7XG4gIG1pbmVkRmVlOiBudW1iZXI7XG4gIGluY29tZTogbnVtYmVyO1xuICBpbmNvbWVGZWU6IG51bWJlcjtcbiAgcG93ZXJDb3N0OiBudW1iZXI7XG4gIHByb2ZpdDogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIENhbGN1bGF0aW9uc1Jlc3VsdCB7XG4gIGRhaWx5OiBDYWxjdWxhdGlvblJlc3VsdDtcbiAgd2Vla2x5OiBDYWxjdWxhdGlvblJlc3VsdDtcbiAgbW9udGhseTogQ2FsY3VsYXRpb25SZXN1bHQ7XG4gIHllYXJseTogQ2FsY3VsYXRpb25SZXN1bHQ7XG4gIGN1cnJlbmN5OiBzdHJpbmc7XG4gIHByaWNlOiBudW1iZXI7XG4gIHJlYWxQcmljZTogbnVtYmVyO1xuICBjb3N0UGVyTWluZWRDb2luOiBudW1iZXI7XG4gIGVsZWN0cmljaXR5UHJpY2VCcmVha0V2ZW46IG51bWJlcjtcbiAgaGFzaFByaWNlOiBudW1iZXI7XG59XG5cbmV4cG9ydCBjb25zdCBDcnlwdG9DdXJyZW5jaWVzID0ge1xuICBCVEM6IHtcbiAgICBpZDogXCJiaXRjb2luXCIsXG4gICAgc3ltYm9sOiBcIkJUQ1wiLFxuICAgIG5hbWU6IFwiQml0Y29pblwiLFxuICAgIGljb246IEJ0Y1NWRygpLFxuICAgIGNvbmZpZzoge1xuICAgICAgaGFzaFJhdGVBbW91bnQ6IDQwLFxuICAgICAgaGFzaFJhdGVUeXBlOiBcIlRoL3NcIixcbiAgICAgIHBvd2VyOiAyNjAwXG4gICAgfVxuICB9LFxuICBFVEM6IHtcbiAgICBpZDogXCJldGhlcmV1bS1jbGFzc2ljXCIsXG4gICAgc3ltYm9sOiBcIkVUQ1wiLFxuICAgIG5hbWU6IFwiRXRoZXJldW0gQ2xhc3NpY1wiLFxuICAgIGljb246IEV0Y1NWRygpLFxuICAgIGNvbmZpZzoge1xuICAgICAgaGFzaFJhdGVBbW91bnQ6IDUwMCxcbiAgICAgIGhhc2hSYXRlVHlwZTogXCJNaC9zXCIsXG4gICAgICBwb3dlcjogMTAwMFxuICAgIH1cbiAgfSxcbiAgWE1SOiB7XG4gICAgaWQ6IFwibW9uZXJvXCIsXG4gICAgc3ltYm9sOiBcIlhNUlwiLFxuICAgIG5hbWU6IFwiTW9uZXJvXCIsXG4gICAgaWNvbjogWG1yU1ZHKCksXG4gICAgY29uZmlnOiB7XG4gICAgICBoYXNoUmF0ZUFtb3VudDogMTAwLFxuICAgICAgaGFzaFJhdGVUeXBlOiBcIktoL3NcIixcbiAgICAgIHBvd2VyOiAxMjAwXG4gICAgfVxuICB9LFxuICBaRUM6IHtcbiAgICBpZDogXCJ6Y2FzaFwiLFxuICAgIHN5bWJvbDogXCJaRUNcIixcbiAgICBuYW1lOiBcIlpjYXNoXCIsXG4gICAgaWNvbjogWmVjU1ZHKCksXG4gICAgY29uZmlnOiB7XG4gICAgICBoYXNoUmF0ZUFtb3VudDogMTAwLFxuICAgICAgaGFzaFJhdGVUeXBlOiBcIktoL3NcIixcbiAgICAgIHBvd2VyOiAxMDAwXG4gICAgfVxuICB9LFxuICBEQVNIOiB7XG4gICAgaWQ6IFwiZGFzaFwiLFxuICAgIHN5bWJvbDogXCJEQVNIXCIsXG4gICAgbmFtZTogXCJEYXNoXCIsXG4gICAgaWNvbjogRGFzaFNWRygpLFxuICAgIGNvbmZpZzoge1xuICAgICAgaGFzaFJhdGVBbW91bnQ6IDIwMCxcbiAgICAgIGhhc2hSYXRlVHlwZTogXCJHaC9zXCIsXG4gICAgICBwb3dlcjogMTExMFxuICAgIH1cbiAgfSxcbiAgTFRDOiB7XG4gICAgaWQ6IFwibGl0ZWNvaW5cIixcbiAgICBzeW1ib2w6IFwiTFRDXCIsXG4gICAgbmFtZTogXCJMaXRlY29pblwiLFxuICAgIGljb246IEx0Y1NWRygpLFxuICAgIGNvbmZpZzoge1xuICAgICAgaGFzaFJhdGVBbW91bnQ6IDUsXG4gICAgICBoYXNoUmF0ZVR5cGU6IFwiR2gvc1wiLFxuICAgICAgcG93ZXI6IDEwMDBcbiAgICB9XG4gIH1cbn07XG5cbmNvbnN0IENyeXB0b0N1cnJlbmNpZXNJZHMgPSBbXCJiaXRjb2luXCIsIFwiZXRoZXJldW0tY2xhc3NpY1wiLCBcIm1vbmVyb1wiLCBcInpjYXNoXCIsIFwiZGFzaFwiLCBcImxpdGVjb2luXCJdO1xuXG5leHBvcnQgZW51bSBDdXJyZW5jeUVudW0ge1xuICBcIlVTRFwiID0gXCJVU0RcIixcbiAgXCJFVVJcIiA9IFwiRVVSXCIsXG4gIFwiR0JQXCIgPSBcIkdCUFwiLFxuICBcIkNBRFwiID0gXCJDQURcIixcbiAgXCJBVURcIiA9IFwiQVVEXCIsXG4gIFwiQ0hGXCIgPSBcIkNIRlwiLFxuICBcIkNOWVwiID0gXCJDTllcIixcbiAgXCJSVUJcIiA9IFwiUlVCXCIsXG4gIFwiQlJMXCIgPSBcIkJSTFwiLFxuICBcIkhLRFwiID0gXCJIS0RcIixcbiAgXCJKUFlcIiA9IFwiSlBZXCIsXG4gIFwiTVhOXCIgPSBcIk1YTlwiXG59XG5cbmV4cG9ydCBlbnVtIEhhc2hSYXRlU3RyaW5nVG9OdW1iZXIge1xuICBcIlBoL3NcIiA9IDEwMDAwMDAwMDAwMDAwMDAsXG4gIFwiVGgvc1wiID0gMTAwMDAwMDAwMDAwMCxcbiAgXCJHaC9zXCIgPSAxMDAwMDAwMDAwLFxuICBcIk1oL3NcIiA9IDEwMDAwMDAsXG4gIFwiS2gvc1wiID0gMTAwMCxcbiAgXCJIL3NcIiA9IDFcbn1cblxuZXhwb3J0IGNsYXNzIENhbGN1bGF0b3JTZXJ2aWNlIHtcbiAgcHJpdmF0ZSB1c2VDYWNoZSA9IChwYXRoKTogYm9vbGVhbiA9PiB7XG4gICAgbGV0IGRhdGVOb3cgPSBEYXRlLm5vdygpO1xuICAgIGxldCBjYWNoZSA9IHN0b3JhZ2VTZXJ2aWNlLmdldChwYXRoKTtcbiAgICBpZiAoY2FjaGUpIHtcbiAgICAgIGxldCBjYWNoZURhdGUgPSBjYWNoZS5kYXRlO1xuICAgICAgaWYgKGRhdGVOb3cgLSBjYWNoZURhdGUgPCBEZWZhdWx0Q2FjaGVUaW1lKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH07XG5cbiAgcHJpdmF0ZSBzZXRDYWNoZShwYXRoOiBzdHJpbmcsIHZhbHVlOiB1bmtub3duKTogdm9pZCB7XG4gICAgbGV0IGRhdGVOb3cgPSBEYXRlLm5vdygpO1xuICAgIHN0b3JhZ2VTZXJ2aWNlLnNldChwYXRoLCB7XG4gICAgICB2YWx1ZSxcbiAgICAgIGRhdGU6IGRhdGVOb3dcbiAgICB9KTtcbiAgfVxuXG4gIC8vIGFzeW5jIHBpbmcoKTogUHJvbWlzZTx1bmtub3duPiB7XG4gIC8vICAgaWYgKHRoaXMudXNlQ2FjaGUoXCJwaW5nXCIpKSB7XG4gIC8vICAgICByZXR1cm4gc3RvcmFnZVNlcnZpY2UuZ2V0KFwicGluZy52YWx1ZVwiKTtcbiAgLy8gICB9XG5cbiAgLy8gICBjb25zdCByZXNwb25zZSA9IGF3YWl0IENvaW5HZWNrb1JlcXVlc3QuZ2V0KFwiL3BpbmdcIik7XG4gIC8vICAgdGhpcy5zZXRDYWNoZShcInBpbmdcIiwgcmVzcG9uc2UpO1xuICAvLyAgIHJldHVybiByZXNwb25zZTtcbiAgLy8gfVxuXG4gIC8vIGFzeW5jIGdldENvaW5zTGlzdCgpOiBQcm9taXNlPGFueT4ge1xuICAvLyAgIGlmICh0aGlzLnVzZUNhY2hlKFwiY29pbnNMaXN0XCIpKSB7XG4gIC8vICAgICByZXR1cm4gc3RvcmFnZVNlcnZpY2UuZ2V0KFwiY29pbnNMaXN0LnZhbHVlXCIpO1xuICAvLyAgIH1cbiAgLy8gICBjb25zdCByZXNwb25zZSA9IGF3YWl0IENvaW5HZWNrb1JlcXVlc3QuZ2V0KFwiL2NvaW5zL2xpc3RcIik7XG4gIC8vICAgdGhpcy5zZXRDYWNoZShcImNvaW5zTGlzdFwiLCByZXNwb25zZSk7XG4gIC8vICAgcmV0dXJuIHJlc3BvbnNlO1xuICAvLyB9XG5cbiAgLy8gYXN5bmMgZ2V0U3VwcG9ydGVkQ3VycmVuY2llcygpOiBQcm9taXNlPGFueT4ge1xuICAvLyAgIGlmICh0aGlzLnVzZUNhY2hlKFwic3VwcG9ydGVkQ3VycmVuY2llc1wiKSkge1xuICAvLyAgICAgcmV0dXJuIHN0b3JhZ2VTZXJ2aWNlLmdldChcInN1cHBvcnRlZEN1cnJlbmNpZXMudmFsdWVcIik7XG4gIC8vICAgfVxuICAvLyAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgQ29pbkdlY2tvUmVxdWVzdC5nZXQoXCIvc2ltcGxlL3N1cHBvcnRlZF92c19jdXJyZW5jaWVzXCIpO1xuICAvLyAgIHRoaXMuc2V0Q2FjaGUoXCJzdXBwb3J0ZWRDdXJyZW5jaWVzXCIsIHJlc3BvbnNlKTtcbiAgLy8gICByZXR1cm4gcmVzcG9uc2U7XG4gIC8vIH1cblxuICBhc3luYyBnZXRQcmljZXMoKTogUHJvbWlzZTxQcmljZXNJbnRlcmZhY2U+IHtcbiAgICBpZiAodGhpcy51c2VDYWNoZShcInByaWNlc1wiKSkge1xuICAgICAgcmV0dXJuIHN0b3JhZ2VTZXJ2aWNlLmdldChcInByaWNlcy52YWx1ZVwiKTtcbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBDb2luR2Vja29SZXF1ZXN0LmdldChcIi9zaW1wbGUvcHJpY2VcIiwge1xuICAgICAgaWRzOiBDcnlwdG9DdXJyZW5jaWVzSWRzLmpvaW4oXCIsXCIpLFxuICAgICAgdnNfY3VycmVuY2llczogT2JqZWN0LmtleXMoQ3VycmVuY3lFbnVtKVxuICAgICAgICAubWFwKChrZXkpID0+IGtleS50b0xvd2VyQ2FzZSgpKVxuICAgICAgICAuam9pbihcIixcIilcbiAgICB9KTtcbiAgICB0aGlzLnNldENhY2hlKFwicHJpY2VzXCIsIHJlc3BvbnNlKTtcbiAgICByZXR1cm4gcmVzcG9uc2U7XG4gIH1cblxuICBhc3luYyBnZXRDb2luc0RhdGEoKTogUHJvbWlzZTxDb2luSW50ZXJmYWNlW10+IHtcbiAgICBpZiAodGhpcy51c2VDYWNoZShcImNvaW5zRGF0YVwiKSkge1xuICAgICAgcmV0dXJuIHN0b3JhZ2VTZXJ2aWNlLmdldChcImNvaW5zRGF0YS52YWx1ZVwiKTtcbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBNaW5lcnN0YXRSZXF1ZXN0LmdldChcIi9cIiwge1xuICAgICAgbGlzdDogT2JqZWN0LmtleXMoQ29pblN5bWJvbEVudW0pLmpvaW4oXCIsXCIpXG4gICAgfSk7XG4gICAgdGhpcy5zZXRDYWNoZShcImNvaW5zRGF0YVwiLCByZXNwb25zZSk7XG4gICAgcmV0dXJuIHJlc3BvbnNlO1xuICB9XG5cbiAgZ2V0SGFzaFJhdGVGcm9tU3RyaW5nKGhhc2hSYXRlU3RyaW5nOiBIYXNoUmF0ZVN0cmluZ1RvTnVtYmVyLCBhbW91bnQ6IG51bWJlcikge1xuICAgIHJldHVybiBhbW91bnQgKiBOdW1iZXIoSGFzaFJhdGVTdHJpbmdUb051bWJlcltoYXNoUmF0ZVN0cmluZ10pO1xuICB9XG5cbiAgYXN5bmMgY2FsY3VsYXRlQ29pbkZvckhhc2hSYXRlKHtcbiAgICBjb2luU3ltYm9sLFxuICAgIGhhc2hSYXRlLFxuICAgIHBvd2VyLFxuICAgIHBvd2VyQ29zdCxcbiAgICBjdXJyZW5jeSxcbiAgICBhbGdvcml0aG0sXG4gICAgcG9vbEZlZSxcbiAgICBjdXN0b21QcmljZSxcbiAgICBjdXN0b21EYWlseU1pbmVkXG4gIH06IHtcbiAgICBjdXN0b21QcmljZTogbnVtYmVyO1xuICAgIGN1c3RvbURhaWx5TWluZWQ6IG51bWJlcjtcbiAgICBjb2luU3ltYm9sOiBDb2luU3ltYm9sRW51bTtcbiAgICBoYXNoUmF0ZTogbnVtYmVyO1xuICAgIHBvd2VyOiBudW1iZXI7XG4gICAgcG93ZXJDb3N0OiBudW1iZXI7XG4gICAgY3VycmVuY3k6IHN0cmluZztcbiAgICBhbGdvcml0aG0/OiBBbGdvcml0aG1zRW51bTtcbiAgICBwb29sRmVlOiBudW1iZXI7XG4gIH0pOiBQcm9taXNlPENhbGN1bGF0aW9uc1Jlc3VsdD4ge1xuICAgIGxldCBjb2lucyA9IGF3YWl0IHRoaXMuZ2V0Q29pbnNEYXRhKCk7XG4gICAgbGV0IHByaWNlc0ZvckFsbENvaW5zID0gYXdhaXQgdGhpcy5nZXRQcmljZXMoKTtcblxuICAgIGlmICghY29pbnMgfHwgIXByaWNlc0ZvckFsbENvaW5zKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb3VsZCBub3QgbG9hZCBkYXRhXCIpO1xuICAgIH1cblxuICAgIGxldCBjb2luID0gY29pbnMuZmluZCgoY29pbikgPT4gY29pbi5jb2luID09PSBjb2luU3ltYm9sKTtcblxuICAgIGlmICghY29pbiB8fCAhQ3J5cHRvQ3VycmVuY2llc1tjb2luU3ltYm9sXSB8fCAhcHJpY2VzRm9yQWxsQ29pbnNbQ3J5cHRvQ3VycmVuY2llc1tjb2luU3ltYm9sXS5pZF0pIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkNvaW4gbm90IGZvdW5kXCIpO1xuICAgIH1cblxuICAgIGlmIChhbGdvcml0aG0gJiYgY29pbi5hbGdvcml0aG0gIT09IGFsZ29yaXRobSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQWxnb3JpdGhtIG5vdCBzdXBwb3J0ZWRcIik7XG4gICAgfVxuXG4gICAgbGV0IGN1cnJlbmN5TG93ZXJDYXNlZCA9IChjdXJyZW5jeSB8fCBcInVzZFwiKS50b0xvd2VyQ2FzZSgpO1xuXG4gICAgbGV0IHJlYWxQcmljZSA9XG4gICAgICBwcmljZXNGb3JBbGxDb2luc1tDcnlwdG9DdXJyZW5jaWVzW2NvaW5TeW1ib2xdLmlkXVtjdXJyZW5jeUxvd2VyQ2FzZWRdIHx8XG4gICAgICBwcmljZXNGb3JBbGxDb2luc1tDcnlwdG9DdXJyZW5jaWVzW2NvaW5TeW1ib2xdLmlkXS51c2Q7XG4gICAgbGV0IGNvaW5QcmljZSA9IGN1c3RvbVByaWNlIHx8IHJlYWxQcmljZTtcblxuICAgIGxldCBjb2luUmV3YXJkUGVyRGF5TWluZWQgPSBjb2luLnJld2FyZCAqIGhhc2hSYXRlICogMjQ7XG4gICAgbGV0IGRhaWx5TWluZWRGZWUgPSBjb2luUmV3YXJkUGVyRGF5TWluZWQgKiBwb29sRmVlO1xuICAgIGxldCBkYWlseU1pbmVkID0gY29pblJld2FyZFBlckRheU1pbmVkIC0gZGFpbHlNaW5lZEZlZTtcblxuICAgIGlmIChjdXN0b21EYWlseU1pbmVkKSB7XG4gICAgICBkYWlseU1pbmVkID0gY3VzdG9tRGFpbHlNaW5lZDtcbiAgICAgIGxldCBpbnRQb29sRmVlID0gcG9vbEZlZSAqIDEwMDtcbiAgICAgIGRhaWx5TWluZWRGZWUgPSAoZGFpbHlNaW5lZCAvICgxMDAgLSBpbnRQb29sRmVlKSkgKiBpbnRQb29sRmVlO1xuICAgICAgY29pblJld2FyZFBlckRheU1pbmVkID0gZGFpbHlNaW5lZCArIGRhaWx5TWluZWRGZWU7XG4gICAgfVxuXG4gICAgY29uc3QgZGFpbHlJbmNvbWUgPSBkYWlseU1pbmVkICogY29pblByaWNlO1xuICAgIGNvbnN0IGRhaWx5SW5jb21lRmVlID0gZGFpbHlNaW5lZEZlZSAqIGNvaW5QcmljZTtcbiAgICBjb25zdCBkYWlseVBvd2VyQ29zdCA9IChwb3dlckNvc3QgLyAxMDAwKSAqIHBvd2VyICogMjQ7XG4gICAgY29uc3QgZGFpbHlQcm9maXQgPSBkYWlseUluY29tZSAtIGRhaWx5UG93ZXJDb3N0O1xuXG4gICAgY29uc3QgY29zdFBlck1pbmVkQ29pbiA9IChkYWlseVBvd2VyQ29zdCArIGRhaWx5SW5jb21lRmVlKSAvIGRhaWx5TWluZWQ7XG4gICAgY29uc3QgZWxlY3RyaWNpdHlQcmljZUJyZWFrRXZlbiA9ICgoZGFpbHlNaW5lZCAqIGNvaW5QcmljZSAqIDEwMDApIC8gcG93ZXIpICogMjQ7XG4gICAgY29uc3QgaGFzaFByaWNlID0gY29pblJld2FyZFBlckRheU1pbmVkICogY29pblByaWNlO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGRhaWx5OiB7XG4gICAgICAgIG1pbmVkOiBkYWlseU1pbmVkLFxuICAgICAgICBtaW5lZEZlZTogZGFpbHlNaW5lZEZlZSxcbiAgICAgICAgaW5jb21lOiBkYWlseUluY29tZSxcbiAgICAgICAgaW5jb21lRmVlOiBkYWlseUluY29tZUZlZSxcbiAgICAgICAgcG93ZXJDb3N0OiBkYWlseVBvd2VyQ29zdCxcbiAgICAgICAgcHJvZml0OiBkYWlseVByb2ZpdFxuICAgICAgfSxcbiAgICAgIHdlZWtseToge1xuICAgICAgICBtaW5lZDogZGFpbHlNaW5lZCAqIDcsXG4gICAgICAgIG1pbmVkRmVlOiBkYWlseU1pbmVkRmVlICogNyxcbiAgICAgICAgaW5jb21lOiBkYWlseUluY29tZSAqIDcsXG4gICAgICAgIGluY29tZUZlZTogZGFpbHlJbmNvbWVGZWUgKiA3LFxuICAgICAgICBwb3dlckNvc3Q6IGRhaWx5UG93ZXJDb3N0ICogNyxcbiAgICAgICAgcHJvZml0OiBkYWlseVByb2ZpdCAqIDdcbiAgICAgIH0sXG4gICAgICBtb250aGx5OiB7XG4gICAgICAgIG1pbmVkOiBkYWlseU1pbmVkICogMzAsXG4gICAgICAgIG1pbmVkRmVlOiBkYWlseU1pbmVkRmVlICogMzAsXG4gICAgICAgIGluY29tZTogZGFpbHlJbmNvbWUgKiAzMCxcbiAgICAgICAgaW5jb21lRmVlOiBkYWlseUluY29tZUZlZSAqIDMwLFxuICAgICAgICBwb3dlckNvc3Q6IGRhaWx5UG93ZXJDb3N0ICogMzAsXG4gICAgICAgIHByb2ZpdDogZGFpbHlQcm9maXQgKiAzMFxuICAgICAgfSxcbiAgICAgIHllYXJseToge1xuICAgICAgICBtaW5lZDogZGFpbHlNaW5lZCAqIDM2NSxcbiAgICAgICAgbWluZWRGZWU6IGRhaWx5TWluZWRGZWUgKiAzNjUsXG4gICAgICAgIGluY29tZTogZGFpbHlJbmNvbWUgKiAzNjUsXG4gICAgICAgIGluY29tZUZlZTogZGFpbHlJbmNvbWVGZWUgKiAzNjUsXG4gICAgICAgIHBvd2VyQ29zdDogZGFpbHlQb3dlckNvc3QgKiAzNjUsXG4gICAgICAgIHByb2ZpdDogZGFpbHlQcm9maXQgKiAzNjVcbiAgICAgIH0sXG4gICAgICBjdXJyZW5jeSxcbiAgICAgIHByaWNlOiBjb2luUHJpY2UsXG4gICAgICByZWFsUHJpY2U6IHJlYWxQcmljZSxcbiAgICAgIGNvc3RQZXJNaW5lZENvaW4sXG4gICAgICBlbGVjdHJpY2l0eVByaWNlQnJlYWtFdmVuLFxuICAgICAgaGFzaFByaWNlXG4gICAgfTtcbiAgfVxufVxuIiwgIi8vIEZvcm1hdCBtb25leSB3aXRoIGN1cnJlbmN5IHN5bWJvbCBhbmQgZGVjaW1hbCBwcmVjaXNpb24gKDIpIHVzaW5nIHRoZSBJbnRsLk51bWJlckZvcm1hdCBBUElcblxuaW1wb3J0IHsgRGlyZWN0aXZlLCBJVm5vZGUsIFZhbHlyaWFuIH0gZnJvbSBcInZhbHlyaWFuLmpzL2ludGVyZmFjZXNcIjtcblxuZW51bSBDdXJyZW5jeVRvTGFuZ3VhZ2VFbnVtIHtcbiAgXCJVU0RcIiA9IFwiZW4tVVNcIixcbiAgXCJFVVJcIiA9IFwiZXMtRVNcIixcbiAgXCJHQlBcIiA9IFwiZW4tR0JcIixcbiAgXCJDQURcIiA9IFwiZW4tQ0FcIixcbiAgXCJBVURcIiA9IFwiZW4tQVVcIixcbiAgXCJDSEZcIiA9IFwiZnItQ0hcIixcbiAgXCJDTllcIiA9IFwiemgtQ05cIixcbiAgXCJSVUJcIiA9IFwicnUtUlVcIixcbiAgXCJCUkxcIiA9IFwicHQtQlJcIixcbiAgXCJIS0RcIiA9IFwiemgtSEtcIixcbiAgXCJKUFlcIiA9IFwiamEtSlBcIixcbiAgXCJNWE5cIiA9IFwiZXMtTVhcIlxufVxuXG5sZXQgZm9ybWF0TW9uZXkgPSAoYW1vdW50OiBudW1iZXIsIGN1cnJlbmN5OiBDdXJyZW5jeVRvTGFuZ3VhZ2VFbnVtLCBsYW5ndWFnZTogc3RyaW5nKSA9PiB7XG4gIGxldCBmb3JtYXR0ZXIgPSBuZXcgSW50bC5OdW1iZXJGb3JtYXQobGFuZ3VhZ2UsIHtcbiAgICBzdHlsZTogXCJjdXJyZW5jeVwiLFxuICAgIGN1cnJlbmN5OiBjdXJyZW5jeSxcbiAgICBtaW5pbXVtRnJhY3Rpb25EaWdpdHM6IDJcbiAgfSk7XG4gIHJldHVybiBmb3JtYXR0ZXIuZm9ybWF0KGFtb3VudCk7XG59O1xuXG5sZXQgZm9ybWF0TnVtYmVyID0gKGFtb3VudDogbnVtYmVyLCBkZWNpbWFsUGxhY2VzOiBudW1iZXIsIGxhbmd1YWdlOiBzdHJpbmcpID0+IHtcbiAgbGV0IGZvcm1hdHRlciA9IG5ldyBJbnRsLk51bWJlckZvcm1hdChsYW5ndWFnZSwge1xuICAgIHN0eWxlOiBcImRlY2ltYWxcIixcbiAgICBtaW5pbXVtRnJhY3Rpb25EaWdpdHM6IGRlY2ltYWxQbGFjZXMsXG4gICAgbWF4aW11bUZyYWN0aW9uRGlnaXRzOiBkZWNpbWFsUGxhY2VzXG4gIH0pO1xuICByZXR1cm4gZm9ybWF0dGVyLmZvcm1hdChhbW91bnQpO1xufTtcblxuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdE1vbmV5RGlyZWN0aXZlKGN1cnJlbmN5OiBDdXJyZW5jeVRvTGFuZ3VhZ2VFbnVtLCB2bm9kZTogSVZub2RlKSB7XG4gIGxldCBjaGlsZCA9IHZub2RlLmNoaWxkcmVuWzBdO1xuICBpZiAodHlwZW9mIGNoaWxkID09PSBcIm51bWJlclwiKSB7XG4gICAgdm5vZGUuY2hpbGRyZW5bMF0gPSBmb3JtYXRNb25leShjaGlsZCwgY3VycmVuY3ksIEN1cnJlbmN5VG9MYW5ndWFnZUVudW1bY3VycmVuY3ldKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0TnVtYmVyRGlyZWN0aXZlKFxuICB7IGN1cnJlbmN5LCBkZWNpbWFsUGxhY2VzIH06IHsgY3VycmVuY3k6IEN1cnJlbmN5VG9MYW5ndWFnZUVudW07IGRlY2ltYWxQbGFjZXM6IG51bWJlciB9LFxuICB2bm9kZTogSVZub2RlXG4pIHtcbiAgbGV0IGNoaWxkID0gdm5vZGUuY2hpbGRyZW5bMF07XG4gIGlmICh0eXBlb2YgY2hpbGQgPT09IFwibnVtYmVyXCIpIHtcbiAgICB2bm9kZS5jaGlsZHJlblswXSA9IGZvcm1hdE51bWJlcihjaGlsZCwgZGVjaW1hbFBsYWNlcywgQ3VycmVuY3lUb0xhbmd1YWdlRW51bVtjdXJyZW5jeV0pO1xuICB9XG59XG4iLCAiLy8gbGliL2hvb2tzL2luZGV4LnRzXG5pbXBvcnQgeyBjdXJyZW50LCBkaXJlY3RpdmUsIG9uQ2xlYW51cCwgb25Vbm1vdW50LCB1cGRhdGUgfSBmcm9tIFwidmFseXJpYW4uanNcIjtcbnZhciBjcmVhdGVIb29rID0gZnVuY3Rpb24gY3JlYXRlSG9vazIoe1xuICBvbkNyZWF0ZSxcbiAgb25VcGRhdGU6IG9uVXBkYXRlSG9vayxcbiAgb25DbGVhbnVwOiBvbkNsZWFudXBIb29rLFxuICBvblJlbW92ZSxcbiAgcmV0dXJuVmFsdWVcbn0pIHtcbiAgcmV0dXJuICguLi5hcmdzKSA9PiB7XG4gICAgbGV0IHsgY29tcG9uZW50LCB2bm9kZSwgb2xkVm5vZGUgfSA9IGN1cnJlbnQ7XG4gICAgaWYgKCF2bm9kZS5jb21wb25lbnRzKSB7XG4gICAgICB2bm9kZS5jb21wb25lbnRzID0gW107XG4gICAgICBvblVubW91bnQoKCkgPT4gUmVmbGVjdC5kZWxldGVQcm9wZXJ0eSh2bm9kZSwgXCJjb21wb25lbnRzXCIpKTtcbiAgICB9XG4gICAgaWYgKHZub2RlLmNvbXBvbmVudHMuaW5kZXhPZihjb21wb25lbnQpID09PSAtMSkge1xuICAgICAgdm5vZGUuY29tcG9uZW50cy5wdXNoKGNvbXBvbmVudCk7XG4gICAgfVxuICAgIGlmICghY29tcG9uZW50Lmhvb2tzKSB7XG4gICAgICBjb21wb25lbnQuaG9va3MgPSBbXTtcbiAgICAgIG9uVW5tb3VudCgoKSA9PiBSZWZsZWN0LmRlbGV0ZVByb3BlcnR5KGNvbXBvbmVudCwgXCJob29rc1wiKSk7XG4gICAgfVxuICAgIGxldCBob29rID0gdm9pZCAwO1xuICAgIGlmICghb2xkVm5vZGUgfHwgIW9sZFZub2RlLmNvbXBvbmVudHMgfHwgb2xkVm5vZGUuY29tcG9uZW50c1t2bm9kZS5jb21wb25lbnRzLmxlbmd0aCAtIDFdICE9PSBjb21wb25lbnQpIHtcbiAgICAgIGhvb2sgPSBvbkNyZWF0ZSguLi5hcmdzKTtcbiAgICAgIGNvbXBvbmVudC5ob29rcy5wdXNoKGhvb2spO1xuICAgICAgaWYgKG9uUmVtb3ZlKSB7XG4gICAgICAgIG9uVW5tb3VudCgoKSA9PiBvblJlbW92ZShob29rKSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChcImNhbGxzXCIgaW4gY29tcG9uZW50ID09PSBmYWxzZSkge1xuICAgICAgICBjb21wb25lbnQuY2FsbHMgPSAtMTtcbiAgICAgICAgb25Vbm1vdW50KCgpID0+IFJlZmxlY3QuZGVsZXRlUHJvcGVydHkoY29tcG9uZW50LCBcImNhbGxzXCIpKTtcbiAgICAgIH1cbiAgICAgIG9uQ2xlYW51cCgoKSA9PiBjb21wb25lbnQuY2FsbHMgPSAtMSk7XG4gICAgICBjb21wb25lbnQuY2FsbHMrKztcbiAgICAgIGhvb2sgPSBjb21wb25lbnQuaG9va3NbY29tcG9uZW50LmNhbGxzXTtcbiAgICAgIGlmIChvblVwZGF0ZUhvb2spIHtcbiAgICAgICAgb25VcGRhdGVIb29rKGhvb2ssIC4uLmFyZ3MpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAob25DbGVhbnVwSG9vaykge1xuICAgICAgb25DbGVhbnVwKCgpID0+IG9uQ2xlYW51cEhvb2soaG9vaykpO1xuICAgIH1cbiAgICBpZiAocmV0dXJuVmFsdWUpIHtcbiAgICAgIHJldHVybiByZXR1cm5WYWx1ZShob29rKTtcbiAgICB9XG4gICAgcmV0dXJuIGhvb2s7XG4gIH07XG59O1xudmFyIHVwZGF0ZVRpbWVvdXQ7XG5mdW5jdGlvbiBkZWxheWVkVXBkYXRlKCkge1xuICBjbGVhclRpbWVvdXQodXBkYXRlVGltZW91dCk7XG4gIHVwZGF0ZVRpbWVvdXQgPSBzZXRUaW1lb3V0KHVwZGF0ZSk7XG59XG52YXIgdXNlU3RhdGUgPSBjcmVhdGVIb29rKHtcbiAgb25DcmVhdGU6ICh2YWx1ZSkgPT4ge1xuICAgIGxldCBzdGF0ZU9iaiA9IC8qIEBfX1BVUkVfXyAqLyBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIHN0YXRlT2JqLnZhbHVlID0gdmFsdWU7XG4gICAgc3RhdGVPYmoudG9KU09OID0gc3RhdGVPYmoudG9TdHJpbmcgPSBzdGF0ZU9iai52YWx1ZU9mID0gKCkgPT4gdHlwZW9mIHN0YXRlT2JqLnZhbHVlID09PSBcImZ1bmN0aW9uXCIgPyBzdGF0ZU9iai52YWx1ZSgpIDogc3RhdGVPYmoudmFsdWU7XG4gICAgcmV0dXJuIFtcbiAgICAgIHN0YXRlT2JqLFxuICAgICAgKHZhbHVlMikgPT4ge1xuICAgICAgICBpZiAoc3RhdGVPYmoudmFsdWUgIT09IHZhbHVlMikge1xuICAgICAgICAgIHN0YXRlT2JqLnZhbHVlID0gdmFsdWUyO1xuICAgICAgICAgIGRlbGF5ZWRVcGRhdGUoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIF07XG4gIH1cbn0pO1xudmFyIHVzZUVmZmVjdCA9IGNyZWF0ZUhvb2soe1xuICBvbkNyZWF0ZTogKGVmZmVjdCwgY2hhbmdlcykgPT4ge1xuICAgIGxldCBob29rID0geyBlZmZlY3QsIHByZXY6IFtdIH07XG4gICAgaWYgKGNoYW5nZXMgPT09IG51bGwpIHtcbiAgICAgIGhvb2sub25SZW1vdmUgPSBlZmZlY3Q7XG4gICAgICByZXR1cm4gaG9vaztcbiAgICB9XG4gICAgaG9vay5wcmV2ID0gY2hhbmdlcztcbiAgICBob29rLm9uQ2xlYW51cCA9IGhvb2suZWZmZWN0KCk7XG4gICAgcmV0dXJuIGhvb2s7XG4gIH0sXG4gIG9uVXBkYXRlOiAoaG9vaywgZWZmZWN0LCBjaGFuZ2VzKSA9PiB7XG4gICAgaWYgKHR5cGVvZiBjaGFuZ2VzID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBob29rLnByZXYgPSBjaGFuZ2VzO1xuICAgICAgaWYgKHR5cGVvZiBob29rLm9uQ2xlYW51cCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIGhvb2sub25DbGVhbnVwKCk7XG4gICAgICB9XG4gICAgICBob29rLm9uQ2xlYW51cCA9IGhvb2suZWZmZWN0KCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChBcnJheS5pc0FycmF5KGNoYW5nZXMpKSB7XG4gICAgICBmb3IgKGxldCBpID0gMCwgbCA9IGNoYW5nZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIGlmIChjaGFuZ2VzW2ldICE9PSBob29rLnByZXZbaV0pIHtcbiAgICAgICAgICBob29rLnByZXYgPSBjaGFuZ2VzO1xuICAgICAgICAgIGlmICh0eXBlb2YgaG9vay5vbkNsZWFudXAgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgaG9vay5vbkNsZWFudXAoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaG9vay5vbkNsZWFudXAgPSBob29rLmVmZmVjdCgpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAgb25SZW1vdmU6IChob29rKSA9PiB7XG4gICAgaWYgKHR5cGVvZiBob29rLm9uQ2xlYW51cCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICBob29rLm9uQ2xlYW51cCgpO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIGhvb2sub25SZW1vdmUgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgaG9vay5vblJlbW92ZSgpO1xuICAgIH1cbiAgfVxufSk7XG52YXIgdXNlUmVmID0gY3JlYXRlSG9vayh7XG4gIG9uQ3JlYXRlOiAoaW5pdGlhbFZhbHVlKSA9PiB7XG4gICAgZGlyZWN0aXZlKFwicmVmXCIsIChyZWYsIHZub2RlKSA9PiB7XG4gICAgICByZWYuY3VycmVudCA9IHZub2RlLmRvbTtcbiAgICB9KTtcbiAgICByZXR1cm4geyBjdXJyZW50OiBpbml0aWFsVmFsdWUgfTtcbiAgfVxufSk7XG52YXIgdXNlQ2FsbGJhY2sgPSBjcmVhdGVIb29rKHtcbiAgb25DcmVhdGU6IChjYWxsYmFjaywgY2hhbmdlcykgPT4ge1xuICAgIGNhbGxiYWNrKCk7XG4gICAgcmV0dXJuIHsgY2FsbGJhY2ssIGNoYW5nZXMgfTtcbiAgfSxcbiAgb25VcGRhdGU6IChob29rLCBjYWxsYmFjaywgY2hhbmdlcykgPT4ge1xuICAgIGZvciAobGV0IGkgPSAwLCBsID0gY2hhbmdlcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIGlmIChjaGFuZ2VzW2ldICE9PSBob29rLmNoYW5nZXNbaV0pIHtcbiAgICAgICAgaG9vay5jaGFuZ2VzID0gY2hhbmdlcztcbiAgICAgICAgaG9vay5jYWxsYmFjaygpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuICB9XG59KTtcbnZhciB1c2VNZW1vID0gY3JlYXRlSG9vayh7XG4gIG9uQ3JlYXRlOiAoY2FsbGJhY2ssIGNoYW5nZXMpID0+IHtcbiAgICByZXR1cm4geyBjYWxsYmFjaywgY2hhbmdlcywgdmFsdWU6IGNhbGxiYWNrKCkgfTtcbiAgfSxcbiAgb25VcGRhdGU6IChob29rLCBjYWxsYmFjaywgY2hhbmdlcykgPT4ge1xuICAgIGZvciAobGV0IGkgPSAwLCBsID0gY2hhbmdlcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIGlmIChjaGFuZ2VzW2ldICE9PSBob29rLmNoYW5nZXNbaV0pIHtcbiAgICAgICAgaG9vay5jaGFuZ2VzID0gY2hhbmdlcztcbiAgICAgICAgaG9vay52YWx1ZSA9IGNhbGxiYWNrKCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIHJldHVyblZhbHVlOiAoaG9vaykgPT4ge1xuICAgIHJldHVybiBob29rLnZhbHVlO1xuICB9XG59KTtcbmV4cG9ydCB7XG4gIGNyZWF0ZUhvb2ssXG4gIHVzZUNhbGxiYWNrLFxuICB1c2VFZmZlY3QsXG4gIHVzZU1lbW8sXG4gIHVzZVJlZixcbiAgdXNlU3RhdGVcbn07XG4iLCAiaW1wb3J0IHtcbiAgQ2FsY3VsYXRpb25SZXN1bHQsXG4gIENhbGN1bGF0aW9uc1Jlc3VsdCxcbiAgQ2FsY3VsYXRvclNlcnZpY2UsXG4gIENvaW5TeW1ib2xFbnVtLFxuICBDcnlwdG9DdXJyZW5jaWVzLFxuICBDdXJyZW5jeUVudW1cbn0gZnJvbSBcIi4vYnVzaW5lc3MtbG9naWMvY3J5cHRvLWNhbGN1bGF0b3Itc2VydmljZVwiO1xuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby11bnVzZWQtdmFyc1xuaW1wb3J0IHsgdXBkYXRlLCB2IH0gZnJvbSBcInZhbHlyaWFuLmpzXCI7XG5pbXBvcnQgeyB1c2VFZmZlY3QsIHVzZVJlZiB9IGZyb20gXCJ2YWx5cmlhbi5qcy9ob29rc1wiO1xuXG5jb25zdCBEZWZhdWx0Q3VycmVuY3kgPSBDdXJyZW5jeUVudW0uVVNEO1xuY29uc3QgRGVmYXVsdENvaW4gPSBDcnlwdG9DdXJyZW5jaWVzLkJUQztcbmNvbnN0IEFsbG93U2VsZWN0TWluZXIgPSBmYWxzZTtcblxuZW51bSBGb3JtVG9TaG93IHtcbiAgXCJtaW5lclNlbGVjdFwiID0gXCJtaW5lclNlbGVjdFwiLFxuICBcIm1hbnVhbENvbmZpZ1wiID0gXCJtYW51YWxDb25maWdcIlxufVxuXG5jb25zdCBEZWZhdWx0Q29uZmlnID0ge1xuICBwb3dlckNvc3Q6IDAuMSxcbiAgcG9vbEZlZTogMVxufTtcblxuY29uc3QgU3RvcmUgPSB7XG4gIGxvYWRpbmc6IHRydWUsXG4gIGN1cnJlbmN5OiBEZWZhdWx0Q3VycmVuY3ksXG4gIGNvaW46IERlZmF1bHRDb2luLFxuICBmb3JtVG9TaG93OiBGb3JtVG9TaG93Lm1hbnVhbENvbmZpZyxcbiAgY29uZmlnOiB7XG4gICAgcG93ZXJDb3N0OiBEZWZhdWx0Q29uZmlnLnBvd2VyQ29zdCxcbiAgICBwb29sRmVlOiBEZWZhdWx0Q29uZmlnLnBvb2xGZWUsXG4gICAgY3VzdG9tUHJpY2U6IG51bGwsXG4gICAgY3VzdG9tRGFpbHlNaW5lZDogbnVsbCxcbiAgICBCVEM6IHsgLi4uQ3J5cHRvQ3VycmVuY2llcy5CVEMuY29uZmlnIH0sXG4gICAgRVRDOiB7IC4uLkNyeXB0b0N1cnJlbmNpZXMuRVRDLmNvbmZpZyB9LFxuICAgIExUQzogeyAuLi5DcnlwdG9DdXJyZW5jaWVzLkxUQy5jb25maWcgfSxcbiAgICBYTVI6IHsgLi4uQ3J5cHRvQ3VycmVuY2llcy5YTVIuY29uZmlnIH0sXG4gICAgWkVDOiB7IC4uLkNyeXB0b0N1cnJlbmNpZXMuWkVDLmNvbmZpZyB9LFxuICAgIERBU0g6IHsgLi4uQ3J5cHRvQ3VycmVuY2llcy5EQVNILmNvbmZpZyB9XG4gIH0sXG4gIHJlc3VsdDoge30gYXMgQ2FsY3VsYXRpb25zUmVzdWx0XG59O1xuXG5mdW5jdGlvbiBDb2luTmF2KCkge1xuICByZXR1cm4gKFxuICAgIDxuYXYgdi1mb3I9e09iamVjdC5rZXlzKENyeXB0b0N1cnJlbmNpZXMpfSBjbGFzcz1cImNvaW4tbmF2IGZsZXhcIj5cbiAgICAgIHsoa2V5KSA9PiAoXG4gICAgICAgIDxidXR0b25cbiAgICAgICAgICB2LWNsYXNzPXt7XG4gICAgICAgICAgICBhY3RpdmU6IFN0b3JlLmNvaW4uc3ltYm9sID09PSBrZXlcbiAgICAgICAgICB9fVxuICAgICAgICAgIG9uY2xpY2s9eygpID0+IChTdG9yZS5jb2luID0gQ3J5cHRvQ3VycmVuY2llc1trZXldKX1cbiAgICAgICAgPlxuICAgICAgICAgIHtrZXl9XG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgKX1cbiAgICA8L25hdj5cbiAgKTtcbn1cblxuZnVuY3Rpb24gQ3VycmVuY3lOYXYoKSB7XG4gIHJldHVybiAoXG4gICAgPG5hdiB2LWZvcj17T2JqZWN0LmtleXMoQ3VycmVuY3lFbnVtKX0gY2xhc3M9XCJjdXJyZW5jeS1uYXYgZmxleCBmbGV4LWNvbHVtblwiPlxuICAgICAgeyhrZXkpID0+IChcbiAgICAgICAgPGJ1dHRvblxuICAgICAgICAgIHYtY2xhc3M9e3tcbiAgICAgICAgICAgIGFjdGl2ZTogU3RvcmUuY3VycmVuY3kgPT09IGtleVxuICAgICAgICAgIH19XG4gICAgICAgICAgb25jbGljaz17KCkgPT4gKFN0b3JlLmN1cnJlbmN5ID0ga2V5KX1cbiAgICAgICAgPlxuICAgICAgICAgIHtrZXl9XG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgKX1cbiAgICA8L25hdj5cbiAgKTtcbn1cblxuZnVuY3Rpb24gQ29pbkRlc2NyaXB0aW9uKCkge1xuICByZXR1cm4gKFxuICAgIDxkaXYgY2xhc3M9XCJjb2luLWRlc2NyaXB0aW9uLXRvcFwiPlxuICAgICAgPGZpZ3VyZT57U3RvcmUuY29pbi5pY29ufTwvZmlndXJlPlxuICAgICAgPGI+e1N0b3JlLmNvaW4ubmFtZX08L2I+XG4gICAgICA8c21hbGwgY2xhc3M9XCJmbGV4IGZsZXgtcm93XCI+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwidS1wLXhzIHUtbm8td2FycFwiPjEge1N0b3JlLmNvaW4uc3ltYm9sfSA9IDwvc3Bhbj5cbiAgICAgICAgPGlucHV0IHR5cGU9XCJudW1iZXJcIiB2LW1vZGVsPXtbU3RvcmUuY29uZmlnLCBcImN1c3RvbVByaWNlXCJdfSBzdGVwPVwiMC4wMVwiIGNsYXNzPVwidS1tLTBcIiAvPlxuICAgICAgICA8c3BhbiBjbGFzcz1cInUtcC14cyB1LW5vLXdhcnBcIj57U3RvcmUuY3VycmVuY3l9PC9zcGFuPlxuICAgICAgPC9zbWFsbD5cbiAgICAgIDxzbWFsbCB2LWZvcm1hdC1tb25leT17U3RvcmUuY3VycmVuY3l9IGNsYXNzPVwibm90ZSB0ZXh0LXhzXCI+XG4gICAgICAgIHtTdG9yZS5yZXN1bHQucmVhbFByaWNlfVxuICAgICAgPC9zbWFsbD5cbiAgICA8L2Rpdj5cbiAgKTtcbn1cblxuZnVuY3Rpb24gTWluZXJTZWxlY3QoKSB7XG4gIHJldHVybiA8ZGl2IHYtaWY9e1N0b3JlLmZvcm1Ub1Nob3cgPT09IEZvcm1Ub1Nob3cubWluZXJTZWxlY3QgJiYgQWxsb3dTZWxlY3RNaW5lcn0+PC9kaXY+O1xufVxuXG5mdW5jdGlvbiBNYW51YWxDb25maWcoKSB7XG4gIHJldHVybiAoXG4gICAgPGRpdiB2LWlmPXshQWxsb3dTZWxlY3RNaW5lciB8fCBTdG9yZS5mb3JtVG9TaG93ID09PSBGb3JtVG9TaG93Lm1hbnVhbENvbmZpZ30+XG4gICAgICA8Zm9ybT5cbiAgICAgICAgPHNlY3Rpb24+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cImZsZXggZmxleC1oYXNoLXBvd2VyXCI+XG4gICAgICAgICAgICA8ZmllbGRzZXQ+XG4gICAgICAgICAgICAgIDxsZWdlbmQ+SGFzaCBQb3dlcjwvbGVnZW5kPlxuICAgICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgICB0eXBlPVwibnVtYmVyXCJcbiAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cIkhhc2ggcG93ZXJcIlxuICAgICAgICAgICAgICAgIHYtbW9kZWw9e1tTdG9yZS5jb25maWdbU3RvcmUuY29pbi5zeW1ib2xdLCBcImhhc2hSYXRlQW1vdW50XCJdfVxuICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgPC9maWVsZHNldD5cbiAgICAgICAgICAgIDxmaWVsZHNldCBjbGFzcz1cImhhc2gtcG93ZXJcIj5cbiAgICAgICAgICAgICAgPGxlZ2VuZD4mbmJzcDs8L2xlZ2VuZD5cbiAgICAgICAgICAgICAgPHNlbGVjdCB2LW1vZGVsPXtbU3RvcmUuY29uZmlnW1N0b3JlLmNvaW4uc3ltYm9sXSwgXCJoYXNoUmF0ZVR5cGVcIl19PlxuICAgICAgICAgICAgICAgIDxvcHRpb24+UGgvczwvb3B0aW9uPlxuICAgICAgICAgICAgICAgIDxvcHRpb24+VGgvczwvb3B0aW9uPlxuICAgICAgICAgICAgICAgIDxvcHRpb24+R2gvczwvb3B0aW9uPlxuICAgICAgICAgICAgICAgIDxvcHRpb24+TWgvczwvb3B0aW9uPlxuICAgICAgICAgICAgICAgIDxvcHRpb24+S2gvczwvb3B0aW9uPlxuICAgICAgICAgICAgICAgIDxvcHRpb24+SC9zPC9vcHRpb24+XG4gICAgICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICAgICAgPC9maWVsZHNldD5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZmllbGRzZXQ+XG4gICAgICAgICAgICA8bGVnZW5kPlBvd2VyIENvbnN1bXB0aW9uIChXKTwvbGVnZW5kPlxuICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgIHR5cGU9XCJudW1iZXJcIlxuICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cIlBvd2VyIENvbnN1bXB0aW9uIChXKVwiXG4gICAgICAgICAgICAgIHYtbW9kZWw9e1tTdG9yZS5jb25maWdbU3RvcmUuY29pbi5zeW1ib2xdLCBcInBvd2VyXCJdfVxuICAgICAgICAgICAgLz5cbiAgICAgICAgICA8L2ZpZWxkc2V0PlxuICAgICAgICAgIDxmaWVsZHNldD5cbiAgICAgICAgICAgIDxsZWdlbmQ+UG93ZXIgQ29zdCBLdy9oICgkKTwvbGVnZW5kPlxuICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJudW1iZXJcIiBwbGFjZWhvbGRlcj1cIlBvd2VyIENvc3QgS3cvaCAoJClcIiB2LW1vZGVsPXtbU3RvcmUuY29uZmlnLCBcInBvd2VyQ29zdFwiXX0gLz5cbiAgICAgICAgICA8L2ZpZWxkc2V0PlxuICAgICAgICAgIDxmaWVsZHNldD5cbiAgICAgICAgICAgIDxsZWdlbmQ+UG9vbCBmZWUgKCUpPC9sZWdlbmQ+XG4gICAgICAgICAgICA8aW5wdXQgdHlwZT1cIm51bWJlclwiIHBsYWNlaG9sZGVyPVwiUG9vbCBmZWUgKCUpXCIgdi1tb2RlbD17W1N0b3JlLmNvbmZpZywgXCJwb29sRmVlXCJdfSAvPlxuICAgICAgICAgIDwvZmllbGRzZXQ+XG4gICAgICAgIDwvc2VjdGlvbj5cbiAgICAgIDwvZm9ybT5cbiAgICA8L2Rpdj5cbiAgKTtcbn1cblxuZnVuY3Rpb24gQ29uZmlnU2VjdGlvbigpIHtcbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNsYXNzPVwiY29uZmlnXCI+XG4gICAgICA8bmF2IHYtaWY9e0FsbG93U2VsZWN0TWluZXJ9PlxuICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgdi1jbGFzcz17e1xuICAgICAgICAgICAgYWN0aXZlOiBTdG9yZS5mb3JtVG9TaG93ID09PSBGb3JtVG9TaG93Lm1pbmVyU2VsZWN0XG4gICAgICAgICAgfX1cbiAgICAgICAgPlxuICAgICAgICAgIE1pbmVyIExpc3RcbiAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDxidXR0b25cbiAgICAgICAgICB2LWNsYXNzPXt7XG4gICAgICAgICAgICBhY3RpdmU6IFN0b3JlLmZvcm1Ub1Nob3cgPT09IEZvcm1Ub1Nob3cubWFudWFsQ29uZmlnXG4gICAgICAgICAgfX1cbiAgICAgICAgPlxuICAgICAgICAgIE1hbnVhbFxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgIDwvbmF2PlxuICAgICAgPHNlY3Rpb24+XG4gICAgICAgIDxNaW5lclNlbGVjdCAvPlxuICAgICAgICA8TWFudWFsQ29uZmlnIC8+XG4gICAgICA8L3NlY3Rpb24+XG4gICAgPC9kaXY+XG4gICk7XG59XG5cbmVudW0gUmVzdWx0QnlTdHJpbmdFbnVtIHtcbiAgXCJkYWlseVwiID0gXCJEYXlcIixcbiAgXCJ3ZWVrbHlcIiA9IFwiV2Vla1wiLFxuICBcIm1vbnRobHlcIiA9IFwiTW9udGhcIixcbiAgXCJ5ZWFybHlcIiA9IFwiWWVhclwiXG59XG5cbmVudW0gUmVzdWx0QnlFbnVtIHtcbiAgXCJkYWlseVwiID0gXCJkYWlseVwiLFxuICBcIndlZWtseVwiID0gXCJ3ZWVrbHlcIixcbiAgXCJtb250aGx5XCIgPSBcIm1vbnRobHlcIixcbiAgXCJ5ZWFybHlcIiA9IFwieWVhcmx5XCJcbn1cblxuZnVuY3Rpb24gUmVzdWx0QnkoeyBieSB9OiB7IGJ5OiBzdHJpbmcgfSkge1xuICBsZXQgcmVzdWx0ID0gU3RvcmUucmVzdWx0W2J5XSBhcyBDYWxjdWxhdGlvblJlc3VsdDtcbiAgbGV0IGJ5U3RyaW5nID0gUmVzdWx0QnlTdHJpbmdFbnVtW2J5XTtcbiAgaWYgKHJlc3VsdCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDx0cj5cbiAgICAgICAgPHRkIGNvbHNwYW49XCI0XCI+IC0gPC90ZD5cbiAgICAgIDwvdHI+XG4gICAgKTtcbiAgfVxuXG4gIGxldCBkZWNpbWFsUGxhY2VzU3RyaW5nID0gU3RvcmUuY29uZmlnLmN1c3RvbURhaWx5TWluZWQgPj0gMSA/IDUgOiAwLjAwMDAwNTtcblxuICByZXR1cm4gKFxuICAgIDx0cj5cbiAgICAgIDx0ZD5cbiAgICAgICAgPHNtYWxsPk1pbmVkL3tieVN0cmluZ308L3NtYWxsPlxuICAgICAgICA8aW5wdXRcbiAgICAgICAgICB2LWlmPXtieSA9PT0gUmVzdWx0QnlFbnVtLmRhaWx5fVxuICAgICAgICAgIHR5cGU9XCJudW1iZXJcIlxuICAgICAgICAgIHYtbW9kZWw9e1tTdG9yZS5jb25maWcsIFwiY3VzdG9tRGFpbHlNaW5lZFwiXX1cbiAgICAgICAgICBzdGVwPXtkZWNpbWFsUGxhY2VzU3RyaW5nfVxuICAgICAgICAgIGNsYXNzPVwidS1tLTBcIlxuICAgICAgICAvPlxuICAgICAgICA8YlxuICAgICAgICAgIHYtaWY9e2J5ICE9PSBSZXN1bHRCeUVudW0uZGFpbHl9XG4gICAgICAgICAgdi1mb3JtYXQtbnVtYmVyPXt7XG4gICAgICAgICAgICBjdXJyZW5jeTogU3RvcmUuY3VycmVuY3ksXG4gICAgICAgICAgICBkZWNpbWFsUGxhY2VzOiA2XG4gICAgICAgICAgfX1cbiAgICAgICAgPlxuICAgICAgICAgIHtyZXN1bHQubWluZWR9XG4gICAgICAgIDwvYj5cbiAgICAgICAgPHNtYWxsPlxuICAgICAgICAgIFBvb2wgZmVlOiA8c3BhbiB2LWZvcm1hdC1udW1iZXI9e3sgY3VycmVuY3k6IFN0b3JlLmN1cnJlbmN5LCBkZWNpbWFsUGxhY2VzOiA2IH19PntyZXN1bHQubWluZWRGZWV9PC9zcGFuPlxuICAgICAgICA8L3NtYWxsPlxuICAgICAgPC90ZD5cbiAgICAgIDx0ZD5cbiAgICAgICAgPHNtYWxsPkluY29tZS97YnlTdHJpbmd9PC9zbWFsbD5cbiAgICAgICAgPGIgdi1mb3JtYXQtbW9uZXk9e1N0b3JlLmN1cnJlbmN5fT57cmVzdWx0LmluY29tZX08L2I+XG4gICAgICAgIDxzbWFsbD5cbiAgICAgICAgICBQb29sIGZlZSA8c3BhbiB2LWZvcm1hdC1tb25leT17U3RvcmUuY3VycmVuY3l9PntyZXN1bHQuaW5jb21lRmVlfTwvc3Bhbj5cbiAgICAgICAgPC9zbWFsbD5cbiAgICAgIDwvdGQ+XG4gICAgICA8dGQ+XG4gICAgICAgIDxzbWFsbD5Qb3dlciBjb3N0L3tieVN0cmluZ308L3NtYWxsPlxuICAgICAgICA8YiB2LWZvcm1hdC1tb25leT17U3RvcmUuY3VycmVuY3l9PntyZXN1bHQucG93ZXJDb3N0fTwvYj5cbiAgICAgIDwvdGQ+XG4gICAgICA8dGQ+XG4gICAgICAgIDxzbWFsbD5Qcm9maXQve2J5U3RyaW5nfTwvc21hbGw+XG4gICAgICAgIDxiIHYtZm9ybWF0LW1vbmV5PXtTdG9yZS5jdXJyZW5jeX0+e3Jlc3VsdC5wcm9maXR9PC9iPlxuICAgICAgPC90ZD5cbiAgICA8L3RyPlxuICApO1xufVxuXG5mdW5jdGlvbiBSZXN1bHRzKCkge1xuICBpZiAoU3RvcmUubG9hZGluZykge1xuICAgIHJldHVybiA8ZGl2PkxvYWRpbmcuLi48L2Rpdj47XG4gIH1cblxuICByZXR1cm4gKFxuICAgIDx0ciBjbGFzcz1cInJlc3VsdHNcIj5cbiAgICAgIDx0ZCBjb2xzcGFuPVwiMlwiPlxuICAgICAgICA8ZGw+XG4gICAgICAgICAgPGR0PlxuICAgICAgICAgICAgPGRkPlxuICAgICAgICAgICAgICBDb3N0IGJ5IDxzcGFuIGNsYXNzPVwidGV4dC1zbVwiPntTdG9yZS5jb2luLm5hbWV9PC9zcGFuPiBtaW5lZFxuICAgICAgICAgICAgPC9kZD5cbiAgICAgICAgICAgIDxkZD5cbiAgICAgICAgICAgICAgPGIgdi1mb3JtYXQtbW9uZXk9e1N0b3JlLmN1cnJlbmN5fT57U3RvcmUucmVzdWx0LmNvc3RQZXJNaW5lZENvaW59PC9iPlxuICAgICAgICAgICAgPC9kZD5cbiAgICAgICAgICA8L2R0PlxuICAgICAgICAgIDxkdD5cbiAgICAgICAgICAgIDxkZD5FbGVjdHJpY2l0eSBCcmVha0V2ZW48L2RkPlxuICAgICAgICAgICAgPGRkPlxuICAgICAgICAgICAgICA8YiB2LWZvcm1hdC1tb25leT17U3RvcmUuY3VycmVuY3l9PntTdG9yZS5yZXN1bHQuZWxlY3RyaWNpdHlQcmljZUJyZWFrRXZlbn08L2I+XG4gICAgICAgICAgICA8L2RkPlxuICAgICAgICAgIDwvZHQ+XG4gICAgICAgICAgPGR0PlxuICAgICAgICAgICAgPGRkPkhhc2hwcmljZTwvZGQ+XG4gICAgICAgICAgICA8ZGQ+XG4gICAgICAgICAgICAgIDxiIHYtZm9ybWF0LW1vbmV5PXtTdG9yZS5jdXJyZW5jeX0+e1N0b3JlLnJlc3VsdC5oYXNoUHJpY2V9PC9iPlxuICAgICAgICAgICAgPC9kZD5cbiAgICAgICAgICA8L2R0PlxuICAgICAgICA8L2RsPlxuICAgICAgPC90ZD5cbiAgICAgIDx0ZCBjb2xzcGFuPVwiMlwiPlxuICAgICAgICA8Yj5Qcm9maXQgYnkgbW9udGg8L2I+XG4gICAgICAgIDxiIHYtZm9ybWF0LW1vbmV5PXtTdG9yZS5jdXJyZW5jeX0+e1N0b3JlLnJlc3VsdC5tb250aGx5LnByb2ZpdH08L2I+XG4gICAgICA8L3RkPlxuICAgIDwvdHI+XG4gICk7XG59XG5cbmNvbnN0IGNhbGN1bGF0b3JTZXJ2aWNlID0gbmV3IENhbGN1bGF0b3JTZXJ2aWNlKCk7XG5cbmFzeW5jIGZ1bmN0aW9uIGNvbXB1dGVQcm9maXQoKSB7XG4gIGlmIChTdG9yZS5jb25maWdbU3RvcmUuY29pbi5zeW1ib2xdID09PSB1bmRlZmluZWQgfHwgU3RvcmUuY29uZmlnW1N0b3JlLmNvaW4uc3ltYm9sXS5oYXNoUmF0ZUFtb3VudCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgU3RvcmUubG9hZGluZyA9IHRydWU7XG5cbiAgaWYgKFN0b3JlLmNvbmZpZy5wb3dlckNvc3QgPT09IHVuZGVmaW5lZCkge1xuICAgIFN0b3JlLmNvbmZpZy5wb3dlckNvc3QgPT09IDA7XG4gIH1cbiAgaWYgKFN0b3JlLmNvbmZpZy5wb29sRmVlID09PSB1bmRlZmluZWQpIHtcbiAgICBTdG9yZS5jb25maWcucG9vbEZlZSA9PT0gMDtcbiAgfVxuXG4gIGNvbnN0IGhhc2hSYXRlID0gY2FsY3VsYXRvclNlcnZpY2UuZ2V0SGFzaFJhdGVGcm9tU3RyaW5nKFxuICAgIFN0b3JlLmNvbmZpZ1tTdG9yZS5jb2luLnN5bWJvbF0uaGFzaFJhdGVUeXBlLFxuICAgIFN0b3JlLmNvbmZpZ1tTdG9yZS5jb2luLnN5bWJvbF0uaGFzaFJhdGVBbW91bnRcbiAgKTtcblxuICBsZXQgcmVzdWx0cyA9IGF3YWl0IGNhbGN1bGF0b3JTZXJ2aWNlLmNhbGN1bGF0ZUNvaW5Gb3JIYXNoUmF0ZSh7XG4gICAgY3VzdG9tUHJpY2U6IFN0b3JlLmNvbmZpZy5jdXN0b21QcmljZSxcbiAgICBjdXN0b21EYWlseU1pbmVkOiBTdG9yZS5jb25maWcuY3VzdG9tRGFpbHlNaW5lZCxcbiAgICBjb2luU3ltYm9sOiBDb2luU3ltYm9sRW51bVtTdG9yZS5jb2luLnN5bWJvbF0sXG4gICAgaGFzaFJhdGUsXG4gICAgcG93ZXI6IFN0b3JlLmNvbmZpZ1tTdG9yZS5jb2luLnN5bWJvbF0ucG93ZXIsXG4gICAgcG93ZXJDb3N0OiBTdG9yZS5jb25maWcucG93ZXJDb3N0LFxuICAgIGN1cnJlbmN5OiBTdG9yZS5jdXJyZW5jeSxcbiAgICBwb29sRmVlOiBTdG9yZS5jb25maWcucG9vbEZlZSAvIDEwMFxuICB9KTtcblxuICBTdG9yZS5yZXN1bHQgPSByZXN1bHRzO1xuICBTdG9yZS5jb25maWcuY3VzdG9tUHJpY2UgPSByZXN1bHRzLnByaWNlO1xuICBTdG9yZS5jb25maWcuY3VzdG9tRGFpbHlNaW5lZCA9IHJlc3VsdHMuZGFpbHkubWluZWQ7XG5cbiAgU3RvcmUubG9hZGluZyA9IGZhbHNlO1xuICB1cGRhdGUoKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIEFwcCgpIHtcbiAgbGV0IHJlZiA9IHVzZVJlZihudWxsKTtcblxuICAvLyBSZXNldCB0aGUgY3VzdG9tIHByaWNlIHdoZW4gdGhlIGNvaW4gb3IgY3VycmVuY3kgY2hhbmdlc1xuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIFN0b3JlLmNvbmZpZy5jdXN0b21QcmljZSA9IG51bGw7XG4gIH0sIFtTdG9yZS5jb2luLnN5bWJvbCwgU3RvcmUuY3VycmVuY3ldKTtcblxuICAvLyBSZXNldCB0aGUgY3VzdG9tIGRhaWx5IG1pbmVkIHdoZW4gdGhlIGNvbmZpZyBjaGFuZ2VzXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgU3RvcmUuY29uZmlnLmN1c3RvbURhaWx5TWluZWQgPSBudWxsO1xuICB9LCBbXG4gICAgU3RvcmUuY29pbi5zeW1ib2wsXG4gICAgU3RvcmUuY3VycmVuY3ksXG4gICAgU3RvcmUuY29uZmlnW1N0b3JlLmNvaW4uc3ltYm9sXS5oYXNoUmF0ZUFtb3VudCxcbiAgICBTdG9yZS5jb25maWdbU3RvcmUuY29pbi5zeW1ib2xdLmhhc2hSYXRlVHlwZSxcbiAgICBTdG9yZS5jb25maWdbU3RvcmUuY29pbi5zeW1ib2xdLnBvd2VyLFxuICAgIFN0b3JlLmNvbmZpZy5wb3dlckNvc3QsXG4gICAgU3RvcmUuY29uZmlnLnBvb2xGZWVcbiAgXSk7XG5cbiAgLy8gQ29tcHV0ZSBwcm9maXQgb25seSBpbiB0aGUgZmlyc3QgcmVuZGVyXG4gIHVzZUVmZmVjdChjb21wdXRlUHJvZml0LCBbXSk7XG5cbiAgLy8gQ29tcHV0ZSBwcm9maXQgb24gZXZlcnkgY2hhbmdlXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKHJlZi5jdXJyZW50KSB7XG4gICAgICBjb21wdXRlUHJvZml0KCk7XG4gICAgfVxuICB9LCBbXG4gICAgU3RvcmUuY29uZmlnLmN1c3RvbURhaWx5TWluZWQsXG4gICAgU3RvcmUuY29uZmlnLmN1c3RvbVByaWNlLFxuICAgIFN0b3JlLmNvaW4uc3ltYm9sLFxuICAgIFN0b3JlLmN1cnJlbmN5LFxuICAgIFN0b3JlLmNvbmZpZ1tTdG9yZS5jb2luLnN5bWJvbF0uaGFzaFJhdGVBbW91bnQsXG4gICAgU3RvcmUuY29uZmlnW1N0b3JlLmNvaW4uc3ltYm9sXS5oYXNoUmF0ZVR5cGUsXG4gICAgU3RvcmUuY29uZmlnW1N0b3JlLmNvaW4uc3ltYm9sXS5wb3dlcixcbiAgICBTdG9yZS5jb25maWcucG93ZXJDb3N0LFxuICAgIFN0b3JlLmNvbmZpZy5wb29sRmVlXG4gIF0pO1xuXG4gIHJldHVybiBbXG4gICAgPENvaW5OYXYgLz4sXG4gICAgPGFydGljbGUgY2xhc3M9XCJmbGV4XCIgdi1yZWY9e3JlZn0+XG4gICAgICA8Q3VycmVuY3lOYXYgLz5cbiAgICAgIDxzZWN0aW9uIGNsYXNzPVwiY29pbi1jb250YWluZXIgZmxleCBmbGV4LTFcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImNvaW4tZGVzY3JpcHRpb25cIj5cbiAgICAgICAgICA8Q29pbkRlc2NyaXB0aW9uIC8+XG4gICAgICAgICAgPENvbmZpZ1NlY3Rpb24gLz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPHRhYmxlIGNsYXNzPVwiY29pbi1yZXN1bHQgZmxleC0xXCI+XG4gICAgICAgICAgPHRib2R5PlxuICAgICAgICAgICAgPFJlc3VsdEJ5IGJ5PVwiZGFpbHlcIiAvPlxuICAgICAgICAgICAgPFJlc3VsdEJ5IGJ5PVwid2Vla2x5XCIgLz5cbiAgICAgICAgICAgIDxSZXN1bHRCeSBieT1cIm1vbnRobHlcIiAvPlxuICAgICAgICAgICAgPFJlc3VsdEJ5IGJ5PVwieWVhcmx5XCIgLz5cbiAgICAgICAgICAgIDxSZXN1bHRzIC8+XG4gICAgICAgICAgPC90Ym9keT5cbiAgICAgICAgPC90YWJsZT5cbiAgICAgIDwvc2VjdGlvbj5cbiAgICA8L2FydGljbGU+LFxuICAgIDxzbWFsbCBjbGFzcz1cIm5vdGUgdGV4dC1zbSB0ZXh0LXJpZ2h0XCI+RGF0YSBpcyB1cGRhdGVkIGV2ZXJ5IDMwIG1pbnV0ZXM8L3NtYWxsPlxuICBdO1xufVxuIiwgImltcG9ydCBcIi4vYnVzaW5lc3MtbG9naWMvY3J5cHRvLWNhbGN1bGF0b3Itc2VydmljZVwiO1xuXG5pbXBvcnQgeyBkaXJlY3RpdmUsIG1vdW50LCB2IH0gZnJvbSBcInZhbHlyaWFuLmpzXCI7XG5pbXBvcnQgeyBmb3JtYXRNb25leURpcmVjdGl2ZSwgZm9ybWF0TnVtYmVyRGlyZWN0aXZlIH0gZnJvbSBcIi4vY29tbW9uL2Zvcm1hdC1udW1iZXJcIjtcblxuaW1wb3J0IHsgQXBwIH0gZnJvbSBcIi4vYXBwXCI7XG5cbmRpcmVjdGl2ZShcImZvcm1hdC1udW1iZXJcIiwgZm9ybWF0TnVtYmVyRGlyZWN0aXZlKTtcbmRpcmVjdGl2ZShcImZvcm1hdC1tb25leVwiLCBmb3JtYXRNb25leURpcmVjdGl2ZSk7XG5cbm1vdW50KFwiYm9keVwiLCBBcHApO1xuIl0sCiAgIm1hcHBpbmdzIjogIjs7QUFDQSxNQUFJLFVBQVU7QUFDZCxNQUFJLFdBQVcsUUFBUSxPQUFPLFlBQVksZUFBZSxRQUFRLFlBQVksUUFBUSxTQUFTLElBQUk7QUFDbEcsV0FBUyxpQkFBaUIsS0FBSyxRQUFRLE9BQU87QUFDNUMsV0FBTyxRQUFRLFNBQVMsZ0JBQWdCLDhCQUE4QixHQUFHLElBQUksU0FBUyxjQUFjLEdBQUc7QUFBQSxFQUN6RztBQUNBLE1BQUksUUFBUSxTQUFTLE9BQU8sS0FBSyxPQUFPLFVBQVU7QUFDaEQsU0FBSyxNQUFNO0FBQ1gsU0FBSyxRQUFRO0FBQ2IsU0FBSyxXQUFXO0FBQUEsRUFDbEI7QUFDQSxXQUFTLFlBQVksV0FBVztBQUM5QixXQUFPLGNBQWMsT0FBTyxjQUFjLGNBQWMsT0FBTyxjQUFjLFlBQVksVUFBVTtBQUFBLEVBQ3JHO0FBQ0EsTUFBSSxVQUFVLENBQUMsV0FBVztBQUN4QixXQUFPLGtCQUFrQjtBQUFBLEVBQzNCO0FBQ0EsTUFBSSxtQkFBbUIsQ0FBQyxXQUFXO0FBQ2pDLFdBQU8sUUFBUSxNQUFNLEtBQUssWUFBWSxPQUFPLEdBQUc7QUFBQSxFQUNsRDtBQUNBLFdBQVMsV0FBVyxLQUFLO0FBQ3ZCLFFBQUksV0FBVyxDQUFDO0FBQ2hCLGFBQVMsSUFBSSxHQUFHLElBQUksSUFBSSxXQUFXLFFBQVEsSUFBSSxHQUFHLEtBQUs7QUFDckQsVUFBSSxXQUFXLElBQUksV0FBVztBQUM5QixVQUFJLFNBQVMsYUFBYSxHQUFHO0FBQzNCLFlBQUksU0FBUyxJQUFJLE1BQU0sU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ3RDLGVBQU8sTUFBTTtBQUNiLGlCQUFTLEtBQUssTUFBTTtBQUNwQjtBQUFBLE1BQ0Y7QUFDQSxVQUFJLFNBQVMsYUFBYSxHQUFHO0FB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O0FBQUEsUUFBUSxPQUFNO0FBQUEsU0FDYixrQkFBQztBQUFBLFFBQUksT0FBTTtBQUFBLFNBQ1Qsa0JBQUMscUJBQWdCLEdBQ2pCLGtCQUFDLG1CQUFjLENBQ2pCLEdBRUEsa0JBQUM7QUFBQSxRQUFNLE9BQU07QUFBQSxTQUNYLGtCQUFDLGVBQ0Msa0JBQUM7QUFBQSxRQUFTLElBQUc7QUFBQSxPQUFRLEdBQ3JCLGtCQUFDO0FBQUEsUUFBUyxJQUFHO0FBQUEsT0FBUyxHQUN0QixrQkFBQztBQUFBLFFBQVMsSUFBRztBQUFBLE9BQVUsR0FDdkIsa0JBQUM7QUFBQSxRQUFTLElBQUc7QUFBQSxPQUFTLEdBQ3RCLGtCQUFDLGFBQVEsQ0FDWCxDQUNGLENBQ0YsQ0FDRjtBQUFBLE1BQ0Esa0JBQUM7QUFBQSxRQUFNLE9BQU07QUFBQSxTQUEwQixrQ0FBZ0M7QUFBQSxJQUN6RTtBQUFBLEVBQ0Y7OztBQzlYQSxZQUFVLGlCQUFpQixxQkFBcUI7QUFDaEQsWUFBVSxnQkFBZ0Isb0JBQW9CO0FBRTlDLFFBQU0sUUFBUSxHQUFHOyIsCiAgIm5hbWVzIjogWyJDb2luU3ltYm9sRW51bSIsICJDdXJyZW5jeUVudW0iLCAiSGFzaFJhdGVTdHJpbmdUb051bWJlciIsICJjb2luIiwgIkN1cnJlbmN5VG9MYW5ndWFnZUVudW0iLCAiUmVzdWx0QnlTdHJpbmdFbnVtIl0KfQo=