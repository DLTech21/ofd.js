export const convertPathAbbreviatedDatatoPoint = abbreviatedData => {
    let array = abbreviatedData.split(' ');
    let pointList = [];
    let i = 0;
    while (i < array.length) {
        if (array[i] === 'M') {
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
        if (point.type === 'M' || point.type === 'L') {
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

export const converterDpi = function (width) {
    return millimetersToPixel(width, 3.78*25.4);
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

export const calTextPoint = function (textCode) {
    let x = 0;
    let y = 0;
    let textCodePointList = [];
    // for (let textCode of textCodes) {
        x = parseFloat(textCode['@_X']);
        y = parseFloat(textCode['@_Y']);

        let deltaXList = [];
        let deltaYList = [];
        if (textCode['@_DeltaX'] && textCode['@_DeltaX'].length > 0) {
            deltaXList = deltaFormatter(textCode['@_DeltaX']);
        }
        if (textCode['@_DeltaY'] && textCode['@_DeltaY'].length > 0) {
            deltaYList = deltaFormatter(textCode['@_DeltaY']);
        }
        let textStr = textCode['#text']+'';
        textStr = textStr.replaceAll('&gt;','>');
        textStr = textStr.replaceAll('&lt;','<');
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
    // }
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


