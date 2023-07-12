/*! For license information please see lab.js.LICENSE.txt */
if (process.browser) {
  !(function (t, e) {
    "object" == typeof exports && "object" == typeof module
      ? (module.exports = e())
      : "function" == typeof define && define.amd
      ? define("lab", [], e)
      : "object" == typeof exports
      ? (exports.lab = e())
      : (t.lab = e());
  })(self, () =>
    (() => {
      var t = {
          782: function (t, e, n) {
            var r, i, o;
            (i = []),
              (r = function () {
                "use strict";
                function e(t, e) {
                  return (
                    void 0 === e
                      ? (e = { autoBom: !1 })
                      : "object" != typeof e &&
                        (console.warn(
                          "Deprecated: Expected third argument to be a object"
                        ),
                        (e = { autoBom: !e })),
                    e.autoBom &&
                    /^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(
                      t.type
                    )
                      ? new Blob(["\ufeff", t], { type: t.type })
                      : t
                  );
                }
                function r(t, e, n) {
                  var r = new XMLHttpRequest();
                  r.open("GET", t),
                    (r.responseType = "blob"),
                    (r.onload = function () {
                      l(r.response, e, n);
                    }),
                    (r.onerror = function () {
                      console.error("could not download file");
                    }),
                    r.send();
                }
                function i(t) {
                  var e = new XMLHttpRequest();
                  e.open("HEAD", t, !1);
                  try {
                    e.send();
                  } catch (t) {}
                  return 200 <= e.status && 299 >= e.status;
                }
                function o(t) {
                  try {
                    t.dispatchEvent(new MouseEvent("click"));
                  } catch (n) {
                    var e = document.createEvent("MouseEvents");
                    e.initMouseEvent(
                      "click",
                      !0,
                      !0,
                      window,
                      0,
                      0,
                      0,
                      80,
                      20,
                      !1,
                      !1,
                      !1,
                      !1,
                      0,
                      null
                    ),
                      t.dispatchEvent(e);
                  }
                }
                var a =
                    "object" == typeof window && window.window === window
                      ? window
                      : "object" == typeof self && self.self === self
                      ? self
                      : "object" == typeof n.g && n.g.global === n.g
                      ? n.g
                      : void 0,
                  s =
                    a.navigator &&
                    /Macintosh/.test(navigator.userAgent) &&
                    /AppleWebKit/.test(navigator.userAgent) &&
                    !/Safari/.test(navigator.userAgent),
                  l =
                    a.saveAs ||
                    ("object" != typeof window || window !== a
                      ? function () {}
                      : "download" in HTMLAnchorElement.prototype && !s
                      ? function (t, e, n) {
                          var s = a.URL || a.webkitURL,
                            l = document.createElement("a");
                          (e = e || t.name || "download"),
                            (l.download = e),
                            (l.rel = "noopener"),
                            "string" == typeof t
                              ? ((l.href = t),
                                l.origin === location.origin
                                  ? o(l)
                                  : i(l.href)
                                  ? r(t, e, n)
                                  : o(l, (l.target = "_blank")))
                              : ((l.href = s.createObjectURL(t)),
                                setTimeout(function () {
                                  s.revokeObjectURL(l.href);
                                }, 4e4),
                                setTimeout(function () {
                                  o(l);
                                }, 0));
                        }
                      : "msSaveOrOpenBlob" in navigator
                      ? function (t, n, a) {
                          if (
                            ((n = n || t.name || "download"),
                            "string" != typeof t)
                          )
                            navigator.msSaveOrOpenBlob(e(t, a), n);
                          else if (i(t)) r(t, n, a);
                          else {
                            var s = document.createElement("a");
                            (s.href = t),
                              (s.target = "_blank"),
                              setTimeout(function () {
                                o(s);
                              });
                          }
                        }
                      : function (t, e, n, i) {
                          if (
                            ((i = i || open("", "_blank")) &&
                              (i.document.title = i.document.body.innerText =
                                "downloading..."),
                            "string" == typeof t)
                          )
                            return r(t, e, n);
                          var o = "application/octet-stream" === t.type,
                            l = /constructor/i.test(a.HTMLElement) || a.safari,
                            u = /CriOS\/[\d]+/.test(navigator.userAgent);
                          if (
                            (u || (o && l) || s) &&
                            "undefined" != typeof FileReader
                          ) {
                            var c = new FileReader();
                            (c.onloadend = function () {
                              var t = c.result;
                              (t = u
                                ? t
                                : t.replace(
                                    /^data:[^;]*;/,
                                    "data:attachment/file;"
                                  )),
                                i ? (i.location.href = t) : (location = t),
                                (i = null);
                            }),
                              c.readAsDataURL(t);
                          } else {
                            var f = a.URL || a.webkitURL,
                              h = f.createObjectURL(t);
                            i ? (i.location = h) : (location.href = h),
                              (i = null),
                              setTimeout(function () {
                                f.revokeObjectURL(h);
                              }, 4e4);
                          }
                        });
                (a.saveAs = l.saveAs = l), (t.exports = l);
              }),
              void 0 === (o = "function" == typeof r ? r.apply(e, i) : r) ||
                (t.exports = o);
          },
          421: function (t, e, n) {
            var r;
            !(function (t, i, o) {
              function a(t) {
                var e,
                  n = this,
                  r =
                    ((e = 4022871197),
                    function (t) {
                      t = String(t);
                      for (var n = 0; n < t.length; n++) {
                        var r = 0.02519603282416938 * (e += t.charCodeAt(n));
                        (r -= e = r >>> 0),
                          (e = (r *= e) >>> 0),
                          (e += 4294967296 * (r -= e));
                      }
                      return 2.3283064365386963e-10 * (e >>> 0);
                    });
                (n.next = function () {
                  var t = 2091639 * n.s0 + 2.3283064365386963e-10 * n.c;
                  return (
                    (n.s0 = n.s1), (n.s1 = n.s2), (n.s2 = t - (n.c = 0 | t))
                  );
                }),
                  (n.c = 1),
                  (n.s0 = r(" ")),
                  (n.s1 = r(" ")),
                  (n.s2 = r(" ")),
                  (n.s0 -= r(t)),
                  n.s0 < 0 && (n.s0 += 1),
                  (n.s1 -= r(t)),
                  n.s1 < 0 && (n.s1 += 1),
                  (n.s2 -= r(t)),
                  n.s2 < 0 && (n.s2 += 1),
                  (r = null);
              }
              function s(t, e) {
                return (
                  (e.c = t.c), (e.s0 = t.s0), (e.s1 = t.s1), (e.s2 = t.s2), e
                );
              }
              function l(t, e) {
                var n = new a(t),
                  r = e && e.state,
                  i = n.next;
                return (
                  (i.int32 = function () {
                    return (4294967296 * n.next()) | 0;
                  }),
                  (i.double = function () {
                    return i() + 11102230246251565e-32 * ((2097152 * i()) | 0);
                  }),
                  (i.quick = i),
                  r &&
                    ("object" == typeof r && s(r, n),
                    (i.state = function () {
                      return s(n, {});
                    })),
                  i
                );
              }
              i && i.exports
                ? (i.exports = l)
                : n.amdD && n.amdO
                ? void 0 ===
                    (r = function () {
                      return l;
                    }.call(e, n, e, i)) || (i.exports = r)
                : (this.alea = l);
            })(0, (t = n.nmd(t)), n.amdD);
          },
          137: () => {
            !(function () {
              "use strict";
              if (self.document) {
                var t = KeyboardEvent.prototype,
                  e = Object.getOwnPropertyDescriptor(t, "key");
                if (e) {
                  var n = {
                    Win: "Meta",
                    Scroll: "ScrollLock",
                    Spacebar: " ",
                    Down: "ArrowDown",
                    Left: "ArrowLeft",
                    Right: "ArrowRight",
                    Up: "ArrowUp",
                    Del: "Delete",
                    Apps: "ContextMenu",
                    Esc: "Escape",
                    Multiply: "*",
                    Add: "+",
                    Subtract: "-",
                    Decimal: ".",
                    Divide: "/",
                  };
                  Object.defineProperty(t, "key", {
                    get: function () {
                      var t = e.get.call(this);
                      return n.hasOwnProperty(t) ? n[t] : t;
                    },
                  });
                }
              }
            })();
          },
          353: function (t, e, n) {
            var r;
            !(function (i, o) {
              "use strict";
              var a = "function",
                s = "undefined",
                l = "object",
                u = "string",
                c = "model",
                f = "name",
                h = "type",
                p = "vendor",
                d = "version",
                v = "architecture",
                m = "console",
                g = "mobile",
                w = "tablet",
                b = "smarttv",
                y = "wearable",
                _ = "embedded",
                x = "Amazon",
                j = "Apple",
                k = "ASUS",
                E = "BlackBerry",
                O = "Firefox",
                S = "Google",
                T = "Huawei",
                C = "LG",
                A = "Microsoft",
                P = "Motorola",
                R = "Opera",
                $ = "Samsung",
                M = "Sony",
                q = "Xiaomi",
                I = "Zebra",
                L = "Facebook",
                z = function (t) {
                  for (var e = {}, n = 0; n < t.length; n++)
                    e[t[n].toUpperCase()] = t[n];
                  return e;
                },
                D = function (t, e) {
                  return typeof t === u && -1 !== F(e).indexOf(F(t));
                },
                F = function (t) {
                  return t.toLowerCase();
                },
                W = function (t, e) {
                  if (typeof t === u)
                    return (
                      (t = t.replace(/^\s\s*/, "").replace(/\s\s*$/, "")),
                      typeof e === s ? t : t.substring(0, 255)
                    );
                },
                U = function (t, e) {
                  for (var n, r, i, s, u, c, f = 0; f < e.length && !u; ) {
                    var h = e[f],
                      p = e[f + 1];
                    for (n = r = 0; n < h.length && !u; )
                      if ((u = h[n++].exec(t)))
                        for (i = 0; i < p.length; i++)
                          (c = u[++r]),
                            typeof (s = p[i]) === l && s.length > 0
                              ? 2 === s.length
                                ? typeof s[1] == a
                                  ? (this[s[0]] = s[1].call(this, c))
                                  : (this[s[0]] = s[1])
                                : 3 === s.length
                                ? typeof s[1] !== a || (s[1].exec && s[1].test)
                                  ? (this[s[0]] = c ? c.replace(s[1], s[2]) : o)
                                  : (this[s[0]] = c
                                      ? s[1].call(this, c, s[2])
                                      : o)
                                : 4 === s.length &&
                                  (this[s[0]] = c
                                    ? s[3].call(this, c.replace(s[1], s[2]))
                                    : o)
                              : (this[s] = c || o);
                    f += 2;
                  }
                },
                B = function (t, e) {
                  for (var n in e)
                    if (typeof e[n] === l && e[n].length > 0) {
                      for (var r = 0; r < e[n].length; r++)
                        if (D(e[n][r], t)) return "?" === n ? o : n;
                    } else if (D(e[n], t)) return "?" === n ? o : n;
                  return t;
                },
                N = {
                  ME: "4.90",
                  "NT 3.11": "NT3.51",
                  "NT 4.0": "NT4.0",
                  2e3: "NT 5.0",
                  XP: ["NT 5.1", "NT 5.2"],
                  Vista: "NT 6.0",
                  7: "NT 6.1",
                  8: "NT 6.2",
                  8.1: "NT 6.3",
                  10: ["NT 6.4", "NT 10.0"],
                  RT: "ARM",
                },
                H = {
                  browser: [
                    [/\b(?:crmo|crios)\/([\w\.]+)/i],
                    [d, [f, "Chrome"]],
                    [/edg(?:e|ios|a)?\/([\w\.]+)/i],
                    [d, [f, "Edge"]],
                    [
                      /(opera mini)\/([-\w\.]+)/i,
                      /(opera [mobiletab]{3,6})\b.+version\/([-\w\.]+)/i,
                      /(opera)(?:.+version\/|[\/ ]+)([\w\.]+)/i,
                    ],
                    [f, d],
                    [/opios[\/ ]+([\w\.]+)/i],
                    [d, [f, "Opera Mini"]],
                    [/\bopr\/([\w\.]+)/i],
                    [d, [f, R]],
                    [
                      /(kindle)\/([\w\.]+)/i,
                      /(lunascape|maxthon|netfront|jasmine|blazer)[\/ ]?([\w\.]*)/i,
                      /(avant |iemobile|slim)(?:browser)?[\/ ]?([\w\.]*)/i,
                      /(ba?idubrowser)[\/ ]?([\w\.]+)/i,
                      /(?:ms|\()(ie) ([\w\.]+)/i,
                      /(flock|rockmelt|midori|epiphany|silk|skyfire|ovibrowser|bolt|iron|vivaldi|iridium|phantomjs|bowser|quark|qupzilla|falkon|rekonq|puffin|brave|whale|qqbrowserlite|qq)\/([-\w\.]+)/i,
                      /(weibo)__([\d\.]+)/i,
                    ],
                    [f, d],
                    [/(?:\buc? ?browser|(?:juc.+)ucweb)[\/ ]?([\w\.]+)/i],
                    [d, [f, "UCBrowser"]],
                    [/\bqbcore\/([\w\.]+)/i],
                    [d, [f, "WeChat(Win) Desktop"]],
                    [/micromessenger\/([\w\.]+)/i],
                    [d, [f, "WeChat"]],
                    [/konqueror\/([\w\.]+)/i],
                    [d, [f, "Konqueror"]],
                    [/trident.+rv[: ]([\w\.]{1,9})\b.+like gecko/i],
                    [d, [f, "IE"]],
                    [/yabrowser\/([\w\.]+)/i],
                    [d, [f, "Yandex"]],
                    [/(avast|avg)\/([\w\.]+)/i],
                    [[f, /(.+)/, "$1 Secure Browser"], d],
                    [/\bfocus\/([\w\.]+)/i],
                    [d, [f, "Firefox Focus"]],
                    [/\bopt\/([\w\.]+)/i],
                    [d, [f, "Opera Touch"]],
                    [/coc_coc\w+\/([\w\.]+)/i],
                    [d, [f, "Coc Coc"]],
                    [/dolfin\/([\w\.]+)/i],
                    [d, [f, "Dolphin"]],
                    [/coast\/([\w\.]+)/i],
                    [d, [f, "Opera Coast"]],
                    [/miuibrowser\/([\w\.]+)/i],
                    [d, [f, "MIUI Browser"]],
                    [/fxios\/([-\w\.]+)/i],
                    [d, [f, O]],
                    [/\bqihu|(qi?ho?o?|360)browser/i],
                    [[f, "360 Browser"]],
                    [/(oculus|samsung|sailfish)browser\/([\w\.]+)/i],
                    [[f, /(.+)/, "$1 Browser"], d],
                    [/(comodo_dragon)\/([\w\.]+)/i],
                    [[f, /_/g, " "], d],
                    [
                      /(electron)\/([\w\.]+) safari/i,
                      /(tesla)(?: qtcarbrowser|\/(20\d\d\.[-\w\.]+))/i,
                      /m?(qqbrowser|baiduboxapp|2345Explorer)[\/ ]?([\w\.]+)/i,
                    ],
                    [f, d],
                    [/(metasr)[\/ ]?([\w\.]+)/i, /(lbbrowser)/i],
                    [f],
                    [
                      /((?:fban\/fbios|fb_iab\/fb4a)(?!.+fbav)|;fbav\/([\w\.]+);)/i,
                    ],
                    [[f, L], d],
                    [
                      /safari (line)\/([\w\.]+)/i,
                      /\b(line)\/([\w\.]+)\/iab/i,
                      /(chromium|instagram)[\/ ]([-\w\.]+)/i,
                    ],
                    [f, d],
                    [/\bgsa\/([\w\.]+) .*safari\//i],
                    [d, [f, "GSA"]],
                    [/headlesschrome(?:\/([\w\.]+)| )/i],
                    [d, [f, "Chrome Headless"]],
                    [/ wv\).+(chrome)\/([\w\.]+)/i],
                    [[f, "Chrome WebView"], d],
                    [/droid.+ version\/([\w\.]+)\b.+(?:mobile safari|safari)/i],
                    [d, [f, "Android Browser"]],
                    [
                      /(chrome|omniweb|arora|[tizenoka]{5} ?browser)\/v?([\w\.]+)/i,
                    ],
                    [f, d],
                    [/version\/([\w\.]+) .*mobile\/\w+ (safari)/i],
                    [d, [f, "Mobile Safari"]],
                    [/version\/([\w\.]+) .*(mobile ?safari|safari)/i],
                    [d, f],
                    [/webkit.+?(mobile ?safari|safari)(\/[\w\.]+)/i],
                    [
                      f,
                      [
                        d,
                        B,
                        {
                          "1.0": "/8",
                          1.2: "/1",
                          1.3: "/3",
                          "2.0": "/412",
                          "2.0.2": "/416",
                          "2.0.3": "/417",
                          "2.0.4": "/419",
                          "?": "/",
                        },
                      ],
                    ],
                    [/(webkit|khtml)\/([\w\.]+)/i],
                    [f, d],
                    [/(navigator|netscape\d?)\/([-\w\.]+)/i],
                    [[f, "Netscape"], d],
                    [/mobile vr; rv:([\w\.]+)\).+firefox/i],
                    [d, [f, "Firefox Reality"]],
                    [
                      /ekiohf.+(flow)\/([\w\.]+)/i,
                      /(swiftfox)/i,
                      /(icedragon|iceweasel|camino|chimera|fennec|maemo browser|minimo|conkeror|klar)[\/ ]?([\w\.\+]+)/i,
                      /(seamonkey|k-meleon|icecat|iceape|firebird|phoenix|palemoon|basilisk|waterfox)\/([-\w\.]+)$/i,
                      /(firefox)\/([\w\.]+)/i,
                      /(mozilla)\/([\w\.]+) .+rv\:.+gecko\/\d+/i,
                      /(polaris|lynx|dillo|icab|doris|amaya|w3m|netsurf|sleipnir|obigo|mosaic|(?:go|ice|up)[\. ]?browser)[-\/ ]?v?([\w\.]+)/i,
                      /(links) \(([\w\.]+)/i,
                    ],
                    [f, d],
                  ],
                  cpu: [
                    [/(?:(amd|x(?:(?:86|64)[-_])?|wow|win)64)[;\)]/i],
                    [[v, "amd64"]],
                    [/(ia32(?=;))/i],
                    [[v, F]],
                    [/((?:i[346]|x)86)[;\)]/i],
                    [[v, "ia32"]],
                    [/\b(aarch64|arm(v?8e?l?|_?64))\b/i],
                    [[v, "arm64"]],
                    [/\b(arm(?:v[67])?ht?n?[fl]p?)\b/i],
                    [[v, "armhf"]],
                    [/windows (ce|mobile); ppc;/i],
                    [[v, "arm"]],
                    [/((?:ppc|powerpc)(?:64)?)(?: mac|;|\))/i],
                    [[v, /ower/, "", F]],
                    [/(sun4\w)[;\)]/i],
                    [[v, "sparc"]],
                    [
                      /((?:avr32|ia64(?=;))|68k(?=\))|\barm(?=v(?:[1-7]|[5-7]1)l?|;|eabi)|(?=atmel )avr|(?:irix|mips|sparc)(?:64)?\b|pa-risc)/i,
                    ],
                    [[v, F]],
                  ],
                  device: [
                    [
                      /\b(sch-i[89]0\d|shw-m380s|sm-[pt]\w{2,4}|gt-[pn]\d{2,4}|sgh-t8[56]9|nexus 10)/i,
                    ],
                    [c, [p, $], [h, w]],
                    [
                      /\b((?:s[cgp]h|gt|sm)-\w+|galaxy nexus)/i,
                      /samsung[- ]([-\w]+)/i,
                      /sec-(sgh\w+)/i,
                    ],
                    [c, [p, $], [h, g]],
                    [/\((ip(?:hone|od)[\w ]*);/i],
                    [c, [p, j], [h, g]],
                    [
                      /\((ipad);[-\w\),; ]+apple/i,
                      /applecoremedia\/[\w\.]+ \((ipad)/i,
                      /\b(ipad)\d\d?,\d\d?[;\]].+ios/i,
                    ],
                    [c, [p, j], [h, w]],
                    [
                      /\b((?:ag[rs][23]?|bah2?|sht?|btv)-a?[lw]\d{2})\b(?!.+d\/s)/i,
                    ],
                    [c, [p, T], [h, w]],
                    [
                      /(?:huawei|honor)([-\w ]+)[;\)]/i,
                      /\b(nexus 6p|\w{2,4}-[atu]?[ln][01259x][012359][an]?)\b(?!.+d\/s)/i,
                    ],
                    [c, [p, T], [h, g]],
                    [
                      /\b(poco[\w ]+)(?: bui|\))/i,
                      /\b; (\w+) build\/hm\1/i,
                      /\b(hm[-_ ]?note?[_ ]?(?:\d\w)?) bui/i,
                      /\b(redmi[\-_ ]?(?:note|k)?[\w_ ]+)(?: bui|\))/i,
                      /\b(mi[-_ ]?(?:a\d|one|one[_ ]plus|note lte|max)?[_ ]?(?:\d?\w?)[_ ]?(?:plus|se|lite)?)(?: bui|\))/i,
                    ],
                    [
                      [c, /_/g, " "],
                      [p, q],
                      [h, g],
                    ],
                    [/\b(mi[-_ ]?(?:pad)(?:[\w_ ]+))(?: bui|\))/i],
                    [
                      [c, /_/g, " "],
                      [p, q],
                      [h, w],
                    ],
                    [
                      /; (\w+) bui.+ oppo/i,
                      /\b(cph[12]\d{3}|p(?:af|c[al]|d\w|e[ar])[mt]\d0|x9007|a101op)\b/i,
                    ],
                    [c, [p, "OPPO"], [h, g]],
                    [
                      /vivo (\w+)(?: bui|\))/i,
                      /\b(v[12]\d{3}\w?[at])(?: bui|;)/i,
                    ],
                    [c, [p, "Vivo"], [h, g]],
                    [/\b(rmx[12]\d{3})(?: bui|;|\))/i],
                    [c, [p, "Realme"], [h, g]],
                    [
                      /\b(milestone|droid(?:[2-4x]| (?:bionic|x2|pro|razr))?:?( 4g)?)\b[\w ]+build\//i,
                      /\bmot(?:orola)?[- ](\w*)/i,
                      /((?:moto[\w\(\) ]+|xt\d{3,4}|nexus 6)(?= bui|\)))/i,
                    ],
                    [c, [p, P], [h, g]],
                    [/\b(mz60\d|xoom[2 ]{0,2}) build\//i],
                    [c, [p, P], [h, w]],
                    [
                      /((?=lg)?[vl]k\-?\d{3}) bui| 3\.[-\w; ]{10}lg?-([06cv9]{3,4})/i,
                    ],
                    [c, [p, C], [h, w]],
                    [
                      /(lm(?:-?f100[nv]?|-[\w\.]+)(?= bui|\))|nexus [45])/i,
                      /\blg[-e;\/ ]+((?!browser|netcast|android tv)\w+)/i,
                      /\blg-?([\d\w]+) bui/i,
                    ],
                    [c, [p, C], [h, g]],
                    [
                      /(ideatab[-\w ]+)/i,
                      /lenovo ?(s[56]000[-\w]+|tab(?:[\w ]+)|yt[-\d\w]{6}|tb[-\d\w]{6})/i,
                    ],
                    [c, [p, "Lenovo"], [h, w]],
                    [
                      /(?:maemo|nokia).*(n900|lumia \d+)/i,
                      /nokia[-_ ]?([-\w\.]*)/i,
                    ],
                    [
                      [c, /_/g, " "],
                      [p, "Nokia"],
                      [h, g],
                    ],
                    [/(pixel c)\b/i],
                    [c, [p, S], [h, w]],
                    [/droid.+; (pixel[\daxl ]{0,6})(?: bui|\))/i],
                    [c, [p, S], [h, g]],
                    [
                      /droid.+ ([c-g]\d{4}|so[-gl]\w+|xq-a\w[4-7][12])(?= bui|\).+chrome\/(?![1-6]{0,1}\d\.))/i,
                    ],
                    [c, [p, M], [h, g]],
                    [/sony tablet [ps]/i, /\b(?:sony)?sgp\w+(?: bui|\))/i],
                    [
                      [c, "Xperia Tablet"],
                      [p, M],
                      [h, w],
                    ],
                    [
                      / (kb2005|in20[12]5|be20[12][59])\b/i,
                      /(?:one)?(?:plus)? (a\d0\d\d)(?: b|\))/i,
                    ],
                    [c, [p, "OnePlus"], [h, g]],
                    [
                      /(alexa)webm/i,
                      /(kf[a-z]{2}wi)( bui|\))/i,
                      /(kf[a-z]+)( bui|\)).+silk\//i,
                    ],
                    [c, [p, x], [h, w]],
                    [/((?:sd|kf)[0349hijorstuw]+)( bui|\)).+silk\//i],
                    [
                      [c, /(.+)/g, "Fire Phone $1"],
                      [p, x],
                      [h, g],
                    ],
                    [/(playbook);[-\w\),; ]+(rim)/i],
                    [c, p, [h, w]],
                    [/\b((?:bb[a-f]|st[hv])100-\d)/i, /\(bb10; (\w+)/i],
                    [c, [p, E], [h, g]],
                    [
                      /(?:\b|asus_)(transfo[prime ]{4,10} \w+|eeepc|slider \w+|nexus 7|padfone|p00[cj])/i,
                    ],
                    [c, [p, k], [h, w]],
                    [/ (z[bes]6[027][012][km][ls]|zenfone \d\w?)\b/i],
                    [c, [p, k], [h, g]],
                    [/(nexus 9)/i],
                    [c, [p, "HTC"], [h, w]],
                    [
                      /(htc)[-;_ ]{1,2}([\w ]+(?=\)| bui)|\w+)/i,
                      /(zte)[- ]([\w ]+?)(?: bui|\/|\))/i,
                      /(alcatel|geeksphone|nexian|panasonic|sony)[-_ ]?([-\w]*)/i,
                    ],
                    [p, [c, /_/g, " "], [h, g]],
                    [/droid.+; ([ab][1-7]-?[0178a]\d\d?)/i],
                    [c, [p, "Acer"], [h, w]],
                    [/droid.+; (m[1-5] note) bui/i, /\bmz-([-\w]{2,})/i],
                    [c, [p, "Meizu"], [h, g]],
                    [/\b(sh-?[altvz]?\d\d[a-ekm]?)/i],
                    [c, [p, "Sharp"], [h, g]],
                    [
                      /(blackberry|benq|palm(?=\-)|sonyericsson|acer|asus|dell|meizu|motorola|polytron)[-_ ]?([-\w]*)/i,
                      /(hp) ([\w ]+\w)/i,
                      /(asus)-?(\w+)/i,
                      /(microsoft); (lumia[\w ]+)/i,
                      /(lenovo)[-_ ]?([-\w]+)/i,
                      /(jolla)/i,
                      /(oppo) ?([\w ]+) bui/i,
                    ],
                    [p, c, [h, g]],
                    [
                      /(archos) (gamepad2?)/i,
                      /(hp).+(touchpad(?!.+tablet)|tablet)/i,
                      /(kindle)\/([\w\.]+)/i,
                      /(nook)[\w ]+build\/(\w+)/i,
                      /(dell) (strea[kpr\d ]*[\dko])/i,
                      /(le[- ]+pan)[- ]+(\w{1,9}) bui/i,
                      /(trinity)[- ]*(t\d{3}) bui/i,
                      /(gigaset)[- ]+(q\w{1,9}) bui/i,
                      /(vodafone) ([\w ]+)(?:\)| bui)/i,
                    ],
                    [p, c, [h, w]],
                    [/(surface duo)/i],
                    [c, [p, A], [h, w]],
                    [/droid [\d\.]+; (fp\du?)(?: b|\))/i],
                    [c, [p, "Fairphone"], [h, g]],
                    [/(u304aa)/i],
                    [c, [p, "AT&T"], [h, g]],
                    [/\bsie-(\w*)/i],
                    [c, [p, "Siemens"], [h, g]],
                    [/\b(rct\w+) b/i],
                    [c, [p, "RCA"], [h, w]],
                    [/\b(venue[\d ]{2,7}) b/i],
                    [c, [p, "Dell"], [h, w]],
                    [/\b(q(?:mv|ta)\w+) b/i],
                    [c, [p, "Verizon"], [h, w]],
                    [/\b(?:barnes[& ]+noble |bn[rt])([\w\+ ]*) b/i],
                    [c, [p, "Barnes & Noble"], [h, w]],
                    [/\b(tm\d{3}\w+) b/i],
                    [c, [p, "NuVision"], [h, w]],
                    [/\b(k88) b/i],
                    [c, [p, "ZTE"], [h, w]],
                    [/\b(nx\d{3}j) b/i],
                    [c, [p, "ZTE"], [h, g]],
                    [/\b(gen\d{3}) b.+49h/i],
                    [c, [p, "Swiss"], [h, g]],
                    [/\b(zur\d{3}) b/i],
                    [c, [p, "Swiss"], [h, w]],
                    [/\b((zeki)?tb.*\b) b/i],
                    [c, [p, "Zeki"], [h, w]],
                    [/\b([yr]\d{2}) b/i, /\b(dragon[- ]+touch |dt)(\w{5}) b/i],
                    [[p, "Dragon Touch"], c, [h, w]],
                    [/\b(ns-?\w{0,9}) b/i],
                    [c, [p, "Insignia"], [h, w]],
                    [/\b((nxa|next)-?\w{0,9}) b/i],
                    [c, [p, "NextBook"], [h, w]],
                    [/\b(xtreme\_)?(v(1[045]|2[015]|[3469]0|7[05])) b/i],
                    [[p, "Voice"], c, [h, g]],
                    [/\b(lvtel\-)?(v1[12]) b/i],
                    [[p, "LvTel"], c, [h, g]],
                    [/\b(ph-1) /i],
                    [c, [p, "Essential"], [h, g]],
                    [/\b(v(100md|700na|7011|917g).*\b) b/i],
                    [c, [p, "Envizen"], [h, w]],
                    [/\b(trio[-\w\. ]+) b/i],
                    [c, [p, "MachSpeed"], [h, w]],
                    [/\btu_(1491) b/i],
                    [c, [p, "Rotor"], [h, w]],
                    [/(shield[\w ]+) b/i],
                    [c, [p, "Nvidia"], [h, w]],
                    [/(sprint) (\w+)/i],
                    [p, c, [h, g]],
                    [/(kin\.[onetw]{3})/i],
                    [
                      [c, /\./g, " "],
                      [p, A],
                      [h, g],
                    ],
                    [/droid.+; (cc6666?|et5[16]|mc[239][23]x?|vc8[03]x?)\)/i],
                    [c, [p, I], [h, w]],
                    [/droid.+; (ec30|ps20|tc[2-8]\d[kx])\)/i],
                    [c, [p, I], [h, g]],
                    [/(ouya)/i, /(nintendo) ([wids3utch]+)/i],
                    [p, c, [h, m]],
                    [/droid.+; (shield) bui/i],
                    [c, [p, "Nvidia"], [h, m]],
                    [/(playstation [345portablevi]+)/i],
                    [c, [p, M], [h, m]],
                    [/\b(xbox(?: one)?(?!; xbox))[\); ]/i],
                    [c, [p, A], [h, m]],
                    [/smart-tv.+(samsung)/i],
                    [p, [h, b]],
                    [/hbbtv.+maple;(\d+)/i],
                    [
                      [c, /^/, "SmartTV"],
                      [p, $],
                      [h, b],
                    ],
                    [
                      /(nux; netcast.+smarttv|lg (netcast\.tv-201\d|android tv))/i,
                    ],
                    [
                      [p, C],
                      [h, b],
                    ],
                    [/(apple) ?tv/i],
                    [p, [c, "Apple TV"], [h, b]],
                    [/crkey/i],
                    [
                      [c, "Chromecast"],
                      [p, S],
                      [h, b],
                    ],
                    [/droid.+aft(\w)( bui|\))/i],
                    [c, [p, x], [h, b]],
                    [/\(dtv[\);].+(aquos)/i],
                    [c, [p, "Sharp"], [h, b]],
                    [
                      /\b(roku)[\dx]*[\)\/]((?:dvp-)?[\d\.]*)/i,
                      /hbbtv\/\d+\.\d+\.\d+ +\([\w ]*; *(\w[^;]*);([^;]*)/i,
                    ],
                    [
                      [p, W],
                      [c, W],
                      [h, b],
                    ],
                    [/\b(android tv|smart[- ]?tv|opera tv|tv; rv:)\b/i],
                    [[h, b]],
                    [/((pebble))app/i],
                    [p, c, [h, y]],
                    [/droid.+; (glass) \d/i],
                    [c, [p, S], [h, y]],
                    [/droid.+; (wt63?0{2,3})\)/i],
                    [c, [p, I], [h, y]],
                    [/(quest( 2)?)/i],
                    [c, [p, L], [h, y]],
                    [/(tesla)(?: qtcarbrowser|\/[-\w\.]+)/i],
                    [p, [h, _]],
                    [/droid .+?; ([^;]+?)(?: bui|\) applew).+? mobile safari/i],
                    [c, [h, g]],
                    [
                      /droid .+?; ([^;]+?)(?: bui|\) applew).+?(?! mobile) safari/i,
                    ],
                    [c, [h, w]],
                    [/\b((tablet|tab)[;\/]|focus\/\d(?!.+mobile))/i],
                    [[h, w]],
                    [/(phone|mobile(?:[;\/]| safari)|pda(?=.+windows ce))/i],
                    [[h, g]],
                    [/(android[-\w\. ]{0,9});.+buil/i],
                    [c, [p, "Generic"]],
                  ],
                  engine: [
                    [/windows.+ edge\/([\w\.]+)/i],
                    [d, [f, "EdgeHTML"]],
                    [/webkit\/537\.36.+chrome\/(?!27)([\w\.]+)/i],
                    [d, [f, "Blink"]],
                    [
                      /(presto)\/([\w\.]+)/i,
                      /(webkit|trident|netfront|netsurf|amaya|lynx|w3m|goanna)\/([\w\.]+)/i,
                      /ekioh(flow)\/([\w\.]+)/i,
                      /(khtml|tasman|links)[\/ ]\(?([\w\.]+)/i,
                      /(icab)[\/ ]([23]\.[\d\.]+)/i,
                    ],
                    [f, d],
                    [/rv\:([\w\.]{1,9})\b.+(gecko)/i],
                    [d, f],
                  ],
                  os: [
                    [/microsoft (windows) (vista|xp)/i],
                    [f, d],
                    [
                      /(windows) nt 6\.2; (arm)/i,
                      /(windows (?:phone(?: os)?|mobile))[\/ ]?([\d\.\w ]*)/i,
                      /(windows)[\/ ]?([ntce\d\. ]+\w)(?!.+xbox)/i,
                    ],
                    [f, [d, B, N]],
                    [/(win(?=3|9|n)|win 9x )([nt\d\.]+)/i],
                    [
                      [f, "Windows"],
                      [d, B, N],
                    ],
                    [
                      /ip[honead]{2,4}\b(?:.*os ([\w]+) like mac|; opera)/i,
                      /cfnetwork\/.+darwin/i,
                    ],
                    [
                      [d, /_/g, "."],
                      [f, "iOS"],
                    ],
                    [
                      /(mac os x) ?([\w\. ]*)/i,
                      /(macintosh|mac_powerpc\b)(?!.+haiku)/i,
                    ],
                    [
                      [f, "Mac OS"],
                      [d, /_/g, "."],
                    ],
                    [/droid ([\w\.]+)\b.+(android[- ]x86)/i],
                    [d, f],
                    [
                      /(android|webos|qnx|bada|rim tablet os|maemo|meego|sailfish)[-\/ ]?([\w\.]*)/i,
                      /(blackberry)\w*\/([\w\.]*)/i,
                      /(tizen|kaios)[\/ ]([\w\.]+)/i,
                      /\((series40);/i,
                    ],
                    [f, d],
                    [/\(bb(10);/i],
                    [d, [f, E]],
                    [
                      /(?:symbian ?os|symbos|s60(?=;)|series60)[-\/ ]?([\w\.]*)/i,
                    ],
                    [d, [f, "Symbian"]],
                    [
                      /mozilla\/[\d\.]+ \((?:mobile|tablet|tv|mobile; [\w ]+); rv:.+ gecko\/([\w\.]+)/i,
                    ],
                    [d, [f, "Firefox OS"]],
                    [/web0s;.+rt(tv)/i, /\b(?:hp)?wos(?:browser)?\/([\w\.]+)/i],
                    [d, [f, "webOS"]],
                    [/crkey\/([\d\.]+)/i],
                    [d, [f, "Chromecast"]],
                    [/(cros) [\w]+ ([\w\.]+\w)/i],
                    [[f, "Chromium OS"], d],
                    [
                      /(nintendo|playstation) ([wids345portablevuch]+)/i,
                      /(xbox); +xbox ([^\);]+)/i,
                      /\b(joli|palm)\b ?(?:os)?\/?([\w\.]*)/i,
                      /(mint)[\/\(\) ]?(\w*)/i,
                      /(mageia|vectorlinux)[; ]/i,
                      /([kxln]?ubuntu|debian|suse|opensuse|gentoo|arch(?= linux)|slackware|fedora|mandriva|centos|pclinuxos|red ?hat|zenwalk|linpus|raspbian|plan 9|minix|risc os|contiki|deepin|manjaro|elementary os|sabayon|linspire)(?: gnu\/linux)?(?: enterprise)?(?:[- ]linux)?(?:-gnu)?[-\/ ]?(?!chrom|package)([-\w\.]*)/i,
                      /(hurd|linux) ?([\w\.]*)/i,
                      /(gnu) ?([\w\.]*)/i,
                      /\b([-frentopcghs]{0,5}bsd|dragonfly)[\/ ]?(?!amd|[ix346]{1,2}86)([\w\.]*)/i,
                      /(haiku) (\w+)/i,
                    ],
                    [f, d],
                    [/(sunos) ?([\w\.\d]*)/i],
                    [[f, "Solaris"], d],
                    [
                      /((?:open)?solaris)[-\/ ]?([\w\.]*)/i,
                      /(aix) ((\d)(?=\.|\)| )[\w\.])*/i,
                      /\b(beos|os\/2|amigaos|morphos|openvms|fuchsia|hp-ux)/i,
                      /(unix) ?([\w\.]*)/i,
                    ],
                    [f, d],
                  ],
                },
                V = function (t, e) {
                  if (
                    (typeof t === l && ((e = t), (t = o)), !(this instanceof V))
                  )
                    return new V(t, e).getResult();
                  var n =
                      t ||
                      (typeof i !== s && i.navigator && i.navigator.userAgent
                        ? i.navigator.userAgent
                        : ""),
                    r = e
                      ? (function (t, e) {
                          var n = {};
                          for (var r in t)
                            e[r] && e[r].length % 2 == 0
                              ? (n[r] = e[r].concat(t[r]))
                              : (n[r] = t[r]);
                          return n;
                        })(H, e)
                      : H;
                  return (
                    (this.getBrowser = function () {
                      var t,
                        e = {};
                      return (
                        (e.name = o),
                        (e.version = o),
                        U.call(e, n, r.browser),
                        (e.major =
                          typeof (t = e.version) === u
                            ? t.replace(/[^\d\.]/g, "").split(".")[0]
                            : o),
                        e
                      );
                    }),
                    (this.getCPU = function () {
                      var t = {};
                      return (t.architecture = o), U.call(t, n, r.cpu), t;
                    }),
                    (this.getDevice = function () {
                      var t = {};
                      return (
                        (t.vendor = o),
                        (t.model = o),
                        (t.type = o),
                        U.call(t, n, r.device),
                        t
                      );
                    }),
                    (this.getEngine = function () {
                      var t = {};
                      return (
                        (t.name = o), (t.version = o), U.call(t, n, r.engine), t
                      );
                    }),
                    (this.getOS = function () {
                      var t = {};
                      return (
                        (t.name = o), (t.version = o), U.call(t, n, r.os), t
                      );
                    }),
                    (this.getResult = function () {
                      return {
                        ua: this.getUA(),
                        browser: this.getBrowser(),
                        engine: this.getEngine(),
                        os: this.getOS(),
                        device: this.getDevice(),
                        cpu: this.getCPU(),
                      };
                    }),
                    (this.getUA = function () {
                      return n;
                    }),
                    (this.setUA = function (t) {
                      return (
                        (n = typeof t === u && t.length > 255 ? W(t, 255) : t),
                        this
                      );
                    }),
                    this.setUA(n),
                    this
                  );
                };
              (V.VERSION = "1.0.2"),
                (V.BROWSER = z([f, d, "major"])),
                (V.CPU = z([v])),
                (V.DEVICE = z([c, p, h, m, g, b, w, y, _])),
                (V.ENGINE = V.OS = z([f, d])),
                typeof e !== s
                  ? (t.exports && (e = t.exports = V), (e.UAParser = V))
                  : n.amdO
                  ? (r = function () {
                      return V;
                    }.call(e, n, e, t)) === o || (t.exports = r)
                  : typeof i !== s && (i.UAParser = V);
              var J = typeof i !== s && (i.jQuery || i.Zepto);
              if (J && !J.ua) {
                var Z = new V();
                (J.ua = Z.getResult()),
                  (J.ua.get = function () {
                    return Z.getUA();
                  }),
                  (J.ua.set = function (t) {
                    Z.setUA(t);
                    var e = Z.getResult();
                    for (var n in e) J.ua[n] = e[n];
                  });
              }
            })("object" == typeof window ? window : this);
          },
          486: function (t, e, n) {
            var r;
            (t = n.nmd(t)),
              function () {
                var i,
                  o = "Expected a function",
                  a = "__lodash_hash_undefined__",
                  s = "__lodash_placeholder__",
                  l = 16,
                  u = 32,
                  c = 64,
                  f = 128,
                  h = 256,
                  p = 1 / 0,
                  d = 9007199254740991,
                  v = NaN,
                  m = 4294967295,
                  g = [
                    ["ary", f],
                    ["bind", 1],
                    ["bindKey", 2],
                    ["curry", 8],
                    ["curryRight", l],
                    ["flip", 512],
                    ["partial", u],
                    ["partialRight", c],
                    ["rearg", h],
                  ],
                  w = "[object Arguments]",
                  b = "[object Array]",
                  y = "[object Boolean]",
                  _ = "[object Date]",
                  x = "[object Error]",
                  j = "[object Function]",
                  k = "[object GeneratorFunction]",
                  E = "[object Map]",
                  O = "[object Number]",
                  S = "[object Object]",
                  T = "[object Promise]",
                  C = "[object RegExp]",
                  A = "[object Set]",
                  P = "[object String]",
                  R = "[object Symbol]",
                  $ = "[object WeakMap]",
                  M = "[object ArrayBuffer]",
                  q = "[object DataView]",
                  I = "[object Float32Array]",
                  L = "[object Float64Array]",
                  z = "[object Int8Array]",
                  D = "[object Int16Array]",
                  F = "[object Int32Array]",
                  W = "[object Uint8Array]",
                  U = "[object Uint8ClampedArray]",
                  B = "[object Uint16Array]",
                  N = "[object Uint32Array]",
                  H = /\b__p \+= '';/g,
                  V = /\b(__p \+=) '' \+/g,
                  J = /(__e\(.*?\)|\b__t\)) \+\n'';/g,
                  Z = /&(?:amp|lt|gt|quot|#39);/g,
                  G = /[&<>"']/g,
                  K = RegExp(Z.source),
                  Y = RegExp(G.source),
                  X = /<%-([\s\S]+?)%>/g,
                  Q = /<%([\s\S]+?)%>/g,
                  tt = /<%=([\s\S]+?)%>/g,
                  et = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,
                  nt = /^\w*$/,
                  rt =
                    /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g,
                  it = /[\\^$.*+?()[\]{}|]/g,
                  ot = RegExp(it.source),
                  at = /^\s+/,
                  st = /\s/,
                  lt = /\{(?:\n\/\* \[wrapped with .+\] \*\/)?\n?/,
                  ut = /\{\n\/\* \[wrapped with (.+)\] \*/,
                  ct = /,? & /,
                  ft = /[^\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\x7f]+/g,
                  ht = /[()=,{}\[\]\/\s]/,
                  pt = /\\(\\)?/g,
                  dt = /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g,
                  vt = /\w*$/,
                  mt = /^[-+]0x[0-9a-f]+$/i,
                  gt = /^0b[01]+$/i,
                  wt = /^\[object .+?Constructor\]$/,
                  bt = /^0o[0-7]+$/i,
                  yt = /^(?:0|[1-9]\d*)$/,
                  _t = /[\xc0-\xd6\xd8-\xf6\xf8-\xff\u0100-\u017f]/g,
                  xt = /($^)/,
                  jt = /['\n\r\u2028\u2029\\]/g,
                  kt = "\\u0300-\\u036f\\ufe20-\\ufe2f\\u20d0-\\u20ff",
                  Et = "\\u2700-\\u27bf",
                  Ot = "a-z\\xdf-\\xf6\\xf8-\\xff",
                  St = "A-Z\\xc0-\\xd6\\xd8-\\xde",
                  Tt = "\\ufe0e\\ufe0f",
                  Ct =
                    "\\xac\\xb1\\xd7\\xf7\\x00-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\xbf\\u2000-\\u206f \\t\\x0b\\f\\xa0\\ufeff\\n\\r\\u2028\\u2029\\u1680\\u180e\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000",
                  At = "['’]",
                  Pt = "[\\ud800-\\udfff]",
                  Rt = "[" + Ct + "]",
                  $t = "[" + kt + "]",
                  Mt = "\\d+",
                  qt = "[\\u2700-\\u27bf]",
                  It = "[" + Ot + "]",
                  Lt = "[^\\ud800-\\udfff" + Ct + Mt + Et + Ot + St + "]",
                  zt = "\\ud83c[\\udffb-\\udfff]",
                  Dt = "[^\\ud800-\\udfff]",
                  Ft = "(?:\\ud83c[\\udde6-\\uddff]){2}",
                  Wt = "[\\ud800-\\udbff][\\udc00-\\udfff]",
                  Ut = "[" + St + "]",
                  Bt = "(?:" + It + "|" + Lt + ")",
                  Nt = "(?:" + Ut + "|" + Lt + ")",
                  Ht = "(?:['’](?:d|ll|m|re|s|t|ve))?",
                  Vt = "(?:['’](?:D|LL|M|RE|S|T|VE))?",
                  Jt = "(?:" + $t + "|" + zt + ")" + "?",
                  Zt = "[\\ufe0e\\ufe0f]?",
                  Gt =
                    Zt +
                    Jt +
                    ("(?:\\u200d(?:" +
                      [Dt, Ft, Wt].join("|") +
                      ")" +
                      Zt +
                      Jt +
                      ")*"),
                  Kt = "(?:" + [qt, Ft, Wt].join("|") + ")" + Gt,
                  Yt = "(?:" + [Dt + $t + "?", $t, Ft, Wt, Pt].join("|") + ")",
                  Xt = RegExp(At, "g"),
                  Qt = RegExp($t, "g"),
                  te = RegExp(zt + "(?=" + zt + ")|" + Yt + Gt, "g"),
                  ee = RegExp(
                    [
                      Ut +
                        "?" +
                        It +
                        "+" +
                        Ht +
                        "(?=" +
                        [Rt, Ut, "$"].join("|") +
                        ")",
                      Nt +
                        "+" +
                        Vt +
                        "(?=" +
                        [Rt, Ut + Bt, "$"].join("|") +
                        ")",
                      Ut + "?" + Bt + "+" + Ht,
                      Ut + "+" + Vt,
                      "\\d*(?:1ST|2ND|3RD|(?![123])\\dTH)(?=\\b|[a-z_])",
                      "\\d*(?:1st|2nd|3rd|(?![123])\\dth)(?=\\b|[A-Z_])",
                      Mt,
                      Kt,
                    ].join("|"),
                    "g"
                  ),
                  ne = RegExp("[\\u200d\\ud800-\\udfff" + kt + Tt + "]"),
                  re =
                    /[a-z][A-Z]|[A-Z]{2}[a-z]|[0-9][a-zA-Z]|[a-zA-Z][0-9]|[^a-zA-Z0-9 ]/,
                  ie = [
                    "Array",
                    "Buffer",
                    "DataView",
                    "Date",
                    "Error",
                    "Float32Array",
                    "Float64Array",
                    "Function",
                    "Int8Array",
                    "Int16Array",
                    "Int32Array",
                    "Map",
                    "Math",
                    "Object",
                    "Promise",
                    "RegExp",
                    "Set",
                    "String",
                    "Symbol",
                    "TypeError",
                    "Uint8Array",
                    "Uint8ClampedArray",
                    "Uint16Array",
                    "Uint32Array",
                    "WeakMap",
                    "_",
                    "clearTimeout",
                    "isFinite",
                    "parseInt",
                    "setTimeout",
                  ],
                  oe = -1,
                  ae = {};
                (ae[I] =
                  ae[L] =
                  ae[z] =
                  ae[D] =
                  ae[F] =
                  ae[W] =
                  ae[U] =
                  ae[B] =
                  ae[N] =
                    !0),
                  (ae[w] =
                    ae[b] =
                    ae[M] =
                    ae[y] =
                    ae[q] =
                    ae[_] =
                    ae[x] =
                    ae[j] =
                    ae[E] =
                    ae[O] =
                    ae[S] =
                    ae[C] =
                    ae[A] =
                    ae[P] =
                    ae[$] =
                      !1);
                var se = {};
                (se[w] =
                  se[b] =
                  se[M] =
                  se[q] =
                  se[y] =
                  se[_] =
                  se[I] =
                  se[L] =
                  se[z] =
                  se[D] =
                  se[F] =
                  se[E] =
                  se[O] =
                  se[S] =
                  se[C] =
                  se[A] =
                  se[P] =
                  se[R] =
                  se[W] =
                  se[U] =
                  se[B] =
                  se[N] =
                    !0),
                  (se[x] = se[j] = se[$] = !1);
                var le = {
                    "\\": "\\",
                    "'": "'",
                    "\n": "n",
                    "\r": "r",
                    "\u2028": "u2028",
                    "\u2029": "u2029",
                  },
                  ue = parseFloat,
                  ce = parseInt,
                  fe =
                    "object" == typeof n.g &&
                    n.g &&
                    n.g.Object === Object &&
                    n.g,
                  he =
                    "object" == typeof self &&
                    self &&
                    self.Object === Object &&
                    self,
                  pe = fe || he || Function("return this")(),
                  de = e && !e.nodeType && e,
                  ve = de && t && !t.nodeType && t,
                  me = ve && ve.exports === de,
                  ge = me && fe.process,
                  we = (function () {
                    try {
                      var t = ve && ve.require && ve.require("util").types;
                      return t || (ge && ge.binding && ge.binding("util"));
                    } catch (t) {}
                  })(),
                  be = we && we.isArrayBuffer,
                  ye = we && we.isDate,
                  _e = we && we.isMap,
                  xe = we && we.isRegExp,
                  je = we && we.isSet,
                  ke = we && we.isTypedArray;
                function Ee(t, e, n) {
                  switch (n.length) {
                    case 0:
                      return t.call(e);
                    case 1:
                      return t.call(e, n[0]);
                    case 2:
                      return t.call(e, n[0], n[1]);
                    case 3:
                      return t.call(e, n[0], n[1], n[2]);
                  }
                  return t.apply(e, n);
                }
                function Oe(t, e, n, r) {
                  for (var i = -1, o = null == t ? 0 : t.length; ++i < o; ) {
                    var a = t[i];
                    e(r, a, n(a), t);
                  }
                  return r;
                }
                function Se(t, e) {
                  for (
                    var n = -1, r = null == t ? 0 : t.length;
                    ++n < r && !1 !== e(t[n], n, t);

                  );
                  return t;
                }
                function Te(t, e) {
                  for (
                    var n = null == t ? 0 : t.length;
                    n-- && !1 !== e(t[n], n, t);

                  );
                  return t;
                }
                function Ce(t, e) {
                  for (var n = -1, r = null == t ? 0 : t.length; ++n < r; )
                    if (!e(t[n], n, t)) return !1;
                  return !0;
                }
                function Ae(t, e) {
                  for (
                    var n = -1, r = null == t ? 0 : t.length, i = 0, o = [];
                    ++n < r;

                  ) {
                    var a = t[n];
                    e(a, n, t) && (o[i++] = a);
                  }
                  return o;
                }
                function Pe(t, e) {
                  return !!(null == t ? 0 : t.length) && We(t, e, 0) > -1;
                }
                function Re(t, e, n) {
                  for (var r = -1, i = null == t ? 0 : t.length; ++r < i; )
                    if (n(e, t[r])) return !0;
                  return !1;
                }
                function $e(t, e) {
                  for (
                    var n = -1, r = null == t ? 0 : t.length, i = Array(r);
                    ++n < r;

                  )
                    i[n] = e(t[n], n, t);
                  return i;
                }
                function Me(t, e) {
                  for (var n = -1, r = e.length, i = t.length; ++n < r; )
                    t[i + n] = e[n];
                  return t;
                }
                function qe(t, e, n, r) {
                  var i = -1,
                    o = null == t ? 0 : t.length;
                  for (r && o && (n = t[++i]); ++i < o; ) n = e(n, t[i], i, t);
                  return n;
                }
                function Ie(t, e, n, r) {
                  var i = null == t ? 0 : t.length;
                  for (r && i && (n = t[--i]); i--; ) n = e(n, t[i], i, t);
                  return n;
                }
                function Le(t, e) {
                  for (var n = -1, r = null == t ? 0 : t.length; ++n < r; )
                    if (e(t[n], n, t)) return !0;
                  return !1;
                }
                var ze = He("length");
                function De(t, e, n) {
                  var r;
                  return (
                    n(t, function (t, n, i) {
                      if (e(t, n, i)) return (r = n), !1;
                    }),
                    r
                  );
                }
                function Fe(t, e, n, r) {
                  for (
                    var i = t.length, o = n + (r ? 1 : -1);
                    r ? o-- : ++o < i;

                  )
                    if (e(t[o], o, t)) return o;
                  return -1;
                }
                function We(t, e, n) {
                  return e == e
                    ? (function (t, e, n) {
                        var r = n - 1,
                          i = t.length;
                        for (; ++r < i; ) if (t[r] === e) return r;
                        return -1;
                      })(t, e, n)
                    : Fe(t, Be, n);
                }
                function Ue(t, e, n, r) {
                  for (var i = n - 1, o = t.length; ++i < o; )
                    if (r(t[i], e)) return i;
                  return -1;
                }
                function Be(t) {
                  return t != t;
                }
                function Ne(t, e) {
                  var n = null == t ? 0 : t.length;
                  return n ? Ze(t, e) / n : v;
                }
                function He(t) {
                  return function (e) {
                    return null == e ? i : e[t];
                  };
                }
                function Ve(t) {
                  return function (e) {
                    return null == t ? i : t[e];
                  };
                }
                function Je(t, e, n, r, i) {
                  return (
                    i(t, function (t, i, o) {
                      n = r ? ((r = !1), t) : e(n, t, i, o);
                    }),
                    n
                  );
                }
                function Ze(t, e) {
                  for (var n, r = -1, o = t.length; ++r < o; ) {
                    var a = e(t[r]);
                    a !== i && (n = n === i ? a : n + a);
                  }
                  return n;
                }
                function Ge(t, e) {
                  for (var n = -1, r = Array(t); ++n < t; ) r[n] = e(n);
                  return r;
                }
                function Ke(t) {
                  return t ? t.slice(0, vn(t) + 1).replace(at, "") : t;
                }
                function Ye(t) {
                  return function (e) {
                    return t(e);
                  };
                }
                function Xe(t, e) {
                  return $e(e, function (e) {
                    return t[e];
                  });
                }
                function Qe(t, e) {
                  return t.has(e);
                }
                function tn(t, e) {
                  for (
                    var n = -1, r = t.length;
                    ++n < r && We(e, t[n], 0) > -1;

                  );
                  return n;
                }
                function en(t, e) {
                  for (var n = t.length; n-- && We(e, t[n], 0) > -1; );
                  return n;
                }
                function nn(t, e) {
                  for (var n = t.length, r = 0; n--; ) t[n] === e && ++r;
                  return r;
                }
                var rn = Ve({
                    À: "A",
                    Á: "A",
                    Â: "A",
                    Ã: "A",
                    Ä: "A",
                    Å: "A",
                    à: "a",
                    á: "a",
                    â: "a",
                    ã: "a",
                    ä: "a",
                    å: "a",
                    Ç: "C",
                    ç: "c",
                    Ð: "D",
                    ð: "d",
                    È: "E",
                    É: "E",
                    Ê: "E",
                    Ë: "E",
                    è: "e",
                    é: "e",
                    ê: "e",
                    ë: "e",
                    Ì: "I",
                    Í: "I",
                    Î: "I",
                    Ï: "I",
                    ì: "i",
                    í: "i",
                    î: "i",
                    ï: "i",
                    Ñ: "N",
                    ñ: "n",
                    Ò: "O",
                    Ó: "O",
                    Ô: "O",
                    Õ: "O",
                    Ö: "O",
                    Ø: "O",
                    ò: "o",
                    ó: "o",
                    ô: "o",
                    õ: "o",
                    ö: "o",
                    ø: "o",
                    Ù: "U",
                    Ú: "U",
                    Û: "U",
                    Ü: "U",
                    ù: "u",
                    ú: "u",
                    û: "u",
                    ü: "u",
                    Ý: "Y",
                    ý: "y",
                    ÿ: "y",
                    Æ: "Ae",
                    æ: "ae",
                    Þ: "Th",
                    þ: "th",
                    ß: "ss",
                    Ā: "A",
                    Ă: "A",
                    Ą: "A",
                    ā: "a",
                    ă: "a",
                    ą: "a",
                    Ć: "C",
                    Ĉ: "C",
                    Ċ: "C",
                    Č: "C",
                    ć: "c",
                    ĉ: "c",
                    ċ: "c",
                    č: "c",
                    Ď: "D",
                    Đ: "D",
                    ď: "d",
                    đ: "d",
                    Ē: "E",
                    Ĕ: "E",
                    Ė: "E",
                    Ę: "E",
                    Ě: "E",
                    ē: "e",
                    ĕ: "e",
                    ė: "e",
                    ę: "e",
                    ě: "e",
                    Ĝ: "G",
                    Ğ: "G",
                    Ġ: "G",
                    Ģ: "G",
                    ĝ: "g",
                    ğ: "g",
                    ġ: "g",
                    ģ: "g",
                    Ĥ: "H",
                    Ħ: "H",
                    ĥ: "h",
                    ħ: "h",
                    Ĩ: "I",
                    Ī: "I",
                    Ĭ: "I",
                    Į: "I",
                    İ: "I",
                    ĩ: "i",
                    ī: "i",
                    ĭ: "i",
                    į: "i",
                    ı: "i",
                    Ĵ: "J",
                    ĵ: "j",
                    Ķ: "K",
                    ķ: "k",
                    ĸ: "k",
                    Ĺ: "L",
                    Ļ: "L",
                    Ľ: "L",
                    Ŀ: "L",
                    Ł: "L",
                    ĺ: "l",
                    ļ: "l",
                    ľ: "l",
                    ŀ: "l",
                    ł: "l",
                    Ń: "N",
                    Ņ: "N",
                    Ň: "N",
                    Ŋ: "N",
                    ń: "n",
                    ņ: "n",
                    ň: "n",
                    ŋ: "n",
                    Ō: "O",
                    Ŏ: "O",
                    Ő: "O",
                    ō: "o",
                    ŏ: "o",
                    ő: "o",
                    Ŕ: "R",
                    Ŗ: "R",
                    Ř: "R",
                    ŕ: "r",
                    ŗ: "r",
                    ř: "r",
                    Ś: "S",
                    Ŝ: "S",
                    Ş: "S",
                    Š: "S",
                    ś: "s",
                    ŝ: "s",
                    ş: "s",
                    š: "s",
                    Ţ: "T",
                    Ť: "T",
                    Ŧ: "T",
                    ţ: "t",
                    ť: "t",
                    ŧ: "t",
                    Ũ: "U",
                    Ū: "U",
                    Ŭ: "U",
                    Ů: "U",
                    Ű: "U",
                    Ų: "U",
                    ũ: "u",
                    ū: "u",
                    ŭ: "u",
                    ů: "u",
                    ű: "u",
                    ų: "u",
                    Ŵ: "W",
                    ŵ: "w",
                    Ŷ: "Y",
                    ŷ: "y",
                    Ÿ: "Y",
                    Ź: "Z",
                    Ż: "Z",
                    Ž: "Z",
                    ź: "z",
                    ż: "z",
                    ž: "z",
                    Ĳ: "IJ",
                    ĳ: "ij",
                    Œ: "Oe",
                    œ: "oe",
                    ŉ: "'n",
                    ſ: "s",
                  }),
                  on = Ve({
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    '"': "&quot;",
                    "'": "&#39;",
                  });
                function an(t) {
                  return "\\" + le[t];
                }
                function sn(t) {
                  return ne.test(t);
                }
                function ln(t) {
                  var e = -1,
                    n = Array(t.size);
                  return (
                    t.forEach(function (t, r) {
                      n[++e] = [r, t];
                    }),
                    n
                  );
                }
                function un(t, e) {
                  return function (n) {
                    return t(e(n));
                  };
                }
                function cn(t, e) {
                  for (var n = -1, r = t.length, i = 0, o = []; ++n < r; ) {
                    var a = t[n];
                    (a !== e && a !== s) || ((t[n] = s), (o[i++] = n));
                  }
                  return o;
                }
                function fn(t) {
                  var e = -1,
                    n = Array(t.size);
                  return (
                    t.forEach(function (t) {
                      n[++e] = t;
                    }),
                    n
                  );
                }
                function hn(t) {
                  var e = -1,
                    n = Array(t.size);
                  return (
                    t.forEach(function (t) {
                      n[++e] = [t, t];
                    }),
                    n
                  );
                }
                function pn(t) {
                  return sn(t)
                    ? (function (t) {
                        var e = (te.lastIndex = 0);
                        for (; te.test(t); ) ++e;
                        return e;
                      })(t)
                    : ze(t);
                }
                function dn(t) {
                  return sn(t)
                    ? (function (t) {
                        return t.match(te) || [];
                      })(t)
                    : (function (t) {
                        return t.split("");
                      })(t);
                }
                function vn(t) {
                  for (var e = t.length; e-- && st.test(t.charAt(e)); );
                  return e;
                }
                var mn = Ve({
                  "&amp;": "&",
                  "&lt;": "<",
                  "&gt;": ">",
                  "&quot;": '"',
                  "&#39;": "'",
                });
                var gn = (function t(e) {
                  var n,
                    r = (e =
                      null == e
                        ? pe
                        : gn.defaults(pe.Object(), e, gn.pick(pe, ie))).Array,
                    st = e.Date,
                    kt = e.Error,
                    Et = e.Function,
                    Ot = e.Math,
                    St = e.Object,
                    Tt = e.RegExp,
                    Ct = e.String,
                    At = e.TypeError,
                    Pt = r.prototype,
                    Rt = Et.prototype,
                    $t = St.prototype,
                    Mt = e["__core-js_shared__"],
                    qt = Rt.toString,
                    It = $t.hasOwnProperty,
                    Lt = 0,
                    zt = (n = /[^.]+$/.exec(
                      (Mt && Mt.keys && Mt.keys.IE_PROTO) || ""
                    ))
                      ? "Symbol(src)_1." + n
                      : "",
                    Dt = $t.toString,
                    Ft = qt.call(St),
                    Wt = pe._,
                    Ut = Tt(
                      "^" +
                        qt
                          .call(It)
                          .replace(it, "\\$&")
                          .replace(
                            /hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g,
                            "$1.*?"
                          ) +
                        "$"
                    ),
                    Bt = me ? e.Buffer : i,
                    Nt = e.Symbol,
                    Ht = e.Uint8Array,
                    Vt = Bt ? Bt.allocUnsafe : i,
                    Jt = un(St.getPrototypeOf, St),
                    Zt = St.create,
                    Gt = $t.propertyIsEnumerable,
                    Kt = Pt.splice,
                    Yt = Nt ? Nt.isConcatSpreadable : i,
                    te = Nt ? Nt.iterator : i,
                    ne = Nt ? Nt.toStringTag : i,
                    le = (function () {
                      try {
                        var t = po(St, "defineProperty");
                        return t({}, "", {}), t;
                      } catch (t) {}
                    })(),
                    fe = e.clearTimeout !== pe.clearTimeout && e.clearTimeout,
                    he = st && st.now !== pe.Date.now && st.now,
                    de = e.setTimeout !== pe.setTimeout && e.setTimeout,
                    ve = Ot.ceil,
                    ge = Ot.floor,
                    we = St.getOwnPropertySymbols,
                    ze = Bt ? Bt.isBuffer : i,
                    Ve = e.isFinite,
                    wn = Pt.join,
                    bn = un(St.keys, St),
                    yn = Ot.max,
                    _n = Ot.min,
                    xn = st.now,
                    jn = e.parseInt,
                    kn = Ot.random,
                    En = Pt.reverse,
                    On = po(e, "DataView"),
                    Sn = po(e, "Map"),
                    Tn = po(e, "Promise"),
                    Cn = po(e, "Set"),
                    An = po(e, "WeakMap"),
                    Pn = po(St, "create"),
                    Rn = An && new An(),
                    $n = {},
                    Mn = Wo(On),
                    qn = Wo(Sn),
                    In = Wo(Tn),
                    Ln = Wo(Cn),
                    zn = Wo(An),
                    Dn = Nt ? Nt.prototype : i,
                    Fn = Dn ? Dn.valueOf : i,
                    Wn = Dn ? Dn.toString : i;
                  function Un(t) {
                    if (is(t) && !Ja(t) && !(t instanceof Vn)) {
                      if (t instanceof Hn) return t;
                      if (It.call(t, "__wrapped__")) return Uo(t);
                    }
                    return new Hn(t);
                  }
                  var Bn = (function () {
                    function t() {}
                    return function (e) {
                      if (!rs(e)) return {};
                      if (Zt) return Zt(e);
                      t.prototype = e;
                      var n = new t();
                      return (t.prototype = i), n;
                    };
                  })();
                  function Nn() {}
                  function Hn(t, e) {
                    (this.__wrapped__ = t),
                      (this.__actions__ = []),
                      (this.__chain__ = !!e),
                      (this.__index__ = 0),
                      (this.__values__ = i);
                  }
                  function Vn(t) {
                    (this.__wrapped__ = t),
                      (this.__actions__ = []),
                      (this.__dir__ = 1),
                      (this.__filtered__ = !1),
                      (this.__iteratees__ = []),
                      (this.__takeCount__ = m),
                      (this.__views__ = []);
                  }
                  function Jn(t) {
                    var e = -1,
                      n = null == t ? 0 : t.length;
                    for (this.clear(); ++e < n; ) {
                      var r = t[e];
                      this.set(r[0], r[1]);
                    }
                  }
                  function Zn(t) {
                    var e = -1,
                      n = null == t ? 0 : t.length;
                    for (this.clear(); ++e < n; ) {
                      var r = t[e];
                      this.set(r[0], r[1]);
                    }
                  }
                  function Gn(t) {
                    var e = -1,
                      n = null == t ? 0 : t.length;
                    for (this.clear(); ++e < n; ) {
                      var r = t[e];
                      this.set(r[0], r[1]);
                    }
                  }
                  function Kn(t) {
                    var e = -1,
                      n = null == t ? 0 : t.length;
                    for (this.__data__ = new Gn(); ++e < n; ) this.add(t[e]);
                  }
                  function Yn(t) {
                    var e = (this.__data__ = new Zn(t));
                    this.size = e.size;
                  }
                  function Xn(t, e) {
                    var n = Ja(t),
                      r = !n && Va(t),
                      i = !n && !r && Ya(t),
                      o = !n && !r && !i && hs(t),
                      a = n || r || i || o,
                      s = a ? Ge(t.length, Ct) : [],
                      l = s.length;
                    for (var u in t)
                      (!e && !It.call(t, u)) ||
                        (a &&
                          ("length" == u ||
                            (i && ("offset" == u || "parent" == u)) ||
                            (o &&
                              ("buffer" == u ||
                                "byteLength" == u ||
                                "byteOffset" == u)) ||
                            _o(u, l))) ||
                        s.push(u);
                    return s;
                  }
                  function Qn(t) {
                    var e = t.length;
                    return e ? t[Kr(0, e - 1)] : i;
                  }
                  function tr(t, e) {
                    return zo(Pi(t), ur(e, 0, t.length));
                  }
                  function er(t) {
                    return zo(Pi(t));
                  }
                  function nr(t, e, n) {
                    ((n !== i && !Ba(t[e], n)) || (n === i && !(e in t))) &&
                      sr(t, e, n);
                  }
                  function rr(t, e, n) {
                    var r = t[e];
                    (It.call(t, e) && Ba(r, n) && (n !== i || e in t)) ||
                      sr(t, e, n);
                  }
                  function ir(t, e) {
                    for (var n = t.length; n--; ) if (Ba(t[n][0], e)) return n;
                    return -1;
                  }
                  function or(t, e, n, r) {
                    return (
                      dr(t, function (t, i, o) {
                        e(r, t, n(t), o);
                      }),
                      r
                    );
                  }
                  function ar(t, e) {
                    return t && Ri(e, Ms(e), t);
                  }
                  function sr(t, e, n) {
                    "__proto__" == e && le
                      ? le(t, e, {
                          configurable: !0,
                          enumerable: !0,
                          value: n,
                          writable: !0,
                        })
                      : (t[e] = n);
                  }
                  function lr(t, e) {
                    for (
                      var n = -1, o = e.length, a = r(o), s = null == t;
                      ++n < o;

                    )
                      a[n] = s ? i : Cs(t, e[n]);
                    return a;
                  }
                  function ur(t, e, n) {
                    return (
                      t == t &&
                        (n !== i && (t = t <= n ? t : n),
                        e !== i && (t = t >= e ? t : e)),
                      t
                    );
                  }
                  function cr(t, e, n, r, o, a) {
                    var s,
                      l = 1 & e,
                      u = 2 & e,
                      c = 4 & e;
                    if ((n && (s = o ? n(t, r, o, a) : n(t)), s !== i))
                      return s;
                    if (!rs(t)) return t;
                    var f = Ja(t);
                    if (f) {
                      if (
                        ((s = (function (t) {
                          var e = t.length,
                            n = new t.constructor(e);
                          e &&
                            "string" == typeof t[0] &&
                            It.call(t, "index") &&
                            ((n.index = t.index), (n.input = t.input));
                          return n;
                        })(t)),
                        !l)
                      )
                        return Pi(t, s);
                    } else {
                      var h = go(t),
                        p = h == j || h == k;
                      if (Ya(t)) return Ei(t, l);
                      if (h == S || h == w || (p && !o)) {
                        if (((s = u || p ? {} : bo(t)), !l))
                          return u
                            ? (function (t, e) {
                                return Ri(t, mo(t), e);
                              })(
                                t,
                                (function (t, e) {
                                  return t && Ri(e, qs(e), t);
                                })(s, t)
                              )
                            : (function (t, e) {
                                return Ri(t, vo(t), e);
                              })(t, ar(s, t));
                      } else {
                        if (!se[h]) return o ? t : {};
                        s = (function (t, e, n) {
                          var r = t.constructor;
                          switch (e) {
                            case M:
                              return Oi(t);
                            case y:
                            case _:
                              return new r(+t);
                            case q:
                              return (function (t, e) {
                                var n = e ? Oi(t.buffer) : t.buffer;
                                return new t.constructor(
                                  n,
                                  t.byteOffset,
                                  t.byteLength
                                );
                              })(t, n);
                            case I:
                            case L:
                            case z:
                            case D:
                            case F:
                            case W:
                            case U:
                            case B:
                            case N:
                              return Si(t, n);
                            case E:
                              return new r();
                            case O:
                            case P:
                              return new r(t);
                            case C:
                              return (function (t) {
                                var e = new t.constructor(t.source, vt.exec(t));
                                return (e.lastIndex = t.lastIndex), e;
                              })(t);
                            case A:
                              return new r();
                            case R:
                              return (i = t), Fn ? St(Fn.call(i)) : {};
                          }
                          var i;
                        })(t, h, l);
                      }
                    }
                    a || (a = new Yn());
                    var d = a.get(t);
                    if (d) return d;
                    a.set(t, s),
                      us(t)
                        ? t.forEach(function (r) {
                            s.add(cr(r, e, n, r, t, a));
                          })
                        : os(t) &&
                          t.forEach(function (r, i) {
                            s.set(i, cr(r, e, n, i, t, a));
                          });
                    var v = f ? i : (c ? (u ? ao : oo) : u ? qs : Ms)(t);
                    return (
                      Se(v || t, function (r, i) {
                        v && (r = t[(i = r)]), rr(s, i, cr(r, e, n, i, t, a));
                      }),
                      s
                    );
                  }
                  function fr(t, e, n) {
                    var r = n.length;
                    if (null == t) return !r;
                    for (t = St(t); r--; ) {
                      var o = n[r],
                        a = e[o],
                        s = t[o];
                      if ((s === i && !(o in t)) || !a(s)) return !1;
                    }
                    return !0;
                  }
                  function hr(t, e, n) {
                    if ("function" != typeof t) throw new At(o);
                    return Mo(function () {
                      t.apply(i, n);
                    }, e);
                  }
                  function pr(t, e, n, r) {
                    var i = -1,
                      o = Pe,
                      a = !0,
                      s = t.length,
                      l = [],
                      u = e.length;
                    if (!s) return l;
                    n && (e = $e(e, Ye(n))),
                      r
                        ? ((o = Re), (a = !1))
                        : e.length >= 200 &&
                          ((o = Qe), (a = !1), (e = new Kn(e)));
                    t: for (; ++i < s; ) {
                      var c = t[i],
                        f = null == n ? c : n(c);
                      if (((c = r || 0 !== c ? c : 0), a && f == f)) {
                        for (var h = u; h--; ) if (e[h] === f) continue t;
                        l.push(c);
                      } else o(e, f, r) || l.push(c);
                    }
                    return l;
                  }
                  (Un.templateSettings = {
                    escape: X,
                    evaluate: Q,
                    interpolate: tt,
                    variable: "",
                    imports: { _: Un },
                  }),
                    (Un.prototype = Nn.prototype),
                    (Un.prototype.constructor = Un),
                    (Hn.prototype = Bn(Nn.prototype)),
                    (Hn.prototype.constructor = Hn),
                    (Vn.prototype = Bn(Nn.prototype)),
                    (Vn.prototype.constructor = Vn),
                    (Jn.prototype.clear = function () {
                      (this.__data__ = Pn ? Pn(null) : {}), (this.size = 0);
                    }),
                    (Jn.prototype.delete = function (t) {
                      var e = this.has(t) && delete this.__data__[t];
                      return (this.size -= e ? 1 : 0), e;
                    }),
                    (Jn.prototype.get = function (t) {
                      var e = this.__data__;
                      if (Pn) {
                        var n = e[t];
                        return n === a ? i : n;
                      }
                      return It.call(e, t) ? e[t] : i;
                    }),
                    (Jn.prototype.has = function (t) {
                      var e = this.__data__;
                      return Pn ? e[t] !== i : It.call(e, t);
                    }),
                    (Jn.prototype.set = function (t, e) {
                      var n = this.__data__;
                      return (
                        (this.size += this.has(t) ? 0 : 1),
                        (n[t] = Pn && e === i ? a : e),
                        this
                      );
                    }),
                    (Zn.prototype.clear = function () {
                      (this.__data__ = []), (this.size = 0);
                    }),
                    (Zn.prototype.delete = function (t) {
                      var e = this.__data__,
                        n = ir(e, t);
                      return (
                        !(n < 0) &&
                        (n == e.length - 1 ? e.pop() : Kt.call(e, n, 1),
                        --this.size,
                        !0)
                      );
                    }),
                    (Zn.prototype.get = function (t) {
                      var e = this.__data__,
                        n = ir(e, t);
                      return n < 0 ? i : e[n][1];
                    }),
                    (Zn.prototype.has = function (t) {
                      return ir(this.__data__, t) > -1;
                    }),
                    (Zn.prototype.set = function (t, e) {
                      var n = this.__data__,
                        r = ir(n, t);
                      return (
                        r < 0 ? (++this.size, n.push([t, e])) : (n[r][1] = e),
                        this
                      );
                    }),
                    (Gn.prototype.clear = function () {
                      (this.size = 0),
                        (this.__data__ = {
                          hash: new Jn(),
                          map: new (Sn || Zn)(),
                          string: new Jn(),
                        });
                    }),
                    (Gn.prototype.delete = function (t) {
                      var e = fo(this, t).delete(t);
                      return (this.size -= e ? 1 : 0), e;
                    }),
                    (Gn.prototype.get = function (t) {
                      return fo(this, t).get(t);
                    }),
                    (Gn.prototype.has = function (t) {
                      return fo(this, t).has(t);
                    }),
                    (Gn.prototype.set = function (t, e) {
                      var n = fo(this, t),
                        r = n.size;
                      return (
                        n.set(t, e), (this.size += n.size == r ? 0 : 1), this
                      );
                    }),
                    (Kn.prototype.add = Kn.prototype.push =
                      function (t) {
                        return this.__data__.set(t, a), this;
                      }),
                    (Kn.prototype.has = function (t) {
                      return this.__data__.has(t);
                    }),
                    (Yn.prototype.clear = function () {
                      (this.__data__ = new Zn()), (this.size = 0);
                    }),
                    (Yn.prototype.delete = function (t) {
                      var e = this.__data__,
                        n = e.delete(t);
                      return (this.size = e.size), n;
                    }),
                    (Yn.prototype.get = function (t) {
                      return this.__data__.get(t);
                    }),
                    (Yn.prototype.has = function (t) {
                      return this.__data__.has(t);
                    }),
                    (Yn.prototype.set = function (t, e) {
                      var n = this.__data__;
                      if (n instanceof Zn) {
                        var r = n.__data__;
                        if (!Sn || r.length < 199)
                          return r.push([t, e]), (this.size = ++n.size), this;
                        n = this.__data__ = new Gn(r);
                      }
                      return n.set(t, e), (this.size = n.size), this;
                    });
                  var dr = qi(xr),
                    vr = qi(jr, !0);
                  function mr(t, e) {
                    var n = !0;
                    return (
                      dr(t, function (t, r, i) {
                        return (n = !!e(t, r, i));
                      }),
                      n
                    );
                  }
                  function gr(t, e, n) {
                    for (var r = -1, o = t.length; ++r < o; ) {
                      var a = t[r],
                        s = e(a);
                      if (null != s && (l === i ? s == s && !fs(s) : n(s, l)))
                        var l = s,
                          u = a;
                    }
                    return u;
                  }
                  function wr(t, e) {
                    var n = [];
                    return (
                      dr(t, function (t, r, i) {
                        e(t, r, i) && n.push(t);
                      }),
                      n
                    );
                  }
                  function br(t, e, n, r, i) {
                    var o = -1,
                      a = t.length;
                    for (n || (n = yo), i || (i = []); ++o < a; ) {
                      var s = t[o];
                      e > 0 && n(s)
                        ? e > 1
                          ? br(s, e - 1, n, r, i)
                          : Me(i, s)
                        : r || (i[i.length] = s);
                    }
                    return i;
                  }
                  var yr = Ii(),
                    _r = Ii(!0);
                  function xr(t, e) {
                    return t && yr(t, e, Ms);
                  }
                  function jr(t, e) {
                    return t && _r(t, e, Ms);
                  }
                  function kr(t, e) {
                    return Ae(e, function (e) {
                      return ts(t[e]);
                    });
                  }
                  function Er(t, e) {
                    for (
                      var n = 0, r = (e = _i(e, t)).length;
                      null != t && n < r;

                    )
                      t = t[Fo(e[n++])];
                    return n && n == r ? t : i;
                  }
                  function Or(t, e, n) {
                    var r = e(t);
                    return Ja(t) ? r : Me(r, n(t));
                  }
                  function Sr(t) {
                    return null == t
                      ? t === i
                        ? "[object Undefined]"
                        : "[object Null]"
                      : ne && ne in St(t)
                      ? (function (t) {
                          var e = It.call(t, ne),
                            n = t[ne];
                          try {
                            t[ne] = i;
                            var r = !0;
                          } catch (t) {}
                          var o = Dt.call(t);
                          r && (e ? (t[ne] = n) : delete t[ne]);
                          return o;
                        })(t)
                      : (function (t) {
                          return Dt.call(t);
                        })(t);
                  }
                  function Tr(t, e) {
                    return t > e;
                  }
                  function Cr(t, e) {
                    return null != t && It.call(t, e);
                  }
                  function Ar(t, e) {
                    return null != t && e in St(t);
                  }
                  function Pr(t, e, n) {
                    for (
                      var o = n ? Re : Pe,
                        a = t[0].length,
                        s = t.length,
                        l = s,
                        u = r(s),
                        c = 1 / 0,
                        f = [];
                      l--;

                    ) {
                      var h = t[l];
                      l && e && (h = $e(h, Ye(e))),
                        (c = _n(h.length, c)),
                        (u[l] =
                          !n && (e || (a >= 120 && h.length >= 120))
                            ? new Kn(l && h)
                            : i);
                    }
                    h = t[0];
                    var p = -1,
                      d = u[0];
                    t: for (; ++p < a && f.length < c; ) {
                      var v = h[p],
                        m = e ? e(v) : v;
                      if (
                        ((v = n || 0 !== v ? v : 0),
                        !(d ? Qe(d, m) : o(f, m, n)))
                      ) {
                        for (l = s; --l; ) {
                          var g = u[l];
                          if (!(g ? Qe(g, m) : o(t[l], m, n))) continue t;
                        }
                        d && d.push(m), f.push(v);
                      }
                    }
                    return f;
                  }
                  function Rr(t, e, n) {
                    var r =
                      null == (t = Ao(t, (e = _i(e, t)))) ? t : t[Fo(Qo(e))];
                    return null == r ? i : Ee(r, t, n);
                  }
                  function $r(t) {
                    return is(t) && Sr(t) == w;
                  }
                  function Mr(t, e, n, r, o) {
                    return (
                      t === e ||
                      (null == t || null == e || (!is(t) && !is(e))
                        ? t != t && e != e
                        : (function (t, e, n, r, o, a) {
                            var s = Ja(t),
                              l = Ja(e),
                              u = s ? b : go(t),
                              c = l ? b : go(e),
                              f = (u = u == w ? S : u) == S,
                              h = (c = c == w ? S : c) == S,
                              p = u == c;
                            if (p && Ya(t)) {
                              if (!Ya(e)) return !1;
                              (s = !0), (f = !1);
                            }
                            if (p && !f)
                              return (
                                a || (a = new Yn()),
                                s || hs(t)
                                  ? ro(t, e, n, r, o, a)
                                  : (function (t, e, n, r, i, o, a) {
                                      switch (n) {
                                        case q:
                                          if (
                                            t.byteLength != e.byteLength ||
                                            t.byteOffset != e.byteOffset
                                          )
                                            return !1;
                                          (t = t.buffer), (e = e.buffer);
                                        case M:
                                          return !(
                                            t.byteLength != e.byteLength ||
                                            !o(new Ht(t), new Ht(e))
                                          );
                                        case y:
                                        case _:
                                        case O:
                                          return Ba(+t, +e);
                                        case x:
                                          return (
                                            t.name == e.name &&
                                            t.message == e.message
                                          );
                                        case C:
                                        case P:
                                          return t == e + "";
                                        case E:
                                          var s = ln;
                                        case A:
                                          var l = 1 & r;
                                          if (
                                            (s || (s = fn),
                                            t.size != e.size && !l)
                                          )
                                            return !1;
                                          var u = a.get(t);
                                          if (u) return u == e;
                                          (r |= 2), a.set(t, e);
                                          var c = ro(s(t), s(e), r, i, o, a);
                                          return a.delete(t), c;
                                        case R:
                                          if (Fn)
                                            return Fn.call(t) == Fn.call(e);
                                      }
                                      return !1;
                                    })(t, e, u, n, r, o, a)
                              );
                            if (!(1 & n)) {
                              var d = f && It.call(t, "__wrapped__"),
                                v = h && It.call(e, "__wrapped__");
                              if (d || v) {
                                var m = d ? t.value() : t,
                                  g = v ? e.value() : e;
                                return a || (a = new Yn()), o(m, g, n, r, a);
                              }
                            }
                            if (!p) return !1;
                            return (
                              a || (a = new Yn()),
                              (function (t, e, n, r, o, a) {
                                var s = 1 & n,
                                  l = oo(t),
                                  u = l.length,
                                  c = oo(e).length;
                                if (u != c && !s) return !1;
                                var f = u;
                                for (; f--; ) {
                                  var h = l[f];
                                  if (!(s ? h in e : It.call(e, h))) return !1;
                                }
                                var p = a.get(t),
                                  d = a.get(e);
                                if (p && d) return p == e && d == t;
                                var v = !0;
                                a.set(t, e), a.set(e, t);
                                var m = s;
                                for (; ++f < u; ) {
                                  var g = t[(h = l[f])],
                                    w = e[h];
                                  if (r)
                                    var b = s
                                      ? r(w, g, h, e, t, a)
                                      : r(g, w, h, t, e, a);
                                  if (
                                    !(b === i ? g === w || o(g, w, n, r, a) : b)
                                  ) {
                                    v = !1;
                                    break;
                                  }
                                  m || (m = "constructor" == h);
                                }
                                if (v && !m) {
                                  var y = t.constructor,
                                    _ = e.constructor;
                                  y == _ ||
                                    !("constructor" in t) ||
                                    !("constructor" in e) ||
                                    ("function" == typeof y &&
                                      y instanceof y &&
                                      "function" == typeof _ &&
                                      _ instanceof _) ||
                                    (v = !1);
                                }
                                return a.delete(t), a.delete(e), v;
                              })(t, e, n, r, o, a)
                            );
                          })(t, e, n, r, Mr, o))
                    );
                  }
                  function qr(t, e, n, r) {
                    var o = n.length,
                      a = o,
                      s = !r;
                    if (null == t) return !a;
                    for (t = St(t); o--; ) {
                      var l = n[o];
                      if (s && l[2] ? l[1] !== t[l[0]] : !(l[0] in t))
                        return !1;
                    }
                    for (; ++o < a; ) {
                      var u = (l = n[o])[0],
                        c = t[u],
                        f = l[1];
                      if (s && l[2]) {
                        if (c === i && !(u in t)) return !1;
                      } else {
                        var h = new Yn();
                        if (r) var p = r(c, f, u, t, e, h);
                        if (!(p === i ? Mr(f, c, 3, r, h) : p)) return !1;
                      }
                    }
                    return !0;
                  }
                  function Ir(t) {
                    return (
                      !(!rs(t) || ((e = t), zt && zt in e)) &&
                      (ts(t) ? Ut : wt).test(Wo(t))
                    );
                  }
                  function Lr(t) {
                    return "function" == typeof t
                      ? t
                      : null == t
                      ? al
                      : "object" == typeof t
                      ? Ja(t)
                        ? Br(t[0], t[1])
                        : Ur(t)
                      : vl(t);
                  }
                  function zr(t) {
                    if (!Oo(t)) return bn(t);
                    var e = [];
                    for (var n in St(t))
                      It.call(t, n) && "constructor" != n && e.push(n);
                    return e;
                  }
                  function Dr(t) {
                    if (!rs(t))
                      return (function (t) {
                        var e = [];
                        if (null != t) for (var n in St(t)) e.push(n);
                        return e;
                      })(t);
                    var e = Oo(t),
                      n = [];
                    for (var r in t)
                      ("constructor" != r || (!e && It.call(t, r))) &&
                        n.push(r);
                    return n;
                  }
                  function Fr(t, e) {
                    return t < e;
                  }
                  function Wr(t, e) {
                    var n = -1,
                      i = Ga(t) ? r(t.length) : [];
                    return (
                      dr(t, function (t, r, o) {
                        i[++n] = e(t, r, o);
                      }),
                      i
                    );
                  }
                  function Ur(t) {
                    var e = ho(t);
                    return 1 == e.length && e[0][2]
                      ? To(e[0][0], e[0][1])
                      : function (n) {
                          return n === t || qr(n, t, e);
                        };
                  }
                  function Br(t, e) {
                    return jo(t) && So(e)
                      ? To(Fo(t), e)
                      : function (n) {
                          var r = Cs(n, t);
                          return r === i && r === e ? As(n, t) : Mr(e, r, 3);
                        };
                  }
                  function Nr(t, e, n, r, o) {
                    t !== e &&
                      yr(
                        e,
                        function (a, s) {
                          if ((o || (o = new Yn()), rs(a)))
                            !(function (t, e, n, r, o, a, s) {
                              var l = Ro(t, n),
                                u = Ro(e, n),
                                c = s.get(u);
                              if (c) return void nr(t, n, c);
                              var f = a ? a(l, u, n + "", t, e, s) : i,
                                h = f === i;
                              if (h) {
                                var p = Ja(u),
                                  d = !p && Ya(u),
                                  v = !p && !d && hs(u);
                                (f = u),
                                  p || d || v
                                    ? Ja(l)
                                      ? (f = l)
                                      : Ka(l)
                                      ? (f = Pi(l))
                                      : d
                                      ? ((h = !1), (f = Ei(u, !0)))
                                      : v
                                      ? ((h = !1), (f = Si(u, !0)))
                                      : (f = [])
                                    : ss(u) || Va(u)
                                    ? ((f = l),
                                      Va(l)
                                        ? (f = ys(l))
                                        : (rs(l) && !ts(l)) || (f = bo(u)))
                                    : (h = !1);
                              }
                              h && (s.set(u, f), o(f, u, r, a, s), s.delete(u));
                              nr(t, n, f);
                            })(t, e, s, n, Nr, r, o);
                          else {
                            var l = r ? r(Ro(t, s), a, s + "", t, e, o) : i;
                            l === i && (l = a), nr(t, s, l);
                          }
                        },
                        qs
                      );
                  }
                  function Hr(t, e) {
                    var n = t.length;
                    if (n) return _o((e += e < 0 ? n : 0), n) ? t[e] : i;
                  }
                  function Vr(t, e, n) {
                    e = e.length
                      ? $e(e, function (t) {
                          return Ja(t)
                            ? function (e) {
                                return Er(e, 1 === t.length ? t[0] : t);
                              }
                            : t;
                        })
                      : [al];
                    var r = -1;
                    e = $e(e, Ye(co()));
                    var i = Wr(t, function (t, n, i) {
                      var o = $e(e, function (e) {
                        return e(t);
                      });
                      return { criteria: o, index: ++r, value: t };
                    });
                    return (function (t, e) {
                      var n = t.length;
                      for (t.sort(e); n--; ) t[n] = t[n].value;
                      return t;
                    })(i, function (t, e) {
                      return (function (t, e, n) {
                        var r = -1,
                          i = t.criteria,
                          o = e.criteria,
                          a = i.length,
                          s = n.length;
                        for (; ++r < a; ) {
                          var l = Ti(i[r], o[r]);
                          if (l)
                            return r >= s ? l : l * ("desc" == n[r] ? -1 : 1);
                        }
                        return t.index - e.index;
                      })(t, e, n);
                    });
                  }
                  function Jr(t, e, n) {
                    for (var r = -1, i = e.length, o = {}; ++r < i; ) {
                      var a = e[r],
                        s = Er(t, a);
                      n(s, a) && ei(o, _i(a, t), s);
                    }
                    return o;
                  }
                  function Zr(t, e, n, r) {
                    var i = r ? Ue : We,
                      o = -1,
                      a = e.length,
                      s = t;
                    for (
                      t === e && (e = Pi(e)), n && (s = $e(t, Ye(n)));
                      ++o < a;

                    )
                      for (
                        var l = 0, u = e[o], c = n ? n(u) : u;
                        (l = i(s, c, l, r)) > -1;

                      )
                        s !== t && Kt.call(s, l, 1), Kt.call(t, l, 1);
                    return t;
                  }
                  function Gr(t, e) {
                    for (var n = t ? e.length : 0, r = n - 1; n--; ) {
                      var i = e[n];
                      if (n == r || i !== o) {
                        var o = i;
                        _o(i) ? Kt.call(t, i, 1) : pi(t, i);
                      }
                    }
                    return t;
                  }
                  function Kr(t, e) {
                    return t + ge(kn() * (e - t + 1));
                  }
                  function Yr(t, e) {
                    var n = "";
                    if (!t || e < 1 || e > d) return n;
                    do {
                      e % 2 && (n += t), (e = ge(e / 2)) && (t += t);
                    } while (e);
                    return n;
                  }
                  function Xr(t, e) {
                    return qo(Co(t, e, al), t + "");
                  }
                  function Qr(t) {
                    return Qn(Bs(t));
                  }
                  function ti(t, e) {
                    var n = Bs(t);
                    return zo(n, ur(e, 0, n.length));
                  }
                  function ei(t, e, n, r) {
                    if (!rs(t)) return t;
                    for (
                      var o = -1, a = (e = _i(e, t)).length, s = a - 1, l = t;
                      null != l && ++o < a;

                    ) {
                      var u = Fo(e[o]),
                        c = n;
                      if (
                        "__proto__" === u ||
                        "constructor" === u ||
                        "prototype" === u
                      )
                        return t;
                      if (o != s) {
                        var f = l[u];
                        (c = r ? r(f, u, l) : i) === i &&
                          (c = rs(f) ? f : _o(e[o + 1]) ? [] : {});
                      }
                      rr(l, u, c), (l = l[u]);
                    }
                    return t;
                  }
                  var ni = Rn
                      ? function (t, e) {
                          return Rn.set(t, e), t;
                        }
                      : al,
                    ri = le
                      ? function (t, e) {
                          return le(t, "toString", {
                            configurable: !0,
                            enumerable: !1,
                            value: rl(e),
                            writable: !0,
                          });
                        }
                      : al;
                  function ii(t) {
                    return zo(Bs(t));
                  }
                  function oi(t, e, n) {
                    var i = -1,
                      o = t.length;
                    e < 0 && (e = -e > o ? 0 : o + e),
                      (n = n > o ? o : n) < 0 && (n += o),
                      (o = e > n ? 0 : (n - e) >>> 0),
                      (e >>>= 0);
                    for (var a = r(o); ++i < o; ) a[i] = t[i + e];
                    return a;
                  }
                  function ai(t, e) {
                    var n;
                    return (
                      dr(t, function (t, r, i) {
                        return !(n = e(t, r, i));
                      }),
                      !!n
                    );
                  }
                  function si(t, e, n) {
                    var r = 0,
                      i = null == t ? r : t.length;
                    if ("number" == typeof e && e == e && i <= 2147483647) {
                      for (; r < i; ) {
                        var o = (r + i) >>> 1,
                          a = t[o];
                        null !== a && !fs(a) && (n ? a <= e : a < e)
                          ? (r = o + 1)
                          : (i = o);
                      }
                      return i;
                    }
                    return li(t, e, al, n);
                  }
                  function li(t, e, n, r) {
                    var o = 0,
                      a = null == t ? 0 : t.length;
                    if (0 === a) return 0;
                    for (
                      var s = (e = n(e)) != e,
                        l = null === e,
                        u = fs(e),
                        c = e === i;
                      o < a;

                    ) {
                      var f = ge((o + a) / 2),
                        h = n(t[f]),
                        p = h !== i,
                        d = null === h,
                        v = h == h,
                        m = fs(h);
                      if (s) var g = r || v;
                      else
                        g = c
                          ? v && (r || p)
                          : l
                          ? v && p && (r || !d)
                          : u
                          ? v && p && !d && (r || !m)
                          : !d && !m && (r ? h <= e : h < e);
                      g ? (o = f + 1) : (a = f);
                    }
                    return _n(a, 4294967294);
                  }
                  function ui(t, e) {
                    for (var n = -1, r = t.length, i = 0, o = []; ++n < r; ) {
                      var a = t[n],
                        s = e ? e(a) : a;
                      if (!n || !Ba(s, l)) {
                        var l = s;
                        o[i++] = 0 === a ? 0 : a;
                      }
                    }
                    return o;
                  }
                  function ci(t) {
                    return "number" == typeof t ? t : fs(t) ? v : +t;
                  }
                  function fi(t) {
                    if ("string" == typeof t) return t;
                    if (Ja(t)) return $e(t, fi) + "";
                    if (fs(t)) return Wn ? Wn.call(t) : "";
                    var e = t + "";
                    return "0" == e && 1 / t == -1 / 0 ? "-0" : e;
                  }
                  function hi(t, e, n) {
                    var r = -1,
                      i = Pe,
                      o = t.length,
                      a = !0,
                      s = [],
                      l = s;
                    if (n) (a = !1), (i = Re);
                    else if (o >= 200) {
                      var u = e ? null : Yi(t);
                      if (u) return fn(u);
                      (a = !1), (i = Qe), (l = new Kn());
                    } else l = e ? [] : s;
                    t: for (; ++r < o; ) {
                      var c = t[r],
                        f = e ? e(c) : c;
                      if (((c = n || 0 !== c ? c : 0), a && f == f)) {
                        for (var h = l.length; h--; )
                          if (l[h] === f) continue t;
                        e && l.push(f), s.push(c);
                      } else i(l, f, n) || (l !== s && l.push(f), s.push(c));
                    }
                    return s;
                  }
                  function pi(t, e) {
                    return (
                      null == (t = Ao(t, (e = _i(e, t)))) || delete t[Fo(Qo(e))]
                    );
                  }
                  function di(t, e, n, r) {
                    return ei(t, e, n(Er(t, e)), r);
                  }
                  function vi(t, e, n, r) {
                    for (
                      var i = t.length, o = r ? i : -1;
                      (r ? o-- : ++o < i) && e(t[o], o, t);

                    );
                    return n
                      ? oi(t, r ? 0 : o, r ? o + 1 : i)
                      : oi(t, r ? o + 1 : 0, r ? i : o);
                  }
                  function mi(t, e) {
                    var n = t;
                    return (
                      n instanceof Vn && (n = n.value()),
                      qe(
                        e,
                        function (t, e) {
                          return e.func.apply(e.thisArg, Me([t], e.args));
                        },
                        n
                      )
                    );
                  }
                  function gi(t, e, n) {
                    var i = t.length;
                    if (i < 2) return i ? hi(t[0]) : [];
                    for (var o = -1, a = r(i); ++o < i; )
                      for (var s = t[o], l = -1; ++l < i; )
                        l != o && (a[o] = pr(a[o] || s, t[l], e, n));
                    return hi(br(a, 1), e, n);
                  }
                  function wi(t, e, n) {
                    for (
                      var r = -1, o = t.length, a = e.length, s = {};
                      ++r < o;

                    ) {
                      var l = r < a ? e[r] : i;
                      n(s, t[r], l);
                    }
                    return s;
                  }
                  function bi(t) {
                    return Ka(t) ? t : [];
                  }
                  function yi(t) {
                    return "function" == typeof t ? t : al;
                  }
                  function _i(t, e) {
                    return Ja(t) ? t : jo(t, e) ? [t] : Do(_s(t));
                  }
                  var xi = Xr;
                  function ji(t, e, n) {
                    var r = t.length;
                    return (
                      (n = n === i ? r : n), !e && n >= r ? t : oi(t, e, n)
                    );
                  }
                  var ki =
                    fe ||
                    function (t) {
                      return pe.clearTimeout(t);
                    };
                  function Ei(t, e) {
                    if (e) return t.slice();
                    var n = t.length,
                      r = Vt ? Vt(n) : new t.constructor(n);
                    return t.copy(r), r;
                  }
                  function Oi(t) {
                    var e = new t.constructor(t.byteLength);
                    return new Ht(e).set(new Ht(t)), e;
                  }
                  function Si(t, e) {
                    var n = e ? Oi(t.buffer) : t.buffer;
                    return new t.constructor(n, t.byteOffset, t.length);
                  }
                  function Ti(t, e) {
                    if (t !== e) {
                      var n = t !== i,
                        r = null === t,
                        o = t == t,
                        a = fs(t),
                        s = e !== i,
                        l = null === e,
                        u = e == e,
                        c = fs(e);
                      if (
                        (!l && !c && !a && t > e) ||
                        (a && s && u && !l && !c) ||
                        (r && s && u) ||
                        (!n && u) ||
                        !o
                      )
                        return 1;
                      if (
                        (!r && !a && !c && t < e) ||
                        (c && n && o && !r && !a) ||
                        (l && n && o) ||
                        (!s && o) ||
                        !u
                      )
                        return -1;
                    }
                    return 0;
                  }
                  function Ci(t, e, n, i) {
                    for (
                      var o = -1,
                        a = t.length,
                        s = n.length,
                        l = -1,
                        u = e.length,
                        c = yn(a - s, 0),
                        f = r(u + c),
                        h = !i;
                      ++l < u;

                    )
                      f[l] = e[l];
                    for (; ++o < s; ) (h || o < a) && (f[n[o]] = t[o]);
                    for (; c--; ) f[l++] = t[o++];
                    return f;
                  }
                  function Ai(t, e, n, i) {
                    for (
                      var o = -1,
                        a = t.length,
                        s = -1,
                        l = n.length,
                        u = -1,
                        c = e.length,
                        f = yn(a - l, 0),
                        h = r(f + c),
                        p = !i;
                      ++o < f;

                    )
                      h[o] = t[o];
                    for (var d = o; ++u < c; ) h[d + u] = e[u];
                    for (; ++s < l; ) (p || o < a) && (h[d + n[s]] = t[o++]);
                    return h;
                  }
                  function Pi(t, e) {
                    var n = -1,
                      i = t.length;
                    for (e || (e = r(i)); ++n < i; ) e[n] = t[n];
                    return e;
                  }
                  function Ri(t, e, n, r) {
                    var o = !n;
                    n || (n = {});
                    for (var a = -1, s = e.length; ++a < s; ) {
                      var l = e[a],
                        u = r ? r(n[l], t[l], l, n, t) : i;
                      u === i && (u = t[l]), o ? sr(n, l, u) : rr(n, l, u);
                    }
                    return n;
                  }
                  function $i(t, e) {
                    return function (n, r) {
                      var i = Ja(n) ? Oe : or,
                        o = e ? e() : {};
                      return i(n, t, co(r, 2), o);
                    };
                  }
                  function Mi(t) {
                    return Xr(function (e, n) {
                      var r = -1,
                        o = n.length,
                        a = o > 1 ? n[o - 1] : i,
                        s = o > 2 ? n[2] : i;
                      for (
                        a =
                          t.length > 3 && "function" == typeof a ? (o--, a) : i,
                          s &&
                            xo(n[0], n[1], s) &&
                            ((a = o < 3 ? i : a), (o = 1)),
                          e = St(e);
                        ++r < o;

                      ) {
                        var l = n[r];
                        l && t(e, l, r, a);
                      }
                      return e;
                    });
                  }
                  function qi(t, e) {
                    return function (n, r) {
                      if (null == n) return n;
                      if (!Ga(n)) return t(n, r);
                      for (
                        var i = n.length, o = e ? i : -1, a = St(n);
                        (e ? o-- : ++o < i) && !1 !== r(a[o], o, a);

                      );
                      return n;
                    };
                  }
                  function Ii(t) {
                    return function (e, n, r) {
                      for (
                        var i = -1, o = St(e), a = r(e), s = a.length;
                        s--;

                      ) {
                        var l = a[t ? s : ++i];
                        if (!1 === n(o[l], l, o)) break;
                      }
                      return e;
                    };
                  }
                  function Li(t) {
                    return function (e) {
                      var n = sn((e = _s(e))) ? dn(e) : i,
                        r = n ? n[0] : e.charAt(0),
                        o = n ? ji(n, 1).join("") : e.slice(1);
                      return r[t]() + o;
                    };
                  }
                  function zi(t) {
                    return function (e) {
                      return qe(tl(Vs(e).replace(Xt, "")), t, "");
                    };
                  }
                  function Di(t) {
                    return function () {
                      var e = arguments;
                      switch (e.length) {
                        case 0:
                          return new t();
                        case 1:
                          return new t(e[0]);
                        case 2:
                          return new t(e[0], e[1]);
                        case 3:
                          return new t(e[0], e[1], e[2]);
                        case 4:
                          return new t(e[0], e[1], e[2], e[3]);
                        case 5:
                          return new t(e[0], e[1], e[2], e[3], e[4]);
                        case 6:
                          return new t(e[0], e[1], e[2], e[3], e[4], e[5]);
                        case 7:
                          return new t(
                            e[0],
                            e[1],
                            e[2],
                            e[3],
                            e[4],
                            e[5],
                            e[6]
                          );
                      }
                      var n = Bn(t.prototype),
                        r = t.apply(n, e);
                      return rs(r) ? r : n;
                    };
                  }
                  function Fi(t) {
                    return function (e, n, r) {
                      var o = St(e);
                      if (!Ga(e)) {
                        var a = co(n, 3);
                        (e = Ms(e)),
                          (n = function (t) {
                            return a(o[t], t, o);
                          });
                      }
                      var s = t(e, n, r);
                      return s > -1 ? o[a ? e[s] : s] : i;
                    };
                  }
                  function Wi(t) {
                    return io(function (e) {
                      var n = e.length,
                        r = n,
                        a = Hn.prototype.thru;
                      for (t && e.reverse(); r--; ) {
                        var s = e[r];
                        if ("function" != typeof s) throw new At(o);
                        if (a && !l && "wrapper" == lo(s))
                          var l = new Hn([], !0);
                      }
                      for (r = l ? r : n; ++r < n; ) {
                        var u = lo((s = e[r])),
                          c = "wrapper" == u ? so(s) : i;
                        l =
                          c &&
                          ko(c[0]) &&
                          424 == c[1] &&
                          !c[4].length &&
                          1 == c[9]
                            ? l[lo(c[0])].apply(l, c[3])
                            : 1 == s.length && ko(s)
                            ? l[u]()
                            : l.thru(s);
                      }
                      return function () {
                        var t = arguments,
                          r = t[0];
                        if (l && 1 == t.length && Ja(r))
                          return l.plant(r).value();
                        for (
                          var i = 0, o = n ? e[i].apply(this, t) : r;
                          ++i < n;

                        )
                          o = e[i].call(this, o);
                        return o;
                      };
                    });
                  }
                  function Ui(t, e, n, o, a, s, l, u, c, h) {
                    var p = e & f,
                      d = 1 & e,
                      v = 2 & e,
                      m = 24 & e,
                      g = 512 & e,
                      w = v ? i : Di(t);
                    return function i() {
                      for (var f = arguments.length, b = r(f), y = f; y--; )
                        b[y] = arguments[y];
                      if (m)
                        var _ = uo(i),
                          x = nn(b, _);
                      if (
                        (o && (b = Ci(b, o, a, m)),
                        s && (b = Ai(b, s, l, m)),
                        (f -= x),
                        m && f < h)
                      ) {
                        var j = cn(b, _);
                        return Gi(
                          t,
                          e,
                          Ui,
                          i.placeholder,
                          n,
                          b,
                          j,
                          u,
                          c,
                          h - f
                        );
                      }
                      var k = d ? n : this,
                        E = v ? k[t] : t;
                      return (
                        (f = b.length),
                        u ? (b = Po(b, u)) : g && f > 1 && b.reverse(),
                        p && c < f && (b.length = c),
                        this &&
                          this !== pe &&
                          this instanceof i &&
                          (E = w || Di(E)),
                        E.apply(k, b)
                      );
                    };
                  }
                  function Bi(t, e) {
                    return function (n, r) {
                      return (function (t, e, n, r) {
                        return (
                          xr(t, function (t, i, o) {
                            e(r, n(t), i, o);
                          }),
                          r
                        );
                      })(n, t, e(r), {});
                    };
                  }
                  function Ni(t, e) {
                    return function (n, r) {
                      var o;
                      if (n === i && r === i) return e;
                      if ((n !== i && (o = n), r !== i)) {
                        if (o === i) return r;
                        "string" == typeof n || "string" == typeof r
                          ? ((n = fi(n)), (r = fi(r)))
                          : ((n = ci(n)), (r = ci(r))),
                          (o = t(n, r));
                      }
                      return o;
                    };
                  }
                  function Hi(t) {
                    return io(function (e) {
                      return (
                        (e = $e(e, Ye(co()))),
                        Xr(function (n) {
                          var r = this;
                          return t(e, function (t) {
                            return Ee(t, r, n);
                          });
                        })
                      );
                    });
                  }
                  function Vi(t, e) {
                    var n = (e = e === i ? " " : fi(e)).length;
                    if (n < 2) return n ? Yr(e, t) : e;
                    var r = Yr(e, ve(t / pn(e)));
                    return sn(e) ? ji(dn(r), 0, t).join("") : r.slice(0, t);
                  }
                  function Ji(t) {
                    return function (e, n, o) {
                      return (
                        o && "number" != typeof o && xo(e, n, o) && (n = o = i),
                        (e = ms(e)),
                        n === i ? ((n = e), (e = 0)) : (n = ms(n)),
                        (function (t, e, n, i) {
                          for (
                            var o = -1,
                              a = yn(ve((e - t) / (n || 1)), 0),
                              s = r(a);
                            a--;

                          )
                            (s[i ? a : ++o] = t), (t += n);
                          return s;
                        })(e, n, (o = o === i ? (e < n ? 1 : -1) : ms(o)), t)
                      );
                    };
                  }
                  function Zi(t) {
                    return function (e, n) {
                      return (
                        ("string" == typeof e && "string" == typeof n) ||
                          ((e = bs(e)), (n = bs(n))),
                        t(e, n)
                      );
                    };
                  }
                  function Gi(t, e, n, r, o, a, s, l, f, h) {
                    var p = 8 & e;
                    (e |= p ? u : c), 4 & (e &= ~(p ? c : u)) || (e &= -4);
                    var d = [
                        t,
                        e,
                        o,
                        p ? a : i,
                        p ? s : i,
                        p ? i : a,
                        p ? i : s,
                        l,
                        f,
                        h,
                      ],
                      v = n.apply(i, d);
                    return ko(t) && $o(v, d), (v.placeholder = r), Io(v, t, e);
                  }
                  function Ki(t) {
                    var e = Ot[t];
                    return function (t, n) {
                      if (
                        ((t = bs(t)),
                        (n = null == n ? 0 : _n(gs(n), 292)) && Ve(t))
                      ) {
                        var r = (_s(t) + "e").split("e");
                        return +(
                          (r = (_s(e(r[0] + "e" + (+r[1] + n))) + "e").split(
                            "e"
                          ))[0] +
                          "e" +
                          (+r[1] - n)
                        );
                      }
                      return e(t);
                    };
                  }
                  var Yi =
                    Cn && 1 / fn(new Cn([, -0]))[1] == p
                      ? function (t) {
                          return new Cn(t);
                        }
                      : fl;
                  function Xi(t) {
                    return function (e) {
                      var n = go(e);
                      return n == E
                        ? ln(e)
                        : n == A
                        ? hn(e)
                        : (function (t, e) {
                            return $e(e, function (e) {
                              return [e, t[e]];
                            });
                          })(e, t(e));
                    };
                  }
                  function Qi(t, e, n, a, p, d, v, m) {
                    var g = 2 & e;
                    if (!g && "function" != typeof t) throw new At(o);
                    var w = a ? a.length : 0;
                    if (
                      (w || ((e &= -97), (a = p = i)),
                      (v = v === i ? v : yn(gs(v), 0)),
                      (m = m === i ? m : gs(m)),
                      (w -= p ? p.length : 0),
                      e & c)
                    ) {
                      var b = a,
                        y = p;
                      a = p = i;
                    }
                    var _ = g ? i : so(t),
                      x = [t, e, n, a, p, b, y, d, v, m];
                    if (
                      (_ &&
                        (function (t, e) {
                          var n = t[1],
                            r = e[1],
                            i = n | r,
                            o = i < 131,
                            a =
                              (r == f && 8 == n) ||
                              (r == f && n == h && t[7].length <= e[8]) ||
                              (384 == r && e[7].length <= e[8] && 8 == n);
                          if (!o && !a) return t;
                          1 & r && ((t[2] = e[2]), (i |= 1 & n ? 0 : 4));
                          var l = e[3];
                          if (l) {
                            var u = t[3];
                            (t[3] = u ? Ci(u, l, e[4]) : l),
                              (t[4] = u ? cn(t[3], s) : e[4]);
                          }
                          (l = e[5]) &&
                            ((u = t[5]),
                            (t[5] = u ? Ai(u, l, e[6]) : l),
                            (t[6] = u ? cn(t[5], s) : e[6]));
                          (l = e[7]) && (t[7] = l);
                          r & f &&
                            (t[8] = null == t[8] ? e[8] : _n(t[8], e[8]));
                          null == t[9] && (t[9] = e[9]);
                          (t[0] = e[0]), (t[1] = i);
                        })(x, _),
                      (t = x[0]),
                      (e = x[1]),
                      (n = x[2]),
                      (a = x[3]),
                      (p = x[4]),
                      !(m = x[9] =
                        x[9] === i ? (g ? 0 : t.length) : yn(x[9] - w, 0)) &&
                        24 & e &&
                        (e &= -25),
                      e && 1 != e)
                    )
                      j =
                        8 == e || e == l
                          ? (function (t, e, n) {
                              var o = Di(t);
                              return function a() {
                                for (
                                  var s = arguments.length,
                                    l = r(s),
                                    u = s,
                                    c = uo(a);
                                  u--;

                                )
                                  l[u] = arguments[u];
                                var f =
                                  s < 3 && l[0] !== c && l[s - 1] !== c
                                    ? []
                                    : cn(l, c);
                                return (s -= f.length) < n
                                  ? Gi(
                                      t,
                                      e,
                                      Ui,
                                      a.placeholder,
                                      i,
                                      l,
                                      f,
                                      i,
                                      i,
                                      n - s
                                    )
                                  : Ee(
                                      this && this !== pe && this instanceof a
                                        ? o
                                        : t,
                                      this,
                                      l
                                    );
                              };
                            })(t, e, m)
                          : (e != u && 33 != e) || p.length
                          ? Ui.apply(i, x)
                          : (function (t, e, n, i) {
                              var o = 1 & e,
                                a = Di(t);
                              return function e() {
                                for (
                                  var s = -1,
                                    l = arguments.length,
                                    u = -1,
                                    c = i.length,
                                    f = r(c + l),
                                    h =
                                      this && this !== pe && this instanceof e
                                        ? a
                                        : t;
                                  ++u < c;

                                )
                                  f[u] = i[u];
                                for (; l--; ) f[u++] = arguments[++s];
                                return Ee(h, o ? n : this, f);
                              };
                            })(t, e, n, a);
                    else
                      var j = (function (t, e, n) {
                        var r = 1 & e,
                          i = Di(t);
                        return function e() {
                          return (
                            this && this !== pe && this instanceof e ? i : t
                          ).apply(r ? n : this, arguments);
                        };
                      })(t, e, n);
                    return Io((_ ? ni : $o)(j, x), t, e);
                  }
                  function to(t, e, n, r) {
                    return t === i || (Ba(t, $t[n]) && !It.call(r, n)) ? e : t;
                  }
                  function eo(t, e, n, r, o, a) {
                    return (
                      rs(t) &&
                        rs(e) &&
                        (a.set(e, t), Nr(t, e, i, eo, a), a.delete(e)),
                      t
                    );
                  }
                  function no(t) {
                    return ss(t) ? i : t;
                  }
                  function ro(t, e, n, r, o, a) {
                    var s = 1 & n,
                      l = t.length,
                      u = e.length;
                    if (l != u && !(s && u > l)) return !1;
                    var c = a.get(t),
                      f = a.get(e);
                    if (c && f) return c == e && f == t;
                    var h = -1,
                      p = !0,
                      d = 2 & n ? new Kn() : i;
                    for (a.set(t, e), a.set(e, t); ++h < l; ) {
                      var v = t[h],
                        m = e[h];
                      if (r)
                        var g = s ? r(m, v, h, e, t, a) : r(v, m, h, t, e, a);
                      if (g !== i) {
                        if (g) continue;
                        p = !1;
                        break;
                      }
                      if (d) {
                        if (
                          !Le(e, function (t, e) {
                            if (!Qe(d, e) && (v === t || o(v, t, n, r, a)))
                              return d.push(e);
                          })
                        ) {
                          p = !1;
                          break;
                        }
                      } else if (v !== m && !o(v, m, n, r, a)) {
                        p = !1;
                        break;
                      }
                    }
                    return a.delete(t), a.delete(e), p;
                  }
                  function io(t) {
                    return qo(Co(t, i, Zo), t + "");
                  }
                  function oo(t) {
                    return Or(t, Ms, vo);
                  }
                  function ao(t) {
                    return Or(t, qs, mo);
                  }
                  var so = Rn
                    ? function (t) {
                        return Rn.get(t);
                      }
                    : fl;
                  function lo(t) {
                    for (
                      var e = t.name + "",
                        n = $n[e],
                        r = It.call($n, e) ? n.length : 0;
                      r--;

                    ) {
                      var i = n[r],
                        o = i.func;
                      if (null == o || o == t) return i.name;
                    }
                    return e;
                  }
                  function uo(t) {
                    return (It.call(Un, "placeholder") ? Un : t).placeholder;
                  }
                  function co() {
                    var t = Un.iteratee || sl;
                    return (
                      (t = t === sl ? Lr : t),
                      arguments.length ? t(arguments[0], arguments[1]) : t
                    );
                  }
                  function fo(t, e) {
                    var n,
                      r,
                      i = t.__data__;
                    return (
                      "string" == (r = typeof (n = e)) ||
                      "number" == r ||
                      "symbol" == r ||
                      "boolean" == r
                        ? "__proto__" !== n
                        : null === n
                    )
                      ? i["string" == typeof e ? "string" : "hash"]
                      : i.map;
                  }
                  function ho(t) {
                    for (var e = Ms(t), n = e.length; n--; ) {
                      var r = e[n],
                        i = t[r];
                      e[n] = [r, i, So(i)];
                    }
                    return e;
                  }
                  function po(t, e) {
                    var n = (function (t, e) {
                      return null == t ? i : t[e];
                    })(t, e);
                    return Ir(n) ? n : i;
                  }
                  var vo = we
                      ? function (t) {
                          return null == t
                            ? []
                            : ((t = St(t)),
                              Ae(we(t), function (e) {
                                return Gt.call(t, e);
                              }));
                        }
                      : wl,
                    mo = we
                      ? function (t) {
                          for (var e = []; t; ) Me(e, vo(t)), (t = Jt(t));
                          return e;
                        }
                      : wl,
                    go = Sr;
                  function wo(t, e, n) {
                    for (
                      var r = -1, i = (e = _i(e, t)).length, o = !1;
                      ++r < i;

                    ) {
                      var a = Fo(e[r]);
                      if (!(o = null != t && n(t, a))) break;
                      t = t[a];
                    }
                    return o || ++r != i
                      ? o
                      : !!(i = null == t ? 0 : t.length) &&
                          ns(i) &&
                          _o(a, i) &&
                          (Ja(t) || Va(t));
                  }
                  function bo(t) {
                    return "function" != typeof t.constructor || Oo(t)
                      ? {}
                      : Bn(Jt(t));
                  }
                  function yo(t) {
                    return Ja(t) || Va(t) || !!(Yt && t && t[Yt]);
                  }
                  function _o(t, e) {
                    var n = typeof t;
                    return (
                      !!(e = null == e ? d : e) &&
                      ("number" == n || ("symbol" != n && yt.test(t))) &&
                      t > -1 &&
                      t % 1 == 0 &&
                      t < e
                    );
                  }
                  function xo(t, e, n) {
                    if (!rs(n)) return !1;
                    var r = typeof e;
                    return (
                      !!("number" == r
                        ? Ga(n) && _o(e, n.length)
                        : "string" == r && e in n) && Ba(n[e], t)
                    );
                  }
                  function jo(t, e) {
                    if (Ja(t)) return !1;
                    var n = typeof t;
                    return (
                      !(
                        "number" != n &&
                        "symbol" != n &&
                        "boolean" != n &&
                        null != t &&
                        !fs(t)
                      ) ||
                      nt.test(t) ||
                      !et.test(t) ||
                      (null != e && t in St(e))
                    );
                  }
                  function ko(t) {
                    var e = lo(t),
                      n = Un[e];
                    if ("function" != typeof n || !(e in Vn.prototype))
                      return !1;
                    if (t === n) return !0;
                    var r = so(n);
                    return !!r && t === r[0];
                  }
                  ((On && go(new On(new ArrayBuffer(1))) != q) ||
                    (Sn && go(new Sn()) != E) ||
                    (Tn && go(Tn.resolve()) != T) ||
                    (Cn && go(new Cn()) != A) ||
                    (An && go(new An()) != $)) &&
                    (go = function (t) {
                      var e = Sr(t),
                        n = e == S ? t.constructor : i,
                        r = n ? Wo(n) : "";
                      if (r)
                        switch (r) {
                          case Mn:
                            return q;
                          case qn:
                            return E;
                          case In:
                            return T;
                          case Ln:
                            return A;
                          case zn:
                            return $;
                        }
                      return e;
                    });
                  var Eo = Mt ? ts : bl;
                  function Oo(t) {
                    var e = t && t.constructor;
                    return (
                      t === (("function" == typeof e && e.prototype) || $t)
                    );
                  }
                  function So(t) {
                    return t == t && !rs(t);
                  }
                  function To(t, e) {
                    return function (n) {
                      return null != n && n[t] === e && (e !== i || t in St(n));
                    };
                  }
                  function Co(t, e, n) {
                    return (
                      (e = yn(e === i ? t.length - 1 : e, 0)),
                      function () {
                        for (
                          var i = arguments,
                            o = -1,
                            a = yn(i.length - e, 0),
                            s = r(a);
                          ++o < a;

                        )
                          s[o] = i[e + o];
                        o = -1;
                        for (var l = r(e + 1); ++o < e; ) l[o] = i[o];
                        return (l[e] = n(s)), Ee(t, this, l);
                      }
                    );
                  }
                  function Ao(t, e) {
                    return e.length < 2 ? t : Er(t, oi(e, 0, -1));
                  }
                  function Po(t, e) {
                    for (
                      var n = t.length, r = _n(e.length, n), o = Pi(t);
                      r--;

                    ) {
                      var a = e[r];
                      t[r] = _o(a, n) ? o[a] : i;
                    }
                    return t;
                  }
                  function Ro(t, e) {
                    if (
                      ("constructor" !== e || "function" != typeof t[e]) &&
                      "__proto__" != e
                    )
                      return t[e];
                  }
                  var $o = Lo(ni),
                    Mo =
                      de ||
                      function (t, e) {
                        return pe.setTimeout(t, e);
                      },
                    qo = Lo(ri);
                  function Io(t, e, n) {
                    var r = e + "";
                    return qo(
                      t,
                      (function (t, e) {
                        var n = e.length;
                        if (!n) return t;
                        var r = n - 1;
                        return (
                          (e[r] = (n > 1 ? "& " : "") + e[r]),
                          (e = e.join(n > 2 ? ", " : " ")),
                          t.replace(lt, "{\n/* [wrapped with " + e + "] */\n")
                        );
                      })(
                        r,
                        (function (t, e) {
                          return (
                            Se(g, function (n) {
                              var r = "_." + n[0];
                              e & n[1] && !Pe(t, r) && t.push(r);
                            }),
                            t.sort()
                          );
                        })(
                          (function (t) {
                            var e = t.match(ut);
                            return e ? e[1].split(ct) : [];
                          })(r),
                          n
                        )
                      )
                    );
                  }
                  function Lo(t) {
                    var e = 0,
                      n = 0;
                    return function () {
                      var r = xn(),
                        o = 16 - (r - n);
                      if (((n = r), o > 0)) {
                        if (++e >= 800) return arguments[0];
                      } else e = 0;
                      return t.apply(i, arguments);
                    };
                  }
                  function zo(t, e) {
                    var n = -1,
                      r = t.length,
                      o = r - 1;
                    for (e = e === i ? r : e; ++n < e; ) {
                      var a = Kr(n, o),
                        s = t[a];
                      (t[a] = t[n]), (t[n] = s);
                    }
                    return (t.length = e), t;
                  }
                  var Do = (function (t) {
                    var e = La(t, function (t) {
                        return 500 === n.size && n.clear(), t;
                      }),
                      n = e.cache;
                    return e;
                  })(function (t) {
                    var e = [];
                    return (
                      46 === t.charCodeAt(0) && e.push(""),
                      t.replace(rt, function (t, n, r, i) {
                        e.push(r ? i.replace(pt, "$1") : n || t);
                      }),
                      e
                    );
                  });
                  function Fo(t) {
                    if ("string" == typeof t || fs(t)) return t;
                    var e = t + "";
                    return "0" == e && 1 / t == -1 / 0 ? "-0" : e;
                  }
                  function Wo(t) {
                    if (null != t) {
                      try {
                        return qt.call(t);
                      } catch (t) {}
                      try {
                        return t + "";
                      } catch (t) {}
                    }
                    return "";
                  }
                  function Uo(t) {
                    if (t instanceof Vn) return t.clone();
                    var e = new Hn(t.__wrapped__, t.__chain__);
                    return (
                      (e.__actions__ = Pi(t.__actions__)),
                      (e.__index__ = t.__index__),
                      (e.__values__ = t.__values__),
                      e
                    );
                  }
                  var Bo = Xr(function (t, e) {
                      return Ka(t) ? pr(t, br(e, 1, Ka, !0)) : [];
                    }),
                    No = Xr(function (t, e) {
                      var n = Qo(e);
                      return (
                        Ka(n) && (n = i),
                        Ka(t) ? pr(t, br(e, 1, Ka, !0), co(n, 2)) : []
                      );
                    }),
                    Ho = Xr(function (t, e) {
                      var n = Qo(e);
                      return (
                        Ka(n) && (n = i),
                        Ka(t) ? pr(t, br(e, 1, Ka, !0), i, n) : []
                      );
                    });
                  function Vo(t, e, n) {
                    var r = null == t ? 0 : t.length;
                    if (!r) return -1;
                    var i = null == n ? 0 : gs(n);
                    return i < 0 && (i = yn(r + i, 0)), Fe(t, co(e, 3), i);
                  }
                  function Jo(t, e, n) {
                    var r = null == t ? 0 : t.length;
                    if (!r) return -1;
                    var o = r - 1;
                    return (
                      n !== i &&
                        ((o = gs(n)),
                        (o = n < 0 ? yn(r + o, 0) : _n(o, r - 1))),
                      Fe(t, co(e, 3), o, !0)
                    );
                  }
                  function Zo(t) {
                    return (null == t ? 0 : t.length) ? br(t, 1) : [];
                  }
                  function Go(t) {
                    return t && t.length ? t[0] : i;
                  }
                  var Ko = Xr(function (t) {
                      var e = $e(t, bi);
                      return e.length && e[0] === t[0] ? Pr(e) : [];
                    }),
                    Yo = Xr(function (t) {
                      var e = Qo(t),
                        n = $e(t, bi);
                      return (
                        e === Qo(n) ? (e = i) : n.pop(),
                        n.length && n[0] === t[0] ? Pr(n, co(e, 2)) : []
                      );
                    }),
                    Xo = Xr(function (t) {
                      var e = Qo(t),
                        n = $e(t, bi);
                      return (
                        (e = "function" == typeof e ? e : i) && n.pop(),
                        n.length && n[0] === t[0] ? Pr(n, i, e) : []
                      );
                    });
                  function Qo(t) {
                    var e = null == t ? 0 : t.length;
                    return e ? t[e - 1] : i;
                  }
                  var ta = Xr(ea);
                  function ea(t, e) {
                    return t && t.length && e && e.length ? Zr(t, e) : t;
                  }
                  var na = io(function (t, e) {
                    var n = null == t ? 0 : t.length,
                      r = lr(t, e);
                    return (
                      Gr(
                        t,
                        $e(e, function (t) {
                          return _o(t, n) ? +t : t;
                        }).sort(Ti)
                      ),
                      r
                    );
                  });
                  function ra(t) {
                    return null == t ? t : En.call(t);
                  }
                  var ia = Xr(function (t) {
                      return hi(br(t, 1, Ka, !0));
                    }),
                    oa = Xr(function (t) {
                      var e = Qo(t);
                      return Ka(e) && (e = i), hi(br(t, 1, Ka, !0), co(e, 2));
                    }),
                    aa = Xr(function (t) {
                      var e = Qo(t);
                      return (
                        (e = "function" == typeof e ? e : i),
                        hi(br(t, 1, Ka, !0), i, e)
                      );
                    });
                  function sa(t) {
                    if (!t || !t.length) return [];
                    var e = 0;
                    return (
                      (t = Ae(t, function (t) {
                        if (Ka(t)) return (e = yn(t.length, e)), !0;
                      })),
                      Ge(e, function (e) {
                        return $e(t, He(e));
                      })
                    );
                  }
                  function la(t, e) {
                    if (!t || !t.length) return [];
                    var n = sa(t);
                    return null == e
                      ? n
                      : $e(n, function (t) {
                          return Ee(e, i, t);
                        });
                  }
                  var ua = Xr(function (t, e) {
                      return Ka(t) ? pr(t, e) : [];
                    }),
                    ca = Xr(function (t) {
                      return gi(Ae(t, Ka));
                    }),
                    fa = Xr(function (t) {
                      var e = Qo(t);
                      return Ka(e) && (e = i), gi(Ae(t, Ka), co(e, 2));
                    }),
                    ha = Xr(function (t) {
                      var e = Qo(t);
                      return (
                        (e = "function" == typeof e ? e : i),
                        gi(Ae(t, Ka), i, e)
                      );
                    }),
                    pa = Xr(sa);
                  var da = Xr(function (t) {
                    var e = t.length,
                      n = e > 1 ? t[e - 1] : i;
                    return (
                      (n = "function" == typeof n ? (t.pop(), n) : i), la(t, n)
                    );
                  });
                  function va(t) {
                    var e = Un(t);
                    return (e.__chain__ = !0), e;
                  }
                  function ma(t, e) {
                    return e(t);
                  }
                  var ga = io(function (t) {
                    var e = t.length,
                      n = e ? t[0] : 0,
                      r = this.__wrapped__,
                      o = function (e) {
                        return lr(e, t);
                      };
                    return !(e > 1 || this.__actions__.length) &&
                      r instanceof Vn &&
                      _o(n)
                      ? ((r = r.slice(n, +n + (e ? 1 : 0))).__actions__.push({
                          func: ma,
                          args: [o],
                          thisArg: i,
                        }),
                        new Hn(r, this.__chain__).thru(function (t) {
                          return e && !t.length && t.push(i), t;
                        }))
                      : this.thru(o);
                  });
                  var wa = $i(function (t, e, n) {
                    It.call(t, n) ? ++t[n] : sr(t, n, 1);
                  });
                  var ba = Fi(Vo),
                    ya = Fi(Jo);
                  function _a(t, e) {
                    return (Ja(t) ? Se : dr)(t, co(e, 3));
                  }
                  function xa(t, e) {
                    return (Ja(t) ? Te : vr)(t, co(e, 3));
                  }
                  var ja = $i(function (t, e, n) {
                    It.call(t, n) ? t[n].push(e) : sr(t, n, [e]);
                  });
                  var ka = Xr(function (t, e, n) {
                      var i = -1,
                        o = "function" == typeof e,
                        a = Ga(t) ? r(t.length) : [];
                      return (
                        dr(t, function (t) {
                          a[++i] = o ? Ee(e, t, n) : Rr(t, e, n);
                        }),
                        a
                      );
                    }),
                    Ea = $i(function (t, e, n) {
                      sr(t, n, e);
                    });
                  function Oa(t, e) {
                    return (Ja(t) ? $e : Wr)(t, co(e, 3));
                  }
                  var Sa = $i(
                    function (t, e, n) {
                      t[n ? 0 : 1].push(e);
                    },
                    function () {
                      return [[], []];
                    }
                  );
                  var Ta = Xr(function (t, e) {
                      if (null == t) return [];
                      var n = e.length;
                      return (
                        n > 1 && xo(t, e[0], e[1])
                          ? (e = [])
                          : n > 2 && xo(e[0], e[1], e[2]) && (e = [e[0]]),
                        Vr(t, br(e, 1), [])
                      );
                    }),
                    Ca =
                      he ||
                      function () {
                        return pe.Date.now();
                      };
                  function Aa(t, e, n) {
                    return (
                      (e = n ? i : e),
                      (e = t && null == e ? t.length : e),
                      Qi(t, f, i, i, i, i, e)
                    );
                  }
                  function Pa(t, e) {
                    var n;
                    if ("function" != typeof e) throw new At(o);
                    return (
                      (t = gs(t)),
                      function () {
                        return (
                          --t > 0 && (n = e.apply(this, arguments)),
                          t <= 1 && (e = i),
                          n
                        );
                      }
                    );
                  }
                  var Ra = Xr(function (t, e, n) {
                      var r = 1;
                      if (n.length) {
                        var i = cn(n, uo(Ra));
                        r |= u;
                      }
                      return Qi(t, r, e, n, i);
                    }),
                    $a = Xr(function (t, e, n) {
                      var r = 3;
                      if (n.length) {
                        var i = cn(n, uo($a));
                        r |= u;
                      }
                      return Qi(e, r, t, n, i);
                    });
                  function Ma(t, e, n) {
                    var r,
                      a,
                      s,
                      l,
                      u,
                      c,
                      f = 0,
                      h = !1,
                      p = !1,
                      d = !0;
                    if ("function" != typeof t) throw new At(o);
                    function v(e) {
                      var n = r,
                        o = a;
                      return (r = a = i), (f = e), (l = t.apply(o, n));
                    }
                    function m(t) {
                      return (f = t), (u = Mo(w, e)), h ? v(t) : l;
                    }
                    function g(t) {
                      var n = t - c;
                      return c === i || n >= e || n < 0 || (p && t - f >= s);
                    }
                    function w() {
                      var t = Ca();
                      if (g(t)) return b(t);
                      u = Mo(
                        w,
                        (function (t) {
                          var n = e - (t - c);
                          return p ? _n(n, s - (t - f)) : n;
                        })(t)
                      );
                    }
                    function b(t) {
                      return (u = i), d && r ? v(t) : ((r = a = i), l);
                    }
                    function y() {
                      var t = Ca(),
                        n = g(t);
                      if (((r = arguments), (a = this), (c = t), n)) {
                        if (u === i) return m(c);
                        if (p) return ki(u), (u = Mo(w, e)), v(c);
                      }
                      return u === i && (u = Mo(w, e)), l;
                    }
                    return (
                      (e = bs(e) || 0),
                      rs(n) &&
                        ((h = !!n.leading),
                        (s = (p = "maxWait" in n)
                          ? yn(bs(n.maxWait) || 0, e)
                          : s),
                        (d = "trailing" in n ? !!n.trailing : d)),
                      (y.cancel = function () {
                        u !== i && ki(u), (f = 0), (r = c = a = u = i);
                      }),
                      (y.flush = function () {
                        return u === i ? l : b(Ca());
                      }),
                      y
                    );
                  }
                  var qa = Xr(function (t, e) {
                      return hr(t, 1, e);
                    }),
                    Ia = Xr(function (t, e, n) {
                      return hr(t, bs(e) || 0, n);
                    });
                  function La(t, e) {
                    if (
                      "function" != typeof t ||
                      (null != e && "function" != typeof e)
                    )
                      throw new At(o);
                    var n = function () {
                      var r = arguments,
                        i = e ? e.apply(this, r) : r[0],
                        o = n.cache;
                      if (o.has(i)) return o.get(i);
                      var a = t.apply(this, r);
                      return (n.cache = o.set(i, a) || o), a;
                    };
                    return (n.cache = new (La.Cache || Gn)()), n;
                  }
                  function za(t) {
                    if ("function" != typeof t) throw new At(o);
                    return function () {
                      var e = arguments;
                      switch (e.length) {
                        case 0:
                          return !t.call(this);
                        case 1:
                          return !t.call(this, e[0]);
                        case 2:
                          return !t.call(this, e[0], e[1]);
                        case 3:
                          return !t.call(this, e[0], e[1], e[2]);
                      }
                      return !t.apply(this, e);
                    };
                  }
                  La.Cache = Gn;
                  var Da = xi(function (t, e) {
                      var n = (e =
                        1 == e.length && Ja(e[0])
                          ? $e(e[0], Ye(co()))
                          : $e(br(e, 1), Ye(co()))).length;
                      return Xr(function (r) {
                        for (var i = -1, o = _n(r.length, n); ++i < o; )
                          r[i] = e[i].call(this, r[i]);
                        return Ee(t, this, r);
                      });
                    }),
                    Fa = Xr(function (t, e) {
                      var n = cn(e, uo(Fa));
                      return Qi(t, u, i, e, n);
                    }),
                    Wa = Xr(function (t, e) {
                      var n = cn(e, uo(Wa));
                      return Qi(t, c, i, e, n);
                    }),
                    Ua = io(function (t, e) {
                      return Qi(t, h, i, i, i, e);
                    });
                  function Ba(t, e) {
                    return t === e || (t != t && e != e);
                  }
                  var Na = Zi(Tr),
                    Ha = Zi(function (t, e) {
                      return t >= e;
                    }),
                    Va = $r(
                      (function () {
                        return arguments;
                      })()
                    )
                      ? $r
                      : function (t) {
                          return (
                            is(t) &&
                            It.call(t, "callee") &&
                            !Gt.call(t, "callee")
                          );
                        },
                    Ja = r.isArray,
                    Za = be
                      ? Ye(be)
                      : function (t) {
                          return is(t) && Sr(t) == M;
                        };
                  function Ga(t) {
                    return null != t && ns(t.length) && !ts(t);
                  }
                  function Ka(t) {
                    return is(t) && Ga(t);
                  }
                  var Ya = ze || bl,
                    Xa = ye
                      ? Ye(ye)
                      : function (t) {
                          return is(t) && Sr(t) == _;
                        };
                  function Qa(t) {
                    if (!is(t)) return !1;
                    var e = Sr(t);
                    return (
                      e == x ||
                      "[object DOMException]" == e ||
                      ("string" == typeof t.message &&
                        "string" == typeof t.name &&
                        !ss(t))
                    );
                  }
                  function ts(t) {
                    if (!rs(t)) return !1;
                    var e = Sr(t);
                    return (
                      e == j ||
                      e == k ||
                      "[object AsyncFunction]" == e ||
                      "[object Proxy]" == e
                    );
                  }
                  function es(t) {
                    return "number" == typeof t && t == gs(t);
                  }
                  function ns(t) {
                    return (
                      "number" == typeof t && t > -1 && t % 1 == 0 && t <= d
                    );
                  }
                  function rs(t) {
                    var e = typeof t;
                    return null != t && ("object" == e || "function" == e);
                  }
                  function is(t) {
                    return null != t && "object" == typeof t;
                  }
                  var os = _e
                    ? Ye(_e)
                    : function (t) {
                        return is(t) && go(t) == E;
                      };
                  function as(t) {
                    return "number" == typeof t || (is(t) && Sr(t) == O);
                  }
                  function ss(t) {
                    if (!is(t) || Sr(t) != S) return !1;
                    var e = Jt(t);
                    if (null === e) return !0;
                    var n = It.call(e, "constructor") && e.constructor;
                    return (
                      "function" == typeof n &&
                      n instanceof n &&
                      qt.call(n) == Ft
                    );
                  }
                  var ls = xe
                    ? Ye(xe)
                    : function (t) {
                        return is(t) && Sr(t) == C;
                      };
                  var us = je
                    ? Ye(je)
                    : function (t) {
                        return is(t) && go(t) == A;
                      };
                  function cs(t) {
                    return (
                      "string" == typeof t || (!Ja(t) && is(t) && Sr(t) == P)
                    );
                  }
                  function fs(t) {
                    return "symbol" == typeof t || (is(t) && Sr(t) == R);
                  }
                  var hs = ke
                    ? Ye(ke)
                    : function (t) {
                        return is(t) && ns(t.length) && !!ae[Sr(t)];
                      };
                  var ps = Zi(Fr),
                    ds = Zi(function (t, e) {
                      return t <= e;
                    });
                  function vs(t) {
                    if (!t) return [];
                    if (Ga(t)) return cs(t) ? dn(t) : Pi(t);
                    if (te && t[te])
                      return (function (t) {
                        for (var e, n = []; !(e = t.next()).done; )
                          n.push(e.value);
                        return n;
                      })(t[te]());
                    var e = go(t);
                    return (e == E ? ln : e == A ? fn : Bs)(t);
                  }
                  function ms(t) {
                    return t
                      ? (t = bs(t)) === p || t === -1 / 0
                        ? 17976931348623157e292 * (t < 0 ? -1 : 1)
                        : t == t
                        ? t
                        : 0
                      : 0 === t
                      ? t
                      : 0;
                  }
                  function gs(t) {
                    var e = ms(t),
                      n = e % 1;
                    return e == e ? (n ? e - n : e) : 0;
                  }
                  function ws(t) {
                    return t ? ur(gs(t), 0, m) : 0;
                  }
                  function bs(t) {
                    if ("number" == typeof t) return t;
                    if (fs(t)) return v;
                    if (rs(t)) {
                      var e = "function" == typeof t.valueOf ? t.valueOf() : t;
                      t = rs(e) ? e + "" : e;
                    }
                    if ("string" != typeof t) return 0 === t ? t : +t;
                    t = Ke(t);
                    var n = gt.test(t);
                    return n || bt.test(t)
                      ? ce(t.slice(2), n ? 2 : 8)
                      : mt.test(t)
                      ? v
                      : +t;
                  }
                  function ys(t) {
                    return Ri(t, qs(t));
                  }
                  function _s(t) {
                    return null == t ? "" : fi(t);
                  }
                  var xs = Mi(function (t, e) {
                      if (Oo(e) || Ga(e)) Ri(e, Ms(e), t);
                      else for (var n in e) It.call(e, n) && rr(t, n, e[n]);
                    }),
                    js = Mi(function (t, e) {
                      Ri(e, qs(e), t);
                    }),
                    ks = Mi(function (t, e, n, r) {
                      Ri(e, qs(e), t, r);
                    }),
                    Es = Mi(function (t, e, n, r) {
                      Ri(e, Ms(e), t, r);
                    }),
                    Os = io(lr);
                  var Ss = Xr(function (t, e) {
                      t = St(t);
                      var n = -1,
                        r = e.length,
                        o = r > 2 ? e[2] : i;
                      for (o && xo(e[0], e[1], o) && (r = 1); ++n < r; )
                        for (
                          var a = e[n], s = qs(a), l = -1, u = s.length;
                          ++l < u;

                        ) {
                          var c = s[l],
                            f = t[c];
                          (f === i || (Ba(f, $t[c]) && !It.call(t, c))) &&
                            (t[c] = a[c]);
                        }
                      return t;
                    }),
                    Ts = Xr(function (t) {
                      return t.push(i, eo), Ee(Ls, i, t);
                    });
                  function Cs(t, e, n) {
                    var r = null == t ? i : Er(t, e);
                    return r === i ? n : r;
                  }
                  function As(t, e) {
                    return null != t && wo(t, e, Ar);
                  }
                  var Ps = Bi(function (t, e, n) {
                      null != e &&
                        "function" != typeof e.toString &&
                        (e = Dt.call(e)),
                        (t[e] = n);
                    }, rl(al)),
                    Rs = Bi(function (t, e, n) {
                      null != e &&
                        "function" != typeof e.toString &&
                        (e = Dt.call(e)),
                        It.call(t, e) ? t[e].push(n) : (t[e] = [n]);
                    }, co),
                    $s = Xr(Rr);
                  function Ms(t) {
                    return Ga(t) ? Xn(t) : zr(t);
                  }
                  function qs(t) {
                    return Ga(t) ? Xn(t, !0) : Dr(t);
                  }
                  var Is = Mi(function (t, e, n) {
                      Nr(t, e, n);
                    }),
                    Ls = Mi(function (t, e, n, r) {
                      Nr(t, e, n, r);
                    }),
                    zs = io(function (t, e) {
                      var n = {};
                      if (null == t) return n;
                      var r = !1;
                      (e = $e(e, function (e) {
                        return (e = _i(e, t)), r || (r = e.length > 1), e;
                      })),
                        Ri(t, ao(t), n),
                        r && (n = cr(n, 7, no));
                      for (var i = e.length; i--; ) pi(n, e[i]);
                      return n;
                    });
                  var Ds = io(function (t, e) {
                    return null == t
                      ? {}
                      : (function (t, e) {
                          return Jr(t, e, function (e, n) {
                            return As(t, n);
                          });
                        })(t, e);
                  });
                  function Fs(t, e) {
                    if (null == t) return {};
                    var n = $e(ao(t), function (t) {
                      return [t];
                    });
                    return (
                      (e = co(e)),
                      Jr(t, n, function (t, n) {
                        return e(t, n[0]);
                      })
                    );
                  }
                  var Ws = Xi(Ms),
                    Us = Xi(qs);
                  function Bs(t) {
                    return null == t ? [] : Xe(t, Ms(t));
                  }
                  var Ns = zi(function (t, e, n) {
                    return (e = e.toLowerCase()), t + (n ? Hs(e) : e);
                  });
                  function Hs(t) {
                    return Qs(_s(t).toLowerCase());
                  }
                  function Vs(t) {
                    return (t = _s(t)) && t.replace(_t, rn).replace(Qt, "");
                  }
                  var Js = zi(function (t, e, n) {
                      return t + (n ? "-" : "") + e.toLowerCase();
                    }),
                    Zs = zi(function (t, e, n) {
                      return t + (n ? " " : "") + e.toLowerCase();
                    }),
                    Gs = Li("toLowerCase");
                  var Ks = zi(function (t, e, n) {
                    return t + (n ? "_" : "") + e.toLowerCase();
                  });
                  var Ys = zi(function (t, e, n) {
                    return t + (n ? " " : "") + Qs(e);
                  });
                  var Xs = zi(function (t, e, n) {
                      return t + (n ? " " : "") + e.toUpperCase();
                    }),
                    Qs = Li("toUpperCase");
                  function tl(t, e, n) {
                    return (
                      (t = _s(t)),
                      (e = n ? i : e) === i
                        ? (function (t) {
                            return re.test(t);
                          })(t)
                          ? (function (t) {
                              return t.match(ee) || [];
                            })(t)
                          : (function (t) {
                              return t.match(ft) || [];
                            })(t)
                        : t.match(e) || []
                    );
                  }
                  var el = Xr(function (t, e) {
                      try {
                        return Ee(t, i, e);
                      } catch (t) {
                        return Qa(t) ? t : new kt(t);
                      }
                    }),
                    nl = io(function (t, e) {
                      return (
                        Se(e, function (e) {
                          (e = Fo(e)), sr(t, e, Ra(t[e], t));
                        }),
                        t
                      );
                    });
                  function rl(t) {
                    return function () {
                      return t;
                    };
                  }
                  var il = Wi(),
                    ol = Wi(!0);
                  function al(t) {
                    return t;
                  }
                  function sl(t) {
                    return Lr("function" == typeof t ? t : cr(t, 1));
                  }
                  var ll = Xr(function (t, e) {
                      return function (n) {
                        return Rr(n, t, e);
                      };
                    }),
                    ul = Xr(function (t, e) {
                      return function (n) {
                        return Rr(t, n, e);
                      };
                    });
                  function cl(t, e, n) {
                    var r = Ms(e),
                      i = kr(e, r);
                    null != n ||
                      (rs(e) && (i.length || !r.length)) ||
                      ((n = e), (e = t), (t = this), (i = kr(e, Ms(e))));
                    var o = !(rs(n) && "chain" in n && !n.chain),
                      a = ts(t);
                    return (
                      Se(i, function (n) {
                        var r = e[n];
                        (t[n] = r),
                          a &&
                            (t.prototype[n] = function () {
                              var e = this.__chain__;
                              if (o || e) {
                                var n = t(this.__wrapped__),
                                  i = (n.__actions__ = Pi(this.__actions__));
                                return (
                                  i.push({
                                    func: r,
                                    args: arguments,
                                    thisArg: t,
                                  }),
                                  (n.__chain__ = e),
                                  n
                                );
                              }
                              return r.apply(t, Me([this.value()], arguments));
                            });
                      }),
                      t
                    );
                  }
                  function fl() {}
                  var hl = Hi($e),
                    pl = Hi(Ce),
                    dl = Hi(Le);
                  function vl(t) {
                    return jo(t)
                      ? He(Fo(t))
                      : (function (t) {
                          return function (e) {
                            return Er(e, t);
                          };
                        })(t);
                  }
                  var ml = Ji(),
                    gl = Ji(!0);
                  function wl() {
                    return [];
                  }
                  function bl() {
                    return !1;
                  }
                  var yl = Ni(function (t, e) {
                      return t + e;
                    }, 0),
                    _l = Ki("ceil"),
                    xl = Ni(function (t, e) {
                      return t / e;
                    }, 1),
                    jl = Ki("floor");
                  var kl,
                    El = Ni(function (t, e) {
                      return t * e;
                    }, 1),
                    Ol = Ki("round"),
                    Sl = Ni(function (t, e) {
                      return t - e;
                    }, 0);
                  return (
                    (Un.after = function (t, e) {
                      if ("function" != typeof e) throw new At(o);
                      return (
                        (t = gs(t)),
                        function () {
                          if (--t < 1) return e.apply(this, arguments);
                        }
                      );
                    }),
                    (Un.ary = Aa),
                    (Un.assign = xs),
                    (Un.assignIn = js),
                    (Un.assignInWith = ks),
                    (Un.assignWith = Es),
                    (Un.at = Os),
                    (Un.before = Pa),
                    (Un.bind = Ra),
                    (Un.bindAll = nl),
                    (Un.bindKey = $a),
                    (Un.castArray = function () {
                      if (!arguments.length) return [];
                      var t = arguments[0];
                      return Ja(t) ? t : [t];
                    }),
                    (Un.chain = va),
                    (Un.chunk = function (t, e, n) {
                      e = (n ? xo(t, e, n) : e === i) ? 1 : yn(gs(e), 0);
                      var o = null == t ? 0 : t.length;
                      if (!o || e < 1) return [];
                      for (var a = 0, s = 0, l = r(ve(o / e)); a < o; )
                        l[s++] = oi(t, a, (a += e));
                      return l;
                    }),
                    (Un.compact = function (t) {
                      for (
                        var e = -1, n = null == t ? 0 : t.length, r = 0, i = [];
                        ++e < n;

                      ) {
                        var o = t[e];
                        o && (i[r++] = o);
                      }
                      return i;
                    }),
                    (Un.concat = function () {
                      var t = arguments.length;
                      if (!t) return [];
                      for (var e = r(t - 1), n = arguments[0], i = t; i--; )
                        e[i - 1] = arguments[i];
                      return Me(Ja(n) ? Pi(n) : [n], br(e, 1));
                    }),
                    (Un.cond = function (t) {
                      var e = null == t ? 0 : t.length,
                        n = co();
                      return (
                        (t = e
                          ? $e(t, function (t) {
                              if ("function" != typeof t[1]) throw new At(o);
                              return [n(t[0]), t[1]];
                            })
                          : []),
                        Xr(function (n) {
                          for (var r = -1; ++r < e; ) {
                            var i = t[r];
                            if (Ee(i[0], this, n)) return Ee(i[1], this, n);
                          }
                        })
                      );
                    }),
                    (Un.conforms = function (t) {
                      return (function (t) {
                        var e = Ms(t);
                        return function (n) {
                          return fr(n, t, e);
                        };
                      })(cr(t, 1));
                    }),
                    (Un.constant = rl),
                    (Un.countBy = wa),
                    (Un.create = function (t, e) {
                      var n = Bn(t);
                      return null == e ? n : ar(n, e);
                    }),
                    (Un.curry = function t(e, n, r) {
                      var o = Qi(e, 8, i, i, i, i, i, (n = r ? i : n));
                      return (o.placeholder = t.placeholder), o;
                    }),
                    (Un.curryRight = function t(e, n, r) {
                      var o = Qi(e, l, i, i, i, i, i, (n = r ? i : n));
                      return (o.placeholder = t.placeholder), o;
                    }),
                    (Un.debounce = Ma),
                    (Un.defaults = Ss),
                    (Un.defaultsDeep = Ts),
                    (Un.defer = qa),
                    (Un.delay = Ia),
                    (Un.difference = Bo),
                    (Un.differenceBy = No),
                    (Un.differenceWith = Ho),
                    (Un.drop = function (t, e, n) {
                      var r = null == t ? 0 : t.length;
                      return r
                        ? oi(t, (e = n || e === i ? 1 : gs(e)) < 0 ? 0 : e, r)
                        : [];
                    }),
                    (Un.dropRight = function (t, e, n) {
                      var r = null == t ? 0 : t.length;
                      return r
                        ? oi(
                            t,
                            0,
                            (e = r - (e = n || e === i ? 1 : gs(e))) < 0 ? 0 : e
                          )
                        : [];
                    }),
                    (Un.dropRightWhile = function (t, e) {
                      return t && t.length ? vi(t, co(e, 3), !0, !0) : [];
                    }),
                    (Un.dropWhile = function (t, e) {
                      return t && t.length ? vi(t, co(e, 3), !0) : [];
                    }),
                    (Un.fill = function (t, e, n, r) {
                      var o = null == t ? 0 : t.length;
                      return o
                        ? (n &&
                            "number" != typeof n &&
                            xo(t, e, n) &&
                            ((n = 0), (r = o)),
                          (function (t, e, n, r) {
                            var o = t.length;
                            for (
                              (n = gs(n)) < 0 && (n = -n > o ? 0 : o + n),
                                (r = r === i || r > o ? o : gs(r)) < 0 &&
                                  (r += o),
                                r = n > r ? 0 : ws(r);
                              n < r;

                            )
                              t[n++] = e;
                            return t;
                          })(t, e, n, r))
                        : [];
                    }),
                    (Un.filter = function (t, e) {
                      return (Ja(t) ? Ae : wr)(t, co(e, 3));
                    }),
                    (Un.flatMap = function (t, e) {
                      return br(Oa(t, e), 1);
                    }),
                    (Un.flatMapDeep = function (t, e) {
                      return br(Oa(t, e), p);
                    }),
                    (Un.flatMapDepth = function (t, e, n) {
                      return (n = n === i ? 1 : gs(n)), br(Oa(t, e), n);
                    }),
                    (Un.flatten = Zo),
                    (Un.flattenDeep = function (t) {
                      return (null == t ? 0 : t.length) ? br(t, p) : [];
                    }),
                    (Un.flattenDepth = function (t, e) {
                      return (null == t ? 0 : t.length)
                        ? br(t, (e = e === i ? 1 : gs(e)))
                        : [];
                    }),
                    (Un.flip = function (t) {
                      return Qi(t, 512);
                    }),
                    (Un.flow = il),
                    (Un.flowRight = ol),
                    (Un.fromPairs = function (t) {
                      for (
                        var e = -1, n = null == t ? 0 : t.length, r = {};
                        ++e < n;

                      ) {
                        var i = t[e];
                        r[i[0]] = i[1];
                      }
                      return r;
                    }),
                    (Un.functions = function (t) {
                      return null == t ? [] : kr(t, Ms(t));
                    }),
                    (Un.functionsIn = function (t) {
                      return null == t ? [] : kr(t, qs(t));
                    }),
                    (Un.groupBy = ja),
                    (Un.initial = function (t) {
                      return (null == t ? 0 : t.length) ? oi(t, 0, -1) : [];
                    }),
                    (Un.intersection = Ko),
                    (Un.intersectionBy = Yo),
                    (Un.intersectionWith = Xo),
                    (Un.invert = Ps),
                    (Un.invertBy = Rs),
                    (Un.invokeMap = ka),
                    (Un.iteratee = sl),
                    (Un.keyBy = Ea),
                    (Un.keys = Ms),
                    (Un.keysIn = qs),
                    (Un.map = Oa),
                    (Un.mapKeys = function (t, e) {
                      var n = {};
                      return (
                        (e = co(e, 3)),
                        xr(t, function (t, r, i) {
                          sr(n, e(t, r, i), t);
                        }),
                        n
                      );
                    }),
                    (Un.mapValues = function (t, e) {
                      var n = {};
                      return (
                        (e = co(e, 3)),
                        xr(t, function (t, r, i) {
                          sr(n, r, e(t, r, i));
                        }),
                        n
                      );
                    }),
                    (Un.matches = function (t) {
                      return Ur(cr(t, 1));
                    }),
                    (Un.matchesProperty = function (t, e) {
                      return Br(t, cr(e, 1));
                    }),
                    (Un.memoize = La),
                    (Un.merge = Is),
                    (Un.mergeWith = Ls),
                    (Un.method = ll),
                    (Un.methodOf = ul),
                    (Un.mixin = cl),
                    (Un.negate = za),
                    (Un.nthArg = function (t) {
                      return (
                        (t = gs(t)),
                        Xr(function (e) {
                          return Hr(e, t);
                        })
                      );
                    }),
                    (Un.omit = zs),
                    (Un.omitBy = function (t, e) {
                      return Fs(t, za(co(e)));
                    }),
                    (Un.once = function (t) {
                      return Pa(2, t);
                    }),
                    (Un.orderBy = function (t, e, n, r) {
                      return null == t
                        ? []
                        : (Ja(e) || (e = null == e ? [] : [e]),
                          Ja((n = r ? i : n)) || (n = null == n ? [] : [n]),
                          Vr(t, e, n));
                    }),
                    (Un.over = hl),
                    (Un.overArgs = Da),
                    (Un.overEvery = pl),
                    (Un.overSome = dl),
                    (Un.partial = Fa),
                    (Un.partialRight = Wa),
                    (Un.partition = Sa),
                    (Un.pick = Ds),
                    (Un.pickBy = Fs),
                    (Un.property = vl),
                    (Un.propertyOf = function (t) {
                      return function (e) {
                        return null == t ? i : Er(t, e);
                      };
                    }),
                    (Un.pull = ta),
                    (Un.pullAll = ea),
                    (Un.pullAllBy = function (t, e, n) {
                      return t && t.length && e && e.length
                        ? Zr(t, e, co(n, 2))
                        : t;
                    }),
                    (Un.pullAllWith = function (t, e, n) {
                      return t && t.length && e && e.length
                        ? Zr(t, e, i, n)
                        : t;
                    }),
                    (Un.pullAt = na),
                    (Un.range = ml),
                    (Un.rangeRight = gl),
                    (Un.rearg = Ua),
                    (Un.reject = function (t, e) {
                      return (Ja(t) ? Ae : wr)(t, za(co(e, 3)));
                    }),
                    (Un.remove = function (t, e) {
                      var n = [];
                      if (!t || !t.length) return n;
                      var r = -1,
                        i = [],
                        o = t.length;
                      for (e = co(e, 3); ++r < o; ) {
                        var a = t[r];
                        e(a, r, t) && (n.push(a), i.push(r));
                      }
                      return Gr(t, i), n;
                    }),
                    (Un.rest = function (t, e) {
                      if ("function" != typeof t) throw new At(o);
                      return Xr(t, (e = e === i ? e : gs(e)));
                    }),
                    (Un.reverse = ra),
                    (Un.sampleSize = function (t, e, n) {
                      return (
                        (e = (n ? xo(t, e, n) : e === i) ? 1 : gs(e)),
                        (Ja(t) ? tr : ti)(t, e)
                      );
                    }),
                    (Un.set = function (t, e, n) {
                      return null == t ? t : ei(t, e, n);
                    }),
                    (Un.setWith = function (t, e, n, r) {
                      return (
                        (r = "function" == typeof r ? r : i),
                        null == t ? t : ei(t, e, n, r)
                      );
                    }),
                    (Un.shuffle = function (t) {
                      return (Ja(t) ? er : ii)(t);
                    }),
                    (Un.slice = function (t, e, n) {
                      var r = null == t ? 0 : t.length;
                      return r
                        ? (n && "number" != typeof n && xo(t, e, n)
                            ? ((e = 0), (n = r))
                            : ((e = null == e ? 0 : gs(e)),
                              (n = n === i ? r : gs(n))),
                          oi(t, e, n))
                        : [];
                    }),
                    (Un.sortBy = Ta),
                    (Un.sortedUniq = function (t) {
                      return t && t.length ? ui(t) : [];
                    }),
                    (Un.sortedUniqBy = function (t, e) {
                      return t && t.length ? ui(t, co(e, 2)) : [];
                    }),
                    (Un.split = function (t, e, n) {
                      return (
                        n && "number" != typeof n && xo(t, e, n) && (e = n = i),
                        (n = n === i ? m : n >>> 0)
                          ? (t = _s(t)) &&
                            ("string" == typeof e || (null != e && !ls(e))) &&
                            !(e = fi(e)) &&
                            sn(t)
                            ? ji(dn(t), 0, n)
                            : t.split(e, n)
                          : []
                      );
                    }),
                    (Un.spread = function (t, e) {
                      if ("function" != typeof t) throw new At(o);
                      return (
                        (e = null == e ? 0 : yn(gs(e), 0)),
                        Xr(function (n) {
                          var r = n[e],
                            i = ji(n, 0, e);
                          return r && Me(i, r), Ee(t, this, i);
                        })
                      );
                    }),
                    (Un.tail = function (t) {
                      var e = null == t ? 0 : t.length;
                      return e ? oi(t, 1, e) : [];
                    }),
                    (Un.take = function (t, e, n) {
                      return t && t.length
                        ? oi(t, 0, (e = n || e === i ? 1 : gs(e)) < 0 ? 0 : e)
                        : [];
                    }),
                    (Un.takeRight = function (t, e, n) {
                      var r = null == t ? 0 : t.length;
                      return r
                        ? oi(
                            t,
                            (e = r - (e = n || e === i ? 1 : gs(e))) < 0
                              ? 0
                              : e,
                            r
                          )
                        : [];
                    }),
                    (Un.takeRightWhile = function (t, e) {
                      return t && t.length ? vi(t, co(e, 3), !1, !0) : [];
                    }),
                    (Un.takeWhile = function (t, e) {
                      return t && t.length ? vi(t, co(e, 3)) : [];
                    }),
                    (Un.tap = function (t, e) {
                      return e(t), t;
                    }),
                    (Un.throttle = function (t, e, n) {
                      var r = !0,
                        i = !0;
                      if ("function" != typeof t) throw new At(o);
                      return (
                        rs(n) &&
                          ((r = "leading" in n ? !!n.leading : r),
                          (i = "trailing" in n ? !!n.trailing : i)),
                        Ma(t, e, { leading: r, maxWait: e, trailing: i })
                      );
                    }),
                    (Un.thru = ma),
                    (Un.toArray = vs),
                    (Un.toPairs = Ws),
                    (Un.toPairsIn = Us),
                    (Un.toPath = function (t) {
                      return Ja(t) ? $e(t, Fo) : fs(t) ? [t] : Pi(Do(_s(t)));
                    }),
                    (Un.toPlainObject = ys),
                    (Un.transform = function (t, e, n) {
                      var r = Ja(t),
                        i = r || Ya(t) || hs(t);
                      if (((e = co(e, 4)), null == n)) {
                        var o = t && t.constructor;
                        n = i
                          ? r
                            ? new o()
                            : []
                          : rs(t) && ts(o)
                          ? Bn(Jt(t))
                          : {};
                      }
                      return (
                        (i ? Se : xr)(t, function (t, r, i) {
                          return e(n, t, r, i);
                        }),
                        n
                      );
                    }),
                    (Un.unary = function (t) {
                      return Aa(t, 1);
                    }),
                    (Un.union = ia),
                    (Un.unionBy = oa),
                    (Un.unionWith = aa),
                    (Un.uniq = function (t) {
                      return t && t.length ? hi(t) : [];
                    }),
                    (Un.uniqBy = function (t, e) {
                      return t && t.length ? hi(t, co(e, 2)) : [];
                    }),
                    (Un.uniqWith = function (t, e) {
                      return (
                        (e = "function" == typeof e ? e : i),
                        t && t.length ? hi(t, i, e) : []
                      );
                    }),
                    (Un.unset = function (t, e) {
                      return null == t || pi(t, e);
                    }),
                    (Un.unzip = sa),
                    (Un.unzipWith = la),
                    (Un.update = function (t, e, n) {
                      return null == t ? t : di(t, e, yi(n));
                    }),
                    (Un.updateWith = function (t, e, n, r) {
                      return (
                        (r = "function" == typeof r ? r : i),
                        null == t ? t : di(t, e, yi(n), r)
                      );
                    }),
                    (Un.values = Bs),
                    (Un.valuesIn = function (t) {
                      return null == t ? [] : Xe(t, qs(t));
                    }),
                    (Un.without = ua),
                    (Un.words = tl),
                    (Un.wrap = function (t, e) {
                      return Fa(yi(e), t);
                    }),
                    (Un.xor = ca),
                    (Un.xorBy = fa),
                    (Un.xorWith = ha),
                    (Un.zip = pa),
                    (Un.zipObject = function (t, e) {
                      return wi(t || [], e || [], rr);
                    }),
                    (Un.zipObjectDeep = function (t, e) {
                      return wi(t || [], e || [], ei);
                    }),
                    (Un.zipWith = da),
                    (Un.entries = Ws),
                    (Un.entriesIn = Us),
                    (Un.extend = js),
                    (Un.extendWith = ks),
                    cl(Un, Un),
                    (Un.add = yl),
                    (Un.attempt = el),
                    (Un.camelCase = Ns),
                    (Un.capitalize = Hs),
                    (Un.ceil = _l),
                    (Un.clamp = function (t, e, n) {
                      return (
                        n === i && ((n = e), (e = i)),
                        n !== i && (n = (n = bs(n)) == n ? n : 0),
                        e !== i && (e = (e = bs(e)) == e ? e : 0),
                        ur(bs(t), e, n)
                      );
                    }),
                    (Un.clone = function (t) {
                      return cr(t, 4);
                    }),
                    (Un.cloneDeep = function (t) {
                      return cr(t, 5);
                    }),
                    (Un.cloneDeepWith = function (t, e) {
                      return cr(t, 5, (e = "function" == typeof e ? e : i));
                    }),
                    (Un.cloneWith = function (t, e) {
                      return cr(t, 4, (e = "function" == typeof e ? e : i));
                    }),
                    (Un.conformsTo = function (t, e) {
                      return null == e || fr(t, e, Ms(e));
                    }),
                    (Un.deburr = Vs),
                    (Un.defaultTo = function (t, e) {
                      return null == t || t != t ? e : t;
                    }),
                    (Un.divide = xl),
                    (Un.endsWith = function (t, e, n) {
                      (t = _s(t)), (e = fi(e));
                      var r = t.length,
                        o = (n = n === i ? r : ur(gs(n), 0, r));
                      return (n -= e.length) >= 0 && t.slice(n, o) == e;
                    }),
                    (Un.eq = Ba),
                    (Un.escape = function (t) {
                      return (t = _s(t)) && Y.test(t) ? t.replace(G, on) : t;
                    }),
                    (Un.escapeRegExp = function (t) {
                      return (t = _s(t)) && ot.test(t)
                        ? t.replace(it, "\\$&")
                        : t;
                    }),
                    (Un.every = function (t, e, n) {
                      var r = Ja(t) ? Ce : mr;
                      return n && xo(t, e, n) && (e = i), r(t, co(e, 3));
                    }),
                    (Un.find = ba),
                    (Un.findIndex = Vo),
                    (Un.findKey = function (t, e) {
                      return De(t, co(e, 3), xr);
                    }),
                    (Un.findLast = ya),
                    (Un.findLastIndex = Jo),
                    (Un.findLastKey = function (t, e) {
                      return De(t, co(e, 3), jr);
                    }),
                    (Un.floor = jl),
                    (Un.forEach = _a),
                    (Un.forEachRight = xa),
                    (Un.forIn = function (t, e) {
                      return null == t ? t : yr(t, co(e, 3), qs);
                    }),
                    (Un.forInRight = function (t, e) {
                      return null == t ? t : _r(t, co(e, 3), qs);
                    }),
                    (Un.forOwn = function (t, e) {
                      return t && xr(t, co(e, 3));
                    }),
                    (Un.forOwnRight = function (t, e) {
                      return t && jr(t, co(e, 3));
                    }),
                    (Un.get = Cs),
                    (Un.gt = Na),
                    (Un.gte = Ha),
                    (Un.has = function (t, e) {
                      return null != t && wo(t, e, Cr);
                    }),
                    (Un.hasIn = As),
                    (Un.head = Go),
                    (Un.identity = al),
                    (Un.includes = function (t, e, n, r) {
                      (t = Ga(t) ? t : Bs(t)), (n = n && !r ? gs(n) : 0);
                      var i = t.length;
                      return (
                        n < 0 && (n = yn(i + n, 0)),
                        cs(t)
                          ? n <= i && t.indexOf(e, n) > -1
                          : !!i && We(t, e, n) > -1
                      );
                    }),
                    (Un.indexOf = function (t, e, n) {
                      var r = null == t ? 0 : t.length;
                      if (!r) return -1;
                      var i = null == n ? 0 : gs(n);
                      return i < 0 && (i = yn(r + i, 0)), We(t, e, i);
                    }),
                    (Un.inRange = function (t, e, n) {
                      return (
                        (e = ms(e)),
                        n === i ? ((n = e), (e = 0)) : (n = ms(n)),
                        (function (t, e, n) {
                          return t >= _n(e, n) && t < yn(e, n);
                        })((t = bs(t)), e, n)
                      );
                    }),
                    (Un.invoke = $s),
                    (Un.isArguments = Va),
                    (Un.isArray = Ja),
                    (Un.isArrayBuffer = Za),
                    (Un.isArrayLike = Ga),
                    (Un.isArrayLikeObject = Ka),
                    (Un.isBoolean = function (t) {
                      return !0 === t || !1 === t || (is(t) && Sr(t) == y);
                    }),
                    (Un.isBuffer = Ya),
                    (Un.isDate = Xa),
                    (Un.isElement = function (t) {
                      return is(t) && 1 === t.nodeType && !ss(t);
                    }),
                    (Un.isEmpty = function (t) {
                      if (null == t) return !0;
                      if (
                        Ga(t) &&
                        (Ja(t) ||
                          "string" == typeof t ||
                          "function" == typeof t.splice ||
                          Ya(t) ||
                          hs(t) ||
                          Va(t))
                      )
                        return !t.length;
                      var e = go(t);
                      if (e == E || e == A) return !t.size;
                      if (Oo(t)) return !zr(t).length;
                      for (var n in t) if (It.call(t, n)) return !1;
                      return !0;
                    }),
                    (Un.isEqual = function (t, e) {
                      return Mr(t, e);
                    }),
                    (Un.isEqualWith = function (t, e, n) {
                      var r = (n = "function" == typeof n ? n : i)
                        ? n(t, e)
                        : i;
                      return r === i ? Mr(t, e, i, n) : !!r;
                    }),
                    (Un.isError = Qa),
                    (Un.isFinite = function (t) {
                      return "number" == typeof t && Ve(t);
                    }),
                    (Un.isFunction = ts),
                    (Un.isInteger = es),
                    (Un.isLength = ns),
                    (Un.isMap = os),
                    (Un.isMatch = function (t, e) {
                      return t === e || qr(t, e, ho(e));
                    }),
                    (Un.isMatchWith = function (t, e, n) {
                      return (
                        (n = "function" == typeof n ? n : i), qr(t, e, ho(e), n)
                      );
                    }),
                    (Un.isNaN = function (t) {
                      return as(t) && t != +t;
                    }),
                    (Un.isNative = function (t) {
                      if (Eo(t))
                        throw new kt(
                          "Unsupported core-js use. Try https://npms.io/search?q=ponyfill."
                        );
                      return Ir(t);
                    }),
                    (Un.isNil = function (t) {
                      return null == t;
                    }),
                    (Un.isNull = function (t) {
                      return null === t;
                    }),
                    (Un.isNumber = as),
                    (Un.isObject = rs),
                    (Un.isObjectLike = is),
                    (Un.isPlainObject = ss),
                    (Un.isRegExp = ls),
                    (Un.isSafeInteger = function (t) {
                      return es(t) && t >= -9007199254740991 && t <= d;
                    }),
                    (Un.isSet = us),
                    (Un.isString = cs),
                    (Un.isSymbol = fs),
                    (Un.isTypedArray = hs),
                    (Un.isUndefined = function (t) {
                      return t === i;
                    }),
                    (Un.isWeakMap = function (t) {
                      return is(t) && go(t) == $;
                    }),
                    (Un.isWeakSet = function (t) {
                      return is(t) && "[object WeakSet]" == Sr(t);
                    }),
                    (Un.join = function (t, e) {
                      return null == t ? "" : wn.call(t, e);
                    }),
                    (Un.kebabCase = Js),
                    (Un.last = Qo),
                    (Un.lastIndexOf = function (t, e, n) {
                      var r = null == t ? 0 : t.length;
                      if (!r) return -1;
                      var o = r;
                      return (
                        n !== i &&
                          (o = (o = gs(n)) < 0 ? yn(r + o, 0) : _n(o, r - 1)),
                        e == e
                          ? (function (t, e, n) {
                              for (var r = n + 1; r--; )
                                if (t[r] === e) return r;
                              return r;
                            })(t, e, o)
                          : Fe(t, Be, o, !0)
                      );
                    }),
                    (Un.lowerCase = Zs),
                    (Un.lowerFirst = Gs),
                    (Un.lt = ps),
                    (Un.lte = ds),
                    (Un.max = function (t) {
                      return t && t.length ? gr(t, al, Tr) : i;
                    }),
                    (Un.maxBy = function (t, e) {
                      return t && t.length ? gr(t, co(e, 2), Tr) : i;
                    }),
                    (Un.mean = function (t) {
                      return Ne(t, al);
                    }),
                    (Un.meanBy = function (t, e) {
                      return Ne(t, co(e, 2));
                    }),
                    (Un.min = function (t) {
                      return t && t.length ? gr(t, al, Fr) : i;
                    }),
                    (Un.minBy = function (t, e) {
                      return t && t.length ? gr(t, co(e, 2), Fr) : i;
                    }),
                    (Un.stubArray = wl),
                    (Un.stubFalse = bl),
                    (Un.stubObject = function () {
                      return {};
                    }),
                    (Un.stubString = function () {
                      return "";
                    }),
                    (Un.stubTrue = function () {
                      return !0;
                    }),
                    (Un.multiply = El),
                    (Un.nth = function (t, e) {
                      return t && t.length ? Hr(t, gs(e)) : i;
                    }),
                    (Un.noConflict = function () {
                      return pe._ === this && (pe._ = Wt), this;
                    }),
                    (Un.noop = fl),
                    (Un.now = Ca),
                    (Un.pad = function (t, e, n) {
                      t = _s(t);
                      var r = (e = gs(e)) ? pn(t) : 0;
                      if (!e || r >= e) return t;
                      var i = (e - r) / 2;
                      return Vi(ge(i), n) + t + Vi(ve(i), n);
                    }),
                    (Un.padEnd = function (t, e, n) {
                      t = _s(t);
                      var r = (e = gs(e)) ? pn(t) : 0;
                      return e && r < e ? t + Vi(e - r, n) : t;
                    }),
                    (Un.padStart = function (t, e, n) {
                      t = _s(t);
                      var r = (e = gs(e)) ? pn(t) : 0;
                      return e && r < e ? Vi(e - r, n) + t : t;
                    }),
                    (Un.parseInt = function (t, e, n) {
                      return (
                        n || null == e ? (e = 0) : e && (e = +e),
                        jn(_s(t).replace(at, ""), e || 0)
                      );
                    }),
                    (Un.random = function (t, e, n) {
                      if (
                        (n &&
                          "boolean" != typeof n &&
                          xo(t, e, n) &&
                          (e = n = i),
                        n === i &&
                          ("boolean" == typeof e
                            ? ((n = e), (e = i))
                            : "boolean" == typeof t && ((n = t), (t = i))),
                        t === i && e === i
                          ? ((t = 0), (e = 1))
                          : ((t = ms(t)),
                            e === i ? ((e = t), (t = 0)) : (e = ms(e))),
                        t > e)
                      ) {
                        var r = t;
                        (t = e), (e = r);
                      }
                      if (n || t % 1 || e % 1) {
                        var o = kn();
                        return _n(
                          t + o * (e - t + ue("1e-" + ((o + "").length - 1))),
                          e
                        );
                      }
                      return Kr(t, e);
                    }),
                    (Un.reduce = function (t, e, n) {
                      var r = Ja(t) ? qe : Je,
                        i = arguments.length < 3;
                      return r(t, co(e, 4), n, i, dr);
                    }),
                    (Un.reduceRight = function (t, e, n) {
                      var r = Ja(t) ? Ie : Je,
                        i = arguments.length < 3;
                      return r(t, co(e, 4), n, i, vr);
                    }),
                    (Un.repeat = function (t, e, n) {
                      return (
                        (e = (n ? xo(t, e, n) : e === i) ? 1 : gs(e)),
                        Yr(_s(t), e)
                      );
                    }),
                    (Un.replace = function () {
                      var t = arguments,
                        e = _s(t[0]);
                      return t.length < 3 ? e : e.replace(t[1], t[2]);
                    }),
                    (Un.result = function (t, e, n) {
                      var r = -1,
                        o = (e = _i(e, t)).length;
                      for (o || ((o = 1), (t = i)); ++r < o; ) {
                        var a = null == t ? i : t[Fo(e[r])];
                        a === i && ((r = o), (a = n)),
                          (t = ts(a) ? a.call(t) : a);
                      }
                      return t;
                    }),
                    (Un.round = Ol),
                    (Un.runInContext = t),
                    (Un.sample = function (t) {
                      return (Ja(t) ? Qn : Qr)(t);
                    }),
                    (Un.size = function (t) {
                      if (null == t) return 0;
                      if (Ga(t)) return cs(t) ? pn(t) : t.length;
                      var e = go(t);
                      return e == E || e == A ? t.size : zr(t).length;
                    }),
                    (Un.snakeCase = Ks),
                    (Un.some = function (t, e, n) {
                      var r = Ja(t) ? Le : ai;
                      return n && xo(t, e, n) && (e = i), r(t, co(e, 3));
                    }),
                    (Un.sortedIndex = function (t, e) {
                      return si(t, e);
                    }),
                    (Un.sortedIndexBy = function (t, e, n) {
                      return li(t, e, co(n, 2));
                    }),
                    (Un.sortedIndexOf = function (t, e) {
                      var n = null == t ? 0 : t.length;
                      if (n) {
                        var r = si(t, e);
                        if (r < n && Ba(t[r], e)) return r;
                      }
                      return -1;
                    }),
                    (Un.sortedLastIndex = function (t, e) {
                      return si(t, e, !0);
                    }),
                    (Un.sortedLastIndexBy = function (t, e, n) {
                      return li(t, e, co(n, 2), !0);
                    }),
                    (Un.sortedLastIndexOf = function (t, e) {
                      if (null == t ? 0 : t.length) {
                        var n = si(t, e, !0) - 1;
                        if (Ba(t[n], e)) return n;
                      }
                      return -1;
                    }),
                    (Un.startCase = Ys),
                    (Un.startsWith = function (t, e, n) {
                      return (
                        (t = _s(t)),
                        (n = null == n ? 0 : ur(gs(n), 0, t.length)),
                        (e = fi(e)),
                        t.slice(n, n + e.length) == e
                      );
                    }),
                    (Un.subtract = Sl),
                    (Un.sum = function (t) {
                      return t && t.length ? Ze(t, al) : 0;
                    }),
                    (Un.sumBy = function (t, e) {
                      return t && t.length ? Ze(t, co(e, 2)) : 0;
                    }),
                    (Un.template = function (t, e, n) {
                      var r = Un.templateSettings;
                      n && xo(t, e, n) && (e = i),
                        (t = _s(t)),
                        (e = ks({}, e, r, to));
                      var o,
                        a,
                        s = ks({}, e.imports, r.imports, to),
                        l = Ms(s),
                        u = Xe(s, l),
                        c = 0,
                        f = e.interpolate || xt,
                        h = "__p += '",
                        p = Tt(
                          (e.escape || xt).source +
                            "|" +
                            f.source +
                            "|" +
                            (f === tt ? dt : xt).source +
                            "|" +
                            (e.evaluate || xt).source +
                            "|$",
                          "g"
                        ),
                        d =
                          "//# sourceURL=" +
                          (It.call(e, "sourceURL")
                            ? (e.sourceURL + "").replace(/\s/g, " ")
                            : "lodash.templateSources[" + ++oe + "]") +
                          "\n";
                      t.replace(p, function (e, n, r, i, s, l) {
                        return (
                          r || (r = i),
                          (h += t.slice(c, l).replace(jt, an)),
                          n && ((o = !0), (h += "' +\n__e(" + n + ") +\n'")),
                          s && ((a = !0), (h += "';\n" + s + ";\n__p += '")),
                          r &&
                            (h +=
                              "' +\n((__t = (" +
                              r +
                              ")) == null ? '' : __t) +\n'"),
                          (c = l + e.length),
                          e
                        );
                      }),
                        (h += "';\n");
                      var v = It.call(e, "variable") && e.variable;
                      if (v) {
                        if (ht.test(v))
                          throw new kt(
                            "Invalid `variable` option passed into `_.template`"
                          );
                      } else h = "with (obj) {\n" + h + "\n}\n";
                      (h = (a ? h.replace(H, "") : h)
                        .replace(V, "$1")
                        .replace(J, "$1;")),
                        (h =
                          "function(" +
                          (v || "obj") +
                          ") {\n" +
                          (v ? "" : "obj || (obj = {});\n") +
                          "var __t, __p = ''" +
                          (o ? ", __e = _.escape" : "") +
                          (a
                            ? ", __j = Array.prototype.join;\nfunction print() { __p += __j.call(arguments, '') }\n"
                            : ";\n") +
                          h +
                          "return __p\n}");
                      var m = el(function () {
                        return Et(l, d + "return " + h).apply(i, u);
                      });
                      if (((m.source = h), Qa(m))) throw m;
                      return m;
                    }),
                    (Un.times = function (t, e) {
                      if ((t = gs(t)) < 1 || t > d) return [];
                      var n = m,
                        r = _n(t, m);
                      (e = co(e)), (t -= m);
                      for (var i = Ge(r, e); ++n < t; ) e(n);
                      return i;
                    }),
                    (Un.toFinite = ms),
                    (Un.toInteger = gs),
                    (Un.toLength = ws),
                    (Un.toLower = function (t) {
                      return _s(t).toLowerCase();
                    }),
                    (Un.toNumber = bs),
                    (Un.toSafeInteger = function (t) {
                      return t
                        ? ur(gs(t), -9007199254740991, d)
                        : 0 === t
                        ? t
                        : 0;
                    }),
                    (Un.toString = _s),
                    (Un.toUpper = function (t) {
                      return _s(t).toUpperCase();
                    }),
                    (Un.trim = function (t, e, n) {
                      if ((t = _s(t)) && (n || e === i)) return Ke(t);
                      if (!t || !(e = fi(e))) return t;
                      var r = dn(t),
                        o = dn(e);
                      return ji(r, tn(r, o), en(r, o) + 1).join("");
                    }),
                    (Un.trimEnd = function (t, e, n) {
                      if ((t = _s(t)) && (n || e === i))
                        return t.slice(0, vn(t) + 1);
                      if (!t || !(e = fi(e))) return t;
                      var r = dn(t);
                      return ji(r, 0, en(r, dn(e)) + 1).join("");
                    }),
                    (Un.trimStart = function (t, e, n) {
                      if ((t = _s(t)) && (n || e === i))
                        return t.replace(at, "");
                      if (!t || !(e = fi(e))) return t;
                      var r = dn(t);
                      return ji(r, tn(r, dn(e))).join("");
                    }),
                    (Un.truncate = function (t, e) {
                      var n = 30,
                        r = "...";
                      if (rs(e)) {
                        var o = "separator" in e ? e.separator : o;
                        (n = "length" in e ? gs(e.length) : n),
                          (r = "omission" in e ? fi(e.omission) : r);
                      }
                      var a = (t = _s(t)).length;
                      if (sn(t)) {
                        var s = dn(t);
                        a = s.length;
                      }
                      if (n >= a) return t;
                      var l = n - pn(r);
                      if (l < 1) return r;
                      var u = s ? ji(s, 0, l).join("") : t.slice(0, l);
                      if (o === i) return u + r;
                      if ((s && (l += u.length - l), ls(o))) {
                        if (t.slice(l).search(o)) {
                          var c,
                            f = u;
                          for (
                            o.global ||
                              (o = Tt(o.source, _s(vt.exec(o)) + "g")),
                              o.lastIndex = 0;
                            (c = o.exec(f));

                          )
                            var h = c.index;
                          u = u.slice(0, h === i ? l : h);
                        }
                      } else if (t.indexOf(fi(o), l) != l) {
                        var p = u.lastIndexOf(o);
                        p > -1 && (u = u.slice(0, p));
                      }
                      return u + r;
                    }),
                    (Un.unescape = function (t) {
                      return (t = _s(t)) && K.test(t) ? t.replace(Z, mn) : t;
                    }),
                    (Un.uniqueId = function (t) {
                      var e = ++Lt;
                      return _s(t) + e;
                    }),
                    (Un.upperCase = Xs),
                    (Un.upperFirst = Qs),
                    (Un.each = _a),
                    (Un.eachRight = xa),
                    (Un.first = Go),
                    cl(
                      Un,
                      ((kl = {}),
                      xr(Un, function (t, e) {
                        It.call(Un.prototype, e) || (kl[e] = t);
                      }),
                      kl),
                      { chain: !1 }
                    ),
                    (Un.VERSION = "4.17.21"),
                    Se(
                      [
                        "bind",
                        "bindKey",
                        "curry",
                        "curryRight",
                        "partial",
                        "partialRight",
                      ],
                      function (t) {
                        Un[t].placeholder = Un;
                      }
                    ),
                    Se(["drop", "take"], function (t, e) {
                      (Vn.prototype[t] = function (n) {
                        n = n === i ? 1 : yn(gs(n), 0);
                        var r =
                          this.__filtered__ && !e ? new Vn(this) : this.clone();
                        return (
                          r.__filtered__
                            ? (r.__takeCount__ = _n(n, r.__takeCount__))
                            : r.__views__.push({
                                size: _n(n, m),
                                type: t + (r.__dir__ < 0 ? "Right" : ""),
                              }),
                          r
                        );
                      }),
                        (Vn.prototype[t + "Right"] = function (e) {
                          return this.reverse()[t](e).reverse();
                        });
                    }),
                    Se(["filter", "map", "takeWhile"], function (t, e) {
                      var n = e + 1,
                        r = 1 == n || 3 == n;
                      Vn.prototype[t] = function (t) {
                        var e = this.clone();
                        return (
                          e.__iteratees__.push({ iteratee: co(t, 3), type: n }),
                          (e.__filtered__ = e.__filtered__ || r),
                          e
                        );
                      };
                    }),
                    Se(["head", "last"], function (t, e) {
                      var n = "take" + (e ? "Right" : "");
                      Vn.prototype[t] = function () {
                        return this[n](1).value()[0];
                      };
                    }),
                    Se(["initial", "tail"], function (t, e) {
                      var n = "drop" + (e ? "" : "Right");
                      Vn.prototype[t] = function () {
                        return this.__filtered__ ? new Vn(this) : this[n](1);
                      };
                    }),
                    (Vn.prototype.compact = function () {
                      return this.filter(al);
                    }),
                    (Vn.prototype.find = function (t) {
                      return this.filter(t).head();
                    }),
                    (Vn.prototype.findLast = function (t) {
                      return this.reverse().find(t);
                    }),
                    (Vn.prototype.invokeMap = Xr(function (t, e) {
                      return "function" == typeof t
                        ? new Vn(this)
                        : this.map(function (n) {
                            return Rr(n, t, e);
                          });
                    })),
                    (Vn.prototype.reject = function (t) {
                      return this.filter(za(co(t)));
                    }),
                    (Vn.prototype.slice = function (t, e) {
                      t = gs(t);
                      var n = this;
                      return n.__filtered__ && (t > 0 || e < 0)
                        ? new Vn(n)
                        : (t < 0 ? (n = n.takeRight(-t)) : t && (n = n.drop(t)),
                          e !== i &&
                            (n =
                              (e = gs(e)) < 0
                                ? n.dropRight(-e)
                                : n.take(e - t)),
                          n);
                    }),
                    (Vn.prototype.takeRightWhile = function (t) {
                      return this.reverse().takeWhile(t).reverse();
                    }),
                    (Vn.prototype.toArray = function () {
                      return this.take(m);
                    }),
                    xr(Vn.prototype, function (t, e) {
                      var n = /^(?:filter|find|map|reject)|While$/.test(e),
                        r = /^(?:head|last)$/.test(e),
                        o = Un[r ? "take" + ("last" == e ? "Right" : "") : e],
                        a = r || /^find/.test(e);
                      o &&
                        (Un.prototype[e] = function () {
                          var e = this.__wrapped__,
                            s = r ? [1] : arguments,
                            l = e instanceof Vn,
                            u = s[0],
                            c = l || Ja(e),
                            f = function (t) {
                              var e = o.apply(Un, Me([t], s));
                              return r && h ? e[0] : e;
                            };
                          c &&
                            n &&
                            "function" == typeof u &&
                            1 != u.length &&
                            (l = c = !1);
                          var h = this.__chain__,
                            p = !!this.__actions__.length,
                            d = a && !h,
                            v = l && !p;
                          if (!a && c) {
                            e = v ? e : new Vn(this);
                            var m = t.apply(e, s);
                            return (
                              m.__actions__.push({
                                func: ma,
                                args: [f],
                                thisArg: i,
                              }),
                              new Hn(m, h)
                            );
                          }
                          return d && v
                            ? t.apply(this, s)
                            : ((m = this.thru(f)),
                              d ? (r ? m.value()[0] : m.value()) : m);
                        });
                    }),
                    Se(
                      ["pop", "push", "shift", "sort", "splice", "unshift"],
                      function (t) {
                        var e = Pt[t],
                          n = /^(?:push|sort|unshift)$/.test(t)
                            ? "tap"
                            : "thru",
                          r = /^(?:pop|shift)$/.test(t);
                        Un.prototype[t] = function () {
                          var t = arguments;
                          if (r && !this.__chain__) {
                            var i = this.value();
                            return e.apply(Ja(i) ? i : [], t);
                          }
                          return this[n](function (n) {
                            return e.apply(Ja(n) ? n : [], t);
                          });
                        };
                      }
                    ),
                    xr(Vn.prototype, function (t, e) {
                      var n = Un[e];
                      if (n) {
                        var r = n.name + "";
                        It.call($n, r) || ($n[r] = []),
                          $n[r].push({ name: e, func: n });
                      }
                    }),
                    ($n[Ui(i, 2).name] = [{ name: "wrapper", func: i }]),
                    (Vn.prototype.clone = function () {
                      var t = new Vn(this.__wrapped__);
                      return (
                        (t.__actions__ = Pi(this.__actions__)),
                        (t.__dir__ = this.__dir__),
                        (t.__filtered__ = this.__filtered__),
                        (t.__iteratees__ = Pi(this.__iteratees__)),
                        (t.__takeCount__ = this.__takeCount__),
                        (t.__views__ = Pi(this.__views__)),
                        t
                      );
                    }),
                    (Vn.prototype.reverse = function () {
                      if (this.__filtered__) {
                        var t = new Vn(this);
                        (t.__dir__ = -1), (t.__filtered__ = !0);
                      } else (t = this.clone()).__dir__ *= -1;
                      return t;
                    }),
                    (Vn.prototype.value = function () {
                      var t = this.__wrapped__.value(),
                        e = this.__dir__,
                        n = Ja(t),
                        r = e < 0,
                        i = n ? t.length : 0,
                        o = (function (t, e, n) {
                          var r = -1,
                            i = n.length;
                          for (; ++r < i; ) {
                            var o = n[r],
                              a = o.size;
                            switch (o.type) {
                              case "drop":
                                t += a;
                                break;
                              case "dropRight":
                                e -= a;
                                break;
                              case "take":
                                e = _n(e, t + a);
                                break;
                              case "takeRight":
                                t = yn(t, e - a);
                            }
                          }
                          return { start: t, end: e };
                        })(0, i, this.__views__),
                        a = o.start,
                        s = o.end,
                        l = s - a,
                        u = r ? s : a - 1,
                        c = this.__iteratees__,
                        f = c.length,
                        h = 0,
                        p = _n(l, this.__takeCount__);
                      if (!n || (!r && i == l && p == l))
                        return mi(t, this.__actions__);
                      var d = [];
                      t: for (; l-- && h < p; ) {
                        for (var v = -1, m = t[(u += e)]; ++v < f; ) {
                          var g = c[v],
                            w = g.iteratee,
                            b = g.type,
                            y = w(m);
                          if (2 == b) m = y;
                          else if (!y) {
                            if (1 == b) continue t;
                            break t;
                          }
                        }
                        d[h++] = m;
                      }
                      return d;
                    }),
                    (Un.prototype.at = ga),
                    (Un.prototype.chain = function () {
                      return va(this);
                    }),
                    (Un.prototype.commit = function () {
                      return new Hn(this.value(), this.__chain__);
                    }),
                    (Un.prototype.next = function () {
                      this.__values__ === i &&
                        (this.__values__ = vs(this.value()));
                      var t = this.__index__ >= this.__values__.length;
                      return {
                        done: t,
                        value: t ? i : this.__values__[this.__index__++],
                      };
                    }),
                    (Un.prototype.plant = function (t) {
                      for (var e, n = this; n instanceof Nn; ) {
                        var r = Uo(n);
                        (r.__index__ = 0),
                          (r.__values__ = i),
                          e ? (o.__wrapped__ = r) : (e = r);
                        var o = r;
                        n = n.__wrapped__;
                      }
                      return (o.__wrapped__ = t), e;
                    }),
                    (Un.prototype.reverse = function () {
                      var t = this.__wrapped__;
                      if (t instanceof Vn) {
                        var e = t;
                        return (
                          this.__actions__.length && (e = new Vn(this)),
                          (e = e.reverse()).__actions__.push({
                            func: ma,
                            args: [ra],
                            thisArg: i,
                          }),
                          new Hn(e, this.__chain__)
                        );
                      }
                      return this.thru(ra);
                    }),
                    (Un.prototype.toJSON =
                      Un.prototype.valueOf =
                      Un.prototype.value =
                        function () {
                          return mi(this.__wrapped__, this.__actions__);
                        }),
                    (Un.prototype.first = Un.prototype.head),
                    te &&
                      (Un.prototype[te] = function () {
                        return this;
                      }),
                    Un
                  );
                })();
                (pe._ = gn),
                  (r = function () {
                    return gn;
                  }.call(e, n, e, t)) === i || (t.exports = r);
              }.call(this);
          },
        },
        e = {};
      function n(r) {
        var i = e[r];
        if (void 0 !== i) return i.exports;
        var o = (e[r] = { id: r, loaded: !1, exports: {} });
        return (
          t[r].call(o.exports, o, o.exports, n), (o.loaded = !0), o.exports
        );
      }
      (n.amdD = function () {
        throw new Error("define cannot be used indirect");
      }),
        (n.amdO = {}),
        (n.n = (t) => {
          var e = t && t.__esModule ? () => t.default : () => t;
          return n.d(e, { a: e }), e;
        }),
        (n.d = (t, e) => {
          for (var r in e)
            n.o(e, r) &&
              !n.o(t, r) &&
              Object.defineProperty(t, r, { enumerable: !0, get: e[r] });
        }),
        (n.g = (function () {
          if ("object" == typeof globalThis) return globalThis;
          try {
            return this || new Function("return this")();
          } catch (t) {
            if ("object" == typeof window) return window;
          }
        })()),
        (n.o = (t, e) => Object.prototype.hasOwnProperty.call(t, e)),
        (n.r = (t) => {
          "undefined" != typeof Symbol &&
            Symbol.toStringTag &&
            Object.defineProperty(t, Symbol.toStringTag, { value: "Module" }),
            Object.defineProperty(t, "__esModule", { value: !0 });
        }),
        (n.nmd = (t) => ((t.paths = []), t.children || (t.children = []), t));
      var r = {};
      return (
        (() => {
          "use strict";
          n.r(r),
            n.d(r, {
              build: () => Gn,
              canvas: () => l,
              core: () => e,
              data: () => i,
              flow: () => o,
              html: () => a,
              plugins: () => c,
              util: () => h,
              version: () => Zn,
            });
          var t = {};
          n.r(t),
            n.d(t, {
              mean: () => ht,
              std: () => dt,
              sum: () => ft,
              variance: () => pt,
            });
          var e = {};
          n.r(e),
            n.d(e, {
              Component: () => Component,
              Controller: () => Dt,
              Dummy: () => Dummy,
              EventName: () => et,
              deserialize: () => Xt,
            });
          var i = {};
          n.r(i), n.d(i, { Store: () => St });
          var o = {};
          n.r(o), n.d(o, { Loop: () => Loop, Sequence: () => Sequence });
          var a = {};
          n.r(a),
            n.d(a, {
              Form: () => Form,
              Frame: () => Frame,
              Page: () => Page,
              Screen: () => Screen,
            });
          var s = {};
          n.r(s),
            n.d(s, {
              distance: () => Ie,
              polygon: () => De,
              polygonVertex: () => ze,
              toRadians: () => Le,
            });
          var l = {};
          n.r(l), n.d(l, { Frame: () => Xe, Screen: () => Ze });
          var u = {};
          n.r(u), n.d(u, { exit: () => dn, launch: () => pn });
          var c = {};
          n.r(c),
            n.d(c, {
              Debug: () => Debug,
              Download: () => Download,
              Fullscreen: () => vn,
              Logger: () => Logger,
              Metadata: () => Metadata,
              NavigationGuard: () => wn,
              Paradata: () => yn,
              PostMessage: () => _n,
              Style: () => En,
              Submit: () => xn,
              Transmit: () => Transmit,
            });
          var f = {};
          n.r(f), n.d(f, { product: () => Nn });
          var h = {};
          n.r(h),
            n.d(h, {
              Random: () => Random,
              canvas: () => Hn,
              combinatorics: () => f,
              fullscreen: () => u,
              geometry: () => s,
              stats: () => t,
              timing: () => Vn,
              tree: () => Jn,
            });
          var p = n(486);
          const d = function (t, e) {
            let { value: n, done: r } = t.next();
            for (; !r && !e(n); ) ({ value: n, done: r } = t.next());
            return [{ value: n, done: r }, t];
          };
          var v,
            m,
            g,
            w = function (t, e, n, r, i) {
              if ("m" === r)
                throw new TypeError("Private method is not writable");
              if ("a" === r && !i)
                throw new TypeError(
                  "Private accessor was defined without a setter"
                );
              if ("function" == typeof e ? t !== e || !i : !e.has(t))
                throw new TypeError(
                  "Cannot write private member to an object whose class did not declare it"
                );
              return (
                "a" === r ? i.call(t, n) : i ? (i.value = n) : e.set(t, n), n
              );
            },
            b = function (t, e, n, r) {
              if ("a" === n && !r)
                throw new TypeError(
                  "Private accessor was defined without a getter"
                );
              if ("function" == typeof e ? t !== e || !r : !e.has(t))
                throw new TypeError(
                  "Cannot read private member from an object whose class did not declare it"
                );
              return "m" === n
                ? r
                : "a" === n
                ? r.call(t)
                : r
                ? r.value
                : e.get(t);
            };
          class y {
            constructor(
              t,
              e = async (t) => t[Symbol.iterator](),
              n = (t) => Symbol.iterator in t
            ) {
              v.set(this, void 0),
                m.set(this, void 0),
                g.set(this, void 0),
                w(this, v, t, "f"),
                w(this, m, e, "f"),
                w(this, g, n, "f");
            }
            [((v = new WeakMap()),
            (m = new WeakMap()),
            (g = new WeakMap()),
            Symbol.asyncIterator)]() {
              let t = !1;
              const e = [],
                n = [];
              let r;
              const i = async () => {
                t ||
                  (b(this, g, "f").call(this, b(this, v, "f"))
                    ? (e.push(
                        await b(this, m, "f").call(this, b(this, v, "f"))
                      ),
                      n.push(b(this, v, "f")))
                    : (r = b(this, v, "f")),
                  (t = !0));
              };
              return {
                initialize: i,
                next: async () => {
                  if ((t || (await i()), r)) {
                    const t = [...n, r];
                    return (r = void 0), { value: t, done: !1 };
                  }
                  for (; e.length > 0; ) {
                    const t = e[e.length - 1],
                      { value: r, done: i } = t.next();
                    if (i) e.pop(), n.pop();
                    else {
                      if (
                        (r.status >= tt.running && r._reset(),
                        !b(this, g, "f").call(this, r))
                      )
                        return { value: [...n, r], done: !1 };
                      n.push(r), e.push(await b(this, m, "f").call(this, r));
                    }
                  }
                  return { value: void 0, done: !0 };
                },
                splice: (t) => {
                  e.splice(t), n.splice(t);
                },
                findSplice: function (t) {
                  const e = n.indexOf(t);
                  e >= 0 && this.splice(e);
                },
                reset: async function (t) {
                  if ((this.splice(t + 1), !e[t] || !("reset" in e[t])))
                    throw new Error("No reset method on current iterator");
                  e[t].reset();
                },
                findReset: async function (t) {
                  const e = n.indexOf(t);
                  return e >= 0 && (await this.reset(e)), Promise.resolve();
                },
                fastForward: async (t) => {
                  let i = 0;
                  for (e.splice(1), n.splice(1); ; ) {
                    const o = e[i],
                      [{ value: a, done: s }] = d(o, (e) => t(e, i));
                    if (s) break;
                    if (!b(this, g, "f").call(this, a)) {
                      r = a;
                      break;
                    }
                    e.push(await b(this, m, "f").call(this, a)),
                      n.push(a),
                      (i += 1);
                  }
                },
                peek: function () {
                  var t;
                  const r = [];
                  for (const [i, o] of e.entries()) {
                    const e = n.slice(1, i + 1).map((t) => t.id);
                    if (null == o.peek) {
                      console.error(
                        `Iterator at level ${i} does not support peeking`
                      );
                      break;
                    }
                    {
                      const n =
                        null === (t = o.peek) || void 0 === t
                          ? void 0
                          : t.call(o).map(([t, ...n]) => [[...e, t], ...n]);
                      r.push(n);
                    }
                  }
                  return r;
                },
              };
            }
          }
          const _ = (t, e) => {
            let n = 0;
            for (let r of (0, p.range)(Math.max(t.length, e.length))) {
              if (t[r] !== e[r]) break;
              n += 1;
            }
            return { outgoing: t.slice(n), incoming: e.slice(n) };
          };
          class x extends Error {}
          const j = async function (t) {
            var e;
            return await (null === (e = this.internals.controller) ||
            void 0 === e
              ? void 0
              : e.continue(this, t));
          };
          class k {
            constructor(t) {
              (this.root = t),
                (this.timelineIterable = new y(
                  t,
                  async (t) => (
                    t.status < tt.prepared && (await t.prepare()),
                    t.internals.iterator
                  ),
                  (t) => {
                    var e;
                    return (
                      void 0 !==
                      (null === (e = t.internals) || void 0 === e
                        ? void 0
                        : e.iterator)
                    );
                  }
                ));
            }
            [Symbol.asyncIterator]() {
              const t = this.timelineIterable[Symbol.asyncIterator]();
              let e = [],
                n = [];
              return {
                initialize: async () => {
                  await t.initialize();
                },
                next: async ([r, i]) => {
                  this.renderFrameRequest &&
                    cancelAnimationFrame(this.renderFrameRequest),
                    this.showFrameRequest &&
                      cancelAnimationFrame(this.showFrameRequest);
                  let o,
                    a,
                    s = [...e],
                    l = [];
                  await Promise.all(n);
                  t: for (;;) {
                    let { value: n } = await t.next();
                    (n = null != n ? n : []),
                      ({ incoming: o, outgoing: a } = _(e, n));
                    for (const t of [...a].reverse())
                      try {
                        t.internals.emitter.off(at.endUncontrolled, j),
                          e.pop(),
                          l.push(t),
                          await t.end(
                            r.reason,
                            Object.assign(Object.assign({}, r), {
                              controlled: !0,
                            })
                          ),
                          (i = t.leaveContext(i));
                      } catch (e) {
                        throw (console.error("Error ending", t), e);
                      }
                    for (const n of o)
                      try {
                        n.internals.emitter.on(at.endUncontrolled, j),
                          (i = n.enterContext(i)),
                          e.push(n),
                          await n.run(Object.assign({ controlled: !0 }, r));
                      } catch (e) {
                        if (e instanceof x) {
                          t.findSplice(n);
                          continue t;
                        }
                        throw (console.error("Error running", n), e);
                      }
                    break;
                  }
                  const { incoming: u } = _(s, e);
                  var c, f, h;
                  return (
                    (n = l.map((t) => t.internals.emitter.waitFor(at.lock))),
                    (this.renderFrameRequest =
                      ((c = r.frameSynced),
                      (f = r.timestamp),
                      (h = (t) => {
                        u.map((e) => {
                          var n;
                          return null === (n = e.render) || void 0 === n
                            ? void 0
                            : n.call(e, { timestamp: t });
                        }),
                          (this.showFrameRequest = window.requestAnimationFrame(
                            (t) => {
                              u.map((e) => {
                                var n;
                                return null === (n = e.show) || void 0 === n
                                  ? void 0
                                  : n.call(e, { timestamp: t });
                              }),
                                (this.showFrameRequest = void 0);
                            }
                          )),
                          window.requestAnimationFrame((t) => {
                            l.map((e) => {
                              var n;
                              return null === (n = e.lock) || void 0 === n
                                ? void 0
                                : n.call(e, { timestamp: t });
                            });
                          }),
                          (this.renderFrameRequest = void 0);
                      }),
                      c
                        ? window.requestAnimationFrame(h)
                        : void h(
                            null != f ? f : document.timeline.currentTime
                          ))),
                    { done: 0 === e.length, value: { stack: e, context: i } }
                  );
                },
                splice: t.splice,
                findSplice: t.findSplice,
                reset: t.reset,
                findReset: t.findReset,
                fastForward: async (e) => {
                  await t.fastForward(
                    (t, n) => void 0 === e[n] || e[n] === t.id
                  );
                },
                peek: t.peek,
              };
            }
          }
          var E,
            O,
            S = function (t, e, n, r) {
              if ("a" === n && !r)
                throw new TypeError(
                  "Private accessor was defined without a getter"
                );
              if ("function" == typeof e ? t !== e || !r : !e.has(t))
                throw new TypeError(
                  "Cannot read private member from an object whose class did not declare it"
                );
              return "m" === n
                ? r
                : "a" === n
                ? r.call(t)
                : r
                ? r.value
                : e.get(t);
            },
            T = function (t, e, n, r, i) {
              if ("m" === r)
                throw new TypeError("Private method is not writable");
              if ("a" === r && !i)
                throw new TypeError(
                  "Private accessor was defined without a setter"
                );
              if ("function" == typeof e ? t !== e || !i : !e.has(t))
                throw new TypeError(
                  "Cannot write private member to an object whose class did not declare it"
                );
              return (
                "a" === r ? i.call(t, n) : i ? (i.value = n) : e.set(t, n), n
              );
            };
          class C {
            constructor() {
              E.set(this, void 0), O.set(this, void 0), this.acquire();
            }
            wait() {
              return S(this, E, "f");
            }
            acquire() {
              return (
                T(
                  this,
                  E,
                  new Promise((t) => {
                    T(this, O, t, "f");
                  }),
                  "f"
                ),
                S(this, E, "f")
              );
            }
            release(t) {
              S(this, O, "f").call(this, t);
            }
          }
          (E = new WeakMap()), (O = new WeakMap());
          var A,
            P,
            R = function (t, e, n, r, i) {
              if ("m" === r)
                throw new TypeError("Private method is not writable");
              if ("a" === r && !i)
                throw new TypeError(
                  "Private accessor was defined without a setter"
                );
              if ("function" == typeof e ? t !== e || !i : !e.has(t))
                throw new TypeError(
                  "Cannot write private member to an object whose class did not declare it"
                );
              return (
                "a" === r ? i.call(t, n) : i ? (i.value = n) : e.set(t, n), n
              );
            },
            $ = function (t, e, n, r) {
              if ("a" === n && !r)
                throw new TypeError(
                  "Private accessor was defined without a getter"
                );
              if ("function" == typeof e ? t !== e || !r : !e.has(t))
                throw new TypeError(
                  "Cannot read private member from an object whose class did not declare it"
                );
              return "m" === n
                ? r
                : "a" === n
                ? r.call(t)
                : r
                ? r.value
                : e.get(t);
            };
          const M = /(^|:)(\w)/gi,
            q = function (t, e, n) {
              return n.toUpperCase();
            };
          class I {
            constructor(t, e = { debug: !1, context: void 0 }) {
              var n;
              A.set(this, void 0),
                P.set(this, void 0),
                (this.id = t),
                (this.options = e),
                R(this, P, new Map(), "f"),
                R(
                  this,
                  A,
                  null !== (n = e.context) && void 0 !== n ? n : this,
                  "f"
                );
            }
            async trigger(t, ...e) {
              this.options.debug &&
                console.info(`Caught ${t} on ${this.id}, data`, e);
              const n = (function (t) {
                  return `on${t.replace(M, q)}`;
                })(t),
                r = $(this, A, "f")[n];
              r &&
                "function" == typeof r &&
                (await r.apply($(this, A, "f"), e)),
                await this.emit(t, ...e);
            }
            async emit(t, ...e) {
              var n, r;
              await Promise.all([
                ...(null !== (n = $(this, P, "f").get(t)) && void 0 !== n
                  ? n
                  : []
                )
                  .slice()
                  .map((t) => t.apply($(this, A, "f"), e)),
                ...(null !== (r = $(this, P, "f").get("*")) && void 0 !== r
                  ? r
                  : []
                )
                  .slice()
                  .map((n) => n.call($(this, A, "f"), t, ...e)),
              ]);
            }
            on(t, e) {
              var n;
              $(this, P, "f").set(t, [
                ...(null !== (n = $(this, P, "f").get(t)) && void 0 !== n
                  ? n
                  : []),
                e,
              ]);
            }
            once(t, e) {
              const n = (r) => (this.off(t, n), e(r));
              this.on(t, n);
            }
            off(t, e) {
              void 0 !== $(this, P, "f").get(t) &&
                $(this, P, "f").set(
                  t,
                  $(this, P, "f")
                    .get(t)
                    .filter((t) => t !== e)
                );
            }
            waitFor(t) {
              return new Promise((e) => this.once(t, e));
            }
          }
          (A = new WeakMap()), (P = new WeakMap());
          class L extends I {
            constructor({ root: t, global: e = {}, initialContext: n = {} }) {
              super("controller"),
                (this.root = t),
                (this.root.internals.controller = this),
                (this.global = e),
                (this.iterable = new k(t)),
                (this.iterator = this.iterable[Symbol.asyncIterator]()),
                (this.currentStack = []),
                (this.lock = new C()),
                (this.flipHandlers = []),
                (this.context = n);
            }
            async loop() {
              var t, e;
              let n = {},
                r = !1;
              for (await this.iterator.initialize(); !r; ) {
                const i = await this.iterator.next([n, this.context]),
                  o = this.lock.acquire();
                (r = null === (t = i.done) || void 0 === t || t),
                  (this.context = i.value.context),
                  (this.currentStack = i.value.stack),
                  await this.emit("flip", n);
                for (let t = 0; t < this.flipHandlers.length; t++)
                  null === (e = this.flipHandlers.pop()) || void 0 === e || e();
                r ? this.lock.release() : (n = await o);
              }
              await this.emit("end", n);
            }
            continue(t, e) {
              const n = this.waitFor("flip");
              return this.lock.release(e), n;
            }
            async jump(t, e) {
              var n, r, i;
              switch ((await this.iterator.initialize(), t)) {
                case "abort":
                  null === (n = this.iterator) ||
                    void 0 === n ||
                    n.findSplice(e.sender),
                    await e.sender.end("aborted");
                  break;
                case "rerun":
                  await (null === (r = this.iterator) || void 0 === r
                    ? void 0
                    : r.findReset(e.sender)),
                    await this.continue(e.sender, {});
                  break;
                case "fastforward":
                  await (null === (i = this.iterator) || void 0 === i
                    ? void 0
                    : i.fastForward(e.target));
                  break;
                default:
                  console.error(`Unknown jump instruction ${t}`);
              }
            }
            run() {
              const t = new Promise((t) => {
                  this.flipHandlers.push(t);
                }),
                e = this.loop();
              return Promise.race([t, e]);
            }
            get currentLeaf() {
              return (0, p.last)(this.currentStack);
            }
          }
          var z,
            D = function (t, e, n, r, i) {
              if ("m" === r)
                throw new TypeError("Private method is not writable");
              if ("a" === r && !i)
                throw new TypeError(
                  "Private accessor was defined without a setter"
                );
              if ("function" == typeof e ? t !== e || !i : !e.has(t))
                throw new TypeError(
                  "Cannot write private member to an object whose class did not declare it"
                );
              return (
                "a" === r ? i.call(t, n) : i ? (i.value = n) : e.set(t, n), n
              );
            },
            F = function (t, e, n, r) {
              if ("a" === n && !r)
                throw new TypeError(
                  "Private accessor was defined without a getter"
                );
              if ("function" == typeof e ? t !== e || !r : !e.has(t))
                throw new TypeError(
                  "Cannot read private member from an object whose class did not declare it"
                );
              return "m" === n
                ? r
                : "a" === n
                ? r.call(t)
                : r
                ? r.value
                : e.get(t);
            };
          class W {
            constructor(t, e = []) {
              z.set(this, void 0),
                D(this, z, t, "f"),
                (this.plugins = e),
                this.plugins.forEach((t) =>
                  t.handle(F(this, z, "f"), "plugin:add")
                ),
                (this.handle = this.handle.bind(this)),
                F(this, z, "f").on(at.any, this.handle);
            }
            add(t) {
              this.plugins.push(t), t.handle(F(this, z, "f"), "plugin:add");
            }
            remove(t) {
              t.handle(F(this, z, "f"), "plugin:remove"),
                (this.plugins = (0, p.without)(this.plugins, t));
            }
            async handle(t, e) {
              await Promise.all(
                this.plugins.map((n) => n.handle(F(this, z, "f"), t, e))
              );
            }
          }
          z = new WeakMap();
          const U = (t) =>
              Object.assign(
                {},
                ...((t) => {
                  const e = [Object.getPrototypeOf(t)];
                  for (; Object.getPrototypeOf(e[0]); )
                    e.unshift(Object.getPrototypeOf(e[0]));
                  return e;
                })(t).map((t) => {
                  var e;
                  return null === (e = t.constructor.metadata) || void 0 === e
                    ? void 0
                    : e.parsableOptions;
                })
              ),
            B = (t, e, n, r = {}) => {
              if (!n) return t;
              if (!(0, p.isString)(t))
                return (0, p.isArray)(t)
                  ? t.map((t) => B(t, e, n.content, r))
                  : (0, p.isPlainObject)(t)
                  ? Object.fromEntries(
                      Object.entries(t).map(([t, i]) => {
                        var o, a;
                        return [
                          n.keys ? B(t, e, {}, r) : t,
                          B(
                            i,
                            e,
                            (null === (o = n.content) || void 0 === o
                              ? void 0
                              : o[t]) ||
                              (null === (a = n.content) || void 0 === a
                                ? void 0
                                : a["*"]),
                            r
                          ),
                        ];
                      })
                    )
                  : t;
              {
                const i = (0, p.template)(t, { escape: "", evaluate: "" }).call(
                  r,
                  e
                );
                switch (n.type) {
                  case void 0:
                    return i;
                  case "number":
                    return Number(i);
                  case "boolean":
                    return Boolean("false" !== i.trim());
                  default:
                    throw new Error(
                      `Output type ${n.type} unknown, can't convert option`
                    );
                }
              }
            },
            N = function (t, e = {}) {
              const n = Object.create(e);
              let r = !1;
              return [
                new Proxy(e, {
                  get: (t, e) => Reflect.get(n, e),
                  set: (e, i, o) => {
                    if ((Reflect.set(e, i, o), r)) {
                      const e = B(
                        o,
                        {
                          parameters: t.parameters,
                          state: t.state,
                          files: t.files,
                          random: t.random,
                        },
                        U(t)[i],
                        t
                      );
                      e !== o && Reflect.set(n, i, e);
                    }
                    return !0;
                  },
                }),
                function (i = !0) {
                  if (!0 === i) {
                    const r = {
                      parameters: t.parameters,
                      state: t.state,
                      files: t.files,
                      random: t.random,
                    };
                    Object.assign(
                      n,
                      ((t, e, n, r) =>
                        Object.fromEntries(
                          Object.entries(n)
                            .map(([n, i]) => {
                              if (t[n]) {
                                const o = B(t[n], e, i, r);
                                if (o !== t[n]) return [n, o];
                              }
                            })
                            .filter((t) => void 0 !== t)
                        ))(e, r, U(t), r)
                    );
                  }
                  r = i;
                },
              ];
            },
            H = (t, e) =>
              Object.assign(
                {},
                ...t.parents.map((t) => t.options[e] || {}),
                t.options[e]
              );
          var V,
            J,
            Z,
            G = n(353),
            K = n.n(G);
          const Y = new (K())().getBrowser().name;
          parseInt(
            null !==
              (Z =
                null ===
                  (J =
                    null === (V = new (K())().getBrowser().version) ||
                    void 0 === V
                      ? void 0
                      : V.split(".")) || void 0 === J
                  ? void 0
                  : J[0]) && void 0 !== Z
              ? Z
              : "NaN",
            10
          );
          var X,
            Q,
            tt,
            et,
            nt,
            rt = function (t, e, n, r, i) {
              if ("m" === r)
                throw new TypeError("Private method is not writable");
              if ("a" === r && !i)
                throw new TypeError(
                  "Private accessor was defined without a setter"
                );
              if ("function" == typeof e ? t !== e || !i : !e.has(t))
                throw new TypeError(
                  "Cannot write private member to an object whose class did not declare it"
                );
              return (
                "a" === r ? i.call(t, n) : i ? (i.value = n) : e.set(t, n), n
              );
            },
            it = function (t, e, n, r) {
              if ("a" === n && !r)
                throw new TypeError(
                  "Private accessor was defined without a getter"
                );
              if ("function" == typeof e ? t !== e || !r : !e.has(t))
                throw new TypeError(
                  "Cannot read private member from an object whose class did not declare it"
                );
              return "m" === n
                ? r
                : "a" === n
                ? r.call(t)
                : r
                ? r.value
                : e.get(t);
            },
            ot = function (t, e) {
              var n = {};
              for (var r in t)
                Object.prototype.hasOwnProperty.call(t, r) &&
                  e.indexOf(r) < 0 &&
                  (n[r] = t[r]);
              if (
                null != t &&
                "function" == typeof Object.getOwnPropertySymbols
              ) {
                var i = 0;
                for (r = Object.getOwnPropertySymbols(t); i < r.length; i++)
                  e.indexOf(r[i]) < 0 &&
                    Object.prototype.propertyIsEnumerable.call(t, r[i]) &&
                    (n[r[i]] = t[r[i]]);
              }
              return n;
            };
          !(function (t) {
            (t[(t.initialized = 0)] = "initialized"),
              (t[(t.prepared = 1)] = "prepared"),
              (t[(t.running = 2)] = "running"),
              (t[(t.done = 3)] = "done"),
              (t[(t.locked = 4)] = "locked");
          })(tt || (tt = {})),
            (function (t) {
              (t.any = "*"),
                (t.beforePrepare = "before:prepare"),
                (t.prepare = "prepare"),
                (t.run = "run"),
                (t.render = "render"),
                (t.end = "end"),
                (t.lock = "lock");
            })(et || (et = {})),
            (function (t) {
              (t.beforeRun = "before:run"),
                (t.show = "show"),
                (t.endUncontrolled = "end:uncontrolled"),
                (t.reset = "reset");
            })(nt || (nt = {}));
          const at = Object.assign(Object.assign({}, et), nt);
          class st {
            constructor(t = {}) {
              var e;
              X.set(this, void 0), Q.set(this, void 0);
              const { id: n, debug: r } = t;
              (this.id = n),
                (this.status = tt.initialized),
                (this.data = null !== (e = t.data) && void 0 !== e ? e : {}),
                rt(this, X, new I(n, { debug: r, context: this }), "f"),
                (this.on = (...t) => it(this, X, "f").on(...t)),
                (this.off = (...t) => it(this, X, "f").off(...t));
              const i = new W(this, t.plugins);
              this.internals = {
                controller: void 0,
                emitter: it(this, X, "f"),
                plugins: i,
                rawOptions: Object.assign({ parameters: {}, files: {} }, t),
                timestamps: {},
              };
              const [o, a] = N(this, this.internals.rawOptions);
              (this.options = o),
                (this.parameters = ((t, e, n = {}) =>
                  new Proxy(
                    {},
                    Object.assign(
                      {
                        get: (e, n) => Reflect.get(t(), n),
                        set: (t, n, r) => Reflect.set(e, n, r),
                        has: (e, n) => Reflect.has(t(), n),
                        ownKeys: (e) => Reflect.ownKeys(t()),
                        getOwnPropertyDescriptor: (e, n) =>
                          Reflect.getOwnPropertyDescriptor(t(), n),
                      },
                      n
                    )
                  ))(() => this.aggregateParameters, this.options.parameters)),
                (this.internals.armOptions = a);
            }
            log(t) {
              this.options.debug &&
                console.info(`${this.id} (${this.type}): \t ${t}`);
            }
            async prepare(t = !0) {
              var e;
              if (!this.options.tardy || t) {
                this.internals.controller
                  ? this.internals.controller &&
                    !it(this, Q, "f") &&
                    rt(this, Q, this.internals.controller, "f")
                  : (rt(this, Q, new L({ root: this }), "f"),
                    (this.internals.controller = it(this, Q, "f")));
                for (const [t, n] of Object.entries(
                  null !== (e = this.options.hooks) && void 0 !== e ? e : {}
                ))
                  it(this, X, "f").on(t, n);
                await it(this, X, "f").trigger(
                  at.beforePrepare,
                  void 0,
                  it(this, Q, "f").global
                ),
                  this.internals.armOptions(),
                  (this.status = tt.prepared),
                  await it(this, X, "f").trigger(
                    at.prepare,
                    void 0,
                    it(this, Q, "f").global
                  );
              } else this.log("Skipping automated preparation");
            }
            enterContext(t) {
              return (this.internals.context = t), t;
            }
            leaveContext(t) {
              return t;
            }
            async run(t = {}) {
              var { controlled: e = !1 } = t,
                n = ot(t, ["controlled"]);
              if (
                (this.status < tt.prepared
                  ? await this.prepare()
                  : this.status >= tt.done &&
                    (await this._reset(), await this.prepare()),
                !e && it(this, Q, "f").root === this)
              )
                return it(this, Q, "f").run();
              if (
                ((this.status = tt.running), this.log("run"), this.options.skip)
              )
                throw (
                  (this.log("skipping"),
                  (this.data.ended_on = "skipped"),
                  new x("Skipping component"))
                );
              await it(this, X, "f").trigger(
                at.beforeRun,
                n,
                it(this, Q, "f").global
              ),
                await it(this, X, "f").trigger(
                  at.run,
                  n,
                  it(this, Q, "f").global
                );
            }
            async render(t) {
              await it(this, X, "f").trigger(
                at.render,
                t,
                it(this, Q, "f").global
              );
            }
            async show(t) {
              await it(this, X, "f").trigger(
                at.show,
                t,
                it(this, Q, "f").global
              );
            }
            async respond(t, { timestamp: e, action: n }) {
              return (
                (this.data.response = t),
                n && (this.data.response_action = n),
                null !== this.options.correctResponse &&
                  ((this.data.correctResponse = this.options.correctResponse),
                  (this.data.correct = t === this.options.correctResponse)),
                this.end("response", { timestamp: e })
              );
            }
            async end(t, e = {}) {
              var n, r, i;
              if (this.status >= tt.done && !e.controlled)
                throw new Error("Can't end completed component (again)");
              if (
                ((this.status = tt.done),
                (this.data.ended_on =
                  null !== (n = this.data.ended_on) && void 0 !== n ? n : t),
                "timeout" === this.data.ended_on ||
                ("response" === this.data.ended_on && "Safari" === Y)
                  ? (this.data.duration =
                      this.internals.timestamps.end -
                      this.internals.timestamps.render)
                  : (this.data.duration =
                      this.internals.timestamps.end -
                      (this.internals.timestamps.show ||
                        this.internals.timestamps.render)),
                !e.controlled)
              )
                return await it(this, X, "f").emit(at.endUncontrolled, e);
              await it(this, X, "f").trigger(
                at.end,
                e,
                it(this, Q, "f").global
              ),
                (this.internals.logIndex =
                  null === (r = it(this, Q, "f").global.datastore) ||
                  void 0 === r
                    ? void 0
                    : r.set(
                        Object.assign(
                          Object.assign(
                            Object.assign(
                              {
                                sender: this.options.title,
                                sender_type: this.type,
                                sender_id: this.id,
                                timestamp: new Date().toISOString(),
                                time_commit: performance.now(),
                              },
                              this.aggregateParameters
                            ),
                            this.data
                          ),
                          {
                            time_run: this.internals.timestamps.run,
                            time_render: this.internals.timestamps.render,
                            time_show: this.internals.timestamps.show,
                            time_end: this.internals.timestamps.end,
                          }
                        )
                      )),
                null === (i = it(this, Q, "f").global.datastore) ||
                  void 0 === i ||
                  i.commit(),
                this.log(`Ending with reason ${e.reason}`);
            }
            async _reset() {
              var t;
              null === (t = this.internals.iterator) ||
                void 0 === t ||
                t.reset(),
                (this.status = tt.initialized),
                await it(this, X, "f").trigger(at.reset);
            }
            async reset() {
              await it(this, Q, "f").jump("rerun", { sender: this });
            }
            async lock(t = {}) {
              var e;
              const { timestamp: n } = t;
              null === (e = this.global.datastore) ||
                void 0 === e ||
                e.update(this.internals.logIndex, (t) => {
                  var e;
                  return Object.assign(Object.assign({}, t), {
                    time_switch: n,
                    duration:
                      "timeout" === t.ended_on
                        ? n -
                          (null !== (e = t.time_show) && void 0 !== e
                            ? e
                            : t.time_render)
                        : t.duration,
                  });
                }),
                await it(this, X, "f").trigger(
                  at.lock,
                  t,
                  it(this, Q, "f").global
                ),
                delete this.internals.context,
                (this.status = tt.locked);
            }
            get parents() {
              let t = [],
                e = this;
              for (; e.parent; ) (e = e.parent), (t = t.concat(e));
              return t.reverse();
            }
            get progress() {
              return this.status >= tt.done ? 1 : 0;
            }
            get type() {
              return [
                ...this.constructor.metadata.module,
                this.constructor.name,
              ].join(".");
            }
            get aggregateParameters() {
              return H(this, "parameters");
            }
            get files() {
              return H(this, "files");
            }
            get global() {
              return it(this, Q, "f")
                ? it(this, Q, "f").global
                : (console.error(
                    "Trying to retrieve global state but no controller available"
                  ),
                  {});
            }
          }
          (X = new WeakMap()),
            (Q = new WeakMap()),
            (st.metadata = {
              module: ["core"],
              nestedComponents: [],
              parsableOptions: {
                parameters: { type: "object", content: { "*": {} } },
                responses: { keys: {}, content: { "*": "string" } },
                correctResponse: {},
                timeline: {
                  type: "array",
                  content: {
                    type: "object",
                    content: {
                      start: { type: "number" },
                      stop: { type: "number" },
                      "*": "string",
                      payload: {
                        type: "object",
                        content: {
                          gain: { type: "number" },
                          loop: { type: "boolean" },
                          "*": "string",
                        },
                      },
                    },
                  },
                },
                timeout: { type: "number" },
                skip: { type: "boolean" },
              },
            });
          var lt = n(421),
            ut = n.n(lt);
          const ct = (t = Math.random) =>
              "00000000-0000-4000-8000-000000000000".replace(/[08]/g, (e) =>
                (e ^ ((16 * t()) >> (e / 4))).toString(16)
              ),
            ft = (t) => t.reduce((t, e) => t + e, 0),
            ht = (t) => ft(t) / t.length,
            pt = (t) => {
              const e = ht(t);
              return ht(t.map((t) => (t - e) ** 2));
            },
            dt = (t) => Math.sqrt(pt(t));
          var vt,
            mt = function (t, e, n, r, i) {
              if ("m" === r)
                throw new TypeError("Private method is not writable");
              if ("a" === r && !i)
                throw new TypeError(
                  "Private accessor was defined without a setter"
                );
              if ("function" == typeof e ? t !== e || !i : !e.has(t))
                throw new TypeError(
                  "Cannot write private member to an object whose class did not declare it"
                );
              return (
                "a" === r ? i.call(t, n) : i ? (i.value = n) : e.set(t, n), n
              );
            },
            gt = function (t, e, n, r) {
              if ("a" === n && !r)
                throw new TypeError(
                  "Private accessor was defined without a getter"
                );
              if ("function" == typeof e ? t !== e || !r : !e.has(t))
                throw new TypeError(
                  "Cannot read private member from an object whose class did not declare it"
                );
              return "m" === n
                ? r
                : "a" === n
                ? r.call(t)
                : r
                ? r.value
                : e.get(t);
            };
          class Random {
            constructor(t = {}) {
              var e;
              vt.set(this, void 0),
                "alea" === t.algorithm
                  ? mt(
                      this,
                      vt,
                      ut()(
                        null !== (e = t.seed) && void 0 !== e
                          ? e
                          : ((t = 256) => {
                              const e = new Uint8Array(t);
                              return (
                                window.crypto.getRandomValues(e),
                                String.fromCharCode.apply(null, e)
                              );
                            })()
                      ),
                      "f"
                    )
                  : mt(this, vt, Math.random, "f");
            }
            random() {
              return gt(this, vt, "f").call(this);
            }
            range(t, e) {
              const n = void 0 === e ? t : e - t;
              return (
                (void 0 === e ? 0 : t) +
                Math.floor(gt(this, vt, "f").call(this) * n)
              );
            }
            choice(t, e) {
              return void 0 !== e
                ? t[
                    ((t, e = Math.random) => {
                      let n = e() * ft(t);
                      for (let e = 0; e < t.length; e++)
                        if (((n -= t[e]), n < 0)) return e;
                      throw new Error(
                        `Couldn't compute weighted index with weights ${t}`
                      );
                    })(e, gt(this, vt, "f"))
                  ]
                : t[this.range(t.length)];
            }
            sample(t, e = 1, n = !1) {
              return n
                ? Array(e)
                    .fill(0)
                    .map(() => this.choice(t))
                : this.shuffle(t).slice(0, (0, p.clamp)(e, t.length));
            }
            shuffle(t) {
              const e = t.slice();
              let n = e.length;
              for (; 0 !== n; ) {
                const t = this.range(n--);
                [e[n], e[t]] = [e[t], e[n]];
              }
              return e;
            }
            constrainedShuffle(t, e, n = {}, r = 1e4, i = !1) {
              let o;
              if (((u = e), (0, p.isFunction)(u))) o = e;
              else {
                if (
                  !(
                    ("maxRepSeries" in (l = e) &&
                      "number" == typeof l.maxRepSeries) ||
                    ("minRepDistance" in l &&
                      "number" == typeof l.minRepDistance)
                  )
                )
                  throw new Error(`Invalid constraint check definition ${e}`);
                {
                  const t = [];
                  e.maxRepSeries &&
                    t.push(
                      ((a = e.maxRepSeries),
                      (s = n.equality),
                      (t) =>
                        ((t, e = (t, e) => t === e) => {
                          if (0 === t.length) return 0;
                          let n = 1,
                            r = 1;
                          for (let i = 0; i < t.length - 1; i++)
                            e(t[i], t[i + 1])
                              ? (r++, r > n && (n = r))
                              : (r = 1);
                          return n;
                        })(t, s) <= a)
                    ),
                    e.minRepDistance &&
                      t.push(
                        ((t, e) => (n) => {
                          var r;
                          return (
                            (null !==
                              (r = ((t, e = (t) => t) => {
                                if (0 === t.length) return;
                                const n = {};
                                let r = 1 / 0;
                                for (let i = 0; i < t.length; i++) {
                                  const o = e(t[i]);
                                  if (void 0 !== n[o]) {
                                    const t = i - n[o];
                                    r > t && (r = t);
                                  }
                                  n[o] = i;
                                }
                                return r;
                              })(n, e)) && void 0 !== r
                              ? r
                              : 1 / 0) >= t
                          );
                        })(e.minRepDistance, n.hash)
                      ),
                    (o = (e) => t.reduce((t, n) => t && n(e), !0));
                }
              }
              var a, s, l, u;
              let c, f;
              for (f = 0; f < r && ((c = this.shuffle(t)), !o(c)); f++);
              if (f >= r) {
                const t = `constrainedShuffle could not find a matching candidate after ${r} iterations`;
                if (i) throw new Error(t);
                console.warn(t);
              }
              return c;
            }
            shuffleTable(t, e = [], n = !0) {
              const r = e.map((e) => t.map((t) => (0, p.pick)(t, e))),
                i = (0, p.flatten)(e),
                o = t.map((t) => (0, p.omit)(t, i));
              return (0, p.merge)(
                {},
                ...r.map((t) => ({ data: this.shuffle(t) })),
                { data: n ? this.shuffle(o) : o }
              ).data;
            }
            uuid4() {
              return ct(gt(this, vt, "f"));
            }
          }
          vt = new WeakMap();
          var wt = n(782);
          const bt = (t) => t.toString().padStart(2, "0"),
            yt = (t) =>
              t.map((t) => (0, p.omitBy)(t, (t, e) => e.startsWith("_"))),
            _t = (t) => (
              (0, p.isObject)(t) && (t = JSON.stringify(t)),
              "string" == typeof t &&
                ((t = t.replace(/"/g, '""')),
                /[,"\n]+/.test(t) && (t = `"${t}"`),
                /^[=+\-@\r\t]/.test(t) && (t = `'${t}`)),
              t
            );
          var xt,
            jt = function (t, e, n, r, i) {
              if ("m" === r)
                throw new TypeError("Private method is not writable");
              if ("a" === r && !i)
                throw new TypeError(
                  "Private accessor was defined without a setter"
                );
              if ("function" == typeof e ? t !== e || !i : !e.has(t))
                throw new TypeError(
                  "Cannot write private member to an object whose class did not declare it"
                );
              return (
                "a" === r ? i.call(t, n) : i ? (i.value = n) : e.set(t, n), n
              );
            },
            kt = function (t, e, n, r) {
              if ("a" === n && !r)
                throw new TypeError(
                  "Private accessor was defined without a getter"
                );
              if ("function" == typeof e ? t !== e || !r : !e.has(t))
                throw new TypeError(
                  "Cannot read private member from an object whose class did not declare it"
                );
              return "m" === n
                ? r
                : "a" === n
                ? r.call(t)
                : r
                ? r.value
                : e.get(t);
            };
          const Et = ["id", "participant", "participant_id"],
            Ot = [
              ...Et,
              "sender",
              "sender_type",
              "sender_id",
              "timestamp",
              "meta",
            ];
          class St extends I {
            constructor() {
              super(),
                xt.set(this, void 0),
                (this.state = new Proxy(
                  {},
                  {
                    get: (t, e) => this.get(e),
                    set: (t, e, n) => this.set(e, n) || !0,
                    has: (t, e) => Reflect.has(kt(this, xt, "f"), e),
                    ownKeys: () => Reflect.ownKeys(kt(this, xt, "f")),
                    getOwnPropertyDescriptor: (t, e) =>
                      Reflect.getOwnPropertyDescriptor(kt(this, xt, "f"), e),
                  }
                )),
                (this.data = []),
                jt(this, xt, {}, "f"),
                (this.staging = {});
            }
            set(t, e, n = !1) {
              let r = {};
              "object" == typeof t ? (r = t) : (r[t] = e),
                jt(this, xt, Object.assign(kt(this, xt, "f"), r), "f"),
                (this.staging = Object.assign(this.staging, r)),
                n || this.emit("set");
            }
            get(t) {
              return kt(this, xt, "f")[t];
            }
            getAny(t = []) {
              for (const e of t)
                if (Object.keys(kt(this, xt, "f")).includes(e))
                  return kt(this, xt, "f")[e];
            }
            commit() {
              const t = this.data.push((0, p.cloneDeep)(this.staging)) - 1;
              return (this.staging = {}), this.emit("commit"), t;
            }
            update(t, e = (t) => t) {
              (this.data[t] = e(this.data[t] || {})), this.emit("update");
            }
            clear() {
              this.emit("clear"),
                (this.data = []),
                (this.staging = {}),
                jt(this, xt, {}, "f");
            }
            _hydrate({ data: t = [], state: e = {} }) {
              (this.data = t), jt(this, xt, e, "f");
            }
            keys(t = !1, e = Ot) {
              let n = this.data.map((t) => Object.keys(t));
              t && n.push(Object.keys(kt(this, xt, "f")));
              const r = (0, p.flatten)(n);
              r.sort();
              const i = (0, p.sortedUniq)(r).sort(),
                o = (0, p.intersection)(e, i),
                a = (0, p.difference)(i, o);
              return o.concat(a);
            }
            extract(t, e = RegExp(".*")) {
              const n = "string" == typeof e ? RegExp(`^${e}$`) : e;
              return this.data
                .filter((t) => {
                  var e;
                  return n.test(
                    null !== (e = t.sender) && void 0 !== e ? e : ""
                  );
                })
                .map((e) => e[t]);
            }
            select(t, e = RegExp(".*")) {
              let n;
              if (
                ((n =
                  "function" == typeof t
                    ? this.keys().filter(t)
                    : "string" == typeof t
                    ? [t]
                    : t),
                !Array.isArray(n))
              )
                throw new Error(
                  "The input parameter should be either an array of strings, a string, or a filter function."
                );
              const r = "string" == typeof e ? RegExp(`^${e}$`) : e;
              return this.data
                .filter((t) => {
                  var e;
                  return r.test(
                    null !== (e = t.sender) && void 0 !== e ? e : ""
                  );
                })
                .map((t) => (0, p.pick)(t, n));
            }
            get cleanData() {
              return yt(this.data);
            }
            exportJson(t = !0) {
              const e = t ? this.cleanData : this.data;
              return JSON.stringify(e);
            }
            exportJsonL(t = !0) {
              return (t ? this.cleanData : this.data)
                .map((t) => JSON.stringify(t))
                .join("\n");
            }
            exportCsv(t = ",", e = !0) {
              return ((t, e, n = ",") => {
                const r = t.map((t) =>
                  e
                    .map((e) =>
                      Object.hasOwnProperty.call(t, e) ? t[e] : null
                    )
                    .map(_t)
                    .join(n)
                );
                return r.unshift(e.map(_t).join(n)), r.join("\r\n");
              })(
                e ? this.cleanData : this.data,
                this.keys().filter((t) => !e || !t.startsWith("_")),
                t
              );
            }
            exportBlob(t = "csv", e = !0) {
              let n = "";
              if ("csv" === t) n = this.exportCsv(void 0, e);
              else if ("json" === t) n = this.exportJson(e);
              else {
                if ("jsonl" !== t) throw new Error(`Unsupported format ${t}`);
                n = this.exportJsonL(e);
              }
              return new Blob([n], {
                type: {
                  csv: "text/csv",
                  json: "application/json",
                  jsonl: "application/jsonl",
                }[t],
              });
            }
            guessId(t = Et) {
              return this.getAny(t);
            }
            makeFilename(t = "study", e = "csv") {
              const n = this.guessId();
              return (
                t +
                "--" +
                (n ? `${n}--` : "") +
                ((t = new Date()) =>
                  `${t.getFullYear()}-${bt(t.getMonth() + 1)}-${bt(
                    t.getDate()
                  )}--${t.toTimeString().split(" ")[0]}`)() +
                (e ? `.${e}` : "")
              );
            }
            download(t = "csv", e) {
              (0, wt.saveAs)(
                this.exportBlob(t),
                null != e ? e : this.makeFilename("data", t)
              );
            }
            show() {
              console.table(this.data, this.keys());
            }
          }
          xt = new WeakMap();
          const Tt = window.requestIdleCallback
              ? window.requestIdleCallback
              : (t) => window.setTimeout(t),
            Ct = async (t, e, n) => {
              const r = await fetch(t, n);
              if (!r.ok) throw new Error(`Couldn't load audio from ${r.url}`);
              {
                const n = await r.arrayBuffer();
                try {
                  const r = await ((t, e) =>
                    new Promise((n, r) => {
                      t.decodeAudioData(e, n, r);
                    }))(e, n);
                  if (!r)
                    throw new Error(`No data available after decoding ${t}`);
                  return r;
                } catch (e) {
                  throw new Error(`Error decoding audio data from ${t}`);
                }
              }
            },
            At = (t, e, n = {}, r = {}) => {
              let i;
              switch (t) {
                case "oscillator":
                  i = e.createOscillator();
                  break;
                case "bufferSource":
                  i = e.createBufferSource();
                  break;
                default:
                  throw new Error("Can't create node of unknown type");
              }
              return (
                Object.entries(n).forEach(([t, e]) => {
                  e && (i[t] = e);
                }),
                Object.entries(r).forEach(([t, e]) => {
                  e && (i[t].value = e);
                }),
                i
              );
            },
            Pt = {
              gain: 1,
              pan: 0,
              rampUp: 0,
              rampDown: 0,
              panningModel: "equalpower",
            };
          class Rt {
            constructor(t, e = {}, n = Pt) {
              var r;
              (this.timeline = t),
                (this.options = e),
                (this.payload = Object.assign(
                  Object.assign(
                    Object.assign(
                      {},
                      Object.getPrototypeOf(this).constructor.defaultPayload
                    ),
                    n
                  ),
                  { gain: null !== (r = n.gain) && void 0 !== r ? r : 1 }
                )),
                (this.processingChain = []),
                (this.nodeOrder = { gain: void 0 });
            }
            setAudioOrigin() {
              this.audioSyncOrigin = ((t, e = !1) => {
                var n, r;
                return e && "getOutputTimestamp" in t
                  ? Object.assign(Object.assign({}, t.getOutputTimestamp()), {
                      baseLatency:
                        null !== (n = t.baseLatency) && void 0 !== n ? n : 0,
                    })
                  : {
                      contextTime: t.currentTime,
                      performanceTime: performance.now(),
                      baseLatency:
                        null !== (r = t.baseLatency) && void 0 !== r ? r : 0,
                    };
              })(this.timeline.controller.global.audioContext);
            }
            schedule(t) {
              return ((
                t,
                { contextTime: e, performanceTime: n, baseLatency: r }
              ) => (t - n) / 1e3 + e - r)(t, this.audioSyncOrigin);
            }
            prepare() {
              const t = this.timeline.controller.global.audioContext;
              if (
                ("number" == typeof this.payload.gain &&
                  1 !== this.payload.gain) ||
                (this.payload.rampUp && 0 !== this.payload.rampUp) ||
                (this.payload.rampDown && 0 !== this.payload.rampDown)
              ) {
                const e = t.createGain();
                (e.gain.value = this.payload.rampUp
                  ? 1e-10
                  : this.payload.gain),
                  (this.nodeOrder.gain = this.processingChain.push(e) - 1);
              }
              if (this.payload.pan && 0 !== this.payload.pan) {
                const e = t.createPanner();
                (e.panningModel = this.payload.panningModel),
                  e.setPosition(
                    this.payload.pan,
                    0,
                    1 - Math.abs(this.payload.pan)
                  ),
                  this.processingChain.push(e);
              }
              var e, n, r;
              (e = this.source),
                (n = this.processingChain),
                (r = t.destination),
                [e, ...n, r].reduce((t, e) => (t.connect(e), e));
            }
            start(t) {
              const { start: e } = this.options,
                { rampUp: n } = this.payload,
                r = this.timeline.controller.global.audioContext;
              "running" !== r.state &&
                console.warn(
                  `Sending audio to a context in ${r.state} state.`,
                  "This may result in missing sounds —",
                  "Please make sure that users interact with the page",
                  "before using audio."
                ),
                this.setAudioOrigin();
              const i = Math.max(0, this.schedule(t + e));
              if (n) {
                const r = this.processingChain[this.nodeOrder.gain].gain,
                  o = this.schedule(
                    t + e + ("number" == typeof n ? n : parseFloat(n))
                  );
                r.setValueAtTime(1e-10, i),
                  r.exponentialRampToValueAtTime(this.payload.gain, o);
              }
              this.source.start(i);
            }
            afterStart(t) {
              const { stop: e } = this.options,
                { rampDown: n } = this.payload;
              if (e && n) {
                const r = this.processingChain[this.nodeOrder.gain].gain,
                  i = this.schedule(
                    t + e - ("number" == typeof n ? n : parseFloat(n))
                  ),
                  o = this.schedule(t + e);
                r.setValueAtTime(this.payload.gain, i),
                  r.exponentialRampToValueAtTime(1e-4, o);
              }
              if (e) {
                const n = this.schedule(t + e);
                this.source.stop(n);
              }
            }
            end(t, e) {
              const n = e || !this.options.stop,
                r = n ? t : this.timeline.offset + this.options.stop;
              if (n) {
                const e = this.schedule(t);
                this.source.stop(e);
              }
              window.setTimeout(
                () => Tt(() => this.teardown()),
                r - performance.now() + 20
              );
            }
            teardown() {
              this.source.disconnect(),
                (this.source = void 0),
                this.processingChain.forEach((t) => t.disconnect()),
                (this.processingChain = []),
                (this.nodeOrder = {});
            }
          }
          Rt.defaultPayload = Pt;
          class $t extends Rt {
            async prepare() {
              const { cache: t, audioContext: e } =
                  this.timeline.controller.global,
                { src: n, loop: r } = this.payload,
                i = await t.audio.get(n);
              (this.source = At("bufferSource", e, { buffer: i, loop: r })),
                super.prepare();
            }
          }
          $t.defaultPayload = Object.assign(Object.assign({}, Pt), {
            src: "",
            loop: !1,
          });
          class Mt extends Rt {
            prepare() {
              const { type: t, frequency: e, detune: n } = this.payload;
              (this.source = At(
                "oscillator",
                this.timeline.controller.global.audioContext,
                { type: t },
                { frequency: e, detune: n }
              )),
                super.prepare();
            }
          }
          Mt.defaultPayload = Object.assign(Object.assign({}, Pt), {
            type: "sine",
            frequency: 440,
            detune: 0,
          });
          class qt {
            constructor(t) {
              (this.cache = new Map()),
                (this.pending = new Map()),
                (this.cachedFunc = t);
            }
            async get(t) {
              if (this.cache.has(t)) return this.cache.get(t);
              if (this.pending.has(t)) return await this.pending.get(t);
              {
                const e = this.cachedFunc(t);
                this.pending.set(t, e);
                const n = await e;
                return this.cache.set(t, n), this.pending.delete(t), n;
              }
            }
            async getAll(t) {
              return Promise.all(t.map((t) => this.get(t)));
            }
            readSync(t) {
              if (this.cache.has(t)) return this.cache.get(t);
              throw Error(`Key "${t}" not present in cache`);
            }
          }
          const It = async (t) => {
            const e = new Image();
            return (e.src = t), await e.decode(), e;
          };
          class Lt extends qt {
            constructor() {
              super(It), (this.bitmapCache = new WeakMap());
            }
            async get(t) {
              const e = await super.get(t);
              if (window.createImageBitmap)
                try {
                  const t = await createImageBitmap(e);
                  this.bitmapCache.set(e, t);
                } catch (e) {
                  console.log(`Couldn't cache bitmap for ${t}, error ${e}`);
                }
              return e;
            }
            readSync(t) {
              const e = super.readSync(t);
              return [e, this.bitmapCache.get(e)];
            }
          }
          class zt extends qt {
            constructor(t) {
              super((e) => Ct(e, t));
            }
          }
          class Dt extends L {
            constructor({ root: t, el: e }) {
              var n;
              const r = new (
                  null !== (n = window.AudioContext) && void 0 !== n
                    ? n
                    : window.webkitAudioContext
                )(),
                i = {
                  el:
                    null != e
                      ? e
                      : document.querySelector('[data-labjs-section="main"]'),
                };
              console.log({ i });
              if (!i.el) throw new Error("No target element found for study");
              const o = new St();
              super({
                root: t,
                global: {
                  rootEl: i.el,
                  datastore: o,
                  state: o.state,
                  cache: { images: new Lt(), audio: new zt(r) },
                  random: {},
                  audioContext: r,
                },
                initialContext: i,
              });
            }
          }
          n(137);
          const Ft = { Space: " ", Comma: "," },
            Wt = function (
              t,
              { filters: e = [], filterRepeat: n = !0, startTime: r = -1 / 0 }
            ) {
              const i = [];
              if (
                (i.push((t) => t.timeStamp >= r),
                ["keypress", "keydown", "keyup"].includes(t))
              ) {
                const t = e.map((t) => {
                  var e;
                  return null !== (e = Ft[t]) && void 0 !== e ? e : t;
                });
                (t.length > 0 || n) &&
                  i.push(function (e) {
                    return (
                      e instanceof KeyboardEvent &&
                      !(n && e.repeat) &&
                      !(t.length > 0 && !t.includes(e.key))
                    );
                  });
              } else if (["click", "mousedown", "mouseup"].includes(t)) {
                const t = e.map((t) => parseInt(t));
                t.length > 0 &&
                  i.push(function (e) {
                    return e instanceof MouseEvent && t.includes(e.button);
                  });
              }
              return i;
            },
            Ut = ([t, e, n]) => ({
              eventName: t,
              filters: e,
              selector: n,
              moreChecks: [],
            });
          class Bt {
            constructor({ el: t, events: e, context: n, processEvent: r }) {
              (this.el = t || document),
                (this.events = e || {}),
                (this.parsedEvents = []),
                (this.context = n || this),
                (this.processEvent = r || Ut),
                (this.startTime = -1 / 0);
            }
            wrapHandler(t, e) {
              return (
                null !== this.context && (t = t.bind(this.context)),
                (n) =>
                  e.reduce((t, e) => t && e(n, this.context), !0) ? t(n) : null
              );
            }
            prepare() {
              this.parsedEvents = Object.entries(this.events).map(([t, e]) => {
                const {
                  eventName: n,
                  filters: r,
                  selector: i,
                  moreChecks: o = [],
                } = this.processEvent(
                  (function (t) {
                    const e = /^(\w+)(?:\s+(.*))?$/,
                      n = /^(\w+)\(([^()]+)\)(?:\s+(.*))?$/;
                    let r,
                      i = "",
                      o = [],
                      a = null;
                    return (
                      e.test(t)
                        ? ([, i, a] = e.exec(t))
                        : n.test(t)
                        ? (([, i, r, a] = n.exec(t)),
                          (o = r.split(",").map((t) => t.trim())))
                        : console.log("Can't interpret event string ", t),
                      [i, o, null != a ? a : ""]
                    );
                  })(t)
                );
                return [
                  t,
                  n,
                  i,
                  this.wrapHandler(e, [
                    ...Wt(n, { filters: r, startTime: this.startTime }),
                    ...o,
                  ]),
                ];
              });
            }
            attach() {
              this.parsedEvents.forEach(([, t, e, n]) => {
                "" !== e
                  ? Array.from(this.el.querySelectorAll(e)).forEach((e) =>
                      e.addEventListener(t, n)
                    )
                  : document.addEventListener(t, n);
              });
            }
            detach() {
              this.parsedEvents.forEach(([, t, e, n]) => {
                "" !== e
                  ? Array.from(this.el.querySelectorAll(e)).forEach((e) =>
                      e.removeEventListener(t, n)
                    )
                  : document.removeEventListener(t, n);
              });
            }
            teardown() {
              this.parsedEvents = [];
            }
          }
          class Nt {
            constructor(t, e = []) {
              (this.controller = t),
                (this.serializedItems = e),
                (this.offset = void 0);
            }
            async prepare() {
              const t = (0, p.sortBy)(this.serializedItems, [
                (t) => t.start,
                (t) => t.priority,
              ]);
              return (
                (this.items = t
                  .map((t) => {
                    const e = (0, p.omit)(t, "payload");
                    switch (t.type) {
                      case "sound":
                        return new $t(this, e, t.payload);
                      case "oscillator":
                        return new Mt(this, e, t.payload);
                      default:
                        throw new Error(`Unknown item type on ${t}`);
                    }
                  })
                  .filter((t) => void 0 !== t)),
                await Promise.all(this.items.map((t) => t.prepare()))
              );
            }
            start(t) {
              this.items.forEach((e) => e.start(t)),
                (this.offset = t),
                Tt(() => this.afterStart());
            }
            afterStart() {
              this.items.forEach((t) => t.afterStart(this.offset));
            }
            async end(t, e = !1) {
              return Promise.all(this.items.map((n) => n.end(t, e)));
            }
            async teardown() {}
          }
          const Ht = { frameInterval: 16.68 },
            Vt = { overshoot: 1, closest: 1.5, undershoot: 2 };
          class Jt {
            constructor(t, e, ...n) {
              (this.delay = e),
                (this.f = t),
                (this.params = n),
                (this.running = !1),
                (this.timeoutHandle = void 0),
                (this.animationFrameHandle = void 0),
                (this.lastAnimationFrame = void 0),
                (this.targetTime = void 0),
                (this.mode = "closest"),
                (this.tick = this.tick.bind(this));
            }
            tick(t = performance.now(), e = !1) {
              const n = t - this.lastAnimationFrame || Ht.frameInterval;
              n < Ht.frameInterval && (Ht.frameInterval = n);
              (this.targetTime - t) / n <= Vt[this.mode]
                ? this.f(t, ...this.params)
                : this.targetTime - t < 200
                ? ((this.animationFrameHandle = window.requestAnimationFrame(
                    (t) => this.tick(t, !0)
                  )),
                  e && (this.lastAnimationFrame = t))
                : (this.timeoutHandle = window.setTimeout(
                    this.tick,
                    (this.targetTime - t - 100) / 2
                  ));
            }
            run(t = performance.now()) {
              this.running
                ? console.log("Cannot restart previously run timer")
                : ((this.targetTime = this.targetTime || t + this.delay),
                  this.tick(),
                  (this.running = !0));
            }
            cancel() {
              window.clearTimeout(this.timeoutHandle),
                window.cancelAnimationFrame(this.animationFrameHandle);
            }
          }
          var Zt = function (t, e) {
            var n = {};
            for (var r in t)
              Object.prototype.hasOwnProperty.call(t, r) &&
                e.indexOf(r) < 0 &&
                (n[r] = t[r]);
            if (
              null != t &&
              "function" == typeof Object.getOwnPropertySymbols
            ) {
              var i = 0;
              for (r = Object.getOwnPropertySymbols(t); i < r.length; i++)
                e.indexOf(r[i]) < 0 &&
                  Object.prototype.propertyIsEnumerable.call(t, r[i]) &&
                  (n[r[i]] = t[r[i]]);
            }
            return n;
          };
          const Gt = {
            events: {},
            responses: {},
            timeout: void 0,
            el: void 0,
            random: void 0,
            media: { images: [], audio: [] },
            plugins: void 0,
            timeline: [],
            scrollTop: !1,
            datastore: void 0,
          };
          class Component extends st {
            constructor(t = {}) {
              var e;
              super(
                Object.assign(
                  Object.assign(Object.assign({}, (0, p.cloneDeep)(Gt)), t),
                  {
                    media: Object.assign(
                      { images: [], audio: [] },
                      null !== (e = null == t ? void 0 : t.media) &&
                        void 0 !== e
                        ? e
                        : {}
                    ),
                  }
                )
              ),
                (this.internals.domConnection = new Bt({ context: this }));
            }
            async prepare(t = !0) {
              var e, n, r, i, o;
              if (this.options.tardy && !t)
                return void this.log("Skipping automated preparation");
              this.internals.controller ||
                (this.internals.controller = new Dt({
                  root: this,
                  el: this.options.el,
                })),
                (this.state =
                  null === (e = this.internals.controller.global.datastore) ||
                  void 0 === e
                    ? void 0
                    : e.state),
                (this.random = new Random(this.options.random)),
                (this.internals.timeline = new Nt(
                  this.internals.controller,
                  this.options.timeline
                )),
                await super.prepare(t),
                await Promise.all([
                  this.global.cache.images.getAll(
                    null !==
                      (r =
                        null === (n = this.options.media) || void 0 === n
                          ? void 0
                          : n.images) && void 0 !== r
                      ? r
                      : []
                  ),
                  this.global.cache.audio.getAll(
                    null !==
                      (o =
                        null === (i = this.options.media) || void 0 === i
                          ? void 0
                          : i.audio) && void 0 !== o
                      ? o
                      : []
                  ),
                ]),
                await this.internals.timeline.prepare(),
                this.options.timeout &&
                  (this.internals.timeout = new Jt(
                    (t) =>
                      this.end("timeout", { timestamp: t, frameSynced: !0 }),
                    this.options.timeout
                  ));
              const a = (0, p.mapValues)(
                this.options.responses,
                (t, e) => (n) => {
                  n.preventDefault(),
                    this.respond(t, { timestamp: n.timeStamp, action: e });
                }
              );
              (this.internals.domConnection.events = Object.assign(
                Object.assign({}, a),
                this.options.events
              )),
                this.internals.domConnection.prepare();
            }
            async run(t = {}) {
              var e,
                { controlled: n = !1 } = t,
                r = Zt(t, ["controlled"]);
              this.options.scrollTop && n && window.scrollTo(0, 0),
                (this.internals.timestamps.run =
                  null !== (e = null == r ? void 0 : r.timestamp) &&
                  void 0 !== e
                    ? e
                    : performance.now()),
                await super.run(Object.assign({ controlled: n }, r)),
                n &&
                  ((this.internals.domConnection.el =
                    this.internals.context.el),
                  this.internals.domConnection.attach());
            }
            async render({ timestamp: t }) {
              (this.internals.timestamps.render = t),
                await super.render({ timestamp: t }),
                this.internals.timeline.start(t + Ht.frameInterval);
            }
            async show({ timestamp: t }) {
              (this.internals.timestamps.show =
                null != t ? t : performance.now()),
                await super.show({ timestamp: t }),
                this.internals.timeout && this.internals.timeout.run(t);
            }
            async end(t, e = {}) {
              var n, r, i, o;
              if (this.status < tt.running)
                throw new Error(
                  "Trying to end component that's not running yet"
                );
              if (this.status > tt.done)
                throw new Error("Can't end completed component (again)");
              this.internals.domConnection.detach(),
                null === (n = this.internals.timeout) ||
                  void 0 === n ||
                  n.cancel(),
                this.internals.timeline.end(e.timestamp + Ht.frameInterval),
                (this.internals.timestamps.end =
                  null !==
                    (o =
                      null !==
                        (i =
                          null !== (r = this.internals.timestamps.end) &&
                          void 0 !== r
                            ? r
                            : null == e
                            ? void 0
                            : e.timestamp) && void 0 !== i
                        ? i
                        : null == e
                        ? void 0
                        : e.frameTimestamp) && void 0 !== o
                    ? o
                    : performance.now()),
                await super.end(t, e);
            }
            async lock({ timestamp: t }) {
              (this.internals.timestamps.lock = t),
                this.internals.timeline.teardown(),
                this.internals.domConnection.teardown(),
                (this.internals.timeout = void 0),
                await super.lock({ timestamp: t }),
                (this.status = tt.locked);
            }
            get global() {
              return this.internals.controller.global;
            }
            get timer() {
              var t;
              const e = this.internals.timestamps;
              switch (this.status) {
                case tt.running:
                  return performance.now() - (e.show || e.render);
                case tt.done:
                case tt.locked:
                  return (
                    e.end - (null !== (t = e.show) && void 0 !== t ? t : e.run)
                  );
                default:
                  return;
              }
            }
          }
          class Dummy extends Component {
            constructor(t = {}) {
              super(Object.assign(Object.assign({}, t), { skip: !0 }));
            }
          }
          const Kt = (t, e) => t.reduce((t, e) => t[e], e),
            fromObject = (t, e) => Yt((0, p.cloneDeep)(t), e),
            Yt = (t, e) => {
              const r = null != e ? e : window.lab;
              if (void 0 === r)
                throw new Error(
                  "Couldn't find library in global scope, and no root object available"
                );
              const [, ...i] = t.type.split("."),
                o = Kt(i, r);
              return (
                o.metadata.nestedComponents.forEach((e) => {
                  t[e] &&
                    (Array.isArray(t[e])
                      ? (t[e] = t[e].map((t) => fromObject(t, r)))
                      : (0, p.isObject)(t[e]) && (t[e] = fromObject(t[e], r)));
                }),
                t.plugins &&
                  (t.plugins = t.plugins.map((t) => {
                    var e, i;
                    try {
                      const [i, ...o] = (
                        null !== (e = t.path) && void 0 !== e ? e : t.type
                      ).split(".");
                      return new (Kt(
                        o,
                        "global" === i
                          ? null !== n.g && void 0 !== n.g
                            ? n.g
                            : window
                          : r
                      ))(t);
                    } catch (e) {
                      throw new Error(
                        `Couldn't instantiate plugin ${t.type}. Error: ${
                          null !== (i = e.message) && void 0 !== i
                            ? i
                            : "Undefined error"
                        }`
                      );
                    }
                  })),
                new o(t)
              );
            },
            Xt = fromObject;
          var Qt,
            te,
            ee = function (t, e, n, r, i) {
              if ("m" === r)
                throw new TypeError("Private method is not writable");
              if ("a" === r && !i)
                throw new TypeError(
                  "Private accessor was defined without a setter"
                );
              if ("function" == typeof e ? t !== e || !i : !e.has(t))
                throw new TypeError(
                  "Cannot write private member to an object whose class did not declare it"
                );
              return (
                "a" === r ? i.call(t, n) : i ? (i.value = n) : e.set(t, n), n
              );
            },
            ne = function (t, e, n, r) {
              if ("a" === n && !r)
                throw new TypeError(
                  "Private accessor was defined without a getter"
                );
              if ("function" == typeof e ? t !== e || !r : !e.has(t))
                throw new TypeError(
                  "Cannot read private member from an object whose class did not declare it"
                );
              return "m" === n
                ? r
                : "a" === n
                ? r.call(t)
                : r
                ? r.value
                : e.get(t);
            };
          class re {
            constructor(t) {
              Qt.set(this, void 0),
                te.set(this, void 0),
                ee(this, Qt, t, "f"),
                ee(this, te, !0, "f");
            }
            flush() {
              ee(this, te, !1, "f");
            }
            [((Qt = new WeakMap()), (te = new WeakMap()), Symbol.iterator)]() {
              let t = ne(this, Qt, "f")[Symbol.iterator]();
              return {
                next: () =>
                  ne(this, te, "f") ? t.next() : { done: !0, value: null },
                peek: () =>
                  Array.from(ne(this, Qt, "f")).map((t) => [
                    t.id,
                    t.options.title,
                    t.type,
                  ]),
                reset: () => {
                  (t = ne(this, Qt, "f")[Symbol.iterator]()),
                    ee(this, te, !0, "f");
                },
              };
            }
            static empty() {
              return new re([]);
            }
            static emptyIterator() {
              return re.empty()[Symbol.iterator]();
            }
          }
          const ie = function (t, e) {
              return (
                t.forEach((t) => {
                  (t.parent = e),
                    (t.internals.controller = e.internals.controller);
                }),
                t.forEach((t, n) => {
                  null == e.id
                    ? (t.id = String(n))
                    : (t.id = [e.id, n].join("_"));
                }),
                Promise.all(t.map((t) => t.prepare(!1)))
              );
            },
            oe = function (t) {
              return (function (t, e) {
                if (t.length !== e.length)
                  throw new Error(
                    "Values and weights arrays must be of equal length"
                  );
                const n = t.reduce((t, n, r) => t + n * e[r], 0),
                  r = e.reduce((t, e) => t + e, 0);
                return n / r;
              })(
                t.map((t) => t.progress),
                t.map((t) => {
                  var e;
                  return null !== (e = t.options.progressWeight) && void 0 !== e
                    ? e
                    : 1;
                })
              );
            },
            ae = { content: [], shuffle: !1, indexParameter: void 0 };
          class Sequence extends Component {
            constructor(t = {}) {
              super(Object.assign(Object.assign({}, (0, p.cloneDeep)(ae)), t)),
                (this.internals.iterator = re.emptyIterator());
            }
            async onPrepare() {
              this.options.shuffle &&
                (this.options.content = this.random.shuffle(
                  this.options.content
                )),
                void 0 !== this.options.indexParameter &&
                  this.options.content.forEach(
                    (t, e) =>
                      (t.options.parameters[this.options.indexParameter] = e)
                  ),
                (this.internals._iterable = new re(this.options.content)),
                (this.internals.iterator =
                  this.internals._iterable[Symbol.iterator]()),
                await ie(this.options.content, this);
            }
            async end(t, e = {}) {
              return this.internals._iterable.flush(), super.end(t, e);
            }
            get progress() {
              return this.status === tt.done ? 1 : oe(this.options.content);
            }
          }
          Sequence.metadata = {
            module: ["flow"],
            nestedComponents: ["content"],
            parsableOptions: { shuffle: { type: "boolean" } },
          };
          const se = (t, e = {}) => {
            const n = t.constructor.metadata.nestedComponents || [],
              r = Object.assign(
                Object.assign(
                  {},
                  (0, p.cloneDeepWith)(t.internals.rawOptions, (e, r, i) => {
                    if ("datastore" === r) return null;
                    if (i === t.internals.rawOptions && n.includes(r)) {
                      if (Array.isArray(e))
                        return e.map((t) => (t instanceof st ? se(t) : t));
                      if (e instanceof st) return se(e);
                    }
                  })
                ),
                e
              );
            return new t.constructor(r);
          };
          const le = {
            templateParameters: [],
            sample: { mode: "sequential" },
            shuffleUngrouped: !1,
          };
          class Loop extends Sequence {
            constructor(t = {}) {
              super(Object.assign(Object.assign({}, (0, p.cloneDeep)(le)), t));
            }
            onPrepare() {
              let t = [];
              if (
                Array.isArray(this.options.templateParameters) &&
                this.options.templateParameters.length > 0
              ) {
                const e =
                  Array.isArray(this.options.shuffleGroups) &&
                  this.options.shuffleGroups.length
                    ? this.random.shuffleTable(
                        this.options.templateParameters,
                        this.options.shuffleGroups,
                        this.options.shuffleUngrouped
                      )
                    : this.options.templateParameters;
                t = (function (t, e, n, r = "draw-shuffle") {
                  if (!(Array.isArray(e) && e.length > 0))
                    throw new Error(
                      "Can't sample: Empty input, or not an array"
                    );
                  const i = n || e.length,
                    o = Math.floor(i / e.length),
                    a = i % e.length;
                  switch (r) {
                    case "sequential":
                      return [
                        ...(0, p.range)(o).reduce((t) => t.concat(e), []),
                        ...e.slice(0, a),
                      ];
                    case "draw":
                    case "draw-shuffle":
                      const n = [
                        ...(0, p.range)(o).reduce(
                          (n) => n.concat(t.shuffle(e)),
                          []
                        ),
                        ...t.sample(e, a, !1),
                      ];
                      return "draw-shuffle" === r && i > e.length
                        ? t.shuffle(n)
                        : n;
                    case "draw-replace":
                      return t.sample(e, i, !0);
                    default:
                      throw new Error("Unknown sample mode, please specify");
                  }
                })(
                  this.random,
                  e,
                  this.options.sample.n,
                  this.options.sample.mode
                );
              } else
                console.warn(
                  "Empty or invalid parameter set for loop, no content generated"
                );
              const e = this.options.template;
              return (
                e instanceof Component
                  ? (this.options.content = t.map((t) => {
                      const n = se(e);
                      return (
                        (n.options.parameters = Object.assign(
                          Object.assign({}, n.options.parameters),
                          t
                        )),
                        n
                      );
                    }))
                  : Array.isArray(e)
                  ? (this.options.content = t.flatMap((t) =>
                      e.map((e) => {
                        const n = se(e);
                        return (
                          (n.options.parameters = Object.assign(
                            Object.assign({}, e.options.parameters),
                            t
                          )),
                          n
                        );
                      })
                    ))
                  : (0, p.isFunction)(e)
                  ? (this.options.content = t.map((t, n) => e(t, n, this)))
                  : console.warn(
                      "Missing or invalid template in loop, no content generated"
                    ),
                super.onPrepare()
              );
            }
          }
          Loop.metadata = {
            module: ["flow"],
            nestedComponents: ["template"],
            parsableOptions: {
              templateParameters: {
                type: "array",
                content: { content: { "*": {} } },
              },
              sample: {
                type: "object",
                content: {
                  n: { type: "number" },
                  replace: { type: "boolean" },
                  mode: {},
                },
              },
            },
          };
          const ue = { content: "" };
          class Screen extends Component {
            constructor(t = {}) {
              super(Object.assign(Object.assign({}, (0, p.cloneDeep)(ue)), t));
            }
            onRun() {
              this.internals.context.el.innerHTML = this.options.content;
            }
          }
          Screen.metadata = {
            module: ["html"],
            nestedComponents: [],
            parsableOptions: { content: {} },
          };
          const ce = { validator: () => !0 };
          class Form extends Screen {
            constructor(t = {}) {
              super(Object.assign(Object.assign({}, (0, p.cloneDeep)(ce)), t)),
                (this.options.events['click button[type="submit"]'] = (t) => {
                  if (t.target.getAttribute("form")) {
                    const e = this.internals.context.el.querySelector(
                      `form#${t.target.getAttribute("form")}`
                    );
                    if (e) {
                      t.preventDefault(), t.stopPropagation();
                      const n = document.createElement("input");
                      return (
                        (n.type = "submit"),
                        (n.style.display = "none"),
                        e.appendChild(n),
                        n.click(),
                        e.removeChild(n),
                        !1
                      );
                    }
                  }
                  return !0;
                }),
                (this.options.events["submit form"] = (t) => this.submit(t));
            }
            onRun() {
              super.onRun();
              const t = this.internals.context.el.querySelector("[autofocus]");
              t && t.focus();
            }
            submit(t) {
              return (
                t && t.preventDefault && t.preventDefault(),
                this.validate()
                  ? (Object.assign(this.data, this.serialize()),
                    this.end("form submission"))
                  : Array.from(
                      this.internals.context.el.querySelectorAll("form")
                    ).forEach((t) =>
                      t.setAttribute("data-labjs-validated", "")
                    ),
                !1
              );
            }
            serialize() {
              return (function (t) {
                const e = {};
                return (
                  Array.from(t).forEach((t) => {
                    Array.from(t.elements).forEach((t) => {
                      if (t instanceof HTMLInputElement)
                        switch (t.type) {
                          case "checkbox":
                            e[t.name] = t.checked;
                            break;
                          case "radio":
                            t.checked && (e[t.name] = t.value);
                            break;
                          default:
                            e[t.name] = t.value;
                        }
                      else if (t instanceof HTMLTextAreaElement)
                        e[t.name] = t.value;
                      else if (t instanceof HTMLSelectElement)
                        switch (t.type) {
                          case "select-one":
                            e[t.name] = t.value;
                            break;
                          case "select-multiple":
                            e[t.name] = Array.from(t.options)
                              .filter((t) => t.selected)
                              .map((t) => t.value);
                        }
                    });
                  }),
                  e
                );
              })(this.internals.context.el.querySelectorAll("form"));
            }
            validate() {
              const t = this.internals.context.el.querySelectorAll("form");
              return (
                this.options.validator(this.serialize()) &&
                Array.from(t).every((t) => t.checkValidity())
              );
            }
          }
          Form.metadata = { module: ["html"], nestedComponents: [] };
          const fe = (t) => document.createRange().createContextualFragment(t),
            he = { content: void 0, context: "", contextSelector: "" };
          class Frame extends Component {
            constructor(t = {}) {
              super(Object.assign(Object.assign({}, (0, p.cloneDeep)(he)), t)),
                (this.internals.iterator = re.emptyIterator());
            }
            async onPrepare() {
              const t = Array.isArray(this.options.content)
                ? this.options.content
                : [this.options.content];
              await ie(t, this),
                (this.internals.iterator = new re(t)[Symbol.iterator]());
            }
            enterContext(t) {
              const e = super.enterContext(t);
              return (
                (this.internals.outerEl = e.el),
                (this.internals.parsedContext = fe(this.options.context)),
                (this.internals.innerEl =
                  this.internals.parsedContext.querySelector(
                    this.options.contextSelector
                  )),
                Object.assign(Object.assign({}, e), {
                  el: this.internals.innerEl,
                })
              );
            }
            leaveContext(t) {
              const e = Object.assign(Object.assign({}, t), {
                el: this.internals.outerEl,
              });
              return (
                delete this.internals.outerEl,
                delete this.internals.innerEl,
                super.leaveContext(e)
              );
            }
            async onRun() {
              const t = this.internals.outerEl;
              (t.innerHTML = ""), t.appendChild(this.internals.parsedContext);
            }
            get progress() {
              var t, e;
              return null !==
                (e =
                  null === (t = this.options.content) || void 0 === t
                    ? void 0
                    : t.progress) && void 0 !== e
                ? e
                : 0;
            }
          }
          Frame.metadata = {
            module: ["html"],
            nestedComponents: ["content"],
            parsableOptions: { context: {} },
          };
          var pe,
            de,
            ve = (function () {
              function t(t, e) {
                for (var n = 0; n < e.length; n++) {
                  var r = e[n];
                  (r.enumerable = r.enumerable || !1),
                    (r.configurable = !0),
                    "value" in r && (r.writable = !0),
                    Object.defineProperty(t, r.key, r);
                }
              }
              return function (e, n, r) {
                return n && t(e.prototype, n), r && t(e, r), e;
              };
            })(),
            me =
              ((pe = ["", ""]),
              (de = ["", ""]),
              Object.freeze(
                Object.defineProperties(pe, {
                  raw: { value: Object.freeze(de) },
                })
              ));
          function ge(t, e) {
            if (!(t instanceof e))
              throw new TypeError("Cannot call a class as a function");
          }
          var we = (function () {
            function t() {
              for (
                var e = this, n = arguments.length, r = Array(n), i = 0;
                i < n;
                i++
              )
                r[i] = arguments[i];
              return (
                ge(this, t),
                (this.tag = function (t) {
                  for (
                    var n = arguments.length,
                      r = Array(n > 1 ? n - 1 : 0),
                      i = 1;
                    i < n;
                    i++
                  )
                    r[i - 1] = arguments[i];
                  return "function" == typeof t
                    ? e.interimTag.bind(e, t)
                    : "string" == typeof t
                    ? e.transformEndResult(t)
                    : ((t = t.map(e.transformString.bind(e))),
                      e.transformEndResult(
                        t.reduce(e.processSubstitutions.bind(e, r))
                      ));
                }),
                r.length > 0 && Array.isArray(r[0]) && (r = r[0]),
                (this.transformers = r.map(function (t) {
                  return "function" == typeof t ? t() : t;
                })),
                this.tag
              );
            }
            return (
              ve(t, [
                {
                  key: "interimTag",
                  value: function (t, e) {
                    for (
                      var n = arguments.length,
                        r = Array(n > 2 ? n - 2 : 0),
                        i = 2;
                      i < n;
                      i++
                    )
                      r[i - 2] = arguments[i];
                    return this.tag(me, t.apply(void 0, [e].concat(r)));
                  },
                },
                {
                  key: "processSubstitutions",
                  value: function (t, e, n) {
                    var r = this.transformSubstitution(t.shift(), e);
                    return "".concat(e, r, n);
                  },
                },
                {
                  key: "transformString",
                  value: function (t) {
                    return this.transformers.reduce(function (t, e) {
                      return e.onString ? e.onString(t) : t;
                    }, t);
                  },
                },
                {
                  key: "transformSubstitution",
                  value: function (t, e) {
                    return this.transformers.reduce(function (t, n) {
                      return n.onSubstitution ? n.onSubstitution(t, e) : t;
                    }, t);
                  },
                },
                {
                  key: "transformEndResult",
                  value: function (t) {
                    return this.transformers.reduce(function (t, e) {
                      return e.onEndResult ? e.onEndResult(t) : t;
                    }, t);
                  },
                },
              ]),
              t
            );
          })();
          const be = we;
          var ye = { separator: "", conjunction: "", serial: !1 };
          const _e = function () {
            var t =
              arguments.length > 0 && void 0 !== arguments[0]
                ? arguments[0]
                : ye;
            return {
              onSubstitution: function (e, n) {
                if (Array.isArray(e)) {
                  var r = e.length,
                    i = t.separator,
                    o = t.conjunction,
                    a = t.serial,
                    s = n.match(/(\n?[^\S\n]+)$/);
                  if (
                    ((e = s ? e.join(i + s[1]) : e.join(i + " ")), o && r > 1)
                  ) {
                    var l = e.lastIndexOf(i);
                    e = e.slice(0, l) + (a ? i : "") + " " + o + e.slice(l + 1);
                  }
                }
                return e;
              },
            };
          };
          function xe(t) {
            if (Array.isArray(t)) {
              for (var e = 0, n = Array(t.length); e < t.length; e++)
                n[e] = t[e];
              return n;
            }
            return Array.from(t);
          }
          const je = function () {
            var t =
              arguments.length > 0 && void 0 !== arguments[0]
                ? arguments[0]
                : "initial";
            return {
              onEndResult: function (e) {
                if ("initial" === t) {
                  var n = e.match(/^[^\S\n]*(?=\S)/gm),
                    r =
                      n &&
                      Math.min.apply(
                        Math,
                        xe(
                          n.map(function (t) {
                            return t.length;
                          })
                        )
                      );
                  if (r) {
                    var i = new RegExp("^.{" + r + "}", "gm");
                    return e.replace(i, "");
                  }
                  return e;
                }
                if ("all" === t) return e.replace(/^[^\S\n]+/gm, "");
                throw new Error("Unknown type: " + t);
              },
            };
          };
          const ke = function () {
            var t =
              arguments.length > 0 && void 0 !== arguments[0]
                ? arguments[0]
                : "";
            return {
              onEndResult: function (e) {
                if ("" === t) return e.trim();
                if ("start" === (t = t.toLowerCase()) || "left" === t)
                  return e.replace(/^\s*/, "");
                if ("end" === t || "right" === t) return e.replace(/\s*$/, "");
                throw new Error("Side not supported: " + t);
              },
            };
          };
          new be(_e({ separator: "," }), je, ke);
          new be(_e({ separator: ",", conjunction: "and" }), je, ke);
          new be(_e({ separator: ",", conjunction: "or" }), je, ke);
          const Ee = function (t) {
            return {
              onSubstitution: function (e, n) {
                if (null == t || "string" != typeof t)
                  throw new Error(
                    "You need to specify a string character to split by."
                  );
                return (
                  "string" == typeof e && e.includes(t) && (e = e.split(t)), e
                );
              },
            };
          };
          var Oe = function (t) {
            return null != t && !Number.isNaN(t) && "boolean" != typeof t;
          };
          const Se = function () {
            return {
              onSubstitution: function (t) {
                return Array.isArray(t) ? t.filter(Oe) : Oe(t) ? t : "";
              },
            };
          };
          new be(Ee("\n"), Se, _e, je, ke);
          const Te = function (t, e) {
            return {
              onSubstitution: function (n, r) {
                if (null == t || null == e)
                  throw new Error(
                    "replaceSubstitutionTransformer requires at least 2 arguments."
                  );
                return null == n ? n : n.toString().replace(t, e);
              },
            };
          };
          new be(
            Ee("\n"),
            _e,
            je,
            ke,
            Te(/&/g, "&amp;"),
            Te(/</g, "&lt;"),
            Te(/>/g, "&gt;"),
            Te(/"/g, "&quot;"),
            Te(/'/g, "&#x27;"),
            Te(/`/g, "&#x60;")
          );
          const Ce = function (t, e) {
            return {
              onEndResult: function (n) {
                if (null == t || null == e)
                  throw new Error(
                    "replaceResultTransformer requires at least 2 arguments."
                  );
                return n.replace(t, e);
              },
            };
          };
          new be(Ce(/(?:\n(?:\s*))+/g, " "), ke);
          new be(Ce(/(?:\n\s*)/g, ""), ke);
          new be(_e({ separator: "," }), Ce(/(?:\s+)/g, " "), ke);
          new be(
            _e({ separator: ",", conjunction: "or" }),
            Ce(/(?:\s+)/g, " "),
            ke
          );
          new be(
            _e({ separator: ",", conjunction: "and" }),
            Ce(/(?:\s+)/g, " "),
            ke
          );
          new be(_e, je, ke);
          new be(_e, Ce(/(?:\s+)/g, " "), ke);
          const Ae = new be(je, ke);
          new be(je("all"), ke);
          const Pe = (t = {}) =>
              Object.entries(t)
                .map(([t, e]) => `${t}="${e}"`)
                .join(" "),
            Re = (
              { label: t = "", coding: e = "" },
              { name: n = "", required: r = !0 },
              i
            ) =>
              "radio" === i
                ? Ae`
      <tr>
        <td>
          <input
            type="radio"
            name="${n}"
            value="${e}"
            id="${n}-${e}"
            ${r ? "required" : ""}
          >
        </td>
        <td>
          <label for="${n}-${e}">
            ${t}
          </label
        </td>
      </tr>
    `
                : "checkbox" === i
                ? Ae`
      <tr>
        <td>
          <input
            type="checkbox"
            name="${n}-${e}"
            id="${n}-${e}"
            ${r ? "required" : ""}
          >
        </td>
        <td>
          <label for="${n}-${e}">
            ${t}
          </label
        </td>
      </tr>
    `
                : void 0,
            $e = (t, e) => {
              const n = e.rng || new Random(),
                r = (t = [], e = !1) => (e ? n.shuffle(t) : t);
              return Ae`
    <main
      class="
        content-horizontal-center
        content-vertical-center
      "
    >
      <div class="w-${e.width || "m"} text-left">
        <form id="page-form" style="display: block;" autocomplete="off">
          ${t
            .map((t) => Me(t, Object.assign({ shuffleMeMaybe: r }, e)))
            .join("\n")}
        </form>
      </div>
    </main>
    ${(({
      submitButtonPosition: t = "right",
      submitButtonText: e = "Continue →",
    }) =>
      "hidden" !== t
        ? Ae`
      <footer
        class="
          content-horizontal-${t}
          content-vertical-center
        "
      >
        <button type="submit" form="page-form">
          ${e}
        </button>
      </footer>
    `
        : "")(e)}
  `;
            },
            Me = (t, { shuffleMeMaybe: e }) => {
              switch (t.type) {
                case "text":
                  return Ae`
        <div class="page-item page-item-text">
          <h3>${t.title || ""}</h3>
          ${t.content || ""}
        </div>
      `;
                case "image":
                  return Ae`
        <div class="page-item page-item-image">
          <img
            src="${t.src}"
            style="${t.width && "max-width: " + t.width} ${
                    t.height && "max-height: " + t.height
                  }"
          >
        </div>
      `;
                case "html":
                  return Ae`
        <div class="page-item page-item-html">
          ${t.content || ""}
        </div>
      `;
                case "divider":
                  return Ae`
        <div class="page-item page-item-divider">
          <hr>
        </div>
      `;
                case "input":
                  return Ae`
        <div class="page-item page-item-input" id="page-item-${t.name}">
          <p class="font-weight-bold" style="margin: 1rem 0 0.25rem">
            ${t.label || ""}
          </p>
          <p class="small text-muted hide-if-empty" style="margin: 0.25rem 0">
            ${t.help || ""}
          </p>
          <input name="${t.name}"
            ${t.required ? "required" : ""}
            class="w-100"
            ${Pe(t.attributes)}
          >
        </div>
      `;
                case "textarea":
                  return Ae`
        <div class="page-item page-item-textarea" id="page-item-${t.name}">
          <p class="font-weight-bold" style="margin: 1rem 0 0.25rem">
            ${t.label || ""}
          </p>
          <p class="small text-muted hide-if-empty" style="margin: 0.25rem 0">
            ${t.help || ""}
          </p>
          <textarea name="${t.name}"
            ${t.required ? "required" : ""}
            class="w-100"
            rows="3"
          ></textarea>
        </div>
      `;
                case "radio":
                  return Ae`
        <div class="page-item page-item-radio" id="page-item-${t.name}">
          <p class="font-weight-bold" style="margin: 1rem 0 0.25rem">
            ${t.label || ""}
          </p>
          <p class="small text-muted hide-if-empty" style="margin: 0.25rem 0">
            ${t.help || ""}
          </p>
          <table class="table-plain page-item-table">
            <colgroup>
              <col style="width: 7.5%">
              <col style="width: 92.5%">
            </colgroup>
            <tbody>
              ${e(t.options || [], t.shuffle)
                .map((e) => Re(e, t, "radio"))
                .join("\n")}
            </tbody>
          </table>
        </div>
      `;
                case "checkbox":
                  return Ae`
        <div class="page-item page-item-checkbox" id="page-item-${t.name}">
          <p class="font-weight-bold" style="margin: 1rem 0 0.25rem">
            ${t.label || ""}
          </p>
          <p class="small text-muted hide-if-empty" style="margin: 0.25rem 0">
            ${t.help || ""}
          </p>
          <table class="table-plain page-item-table">
            <colgroup>
              <col style="width: 7.5%">
              <col style="width: 92.5%">
            </colgroup>
            <tbody>
              ${e(t.options || [], t.shuffle)
                .map((e) => Re(e, t, "checkbox"))
                .join("\n")}
            </tbody>
          </table>
        </div>
      `;
                case "slider":
                  return Ae`
        <div class="page-item page-item-range" id="page-item-${t.name}">
          <p class="font-weight-bold" style="margin: 1rem 0 0.25rem">
            ${t.label || ""}
          </p>
          <p class="small text-muted hide-if-empty" style="margin: 0.25rem 0">
            ${t.help || ""}
          </p>
          <input name="${t.name}" type="range"
            ${t.required ? "required" : ""}
            class="w-100"
            ${Pe(t.attributes)}
          >
        </div>
      `;
                case "likert":
                  return Ae`
        <div class="page-item page-item-likert" id="page-item-${t.name}">
          <p class="font-weight-bold" style="margin: 1rem 0 0.25rem">
            ${t.label || ""}
          </p>
          <p class="small text-muted hide-if-empty" style="margin: 0.25rem 0">
            ${t.help || ""}
          </p>
          <table class="page-item-table">
            <colgroup>
              <col style="width: 40%">
              ${(0, p.range)(t.width)
                .map(() => `<col style="width: ${60 / t.width}%">`)
                .join("\n")}
            </colgroup>
            ${(({ width: t, anchors: e }) =>
              e.every((t) => !t)
                ? ""
                : Ae`
      <thead class="sticky-top">
        <th class="sticky-top"></th>
        ${(0, p.range)(t)
          .map(
            (t) => Ae`
            <th class="sticky-top text-center small">
              ${e[t] || ""}
            </th>
          `
          )
          .join("\n")}
      </thead>
    `)(t)}
            <tbody>
              ${e(t.items || [], t.shuffle)
                .map((e) =>
                  ((
                    { label: t, coding: e },
                    { name: n, width: r, required: i = !0 }
                  ) => Ae`
    <tr>
      <td class="small" style="padding-left: 0">
        ${t}
      </td>
      ${(0, p.range)(1, Number(r) + 1)
        .map(
          (t) => Ae`
          <td class="text-center">
            <label style="height: 100%; padding: 10px 0">
              <input type="radio"
                name="${n}-${e}" value="${t}"
                ${i ? "required" : ""}
              >
            </label>
          </td>
        `
        )
        .join("\n")}
    </tr>
  `)(e, t)
                )
                .join("\n")}
            </tbody>
          </table>
        </div>
      `;
                default:
                  console.error("Unknown page item type");
              }
            },
            qe = {
              items: [],
              submitButtonText: "Continue →",
              submitButtonPosition: "right",
              width: "m",
              scrollTop: !0,
            };
          class Page extends Form {
            constructor(t = {}) {
              super(Object.assign(Object.assign({}, (0, p.cloneDeep)(qe)), t));
            }
            onPrepare() {
              (this.options.content = $e(this.options.items, {
                submitButtonText: this.options.submitButtonText,
                submitButtonPosition: this.options.submitButtonPosition,
                width: this.options.width,
                rng: this.random,
              })),
                this.options.items
                  .filter((t) => "image" === t.type && void 0 !== t.src)
                  .forEach((t) => this.options.media.images.push(t.src));
            }
          }
          Page.metadata = {
            module: ["html"],
            nestedComponents: [],
            parsableOptions: {
              items: {
                type: "array",
                content: {
                  type: "object",
                  content: {
                    "*": "string",
                    attributes: { type: "object", content: { "*": "string" } },
                    options: {
                      type: "array",
                      content: { type: "object", content: { "*": "string" } },
                    },
                    items: {
                      type: "array",
                      content: { type: "object", content: { "*": "string" } },
                    },
                  },
                },
              },
            },
          };
          const Ie = ([t, e], [n, r]) => Math.sqrt((t - n) ** 2 + (e - r) ** 2),
            Le = (t) => Math.PI * (t / 180),
            ze = (t, e, n = 0, r = [0, 0], i = 0) => {
              const o = Le(n * (360 / t) + i);
              return [e * Math.sin(o) + r[0], e * Math.cos(o) + r[1]];
            },
            De = (t, e, n = [0, 0], r = 0) =>
              (0, p.range)(t).map((i) => ze(t, e, i, n, r)),
            Fe =
              (t = [], e) =>
              (n, r, i) => {
                const o =
                  i instanceof CanvasRenderingContext2D
                    ? i
                    : r.getContext("2d");
                if (!o) throw new Error("Couldn't access 2d rendering context");
                t.forEach((t) =>
                  ((t, e, n = {}) => {
                    switch (
                      (t.save(),
                      t.beginPath(),
                      t.translate(e.left, e.top),
                      t.rotate(Le(e.angle)),
                      e.type)
                    ) {
                      case "line":
                        t.moveTo(-e.width / 2, 0), t.lineTo(+e.width / 2, 0);
                        break;
                      case "rect":
                        t.rect(-e.width / 2, -e.height / 2, e.width, e.height);
                        break;
                      case "triangle":
                        t.moveTo(-e.width / 2, e.height / 2),
                          t.lineTo(0, -e.height / 2),
                          t.lineTo(e.width / 2, e.height / 2),
                          t.closePath();
                        break;
                      case "circle":
                        t.arc(0, 0, e.width / 2, 0, Le(360));
                        break;
                      case "ellipse":
                        t.ellipse(
                          0,
                          0,
                          e.width / 2,
                          e.height / 2,
                          0,
                          0,
                          Le(360)
                        );
                        break;
                      case "text":
                      case "i-text":
                        (t.font = `${e.fontStyle || "normal"} ${
                          e.fontWeight || "normal"
                        } ${e.fontSize || 32}px ${
                          e.fontFamily || "sans-serif"
                        }`),
                          (t.textAlign = e.textAlign || "center"),
                          (t.textBaseline = "middle");
                        break;
                      case "image":
                        const [r, i] = n.images.readSync(e.src),
                          o =
                            "width" === e.autoScale
                              ? r.naturalWidth * (e.height / r.naturalHeight)
                              : e.width,
                          a =
                            "height" === e.autoScale
                              ? r.naturalHeight * (e.width / r.naturalWidth)
                              : e.height;
                        t.drawImage(i || r, -o / 2, -a / 2, o, a);
                        break;
                      default:
                        throw new Error("Unknown content type");
                    }
                    e.fill &&
                      ((t.fillStyle = e.fill),
                      "i-text" !== e.type && "text" !== e.type
                        ? t.fill()
                        : e.text.split("\n").forEach((n, r, i) => {
                            t.fillText(
                              n,
                              0,
                              (r - 0.5 * (i.length - 1)) *
                                (e.fontSize || 32) *
                                (e.lineHeight || 1.16)
                            );
                          })),
                      e.stroke &&
                        e.strokeWidth &&
                        ((t.strokeStyle = e.stroke),
                        (t.lineWidth = e.strokeWidth || 1),
                        "i-text" !== e.type && "text" !== e.type
                          ? t.stroke()
                          : e.text.split("\n").forEach((n, r, i) => {
                              t.strokeText(
                                n,
                                0,
                                (r - 0.5 * (i.length - 1)) *
                                  (e.fontSize || 32) *
                                  (e.lineHeight || 1.16)
                              );
                            })),
                      t.restore();
                  })(o, t, e)
                );
              },
            We = new window.DOMMatrixReadOnly(),
            Ue = (t, e) => {
              const n = new Path2D();
              if ("aoi" === e.type)
                n.rect(-e.width / 2, -e.height / 2, e.width, e.height);
              else console.error("Content type not yet implemented");
              const r = new Path2D();
              return (
                r.addPath(n, We.translate(e.left, e.top).rotate(e.angle)), r
              );
            },
            Be = (t, e, n = {}) => {
              const r = Object.assign(
                  {
                    translateOrigin: !0,
                    viewportScale: "auto",
                    devicePixelScaling: !0,
                    canvasClientRect: { left: 0, top: 0 },
                  },
                  n
                ),
                i = r.translateOrigin ? t[0] / 2 : 0,
                o = r.translateOrigin ? t[1] / 2 : 0,
                a = r.devicePixelScaling ? window.devicePixelRatio : 1,
                s =
                  "auto" === r.viewportScale
                    ? Math.min(t[0] / (a * e[0]), t[1] / (a * e[1]))
                    : r.viewportScale;
              return {
                translateX: i,
                translateY: o,
                scale: s * a,
                viewportScale: s,
                pixelRatio: a,
              };
            },
            Ne = (t, [e, n]) => [
              e * t[0] + n * t[2] + t[4],
              e * t[1] + n * t[3] + t[5],
            ],
            He = function (t, { devicePixelScaling: e = !0 }) {
              const n = e ? window.devicePixelRatio : 1,
                r = t.parentElement,
                i = window.getComputedStyle(r),
                o =
                  r.clientWidth -
                  parseInt(i.paddingLeft) -
                  parseInt(i.paddingRight),
                a =
                  r.clientHeight -
                  parseInt(i.paddingTop) -
                  parseInt(i.paddingBottom);
              (t.width = o * n),
                (t.height = a * n),
                (t.style.display = "block"),
                (t.style.width = `${o}px`),
                (t.style.height = `${a}px`);
            },
            Ve = {
              ctxType: "2d",
              insertCanvasOnRun: !1,
              translateOrigin: !0,
              viewport: [800, 600],
              viewportScale: "auto",
              viewportEdge: !1,
              devicePixelScaling: void 0,
            },
            Je = { content: [], renderFunction: null, clearCanvas: !0 };
          class Ze extends Component {
            constructor(t = {}) {
              super(
                Object.assign(
                  Object.assign(
                    Object.assign({}, (0, p.cloneDeep)(Ve)),
                    (0, p.cloneDeep)(Je)
                  ),
                  t
                )
              ),
                (this.internals.frameRequest = null),
                (this.render = this.render.bind(this));
            }
            onPrepare() {
              var t;
              (this.options.content || [])
                .filter(
                  (t) =>
                    (0, p.isObject)(t) && "image" === t.type && void 0 !== t.src
                )
                .forEach((t) => this.options.media.images.push(t.src)),
                (this.internals.domConnection.processEvent =
                  ((t = this),
                  ([e, n, r]) => {
                    if (r && r.startsWith("@")) {
                      const i = t.options.devicePixelScaling
                        ? window.devicePixelRatio
                        : 1;
                      if (["mouseenter", "mouseleave"].includes(e)) {
                        const t = function (t = !0, e = !0) {
                          let n = t;
                          return function (t, o) {
                            if (t instanceof MouseEvent) {
                              const a = o.internals.ctx.isPointInPath(
                                  o.internals.paths[r.slice(1)],
                                  t.offsetX * i,
                                  t.offsetY * i
                                ),
                                s = e ? !n && a : n && !a;
                              return (n = a), s;
                            }
                            return !1;
                          };
                        };
                        return {
                          eventName: "mousemove",
                          filters: n,
                          selector: "canvas",
                          moreChecks: [
                            "mouseenter" == e ? t(!0, !0) : t(!1, !1),
                          ],
                        };
                      }
                      return {
                        eventName: e,
                        filters: n,
                        selector: "canvas",
                        moreChecks: [
                          (e) =>
                            e instanceof MouseEvent &&
                            t.internals.ctx.isPointInPath(
                              t.internals.paths[r.slice(1)],
                              e.offsetX * i,
                              e.offsetY * i
                            ),
                        ],
                      };
                    }
                    return {
                      eventName: e,
                      filters: n,
                      selector: r,
                      moreChecks: [],
                    };
                  })),
                null === this.options.renderFunction &&
                  (this.options.renderFunction = Fe(
                    (this.options.content || []).filter(
                      (t) => (0, p.isObject)(t) && "aoi" !== t.type
                    ),
                    this.internals.controller.global.cache
                  ));
            }
            enterContext(t) {
              const e = super.enterContext(t);
              return (
                "canvas" in t
                  ? ((this.internals.canvas = t.canvas),
                    (this.internals.canvasAdded = !1))
                  : ((this.internals.canvas = document.createElement("canvas")),
                    (this.internals.canvasAdded = !0)),
                (this.internals.ctx = this.internals.canvas.getContext(
                  this.options.ctxType
                )),
                e
              );
            }
            leaveContext(t) {
              return super.leaveContext(t);
            }
            onRun() {
              this.internals.canvasAdded &&
                ((this.internals.context.el.innerHTML = ""),
                this.internals.context.el.appendChild(this.internals.canvas),
                He(this.internals.canvas, {
                  devicePixelScaling: this.options.devicePixelScaling,
                })),
                this.internals.ctx.save(),
                (this.internals.transformationMatrix = ((t, e, n) => {
                  const {
                    translateX: r,
                    translateY: i,
                    scale: o,
                  } = Be(t, e, n);
                  return [o, 0, 0, o, r, i];
                })(
                  [this.internals.canvas.width, this.internals.canvas.height],
                  this.options.viewport,
                  {
                    translateOrigin: this.options.translateOrigin,
                    viewportScale: this.options.viewportScale,
                    devicePixelScaling: this.options.devicePixelScaling,
                  }
                )),
                this.internals.ctx.setTransform(
                  ...this.internals.transformationMatrix
                );
            }
            onRender({ timestamp: t }) {
              return (
                this.options.clearCanvas &&
                  !this.internals.canvasAdded &&
                  this.clear(),
                this.options.viewportEdge &&
                  (this.internals.ctx.save(),
                  (this.internals.ctx.strokeStyle = "rgb(229, 229, 229)"),
                  this.internals.ctx.strokeRect(
                    this.options.translateOrigin
                      ? -this.options.viewport[0] / 2
                      : 0,
                    this.options.translateOrigin
                      ? -this.options.viewport[1] / 2
                      : 0,
                    this.options.viewport[0],
                    this.options.viewport[1]
                  ),
                  this.internals.ctx.restore()),
                this.options.renderFunction.call(
                  this,
                  t - this.internals.timestamps.render,
                  this.internals.canvas,
                  this.internals.ctx,
                  this
                )
              );
            }
            onShow() {
              this.internals.paths = (
                (t = []) =>
                (e, n, r) =>
                  (0, p.fromPairs)(
                    t
                      .filter((t) => t.label && ["aoi"].includes(t.type))
                      .map((t) => [t.label, Ue(0, t)])
                  )
              )(this.options.content.filter((t) => "aoi" === t.type))(
                0,
                this.internals.canvas,
                this.internals.ctx
              );
            }
            queueAnimationFrame() {
              this.internals.frameRequest = window.requestAnimationFrame(
                (t) => {
                  this.options.clearCanvas && this.clear(),
                    this.options.renderFunction.call(
                      this,
                      t - this.internals.timestamps.render,
                      this.internals.canvas,
                      this.internals.ctx,
                      this
                    );
                }
              );
            }
            onEnd() {
              this.internals.ctx && this.internals.ctx.restore();
            }
            clear() {
              this.internals.ctx.save(),
                this.internals.ctx.setTransform(1, 0, 0, 1, 0, 0),
                this.internals.ctx.clearRect(
                  0,
                  0,
                  this.internals.canvas.width,
                  this.internals.canvas.height
                ),
                this.internals.ctx.restore();
            }
            transform(t) {
              if (!this.internals.transformationMatrix)
                throw new Error("No transformation matrix set");
              return Ne(this.internals.transformationMatrix, t);
            }
            transformInverse(t, e = !1) {
              if (!this.internals.transformationMatrix)
                throw new Error("No transformation matrix set");
              const n = ((t, e, n) => {
                if (!n.fromOffset && !n.canvasClientRect)
                  throw "Transformation requires either an offset or the fromOffset option";
                const {
                    translateX: r,
                    translateY: i,
                    scale: o,
                    viewportScale: a,
                  } = Be(t, e, n),
                  { left: s, top: l } =
                    !0 === n.fromOffset
                      ? { left: 0, top: 0 }
                      : n.canvasClientRect;
                return [1 / a, 0, 0, 1 / a, -r / o - s / a, -i / o - l / a];
              })(
                [this.internals.canvas.width, this.internals.canvas.height],
                this.options.viewport,
                {
                  translateOrigin: this.options.translateOrigin,
                  viewportScale: this.options.viewportScale,
                  devicePixelScaling: this.options.devicePixelScaling,
                  canvasClientRect:
                    this.internals.canvas.getBoundingClientRect(),
                  fromOffset: e,
                }
              );
              return Ne(n, t);
            }
            transformCanvasEvent({ offsetX: t, offsetY: e }) {
              return this.transformInverse([t, e], !0);
            }
          }
          Ze.metadata = {
            module: ["canvas"],
            nestedComponents: [],
            parsableOptions: {
              content: {
                type: "array",
                content: {
                  type: "object",
                  content: {
                    text: {},
                    fill: {},
                    stroke: {},
                    strokeWidth: { type: "number" },
                    left: { type: "number" },
                    top: { type: "number" },
                    width: { type: "number" },
                    height: { type: "number" },
                    angle: { type: "number" },
                    src: {},
                    fontSize: { type: "number" },
                  },
                },
              },
            },
          };
          const Ge = (t, e) => {
              e(t);
              const n = Object.getPrototypeOf(t).constructor.metadata;
              n.nestedComponents &&
                n.nestedComponents.forEach((n) => {
                  const r = t.options[n];
                  (0, p.isArray)(r)
                    ? r.map((t) => Ge(t, e))
                    : r instanceof st && Ge(r, e);
                });
            },
            Ke = (t, e, n) => {
              let r = (0, p.cloneDeep)(n);
              return Ge(t, (t) => (r = e(r, t))), r;
            },
            Ye = { context: "<canvas></canvas>" };
          class Xe extends Component {
            constructor(t = {}) {
              super(
                Object.assign(
                  Object.assign(
                    Object.assign({}, (0, p.cloneDeep)(Ve)),
                    (0, p.cloneDeep)(Ye)
                  ),
                  t
                )
              ),
                (this.internals.iterator = re.emptyIterator());
            }
            async onPrepare() {
              if (
                !Ke(
                  this,
                  (t, e) =>
                    t &&
                    (e === this ||
                      e instanceof Ze ||
                      e instanceof Sequence ||
                      e instanceof Loop),
                  !0
                )
              )
                throw new Error(
                  "canvas.Frame may only contain flow or canvas-based components"
                );
              const t = Array.isArray(this.options.content)
                ? this.options.content
                : [this.options.content];
              await ie(t, this),
                (this.internals.iterator = new re(t)[Symbol.iterator]());
            }
            enterContext(t) {
              var e;
              const n = super.enterContext(t);
              if (
                ((this.internals.outerEl = n.el),
                (this.internals.parsedContext = fe(this.options.context)),
                (this.internals.canvas =
                  this.internals.parsedContext.querySelector("canvas")),
                !this.internals.canvas)
              )
                throw new Error("No canvas found in canvas.Frame context");
              return Object.assign(Object.assign({}, n), {
                canvas: this.internals.canvas,
                el:
                  null !== (e = this.internals.canvas.parentElement) &&
                  void 0 !== e
                    ? e
                    : this.internals.outerEl,
              });
            }
            async onRun() {
              const t = this.internals.outerEl;
              (t.innerHTML = ""),
                t.appendChild(this.internals.parsedContext),
                He(this.internals.canvas, {
                  devicePixelScaling: this.options.devicePixelScaling,
                });
            }
            leaveContext(t) {
              return (
                (t.el = this.internals.outerEl),
                delete t.canvas,
                delete this.internals.canvas,
                super.leaveContext(t)
              );
            }
          }
          Xe.metadata = { module: ["canvas"], nestedComponents: ["content"] };
          var Qe,
            tn,
            en,
            nn,
            rn,
            on,
            an = function (t, e, n, r, i) {
              if ("m" === r)
                throw new TypeError("Private method is not writable");
              if ("a" === r && !i)
                throw new TypeError(
                  "Private accessor was defined without a setter"
                );
              if ("function" == typeof e ? t !== e || !i : !e.has(t))
                throw new TypeError(
                  "Cannot write private member to an object whose class did not declare it"
                );
              return (
                "a" === r ? i.call(t, n) : i ? (i.value = n) : e.set(t, n), n
              );
            },
            sn = function (t, e, n, r) {
              if ("a" === n && !r)
                throw new TypeError(
                  "Private accessor was defined without a getter"
                );
              if ("function" == typeof e ? t !== e || !r : !e.has(t))
                throw new TypeError(
                  "Cannot read private member from an object whose class did not declare it"
                );
              return "m" === n
                ? r
                : "a" === n
                ? r.call(t)
                : r
                ? r.value
                : e.get(t);
            };
          const ln = (t) =>
              (t.length > 80
                ? `<div class="labjs-debug-trunc">${t.substr(0, 100)}</div>`
                : t
              ).replace(/,/g, ",&#8203;"),
            un = (t) =>
              `<td>${((t) => {
                switch (typeof t) {
                  case "number":
                    return t > 150 ? t.toFixed(0) : t.toFixed(2);
                  case "string":
                    return ln(t);
                  case "undefined":
                    return "";
                  case "object":
                    if ((0, p.isPlainObject)(t)) return ln(JSON.stringify(t));
                  default:
                    return t;
                }
              })(t)}</td>`,
            cn = (t, e, n) => {
              const r = t[e];
              return `\n    <ul class="labjs-debug-peek-layer">\n      ${
                r &&
                r
                  .map((r, i) =>
                    ((t, e, n, r) => {
                      const [i, o, a] = n[t][e],
                        s = r[t + 1],
                        l = i.at(-1) === s,
                        u = l && void 0 !== r[t + 2];
                      return `\n    <li ${
                        l ? 'class="current"' : ""
                      }>\n      <a\n        href=""\n        data-labjs-debug-jump-id='${JSON.stringify(
                        i
                      )}'\n      >\n        <span class="labjs-debug-jump-title">${o}</span>\n        <span class="labjs-debug-jump-type">(${a})</span>\n        ${
                        u ? cn(n, t + 1, r) : ""
                      }\n      </a>\n    </li>\n  `;
                    })(e, i, t, n)
                  )
                  .join("\n")
              }\n    </ul>\n  `;
            },
            fn = (t, e) => {
              const n =
                  null != e
                    ? e
                    : t.internals.controller.currentStack
                        .slice(1)
                        .map((t) => t.id),
                r = t.global.datastore.data,
                i = t.state;
              window.sessionStorage.setItem(
                "labjs-debug-snapshot",
                JSON.stringify({ target: n, data: r, state: i, keep: !0 })
              );
            };
          class Debug {
            constructor({ filePrefix: t = "study" } = {}) {
              var e;
              Qe.add(this),
                tn.set(this, void 0),
                en.set(this, void 0),
                nn.set(this, void 0),
                rn.set(this, void 0),
                (this.filePrefix = t),
                an(
                  this,
                  en,
                  null !==
                    (e = window.sessionStorage.getItem(
                      "labjs-debug-alignment"
                    )) && void 0 !== e
                    ? e
                    : "horizontal",
                  "f"
                );
            }
            async handle(t, e) {
              switch (e) {
                case "plugin:add":
                  return this.onInit(t);
                case "prepare":
                  return await this.onPrepare();
                default:
                  return;
              }
            }
            onInit(t) {
              an(this, tn, !1, "f"),
                an(this, nn, t, "f"),
                an(this, rn, document.createElement("div"), "f"),
                (sn(this, rn, "f").id = "labjs-debug"),
                (sn(this, rn, "f").innerHTML =
                  '<style type="text/css">\n  .labjs-debug-open {\n    font-size: 1.2rem;\n    color: var(--color-gray-content, #8d8d8d);\n    /* Box formatting */\n    width: 40px;\n    height: 32px;\n    padding: 6px 8px;\n    border-radius: 3px;\n    border: 1px solid var(--color-border, #e5e5e5);\n    z-index: 3;\n    background-color: var(--color-background, white);\n    /* Fixed position */\n    position: fixed;\n    bottom: 36px;\n    right: -5px;\n    /* Content centering */\n    display: flex;\n    align-items: center;\n    justify-content: left;\n  }\n\n  .labjs-debug-toggle {\n    cursor: pointer;\n  }\n\n  body.labjs-debug-visible .labjs-debug-open {\n    display: none;\n  }\n\n  body.labjs-debug-visible.labjs-debug-vertical > .container.fullscreen {\n    width: calc(50vw - 2 * var(--padding-internal));\n  }\n\n  .labjs-debug-overlay {\n    font-family: var(--font-family, "Arial", sans-serif);\n    color: black;\n    /* Box formatting, exact positions defined below */\n    position: fixed;\n    z-index: 2;\n    background-color: white;\n    display: none;\n    overflow: scroll;\n    contain: strict;\n  }\n\n  body.labjs-debug-horizontal .labjs-debug-overlay {\n    width: 100vw;\n    height: 30vh;\n    bottom: 0;\n    left: 0;\n    border-top: 2px solid var(--color-border, #e5e5e5);\n  }\n\n  body.labjs-debug-vertical .labjs-debug-overlay {\n    width: 50vw;\n    height: 100vh;\n    top: 0;\n    right: 0;\n    border-left: 2px solid var(--color-border, #e5e5e5);\n  }\n\n  #labjs-debug.labjs-debug-large .labjs-debug-overlay {\n    height: 100vh;\n  }\n\n  .labjs-debug-overlay-menu {\n    position: sticky;\n    top: 0px;\n    font-size: 0.8rem;\n    padding: 8px 12px 6px;\n    color: var(--color-gray-content, #8d8d8d);\n    background-color: white;\n    border-bottom: 1px solid var(--color-border, #e5e5e5);\n  }\n\n  .labjs-debug-overlay-menu a {\n    color: var(--color-gray-content, #8d8d8d);\n  }\n\n  .labjs-debug-overlay-menu .pull-right {\n    float: right;\n    position: relative;\n    top: -4px;\n  }\n\n  .labjs-debug-overlay-menu .pull-right .labjs-debug-close {\n    font-size: 1rem;\n    margin-left: 0.5em;\n    position: relative;\n    top: 1px;\n  }\n\n  body.labjs-debug-visible .labjs-debug-overlay {\n    display: block;\n  }\n\n  .labjs-debug-overlay-contents {\n    padding: 12px;\n  }\n\n  .labjs-debug-overlay-contents table {\n    font-size: 0.8rem;\n  }\n\n  .labjs-debug-overlay-contents table tr.labjs-debug-state {\n    background-color: var(--color-gray-background, #f8f8f8);\n  }\n\n  /* Truncated cells */\n  .labjs-debug-trunc {\n    min-width: 200px;\n    max-width: 400px;\n  }\n  .labjs-debug-trunc::after {\n    content: "...";\n    opacity: 0.5;\n  }\n\n  /* Layer peeking */\n  .labjs-debug-overlay ul.labjs-debug-peek-layer {\n  }\n\n  .labjs-debug-overlay ul.labjs-debug-peek-layer li {\n  }\n  .labjs-debug-overlay ul.labjs-debug-peek-layer li.current > a > .labjs-debug-jump-title {\n    font-weight: bold;\n  }\n\n  .labjs-debug-overlay ul.labjs-debug-peek-layer li a {\n  }\n  .labjs-debug-overlay ul.labjs-debug-peek-layer li a .labjs-debug-jump-type {\n  }\n</style>\n<div class="labjs-debug-open labjs-debug-toggle">\n  <div style="position:relative;top:3.2px;left:-1.5px">\n    <svg width="21" height="21" viewBox="0 0 16.93 16.93" xmlns="http://www.w3.org/2000/svg">\n      <ellipse style="fill:currentColor" cx="8.47" cy="4.49" rx="2.49" ry=".89"/>\n      <ellipse style="fill:none;stroke:currentColor;stroke-width:1.1" cx="8.47" cy="9.07" rx="4.65" ry="5.44"/>\n      <path style="fill:none;stroke:currentColor;stroke-width:.2" d="M12.33 6c0 .9-1.73 1.63-3.86 1.63C6.33 7.63 4.6 6.9 4.6 6"/>\n      <path style="fill:none;stroke:currentColor;stroke-width:.2" d="M8.47 7.58v6.8"/>\n      <path style="fill:none;stroke:currentColor;stroke-width:.9" d="M5.65 2.12s.22 1.13.78 1.76M1.94 9.95s1.15-.1 1.89-.31M3.26 13.8s1.29-.6 1.55-1.13M2.54 5.6s1 .76 1.74 1.02M11.29 2.12s-.23 1.13-.78 1.76M15 9.95s-1.16-.1-1.9-.31M13.68 13.8s-1.3-.6-1.56-1.13M14.39 5.6s-1 .76-1.73 1.02"/>\n    </svg>\n  </div>\n</div>\n<div class="labjs-debug-overlay">\n  <div class="labjs-debug-overlay-menu">\n    <div class="pull-right">\n      <code>lab.js</code> debug tools ·\n      <a href="#" class="labjs-debug-data-download">📦 csv</a>\n      <a href="" class="labjs-debug-snapshot">📌 Snapshot</a>\n      <a href="" class="labjs-debug-snapshot-reload">Reload</a>\n      <a href="" class="labjs-debug-snapshot-clear">Clear</a>\n      <a href="" class="labjs-debug-alignment-toggle">Toggle alignment</a>\n      <span class="labjs-debug-close labjs-debug-toggle">&times;</span>\n    </div>\n    <div>\n      <span class="labjs-debug-overlay-breadcrumbs"></span>\n      &nbsp; \x3c!-- prevent element from collapsing --\x3e\n    </div>\n  </div>\n  <div class="labjs-debug-overlay-contents">\n    <div class="labjs-debug-overlay-peek"></div>\n    <div class="labjs-debug-overlay-data"></div>\n  </div>\n</div>'),
                Array.from(
                  sn(this, rn, "f").querySelectorAll(".labjs-debug-toggle")
                ).forEach((t) =>
                  t.addEventListener("click", () => this.toggle())
                ),
                sn(this, rn, "f")
                  .querySelector(".labjs-debug-overlay-menu")
                  .addEventListener("dblclick", () =>
                    sn(this, rn, "f").classList.toggle("labjs-debug-large")
                  ),
                sn(this, rn, "f")
                  .querySelector(".labjs-debug-data-download")
                  .addEventListener("click", (e) => {
                    var n;
                    e.preventDefault(),
                      null === (n = sn(this, nn, "f")) ||
                        void 0 === n ||
                        n.internals.controller.global.datastore.download(
                          "csv",
                          t.global.datastore.makeFilename(
                            this.filePrefix,
                            "csv"
                          )
                        );
                  }),
                sn(this, rn, "f")
                  .querySelector(".labjs-debug-snapshot")
                  .addEventListener("click", (t) => {
                    t.preventDefault(), fn(sn(this, nn, "f"));
                  }),
                sn(this, rn, "f")
                  .querySelector(".labjs-debug-snapshot-reload")
                  .addEventListener("click", (t) => {
                    t.preventDefault(), window.location.reload();
                  }),
                sn(this, rn, "f")
                  .querySelector(".labjs-debug-snapshot-clear")
                  .addEventListener("click", (t) => {
                    t.preventDefault(),
                      window.sessionStorage.removeItem("labjs-debug-snapshot");
                  }),
                sn(this, rn, "f")
                  .querySelector(".labjs-debug-alignment-toggle")
                  .addEventListener("click", (t) => {
                    t.preventDefault(),
                      "horizontal" === sn(this, en, "f")
                        ? an(this, en, "vertical", "f")
                        : an(this, en, "horizontal", "f"),
                      window.sessionStorage.setItem(
                        "labjs-debug-alignment",
                        sn(this, en, "f")
                      ),
                      sn(this, Qe, "m", on).call(this);
                  }),
                sn(this, rn, "f")
                  .querySelector(".labjs-debug-overlay-breadcrumbs")
                  .addEventListener("click", (t) => {
                    var e, n;
                    if (
                      t.target instanceof HTMLSpanElement &&
                      "labjsDebugBreadcrumb" in t.target.dataset
                    ) {
                      const r = parseInt(t.target.dataset.labjsDebugBreadcrumb),
                        i =
                          null === (e = sn(this, nn, "f")) || void 0 === e
                            ? void 0
                            : e.internals.controller.currentStack[r];
                      null === (n = sn(this, nn, "f")) ||
                        void 0 === n ||
                        n.internals.controller.jump("abort", { sender: i });
                    }
                  }),
                sn(this, rn, "f")
                  .querySelector(".labjs-debug-overlay-peek")
                  .addEventListener("click", (t) => {
                    var e;
                    const n =
                      null === (e = t.target) || void 0 === e
                        ? void 0
                        : e.closest("a");
                    if (n && "labjsDebugJumpId" in n.dataset) {
                      t.preventDefault();
                      const e = JSON.parse(n.dataset.labjsDebugJumpId);
                      fn(sn(this, nn, "f"), e), window.location.reload();
                    }
                  }),
                document.body.appendChild(sn(this, rn, "f")),
                sn(this, Qe, "m", on).call(this);
            }
            async onPrepare() {
              if (sn(this, nn, "f").internals.controller) {
                const t = (0, p.throttle)(() => this.render(), 100),
                  e = sn(this, nn, "f").internals.controller;
                e.on("flip", t);
                const n = e.global.datastore;
                if (
                  (n.on("set", t),
                  n.on("commit", t),
                  n.on("update", t),
                  window.sessionStorage.getItem("labjs-debug-snapshot"))
                ) {
                  const {
                    target: t,
                    data: e,
                    state: n,
                    keep: r,
                  } = JSON.parse(
                    window.sessionStorage.getItem("labjs-debug-snapshot")
                  );
                  await (async (t, e) => {
                    t.global.datastore._hydrate({
                      data: e.data,
                      state: e.state,
                    }),
                      await t.internals.controller.jump("fastforward", {
                        target: e.target,
                      });
                  })(sn(this, nn, "f"), { target: t, data: e, state: n }),
                    sn(this, tn, "f") || this.toggle();
                }
              }
            }
            toggle() {
              an(this, tn, !sn(this, tn, "f"), "f"),
                this.render(),
                sn(this, Qe, "m", on).call(this);
            }
            render() {
              if (sn(this, tn, "f")) {
                const t = sn(this, nn, "f").internals.controller,
                  e = t.global.datastore;
                (sn(this, rn, "f").querySelector(
                  ".labjs-debug-overlay-contents .labjs-debug-overlay-data"
                ).innerHTML = ((t) => {
                  const e = t.keys(!0),
                    n = e.map((t) => `<th>${t}</th>`),
                    r = e.map((e) => un(t.state[e])),
                    i = t.data
                      .slice()
                      .reverse()
                      .map(
                        (t) => `<tr> ${e.map((e) => un(t[e])).join("")} </tr>`
                      );
                  return `\n    <table>\n      <tr>${n.join(
                    "\n"
                  )}</tr>\n      <tr class="labjs-debug-state">${r.join(
                    "\n"
                  )}</tr>\n      ${i.join("\n")}\n    </table>\n  `;
                })(e)),
                  (sn(this, rn, "f").querySelector(
                    ".labjs-debug-overlay-breadcrumbs"
                  ).innerHTML = ((t) =>
                    t.currentStack
                      .map((t, e) => {
                        const n =
                          0 === e && "root" === t.options.title
                            ? "Experiment"
                            : t.options.title;
                        return {
                          title: null != n ? n : `Untitled ${t.type}`,
                          type: t.type,
                        };
                      })
                      .map(
                        (t, e) =>
                          `<span data-labjs-debug-breadcrumb="${e}">${t.title}</span>`
                      )
                      .join(' <span style="opacity: 0.5">/</span> '))(t)),
                  (sn(this, rn, "f").querySelector(
                    ".labjs-debug-overlay-peek"
                  ).innerHTML = ((t) => {
                    const e = t.iterator.peek(),
                      n = t.currentStack.map((t) => t.id);
                    return cn(e, 0, n);
                  })(t));
              }
            }
          }
          (tn = new WeakMap()),
            (en = new WeakMap()),
            (nn = new WeakMap()),
            (rn = new WeakMap()),
            (Qe = new WeakSet()),
            (on = function () {
              document.body.classList.toggle(
                "labjs-debug-visible",
                sn(this, tn, "f")
              ),
                document.body.classList.toggle(
                  "labjs-debug-horizontal",
                  "horizontal" === sn(this, en, "f")
                ),
                document.body.classList.toggle(
                  "labjs-debug-vertical",
                  "vertical" === sn(this, en, "f")
                );
            });
          const hn = (t) => {
            const e = "Are you sure you want to close this window?";
            return (t.returnValue = e), e;
          };
          class Download {
            constructor({ filePrefix: t, fileType: e } = {}) {
              (this.el = void 0),
                (this.filePrefix = t || "study"),
                (this.fileType = e || "csv");
            }
            async handle(t, e) {
              if ("end" === e) {
                const e = t.internals.controller,
                  n = e.global.datastore;
                window.addEventListener("beforeunload", hn),
                  (this.el = document.createElement("div")),
                  (this.el.className = "popover"),
                  (this.el.innerHTML =
                    '\n        <div class="alert text-center">\n          <strong>Download data</strong>\n        </div>\n      '),
                  this.el.addEventListener("click", () => {
                    n.download(
                      this.fileType,
                      n.makeFilename(this.filePrefix, this.fileType)
                    ),
                      window.removeEventListener("beforeunload", hn);
                  }),
                  e.global.rootEl.prepend(this.el);
              }
            }
          }
          const pn = (t) =>
              t.requestFullscreen
                ? t.requestFullscreen()
                : "webkitRequestFullscreen" in t
                ? t.webkitRequestFullscreen()
                : void 0,
            dn = () =>
              document.exitFullscreen
                ? document.exitFullscreen()
                : "webkitExitFullscreen" in document
                ? document.webkitExitFullscreen()
                : void 0;
          class vn {
            constructor({ message: t, hint: e, close: n } = {}) {
              (this.message =
                t || "This experiment requires full screen display"),
                (this.hint =
                  e || "Please click to continue in full screen mode"),
                (this.close = null == n || n);
            }
            async handle(t, e) {
              if ("before:run" !== e || document.fullscreenElement)
                "end" === e && this.close && dn();
              else {
                const t = document.createElement("div");
                (t.innerHTML = `\n        <div\n          class="modal w-m content-horizontal-center content-vertical-center text-center"\n        >\n          <p>\n            <span class="font-weight-bold">\n              ${this.message}\n            </span><br>\n            <span class="text-muted">\n              ${this.hint}\n            </span>\n          </p>\n        </div>\n      `),
                  t.classList.add(
                    "overlay",
                    "content-vertical-center",
                    "content-horizontal-center"
                  ),
                  document.body.appendChild(t),
                  await new Promise((e) => {
                    t.addEventListener(
                      "click",
                      async (n) => {
                        await pn(document.documentElement),
                          document.body.removeChild(t),
                          e(null);
                      },
                      { once: !0 }
                    );
                  });
              }
            }
          }
          class Logger {
            constructor({ title: t } = {}) {
              this.title = t;
            }
            async handle(t, e) {
              console.log(`Component ${this.title} received ${e}`);
            }
          }
          const mn = () => {
            const t = window.Intl.DateTimeFormat().resolvedOptions();
            return {
              labjs_version: Zn,
              labjs_build: Gn,
              location: window.location.href,
              userAgent: window.navigator.userAgent,
              platform: window.navigator.platform,
              language: window.navigator.language,
              locale: t.locale,
              timeZone: t.timeZone,
              timezoneOffset: new Date().getTimezoneOffset(),
              screen_width: window.screen.width,
              screen_height: window.screen.height,
              scroll_width: document.body.scrollWidth,
              scroll_height: document.body.scrollHeight,
              timeOrigin: performance.timeOrigin,
              window_innerWidth: window.innerWidth,
              window_innerHeight: window.innerHeight,
              devicePixelRatio: window.devicePixelRatio,
            };
          };
          class Metadata {
            constructor(t = {}) {
              this.options = t;
            }
            async handle(t, e) {
              var n, r;
              if ("prepare" === e) {
                const e =
                  ((r =
                    null !== (n = this.options.location_search) && void 0 !== n
                      ? n
                      : window.location.search),
                  (0, p.fromPairs)(
                    Array.from(new URLSearchParams(r).entries())
                  ));
                t.global.datastore.set({ url: e, meta: mn() });
              }
            }
          }
          const gn = (t) => {
            const e = "Closing this window will abort the study. Are you sure?";
            return (t.returnValue = e), e;
          };
          class wn {
            async handle(t, e) {
              "prepare" === e
                ? window.addEventListener("beforeunload", gn)
                : "end" === e && window.removeEventListener("beforeunload", gn);
            }
          }
          const bn = {
            blur: "focus",
            focus: "blur",
            mouseover: "mouseout",
            mouseout: "mouseover",
            visibilitychange: "visibilitychange",
          };
          class yn {
            constructor({ notify: t = !0, count: e = !1, message: n } = {}) {
              (this.lastTimestamps = {}),
                (this.notify = t),
                (this.count = e),
                (this.message =
                  null != n
                    ? n
                    : "Please do not switch to another windowor minimize the browser while the study is running.");
            }
            async handle(t, e) {
              "run" === e
                ? ((this._handleEvent = (e) => this.logEvent(e, t)),
                  window.addEventListener("focus", this._handleEvent),
                  window.addEventListener("blur", this._handleEvent),
                  window.addEventListener(
                    "visibilitychange",
                    this._handleEvent
                  ))
                : "end" === e &&
                  (window.removeEventListener("focus", this._handleEvent),
                  window.removeEventListener("blur", this._handleEvent),
                  window.removeEventListener(
                    "visibilitychange",
                    this._handleEvent
                  ));
            }
            logEvent(t, e) {
              const n = e.internals.controller.global.datastore,
                r = n.staging;
              r.paradata || (r.paradata = []),
                this.count &&
                  (void 0 === r[`${t.type}Count`]
                    ? (r[`${t.type}Count`] = 1)
                    : r[`${t.type}Count`]++),
                (this.lastTimestamps[t.type] = t.timeStamp);
              const i = bn[t.type],
                o = {
                  event: t.type,
                  ts: t.timeStamp,
                  duration: t.timeStamp - this.lastTimestamps[i],
                };
              "visibilitychange" === t.type &&
                (o.visibilityState = document.visibilityState),
                n.staging.paradata.push(o),
                this.notify && "blur" === t.type && alert(this.message);
            }
          }
          class _n {
            constructor({ origin: t, target: e, messageType: n } = {}) {
              (this.origin = null != t ? t : "*"),
                (this.target = null != e ? e : window.parent),
                (this.messageType = null != n ? n : "labjs.data");
            }
            async handle(t, e) {
              "lock" === e &&
                this.target.postMessage(
                  {
                    type: this.messageType,
                    metadata: { payload: "full", url: window.location.href },
                    raw: t.global.datastore.data,
                    json: t.global.datastore.exportJson(),
                    csv: t.global.datastore.exportCsv(),
                  },
                  this.origin
                );
            }
          }
          class xn {
            async handle(t, e) {
              if ("after:end" === e && t.global.datastore) {
                const e = document.querySelector('form[name="labjs-data"]');
                try {
                  const n =
                    new ClipboardEvent("").clipboardData || new DataTransfer();
                  n.items.add(
                    new File([t.global.datastore.exportCsv()], "data.csv")
                  ),
                    (e.elements.dataFile.files = n.files);
                } catch (n) {
                  console.log(
                    "Couldn't append data file to form falling back to direkt insertion. Error was",
                    n
                  ),
                    (e.elements.dataRaw.value = t.global.datastore.exportCsv());
                }
                e.submit();
              }
            }
          }
          const jn = (t) => {
              for (const [e, n] of Object.entries(t))
                document.documentElement.style.setProperty(e, n);
            },
            kn = (t) => {
              ((t) => {
                t.forEach((t) =>
                  t.classList.add("labjs-styleplugin-transition")
                );
              })(t),
                document.documentElement.addEventListener(
                  "transitionend",
                  () =>
                    ((t) => {
                      t.forEach((t) =>
                        t.classList.remove("labjs-styleplugin-transition")
                      );
                    })(t),
                  { once: !0 }
                );
            };
          class En {
            constructor({
              properties: t = {},
              reverse: e = !0,
              transition: n = !0,
            } = {}) {
              (this.transitionSelector =
                "body, body > .container, header, main, footer"),
                (this.properties = t),
                (this.backup = {}),
                (this.transition = n),
                (this.reverse = e);
            }
            async handle(t, e) {
              "prepare" === e && this.transition
                ? (() => {
                    if (!document.querySelector("style#labjs-styleplugin")) {
                      const t = document.createElement("style");
                      (t.id = "labjs-styleplugin"),
                        (t.innerHTML = Ae`
      .labjs-styleplugin-transition {
        transition-property: color, background-color, border-color;
        transition-duration: 1s;
      }
    `),
                        document.head.appendChild(t);
                    }
                  })()
                : "run" === e
                ? (this.transition &&
                    kn([
                      document.documentElement,
                      ...Array.from(
                        document.querySelectorAll(this.transitionSelector)
                      ),
                    ]),
                  (this.backup = ((t) => {
                    const e = getComputedStyle(document.documentElement);
                    return Object.fromEntries(
                      t.map((t) => [t, e.getPropertyValue(t)])
                    );
                  })(Object.keys(this.properties))),
                  jn(this.properties))
                : "end" === e && this.reverse
                ? (this.transition &&
                    kn([
                      document.documentElement,
                      ...Array.from(
                        document.querySelectorAll(this.transitionSelector)
                      ),
                    ]),
                  jn(this.backup))
                : "lock" === e && (this.backup = {});
            }
          }
          const On = (t, e, { throttle: n = !0 } = {}) => {
            let r,
              i,
              o,
              a = [],
              s = !1,
              l = !1;
            const u = function () {
                if (((r = null), s && n)) l = !0;
                else {
                  const e = a;
                  (a = []),
                    (s = !0),
                    Promise.resolve(t.apply(o, i))
                      .then((t) => {
                        for (const [n, r] of e) n(t);
                      })
                      .catch((t) => {
                        for (const [n, r] of e) r(t);
                      })
                      .finally(() => {
                        const t = l;
                        (s = l = !1), t && null === r && c();
                      });
                }
              },
              c = function () {
                if ((r && clearTimeout(r), a.length > 0)) {
                  const t = new Promise((t, e) => {
                    a.push([t, e]);
                  });
                  return u(), t;
                }
                return Promise.resolve();
              },
              f = function () {
                return new Promise((t, n) => {
                  (i = arguments),
                    (o = this),
                    r && clearTimeout(r),
                    (r = setTimeout(u, e)),
                    a.push([t, n]);
                });
              };
            return (
              (f.flush = c),
              (f.cancel = function () {
                r && clearTimeout(r),
                  (r = null),
                  (l = !1),
                  (i = o = void 0),
                  (a = []);
              }),
              f
            );
          };
          var Sn = function (t, e) {
            var n = {};
            for (var r in t)
              Object.prototype.hasOwnProperty.call(t, r) &&
                e.indexOf(r) < 0 &&
                (n[r] = t[r]);
            if (
              null != t &&
              "function" == typeof Object.getOwnPropertySymbols
            ) {
              var i = 0;
              for (r = Object.getOwnPropertySymbols(t); i < r.length; i++)
                e.indexOf(r[i]) < 0 &&
                  Object.prototype.propertyIsEnumerable.call(t, r[i]) &&
                  (n[r[i]] = t[r[i]]);
            }
            return n;
          };
          const Tn = function (
            t,
            e,
            n = {},
            {
              encoding: r = "json",
              headers: i = {},
              retry: o = {},
              slice: a = [void 0, void 0],
            } = {}
          ) {
            var s, l;
            const u = null !== (s = a[0]) && void 0 !== s ? s : 0,
              c = null !== (l = a[1]) && void 0 !== l ? l : e.length,
              f = yt(e.slice(u, c));
            let h,
              p = {};
            return (
              "form" === r
                ? ((h = new FormData()),
                  h.append(
                    "metadata",
                    JSON.stringify(Object.assign({ slice: u }, n))
                  ),
                  h.append("url", window.location.href),
                  h.append("data", JSON.stringify(f)))
                : "graphql" === r
                ? (console.log("Doing graphql way"),
                  (h = JSON.stringify({
                    query:
                      "mutation CREATE_DATASET($data: JSON) {\n        createDataset(\n          data: {\n            data: $data\n          }\n        ) {\n          id\n        }\n      }\n    ",
                    variables: {
                      data: Object.assign(Object.assign({ slice: u }, n), {
                        data: f,
                      }),
                    },
                    url: window.location.href,
                  })),
                  (p = {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                  }))
                : ((h = JSON.stringify({
                    metadata: Object.assign({ slice: u }, n),
                    url: window.location.href,
                    data: f,
                  })),
                  (p = {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                  })),
              ((t, e = {}) => {
                var {
                    retry: { times: n = 3, delay: r = 10, factor: i = 5 } = {},
                  } = e,
                  o = Sn(e, ["retry"]);
                return new Promise((e, a) => {
                  const s = (r) =>
                      window
                        .fetch(t, o)
                        .then((t) => e(t))
                        .catch((t) => {
                          r <= n ? l(r) : a(t);
                        }),
                    l = (t) => {
                      setTimeout(() => s(++t), r * i ** t);
                    };
                  return s(0);
                });
              })(t, {
                method: "post",
                headers: Object.assign(Object.assign({}, p), i),
                body: h,
                credentials: "include",
                retry: o,
              })
            );
          };
          var Cn,
            An,
            Pn,
            Rn,
            $n,
            Mn,
            qn,
            In = function (t, e, n, r, i) {
              if ("m" === r)
                throw new TypeError("Private method is not writable");
              if ("a" === r && !i)
                throw new TypeError(
                  "Private accessor was defined without a setter"
                );
              if ("function" == typeof e ? t !== e || !i : !e.has(t))
                throw new TypeError(
                  "Cannot write private member to an object whose class did not declare it"
                );
              return (
                "a" === r ? i.call(t, n) : i ? (i.value = n) : e.set(t, n), n
              );
            },
            Ln = function (t, e, n, r) {
              if ("a" === n && !r)
                throw new TypeError(
                  "Private accessor was defined without a getter"
                );
              if ("function" == typeof e ? t !== e || !r : !e.has(t))
                throw new TypeError(
                  "Cannot read private member from an object whose class did not declare it"
                );
              return "m" === n
                ? r
                : "a" === n
                ? r.call(t)
                : r
                ? r.value
                : e.get(t);
            };
          class zn {
            constructor(
              t,
              e,
              {
                metadata: n = {},
                headers: r = {},
                encoding: i = "json",
                debounceInterval: o = 2500,
              } = {}
            ) {
              Cn.set(this, void 0),
                An.set(this, void 0),
                Pn.set(this, void 0),
                Rn.set(this, void 0),
                $n.set(this, void 0),
                Mn.set(this, void 0),
                qn.set(this, 0),
                In(this, Cn, t, "f"),
                In(this, An, e, "f"),
                In(this, Pn, n, "f"),
                In(this, Rn, r, "f"),
                In(this, $n, i, "f"),
                In(
                  this,
                  Mn,
                  On(async () => {
                    const t = Tn(
                      Ln(this, An, "f"),
                      Ln(this, Cn, "f").data,
                      Object.assign(Object.assign({}, Ln(this, Pn, "f")), {
                        payload: "incremental",
                      }),
                      {
                        headers: Ln(this, Rn, "f"),
                        encoding: Ln(this, $n, "f"),
                        slice: [Ln(this, qn, "f"), void 0],
                      }
                    );
                    return (
                      In(this, qn, Ln(this, Cn, "f").data.length, "f"), await t
                    );
                  }, o),
                  "f"
                );
            }
            async enqueue() {
              return Ln(this, Mn, "f").call(this);
            }
            async transmit() {
              return (
                Ln(this, Mn, "f").flush(),
                Tn(
                  Ln(this, An, "f"),
                  Ln(this, Cn, "f").data,
                  Object.assign(Object.assign({}, Ln(this, Pn, "f")), {
                    payload: "full",
                  }),
                  { headers: Ln(this, Rn, "f"), encoding: Ln(this, $n, "f") }
                )
              );
            }
            async finalize() {
              await Ln(this, Mn, "f").flush();
            }
            drop() {
              Ln(this, Mn, "f").cancel();
            }
            get lastTransmission() {
              return Ln(this, qn, "f");
            }
          }
          (Cn = new WeakMap()),
            (An = new WeakMap()),
            (Pn = new WeakMap()),
            (Rn = new WeakMap()),
            ($n = new WeakMap()),
            (Mn = new WeakMap()),
            (qn = new WeakMap());
          var Dn,
            Fn,
            Wn,
            Un = function (t, e, n, r, i) {
              if ("m" === r)
                throw new TypeError("Private method is not writable");
              if ("a" === r && !i)
                throw new TypeError(
                  "Private accessor was defined without a setter"
                );
              if ("function" == typeof e ? t !== e || !i : !e.has(t))
                throw new TypeError(
                  "Cannot write private member to an object whose class did not declare it"
                );
              return (
                "a" === r ? i.call(t, n) : i ? (i.value = n) : e.set(t, n), n
              );
            },
            Bn = function (t, e, n, r) {
              if ("a" === n && !r)
                throw new TypeError(
                  "Private accessor was defined without a getter"
                );
              if ("function" == typeof e ? t !== e || !r : !e.has(t))
                throw new TypeError(
                  "Cannot read private member from an object whose class did not declare it"
                );
              return "m" === n
                ? r
                : "a" === n
                ? r.call(t)
                : r
                ? r.value
                : e.get(t);
            };
          class Transmit {
            constructor(t) {
              var e, n, r, i;
              Dn.set(this, void 0),
                Fn.set(this, void 0),
                Wn.set(this, void 0),
                Un(this, Dn, t.url, "f"),
                Un(
                  this,
                  Fn,
                  Object.assign(
                    {
                      id:
                        null !==
                          (n =
                            null === (e = t.metadata) || void 0 === e
                              ? void 0
                              : e.id) && void 0 !== n
                          ? n
                          : ct(),
                    },
                    t.metadata
                  ),
                  "f"
                ),
                Un(
                  this,
                  Wn,
                  {
                    incremental:
                      !1 !==
                      (null === (r = t.updates) || void 0 === r
                        ? void 0
                        : r.incremental),
                    full:
                      !1 !==
                      (null === (i = t.updates) || void 0 === i
                        ? void 0
                        : i.full),
                  },
                  "f"
                ),
                (this.callbacks = t.callbacks || {}),
                (this.headers = t.headers || {}),
                (this.encoding = t.encoding || "json");
            }
            async handle(t, e) {
              if ("prepare" === e) {
                const e = t.internals.controller,
                  n = e.global.datastore;
                (this.connection = new zn(n, Bn(this, Dn, "f"), {
                  metadata: Bn(this, Fn, "f"),
                  headers: this.headers,
                  encoding: this.encoding,
                })),
                  Bn(this, Wn, "f").incremental &&
                    e.on("flip", () => {
                      var t;
                      return null === (t = this.connection) || void 0 === t
                        ? void 0
                        : t.enqueue();
                    }),
                  Bn(this, Wn, "f").full &&
                    e.on("end", () => {
                      var t, e;
                      return Promise.all([
                        null === (t = this.connection) || void 0 === t
                          ? void 0
                          : t.transmit(),
                        null === (e = this.connection) || void 0 === e
                          ? void 0
                          : e.finalize(),
                      ]).then(() => {
                        var t, e;
                        return null === (e = (t = this.callbacks).full) ||
                          void 0 === e
                          ? void 0
                          : e.call(t);
                      });
                    }),
                  this.callbacks.setup && this.callbacks.setup.call(this);
              }
            }
          }
          (Dn = new WeakMap()), (Fn = new WeakMap()), (Wn = new WeakMap());
          const Nn = function* (...t) {
              const e = t
                .map((t) => Math.max(t.length, 1))
                .reverse()
                .reduce((t, e, n) => [...t, (t[n - 1] || 1) * e], [])
                .reverse();
              for (let n = 0; n < e[0]; n++)
                yield t.map(
                  (t, r) => t[Math.floor(n / (e[r + 1] || 1)) % t.length]
                );
            },
            Hn = { makeRenderFunction: Fe, transform: Ne },
            Vn = { FrameTimeout: Jt },
            Jn = { traverse: Ge, reduce: Ke },
            Zn = "22.0.0-beta7",
            Gn = {
              flavor: "production",
              commit: "cf9e385ff1e6db82bf915cd88e8eed5aaddb1771",
            };
        })(),
        r
      );
    })()
  );
}
//# sourceMappingURL=lab.js.map
