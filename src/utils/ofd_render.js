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

import {
    calPathPoint,
    calTextPoint,
    converterDpi, convertPathAbbreviatedDatatoPoint,
    getFontFamily,
    parseColor,
    parseCtm,
    parseStBox,
    setPageScal
} from "@/utils/ofd_util";

export const renderPageBox = function (screenWidth, pages, document) {
    let pageBoxs = [];
    for (const page of pages) {
        let boxObj = {};
        boxObj['id'] = Object.keys(page)[0];
        boxObj['box'] = calPageBox(screenWidth, document, page);
        pageBoxs.push(boxObj);
    }
    return pageBoxs;
}

const calPageBox = function (screenWidth, document, page) {
    const area = page[Object.keys(page)[0]]['json']['ofd:Area'];
    let box;
    if (area) {
        const physicalBox = area['ofd:PhysicalBox']
        if (physicalBox) {
            box = (physicalBox);
        } else {
            const applicationBox = area['ofd:ApplicationBox']
            if (applicationBox) {
                box = (applicationBox);
            } else {
                const contentBox = area['ofd:ContentBox']
                if (contentBox) {
                    box = (contentBox);
                }
            }
        }
    } else {
        let documentArea = document['ofd:CommonData']['ofd:PageArea']
        const physicalBox = documentArea['ofd:PhysicalBox']
        if (physicalBox) {
            box = (physicalBox);
        } else {
            const applicationBox = documentArea['ofd:ApplicationBox']
            if (applicationBox) {
                box = (applicationBox);
            } else {
                const contentBox = documentArea['ofd:ContentBox']
                if (contentBox) {
                    box = (contentBox);
                }
            }
        }
    }
    box = parsePageBox(screenWidth, box);
    return box;
}

const parsePageBox = function (screenWidth, obj) {
    if (obj) {
        let array = obj.split(' ');
        let width = converterDpi(parseFloat(array[2]));
        if (width > screenWidth) {
            const scale = (screenWidth - 5) / parseFloat(array[2]);
            setPageScal(scale > 0 ? scale : 1);
        }
        return {
            x: converterDpi(parseFloat(array[0])), y: converterDpi(parseFloat(array[1])),
            w: converterDpi(parseFloat(array[2])), h: converterDpi(parseFloat(array[3]))
        };
    } else {
        return null;
    }
}

export const renderOfd = function (screenWidth, ofd) {
    let divArray = [];
    for (const page of ofd.pages) {
        let box = calPageBox(screenWidth, ofd.document, page);
        const pageId = Object.keys(page)[0];
        let pageDiv = document.createElement('div');
        pageDiv.id = pageId;
        pageDiv.setAttribute('style', `border: 1px solid rgb(199, 198, 198);position: relative;width:${box.w}px;height:${box.h}px`)
        renderPage(pageDiv, page, ofd.tpls, ofd.fontResObj, ofd.drawParamResObj, ofd.multiMediaResObj);
        divArray.push(pageDiv);
    }
    return divArray;
}

const renderPage = function (pageDiv, page, tpls, fontResObj, drawParamResObj, multiMediaResObj) {
    const pageId = Object.keys(page)[0];
    let stampAnnotBoundary = {x: 0, y: 0, w: 0, h: 0};
    const template = page[pageId]['json']['ofd:Template'];
    if (template) {
        const layer = tpls[template['@_TemplateID']]['json']['ofd:Content']['ofd:Layer'];
        renderLayer(pageDiv, fontResObj, drawParamResObj, multiMediaResObj, layer, false, stampAnnotBoundary);
    }
    const contentLayer = page[pageId]['json']['ofd:Content']['ofd:Layer'];
    renderLayer(pageDiv, fontResObj, drawParamResObj, multiMediaResObj, contentLayer, false, stampAnnotBoundary);
    if (page[pageId].stamp) {
        for (const stamp of page[pageId].stamp) {
          if (stamp.type === 'ofd') {
            renderSealPage(pageDiv, stamp.obj.pages, stamp.obj.tpls, true, stamp.stamp.stampAnnot, stamp.obj.fontResObj, stamp.obj.drawParamResObj, stamp.obj.multiMediaResObj);
          } else if (stamp.type === 'png') {
              let element = renderImageOnDiv(pageDiv.style.width, pageDiv.style.height, stamp.obj.img, stamp.obj.boundary, stamp.obj.clip);
              pageDiv.appendChild(element);
          }
        }
    }
}

const renderSealPage = function (pageDiv, pages, tpls, isStampAnnot, stampAnnot, fontResObj, drawParamResObj, multiMediaResObj) {
    for (const page of pages) {
        const pageId = Object.keys(page)[0];
        let stampAnnotBoundary = {x: 0, y: 0, w: 0, h: 0};
        if (isStampAnnot && stampAnnot) {
            stampAnnotBoundary = stampAnnot.boundary;
            console.log(stampAnnotBoundary)
        }
        const template = page[pageId]['json']['ofd:Template'];
        if (template) {
            const layer = tpls[template['@_TemplateID']]['json']['ofd:Content']['ofd:Layer'];
            renderLayer(pageDiv, fontResObj, drawParamResObj, multiMediaResObj, layer,  isStampAnnot, stampAnnotBoundary);
        }
        const contentLayer = page[pageId]['json']['ofd:Content']['ofd:Layer'];
        renderLayer(pageDiv, fontResObj, drawParamResObj, multiMediaResObj, contentLayer, isStampAnnot, stampAnnotBoundary);
    }
}

