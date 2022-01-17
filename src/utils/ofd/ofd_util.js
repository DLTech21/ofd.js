/*
 * ofd.js - A Javascript class for reading and rendering ofd files
 * <https://github.com/DLTech21/ofd.js>
 *
 * Copyright (c) 2020. DLTech21 All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * You may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 *
 */

const millimetersToPixel = function (mm, dpi) {
    //毫米转像素：mm * dpi / 25.4
    return ((mm * dpi / 25.4));
}

let MaxScale = 10;

let Scale = MaxScale;

export const setMaxPageScal = function (scale) {
    MaxScale = scale > 5 ? 5 : scale;
}

export const setPageScal = function (scale) {
    // scale = Math.ceil(scale);
    Scale = scale > 1 ? scale : 1;
    Scale = Scale > MaxScale ? MaxScale : Scale;
}

export const getPageScal = function () {
    return Scale;
}

export const converterDpi = function (width) {
    return millimetersToPixel(width, Scale * 25.4);
}

export const ctmImageScale = function () {
    return 1 / Scale;
}

const ctmCalPoint = function (x, y, ctm) {
    const ctmX = x * ctm.a + y * ctm.c + 1 * ctm.e;
    const ctmY = x * ctm.b + y * ctm.d + 1 * ctm.f;
    return {cx:ctmX, cy:ctmY};
}

const ctmCalDetalPoint = function (x, y, ctm) {
    const ctmX = x * ctm.a + y * ctm.c;
    const ctmY = x * ctm.b + y * ctm.d;
    return {ctmX, ctmY};
}

const adjustPos = function (x, y, boundary) {
    const realX = boundary.x + x
    const realY = boundary.y + y
    return {cx: realX, cy: realY};
}


