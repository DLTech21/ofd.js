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


export const convertPathAbbreviatedDatatoPoint = abbreviatedData => {
    let array = abbreviatedData.split(' ');
    let pointList = [];
    let i = 0;
    while (i < array.length) {
        if (array[i] === 'M'|| array[i] === 'S') {
            let point = {
                'type': 'M',
                'x': parseFloat(array[i + 1]),
                'y': parseFloat(array[i + 2])
            }
            i = i + 3;
            pointList.push(point);
        }
        if (array[i] === 'L') {
            let point = {
                'type': 'L',
                'x': parseFloat(array[i + 1]),
                'y': parseFloat(array[i + 2])
            }
            i = i + 3;
            pointList.push(point);
        } else if (array[i] === 'C') {
            let point = {
                'type': 'C',
                'x': 0,
                'y': 0
            }
            pointList.push(point)
            i++;
        } else if (array[i] === 'B') {
            let point = {
                'type': 'B',
                'x1': parseFloat(array[i + 1]),
                'y1': parseFloat(array[i + 2]),
                'x2': parseFloat(array[i + 3]),
                'y2': parseFloat(array[i + 4]),
                'x3': parseFloat(array[i + 5]),
                'y3': parseFloat(array[i + 6])
            }
            i = i + 7;
            pointList.push(point);
        } else {
            i++;
        }
    }
    return pointList;
}

export const calPathPoint = function (abbreviatedPoint) {
    let pointList = [];

    for (let i = 0; i < abbreviatedPoint.length; i++) {
        let point = abbreviatedPoint[i];
        if (point.type === 'M' || point.type === 'L' || point.type === 'C') {
            let x = 0, y = 0;
            x = point.x;
            y = point.y;
            point.x = converterDpi(x);
            point.y = converterDpi(y);
            pointList.push(point);
        } else if (point.type === 'B') {
            let x1 = point.x1, y1 = point.y1;
            let x2 = point.x2, y2 = point.y2;
            let x3 = point.x3, y3 = point.y3;
            let realPoint = {
                'type': 'B', 'x1': converterDpi(x1), 'y1': converterDpi(y1),
                'x2': converterDpi(x2), 'y2': converterDpi(y2),
                'x3': converterDpi(x3), 'y3': converterDpi(y3)
            }
            pointList.push(realPoint);
        }
    }
    return pointList;
}

const millimetersToPixel = function (mm, dpi) {
    //毫米转像素：mm * dpi / 25.4
    return ((mm * dpi / 25.4));
}

let MaxScale = 10;

let Scale = MaxScale ;

export const setMaxPageScal = function (scale) {
    MaxScale = scale > 5 ? 5 : scale;
}

export const setPageScal = function (scale) {
    // scale = Math.ceil(scale);
    Scale = scale > 1 ? scale: 1;
    Scale = Scale > MaxScale ? MaxScale: Scale;
}

export const getPageScal = function () {
    return Scale;
}

export const converterDpi = function (width) {
    return millimetersToPixel(width, Scale*25.4);
}

export const deltaFormatter = function (delta) {
    if(delta.indexOf("g") === -1) {
        let floatList = [];
        for (let f of delta.split(' ')) {
            floatList.push(parseFloat(f));
        }
        return floatList;
    } else {
        const array = delta.split(' ');
        let gFlag = false;
        let gProcessing = false;
        let gItemCount = 0;
        let floatList = [];
        for (const s of array) {
            if ('g' === s) {
                gFlag = true;
            } else {
                if (!s || s.trim().length == 0) {
                    continue;
                }
                if (gFlag) {
                    gItemCount = parseInt(s);
                    gProcessing = true;
                    gFlag = false;
                } else if (gProcessing) {
                    for (let j = 0; j < gItemCount; j++) {
                        floatList.push(parseFloat(s));
                    }
                    gProcessing = false;
                } else {
                    floatList.push(parseFloat(s));
                }
            }
        }
        return floatList;
    }
}

export const calTextPoint = function (textCodes) {
    let x = 0;
    let y = 0;
    let textCodePointList = [];
    if (!textCodes) {
        return textCodePointList;
    }
    for (let textCode of textCodes) {
        if (!textCode) {
            continue
        }
        x = parseFloat(textCode['@_X']);
        y = parseFloat(textCode['@_Y']);

        if (isNaN(x)) {
            x = 0;
        }
        if (isNaN(y)) {
            y = 0;
        }

        let deltaXList = [];
        let deltaYList = [];
        if (textCode['@_DeltaX'] && textCode['@_DeltaX'].length > 0) {
            deltaXList = deltaFormatter(textCode['@_DeltaX']);
        }
        if (textCode['@_DeltaY'] && textCode['@_DeltaY'].length > 0) {
            deltaYList = deltaFormatter(textCode['@_DeltaY']);
        }
        let textStr = textCode['#text'];
        if (textStr) {
            textStr += '';
            textStr = decodeHtml(textStr);
            textStr = textStr.replace(/&#x20;/g, ' ');
            for (let i = 0; i < textStr.length; i++) {
                if (i > 0 && deltaXList.length > 0) {
                    x += deltaXList[(i - 1)];
                }
                if (i > 0 && deltaYList.length > 0) {
                    y += deltaYList[(i - 1)];
                }
                let text = textStr.substring(i, i + 1);
                let textCodePoint = {'x': converterDpi(x), 'y': converterDpi(y), 'text': text};
                textCodePointList.push(textCodePoint);
            }
        }
    }
    return textCodePointList;
}

export const replaceFirstSlash = function (str) {
    if (str) {
        if (str.indexOf('/') === 0) {
            str = str.replace('/', '');
        }
    }
    return str;
}

export const getExtensionByPath = function (path) {
    if (!path && typeof path !== "string") return "";
    return path.substring(path.lastIndexOf('.') + 1);
}


let REGX_HTML_DECODE = /&\w+;|&#(\d+);/g;

let HTML_DECODE = {
    "&lt;" : "<",
    "&gt;" : ">",
    "&amp;" : "&",
    "&nbsp;": " ",
    "&quot;": "\"",
    "&copy;": "",
    "&apos;": "'",
    // Add more
};

export const decodeHtml = function(s){
    s = (s != undefined) ? s : this.toString();
    return (typeof s != "string") ? s :
        s.replace(REGX_HTML_DECODE,
            function($0, $1){
                var c = HTML_DECODE[$0];
                if(c == undefined){
                    // Maybe is Entity Number
                    if(!isNaN($1)){
                        c = String.fromCharCode(($1 == 160) ? 32:$1);
                    }else{
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

export const getFontFamily = function (font) {
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
    if (color) {
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