const renderLayer = function (pageDiv, fontResObj, drawParamResObj, multiMediaResObj, layer, isStampAnnot, stampAnnotBoundary) {
    let fillColor = null;
    let strokeColor = null;
    let lineWith = 0;
    const drawParam = layer['@_DrawParam'];
    if (drawParam && Object.keys(drawParamResObj).length > 0 && drawParamResObj[drawParam]) {
        fillColor = parseColor(drawParamResObj[drawParam]['FillColor']);
        strokeColor = parseColor(drawParamResObj[drawParam]['StrokeColor']);
        lineWith = converterDpi(drawParamResObj[drawParam]['LineWidth']);
    }
    const imageObjects = layer['ofd:ImageObject'];
    let imageObjectArray = [];
    imageObjectArray = imageObjectArray.concat(imageObjects);
    for (const imageObject of imageObjectArray) {
        if (imageObject) {
            let element = renderImageObject(pageDiv.style.width, pageDiv.style.height, multiMediaResObj, imageObject)
            pageDiv.appendChild(element);
        }
    }
    const pathObjects = layer['ofd:PathObject'];
    let pathObjectArray = [];
    pathObjectArray = pathObjectArray.concat(pathObjects);
    for (const pathObject of pathObjectArray) {
        if (pathObject) {
            let svg = renderPathObject(drawParamResObj, pathObject, null, strokeColor, lineWith, isStampAnnot, stampAnnotBoundary)
            pageDiv.appendChild(svg);
        }
    }
    const textObjects = layer['ofd:TextObject'];
    let textObjectArray = [];
    textObjectArray = textObjectArray.concat(textObjects);
    for (const textObject of textObjectArray) {
        if (textObject) {
            let svg = renderTextObject(fontResObj, textObject, fillColor, strokeColor, isStampAnnot, stampAnnotBoundary);
            pageDiv.appendChild(svg);
        }
    }
}

export const renderImageObject = function (pageWidth, pageHeight, multiMediaResObj, imageObject){
    const boundary = parseStBox(imageObject['@_Boundary']);
    const resId = imageObject['@_ResourceID'];
    if (multiMediaResObj[resId].format === 'gbig2') {
        const img = multiMediaResObj[resId].img;
        const width = multiMediaResObj[resId].width;
        const height = multiMediaResObj[resId].height;
        return renderImageOnCanvas(img, width, height, boundary);
    } else {
        return renderImageOnDiv(pageWidth, pageHeight, multiMediaResObj[resId].img, boundary);
    }
}

const renderImageOnCanvas = function (img, imgWidth, imgHeight, boundary){
    const arr = new Uint8ClampedArray(4 * imgWidth * imgHeight);
    for (var i = 0; i < img.length; i++) {
        arr[4 * i] = img[i];
        arr[4 * i + 1] = img[i];
        arr[4 * i + 2] = img[i];
        arr[4 * i + 3] = 255;
    }
    let imageData = new ImageData(arr, imgWidth, imgHeight);
    let canvas = document.createElement('canvas');
    canvas.width = imgWidth;
    canvas.height = imgHeight;
    let context = canvas.getContext('2d');
    context.putImageData(imageData, 0, 0);
    canvas.setAttribute('style', `left: ${boundary.x}px; top: ${boundary.y}px; width: ${boundary.w}px; height: ${boundary.h}px`)
    canvas.style.position = 'absolute';
    return canvas;
}

export const renderImageOnDiv = function (pageWidth, pageHeight, imgSrc, boundary, clip) {
    let div = document.createElement('div');
    let img = document.createElement('img');
    img.src = imgSrc;
    img.setAttribute('width', '100%');
    img.setAttribute('height', '100%');
    div.appendChild(img);
    const pw = parseFloat(pageWidth.replace('px', ''));
    const ph = parseFloat(pageHeight.replace('px', ''));
    const w = boundary.w > pw ? pw : boundary.w;
    const h = boundary.h > ph ? ph : boundary.h;
    let c;
    if (clip) {
        c = `clip: rect(${clip.y}px, ${clip.w + clip.x}px, ${clip.h + clip.y}px, ${clip.x}px)`
    }
    div.setAttribute('style', `overflow: hidden; position: absolute; left: ${c ? boundary.x : boundary.x < 0 ? 0 : boundary.x}px; top: ${c ? boundary.y : boundary.y < 0 ? 0 : boundary.y}px; width: ${w}px; height: ${h}px; ${c}`)
    return div;
}