export const calTextPoint = function (textCodes, cgTransform, ctm, boundary, compositeObjectBoundary, compositeObjectCTM) {
    let x = 0;
    let y = 0;
    let cx = 0;
    let cy = 0;
    let textCodePointList = [];
    if (!textCodes) {
        return textCodePointList;
    }
    for (let textCode of textCodes) {
        if (!textCode) {
            continue
        }

        x = parseFloat(textCode['X']);
        y = parseFloat(textCode['Y']);

        if (isNaN(x)) {
            x = 0;
        }
        if (isNaN(y)) {
            y = 0;
        }
        cx = x;
        cy = y;
        if (ctm) {
            const r = ctmCalPoint(cx, cy, ctm)
            cx = r.cx
            cy = r.cy
        }

        let deltaXList = [];
        let deltaYList = [];
        if (textCode['DeltaX'] && textCode['DeltaX'].length > 0) {
            deltaXList = textCode['DeltaX'];
        }
        if (textCode['DeltaY'] && textCode['DeltaY'].length > 0) {
            deltaYList = textCode['DeltaY'];
        }
        let textStr = textCode['text'];
        if (textStr) {
            textStr += '';
            textStr = decodeHtml(textStr);
            textStr = textStr.replace(/&#x20;/g, ' ');
            for (let i = 0; i < textStr.length; i++) {
                if (i > 0 && deltaXList.length > 0) {
                    x += deltaXList[(i - 1)];
                    if (ctm) {
                        const r = ctmCalDetalPoint(deltaXList[(i - 1)], 0, ctm)
                        cx += r.ctmX
                    } else {
                        cx = x
                    }
                }
                if (i > 0 && deltaYList.length > 0) {
                    y += deltaYList[(i - 1)];
                    if (ctm) {
                        const r = ctmCalDetalPoint(0, deltaYList[(i - 1)], ctm)
                        cy += r.ctmY
                    } else {
                        cy = y
                    }
                }
                let realPos = adjustPos(cx, cy, boundary);
                if (compositeObjectCTM) {
                    realPos = ctmCalPoint(realPos.cx, realPos.cy, compositeObjectCTM);
                }
                let text = textStr.substring(i, i + 1);
                let textCodePoint = {
                    'x': converterDpi(x),
                    'y': converterDpi(y),
                    'text': text,
                    cx: converterDpi(realPos.cx),
                    cy: converterDpi(realPos.cy)
                };
                textCodePointList.push(textCodePoint);
            }
        }
    }
    if (textCodePointList.length > 0) {
        for (const transform of cgTransform) {
            // console.log(transform)
            const pos = transform['CodePosition']
            const glyphCount = transform['GlyphCount']
            // const codeCount = transform['CodeCount']
            for (let i = pos; i < glyphCount + pos; i++) {
                if (textCodePointList.length <= i) {
                    const glyphs = `${textCodePointList[textCodePointList.length - 1].glyph} ${transform['Glyphs'][i - pos]}`
                    textCodePointList[textCodePointList.length - 1].glyph = glyphs;
                } else {
                    textCodePointList[i].glyph = transform['Glyphs'][i - pos]
                }
            }
        }
    }
    return textCodePointList;
}

let REGX_HTML_DECODE = /&\w+;|&#(\d+);/g;

let HTML_DECODE = {
    "&lt;": "<",
    "&gt;": ">",
    "&amp;": "&",
    "&nbsp;": " ",
    "&quot;": "\"",
    "&copy;": "",
    "&apos;": "'",
    // Add more
};

export const decodeHtml = function (s) {
    s = (s != undefined) ? s : this.toString();
    return (typeof s != "string") ? s :
        s.replace(REGX_HTML_DECODE,
            function ($0, $1) {
                var c = HTML_DECODE[$0];
                if (c == undefined) {
                    // Maybe is Entity Number
                    if (!isNaN($1)) {
                        c = String.fromCharCode(($1 == 160) ? 32 : $1);
                    } else {
                        c = $0;
                    }
                }
                return c;
            });
};

let FONT_FAMILY = {
    '楷体': '楷体, KaiTi, Kai, simkai',
    'kaiti': '楷体, KaiTi, Kai, simkai',
    'Kai': '楷体, KaiTi, Kai',
    'simsun': 'SimSun, simsun, Songti SC',
    '宋体': 'SimSun, simsun, Songti SC',
    '黑体': 'SimHei, STHeiti, simhei',
    '仿宋': 'FangSong, STFangsong, simfang',
    '小标宋体': 'sSun',
    '方正小标宋_gbk': 'sSun',
    '仿宋_gb2312': 'FangSong, STFangsong, simfang',
    '楷体_gb2312': '楷体, KaiTi, Kai, simkai',
    'couriernew': 'Courier New',
    'courier new': 'Courier New',
};

export const getFontFamily = function (fontObj) {
    if (!fontObj) {
        return FONT_FAMILY['宋体']
    }
    let font = fontObj.FamilyName
    if (!font) {
        font = fontObj.FontName
    }
    if (FONT_FAMILY[font.toLowerCase()]) {
        font = FONT_FAMILY[font.toLowerCase()];
    }
    for (let key of Object.keys(FONT_FAMILY)) {
        if (font.toLowerCase().indexOf(key.toLowerCase()) != -1) {
            return FONT_FAMILY[key]
        }
    }
    return font;
}

export const parseStBox = function (obj) {
    if (obj) {
        let array = obj.split(' ');
        return {
            x: (parseFloat(array[0])), y: (parseFloat(array[1])),
            w: (parseFloat(array[2])), h: (parseFloat(array[3]))
        };
    } else {
        return null;
    }
}

export const parseCtm = function (ctm) {
    let array = ctm.split(' ');
    return array;
}

export const parseColor = function (color) {
    if (color && color.length > 0) {
        if (color.indexOf('#') !== -1) {
            color = color.replace(/#/g, '');
            color = color.replace(/ /g, '');
            color = '#' + color.toString();
            return color;
        }
        let array = color.split(' ');
        return `rgb(${array[0]}, ${array[1]}, ${array[2]})`
    } else {
        return `rgb(0, 0, 0)`
    }
}

export const converterBox = function (box) {
    return {
        x: converterDpi(box.x), y: converterDpi(box.y),
        w: converterDpi(box.w), h: converterDpi(box.h)
    };
}

export const Uint8ArrayToHexString = function (arr) {
    let words = [];
    let j = 0;
    for (let i = 0; i < arr.length * 2; i += 2) {
        words[i >>> 3] |= parseInt(arr[j], 10) << (24 - (i % 8) * 4);
        j++;
    }

    // 转换到16进制
    let hexChars = [];
    for (let i = 0; i < arr.length; i++) {
        let bite = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
        hexChars.push((bite >>> 4).toString(16));
        hexChars.push((bite & 0x0f).toString(16));
    }

    return hexChars.join('');
}

export const replaceFirstSlash = function (str) {
    if (str) {
        if (str.indexOf('/') === 0) {
            str = str.replace('/', '');
        }
    }
    return str;
}

export const replaceFirstTarget = function (str, target) {
    if (str) {
        if (str.indexOf(target) === 0) {
            str = str.replace(target, '');
        }
    }
    return str;
}

export const readUTF = function (arr) {
    if (typeof arr === 'string') {
        return arr;
    }
    var UTF = '', _arr = arr;
    for (var i = 0; i < _arr.length; i++) {
        var one = _arr[i].toString(2),
            v = one.match(/^1+?(?=0)/);
        if (v && one.length == 8) {
            var bytesLength = v[0].length;
            var store = _arr[i].toString(2).slice(7 - bytesLength);
            for (var st = 1; st < bytesLength; st++) {
                store += _arr[st + i].toString(2).slice(2)
            }
            UTF = `${UTF}${String.fromCharCode(parseInt(store, 2))}`;
            i += bytesLength - 1
        }
        else {
            // console.log((_arr[i].toString(2).length))
        //     UTF = `${UTF}${String.fromCharCode(_arr[i])}`
        }
    }
    return UTF
}