export const renderTextObject = function (fontResObj, textObject, defaultFillColor, defaultStrokeColor, isStampAnnot, stampAnnotBoundary) {
    const boundary = parseStBox(textObject['@_Boundary']);
    const ctm = textObject['@_CTM'];
    const hScale = textObject['@_HScale'];
    const font = textObject['@_Font'];
    const weight = textObject['@_Weight'];
    const size = converterDpi(parseFloat(textObject['@_Size']));
    const textCode = textObject['ofd:TextCode'];
    const textCodePointList = calTextPoint(textCode);
    let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('version', '1.1');
    const fillColor = textObject['ofd:FillColor'];
    if (fillColor) {
        defaultFillColor = parseColor(fillColor['@_Value']);
    }
    for (const textCodePoint of textCodePointList) {
        if (!isNaN(textCodePoint.x)) {
            let text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', textCodePoint.x);
            text.setAttribute('y', textCodePoint.y);
            text.innerHTML = textCodePoint.text;
            if (ctm) {
                const ctms = parseCtm(ctm);
                text.setAttribute('transform', `matrix(${ctms[0]} ${ctms[1]} ${ctms[2]} ${ctms[3]} ${converterDpi(ctms[4])} ${converterDpi(ctms[5])})`)
            }
            if (hScale) {
                text.setAttribute('transform', `scale(${hScale}, 1)`)
                text.setAttribute('transform-origin', `${textCodePoint.x}`);
            }
            text.setAttribute('fill', defaultStrokeColor);
            text.setAttribute('fill', defaultFillColor);
            text.setAttribute('style', `font-weight: ${weight};font-size:${size}px;font-family: ${getFontFamily(fontResObj[font])};`)
            svg.appendChild(text);
        }

    }
    let width = boundary.w;
    let height = boundary.h;
    let left = stampAnnotBoundary.x + boundary.x;
    let top = stampAnnotBoundary.y + boundary.y;
    svg.setAttribute('style', `position:absolute;width:${width}px;height:${height}px;left:${left}px;top:${top}px`);
    return svg;
}

export const renderPathObject = function (drawParamResObj, pathObject, defaultFillColor, defaultStrokeColor, defaultLineWith, isStampAnnot, stampAnnotBoundary) {
    const boundary = parseStBox(pathObject['@_Boundary']);
    let lineWidth = pathObject['@_LineWidth'];
    const abbreviatedData = pathObject['ofd:AbbreviatedData'];
    const points = calPathPoint(convertPathAbbreviatedDatatoPoint(abbreviatedData));
    const ctm = pathObject['@_CTM'];
    let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('version', '1.1');
    let path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    if (lineWidth) {
        defaultLineWith = converterDpi(lineWidth);
    }
    const drawParam = pathObject['@_DrawParam'];
    if (drawParam) {
        lineWidth = drawParamResObj[drawParam].LineWidth;
        if (lineWidth) {
            defaultLineWith = converterDpi(lineWidth);
        }
    }
    if (ctm) {
        const ctms = parseCtm(ctm);
        path.setAttribute('transform', `matrix(${ctms[0]} ${ctms[1]} ${ctms[2]} ${ctms[3]} ${converterDpi(ctms[4])} ${converterDpi(ctms[5])})`)
    }
    let strokeStyle = '';
    const strokeColor = pathObject['ofd:StrokeColor'];
    if (strokeColor) {
        defaultStrokeColor = parseColor(strokeColor['@_Value'])
    }
    let fillStyle = 'fill: none;';
    const fillColor = pathObject['ofd:FillColor'];
    if (fillColor) {
        defaultFillColor = parseColor(fillColor['@_Value'])
    }
    if (defaultLineWith > 0 && !defaultStrokeColor) {
        defaultStrokeColor = defaultFillColor;
        if (!defaultStrokeColor) {
            defaultStrokeColor = 'rgb(0, 0, 0)';
        }
    }
    strokeStyle = `stroke:${defaultStrokeColor};stroke-width:${defaultLineWith}px;`;
    fillStyle = `fill:${isStampAnnot ? 'none' : defaultFillColor ? defaultFillColor : 'none'};`;
    path.setAttribute('style', `${strokeStyle};${fillStyle}`)
    let d = '';
    for (const point of points) {
        if (point.type === 'M') {
            d += `M${point.x} ${point.y} `;
        } else if (point.type === 'L') {
            d += `L${point.x} ${point.y} `;
        } else if (point.type === 'B') {
            d += `C${point.x1} ${point.y1} ${point.x2} ${point.y2} ${point.x3} ${point.y3} `;
        } else if (point.type === 'C') {
            d += `Z`;
        }
    }
    path.setAttribute('d', d);
    svg.appendChild(path);
    let width = isStampAnnot ? boundary.w : Math.ceil(boundary.w);
    let height = isStampAnnot ? boundary.h : Math.ceil(boundary.h);
    let left = stampAnnotBoundary.x + boundary.x;
    let top = stampAnnotBoundary.y + boundary.y;
    svg.setAttribute('style', `position:absolute;width:${width}px;height:${height}px;left:${left}px;top:${top}px`);
    return svg;
}
