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
    setPageScal,
    converterBox, setMaxPageScal,
} from "@/utils/ofd/ofd_util";

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

export const calPageBox = function (screenWidth, document, page) {
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
    let array = box.split(' ');
    const scale = ((screenWidth - 10) / parseFloat(array[2])).toFixed(1);
    setMaxPageScal(scale);
    setPageScal(scale);
    box = parseStBox(box);
    box = converterBox(box)
    return box;
}

export const calPageBoxScale = function (document, page) {
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
    box = parseStBox(box);
    box = converterBox(box)
    return box;
}


export const renderPage = function (pageDiv, page, tpls, fontResObj, drawParamResObj, multiMediaResObj, compositeGraphicUnits) {
    const pageId = Object.keys(page)[0];
    const template = page[pageId]['json']['ofd:Template'];
    if (template) {
        let array = [];
        const layers = tpls[template['@_TemplateID']]['json']['ofd:Content']['ofd:Layer'];
        array = array.concat(layers);
        for (let layer of array) {
            if (layer) {
                renderLayer(pageDiv, fontResObj, drawParamResObj, multiMediaResObj, compositeGraphicUnits, layer, false);
            }
        }
    }
    const contentLayers = page[pageId]['json']['ofd:Content']['ofd:Layer'];
    let array = [];
    array = array.concat(contentLayers);
    for (let contentLayer of array) {
        if (contentLayer) {
            renderLayer(pageDiv, fontResObj, drawParamResObj, multiMediaResObj, compositeGraphicUnits, contentLayer, false);
        }
    }
    if (page[pageId].stamp) {
        const fixIndex = page[pageId].json.pfIndex;
        for (const stamp of page[pageId].stamp) {
            if (stamp.type === 'ofd') {
                renderSealPage(pageDiv, stamp.obj.pages, stamp.obj.tpls, true, stamp.stamp.stampAnnot, stamp.obj.fontResObj, stamp.obj.drawParamResObj, stamp.obj.multiMediaResObj, compositeGraphicUnits, stamp.stamp.sealObj.SES_Signature, stamp.stamp.signedInfo, fixIndex);
            } else if (stamp.type === 'png') {
                let sealBoundary = converterBox(stamp.obj.boundary);
                const oid = (Array.isArray(stamp.stamp.stampAnnot) ? stamp.stamp.stampAnnot[0]['@_ID'] : stamp.stamp.stampAnnot['@_ID']) + fixIndex;
                let element = renderImageOnDiv(pageDiv.style.width, pageDiv.style.height, stamp.obj.img, sealBoundary, stamp.obj.clip, true, stamp.stamp.sealObj.SES_Signature, stamp.stamp.signedInfo, oid);
                pageDiv.appendChild(element);
            }
        }
    }
    if (page[pageId].annotation) {
        const fixIndex = page[pageId].json.pfIndex;
        for (const annotation of page[pageId].annotation) {
            renderAnnotation(pageDiv, annotation, fontResObj, drawParamResObj, multiMediaResObj, compositeGraphicUnits, fixIndex);
        }
    }
}

const renderAnnotation = function (pageDiv, annotation, fontResObj, drawParamResObj, multiMediaResObj, compositeGraphicUnits, fixIndex) {
    let div = document.createElement('div');
    div.setAttribute('style', `overflow: hidden;z-index:${annotation['@_ID'] + fixIndex};position:relative;`)
    let boundary = annotation['appearance']['@_Boundary'];
    if (boundary) {
        let divBoundary = converterBox(parseStBox(boundary));
        div.setAttribute('style', `overflow: hidden;z-index:${annotation['@_ID'] + fixIndex};position:absolute; left: ${divBoundary.x}px; top: ${divBoundary.y}px; width: ${divBoundary.w}px; height: ${divBoundary.h}px`)
    }
    const contentLayer = annotation['appearance'];
    renderLayer(div, fontResObj, drawParamResObj, multiMediaResObj, compositeGraphicUnits, contentLayer, false);
    pageDiv.appendChild(div);

}

const renderSealPage = function (pageDiv, pages, tpls, isStampAnnot, stampAnnot, fontResObj, drawParamResObj, multiMediaResObj, compositeGraphicUnits, SES_Signature, signedInfo, fixIndex) {
    for (const page of pages) {
        const pageId = Object.keys(page)[0];
        let stampAnnotBoundary = {x: 0, y: 0, w: 0, h: 0};
        if (isStampAnnot && stampAnnot) {
            stampAnnotBoundary = stampAnnot.boundary;
        }
        let divBoundary = converterBox(stampAnnotBoundary);
        let div = document.createElement('div');
        div.setAttribute("name", "seal_img_div");
        div.setAttribute('style', `z-index:${fixIndex + 10000};cursor: pointer; position:relative; left: ${divBoundary.x}px; top: ${divBoundary.y}px; width: ${divBoundary.w}px; height: ${divBoundary.h}px`)
        div.setAttribute('data-ses-signature', `${JSON.stringify(SES_Signature)}`);
        div.setAttribute('data-signed-info', `${JSON.stringify(signedInfo)}`);
        const template = page[pageId]['json']['ofd:Template'];
        if (template) {
            const layers = tpls[template['@_TemplateID']]['json']['ofd:Content']['ofd:Layer'];
            let array = [];
            array = array.concat(layers);
            for (let layer of array) {
                if (layer) {
                    renderLayer(div, fontResObj, drawParamResObj, multiMediaResObj, compositeGraphicUnits, layer, isStampAnnot);
                }
            }
        }
        const contentLayers = page[pageId]['json']['ofd:Content']['ofd:Layer'];
        let array = [];
        array = array.concat(contentLayers);
        for (let contentLayer of array) {
            if (contentLayer) {
                renderLayer(div, fontResObj, drawParamResObj, multiMediaResObj, compositeGraphicUnits, contentLayer, isStampAnnot);
            }
        }
        pageDiv.appendChild(div);
    }
}

const renderLayer = function (pageDiv, fontResObj, drawParamResObj, multiMediaResObj, compositeGraphicUnits, layer, isStampAnnot, compositeObjectAlpha, compositeObjectBoundary, compositeObjectCTM) {
    let fillColor = null;
    let strokeColor = null;
    let lineWith = converterDpi(0.353);
    let drawParam = layer['@_DrawParam'];
    if (drawParam && Object.keys(drawParamResObj).length > 0 && drawParamResObj[drawParam]) {
        if (drawParamResObj[drawParam]['relative']) {
            drawParam = drawParamResObj[drawParam]['relative'];
            if (drawParamResObj[drawParam]['FillColor']) {
                fillColor = parseColor(drawParamResObj[drawParam]['FillColor']);
            }
            if (drawParamResObj[drawParam]['StrokeColor']) {
                strokeColor = parseColor(drawParamResObj[drawParam]['StrokeColor']);
            }
            if (drawParamResObj[drawParam]['LineWidth']) {
                lineWith = converterDpi(drawParamResObj[drawParam]['LineWidth']);
            }
        }
        if (drawParamResObj[drawParam]['FillColor']) {
            fillColor = parseColor(drawParamResObj[drawParam]['FillColor']);
        }
        if (drawParamResObj[drawParam]['StrokeColor']) {
            strokeColor = parseColor(drawParamResObj[drawParam]['StrokeColor']);
        }
        if (drawParamResObj[drawParam]['LineWidth']) {
            lineWith = converterDpi(drawParamResObj[drawParam]['LineWidth']);
        }
    }
    const imageObjects = layer['ofd:ImageObject'];
    let imageObjectArray = [];
    imageObjectArray = imageObjectArray.concat(imageObjects);
    for (const imageObject of imageObjectArray) {
        if (imageObject) {
            let element = renderImageObject(pageDiv.style.width, pageDiv.style.height, multiMediaResObj, imageObject, isStampAnnot, compositeObjectBoundary)
            pageDiv.appendChild(element);
        }
    }
    const pathObjects = layer['ofd:PathObject'];
    let pathObjectArray = [];
    pathObjectArray = pathObjectArray.concat(pathObjects);
    for (const pathObject of pathObjectArray) {
        if (pathObject) {
            let svg = renderPathObject(drawParamResObj, pathObject, fillColor, strokeColor, lineWith, isStampAnnot, compositeObjectAlpha, compositeObjectBoundary, compositeObjectCTM)
            pageDiv.appendChild(svg);
        }
    }
    const textObjects = layer['ofd:TextObject'];
    let textObjectArray = [];
    textObjectArray = textObjectArray.concat(textObjects);
    for (const textObject of textObjectArray) {
        if (textObject) {
            let svg = renderTextObject(fontResObj, textObject, fillColor, strokeColor);
            pageDiv.appendChild(svg);
        }
    }
    const compositeObjects = layer['ofd:CompositeObject'];
    let compositeObjectArray = [];
    compositeObjectArray = compositeObjectArray.concat(compositeObjects);
    for (const compositeObject of compositeObjectArray) {
        if (compositeObject) {
            for (const compositeGraphicUnit of compositeGraphicUnits) {
                if (compositeGraphicUnit['@_ID'] === compositeObject['@_ResourceID']) {
                    const currentCompositeObjectAlpha = compositeObject['@_Alpha'];
                    const currentCompositeObjectBoundary = compositeObject['@_Boundary'];
                    const currentCompositeObjectCTM = compositeObject['@_CTM'];
                    renderLayer(pageDiv, fontResObj, drawParamResObj, multiMediaResObj, compositeGraphicUnits, compositeGraphicUnit['ofd:Content'], false, currentCompositeObjectAlpha, currentCompositeObjectBoundary, currentCompositeObjectCTM);
                    break;
                }
            }
        }
    }
    const pageBlocks = layer['ofd:PageBlock'];
    let pageBlockArray = [];
    pageBlockArray = pageBlockArray.concat(pageBlocks);
    for (const pageBlock of pageBlockArray) {
        if (pageBlock) {
            renderLayer(pageDiv, fontResObj, drawParamResObj, multiMediaResObj, compositeGraphicUnits, pageBlock, isStampAnnot);
        }
    }
}

export const renderImageObject = function (pageWidth, pageHeight, multiMediaResObj, imageObject, isStampAnnot, compositeObjectBoundary) {
    let boundary = parseStBox(imageObject['@_Boundary']);
    boundary = converterBox(boundary);
    const resId = imageObject['@_ResourceID'];
    if (multiMediaResObj[resId].format === 'gbig2') {
        const img = multiMediaResObj[resId].img;
        const width = multiMediaResObj[resId].width;
        const height = multiMediaResObj[resId].height;
        return renderImageOnCanvas(img, width, height, boundary, imageObject['@_ID']);
    } else {
        const ctm = imageObject['@_CTM'];
        return renderImageOnDiv(pageWidth, pageHeight, multiMediaResObj[resId].img, boundary, false, isStampAnnot, null, null, imageObject['@_ID'], ctm, compositeObjectBoundary);
    }
}

const renderImageOnCanvas = function (img, imgWidth, imgHeight, boundary, oid) {
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
    canvas.setAttribute('style', `left: ${boundary.x}px; top: ${boundary.y}px; width: ${boundary.w}px; height: ${boundary.h}px;z-index: ${oid}`)
    canvas.style.position = 'absolute';
    return canvas;
}

export const renderImageOnDiv = function (pageWidth, pageHeight, imgSrc, boundary, clip, isStampAnnot, SES_Signature, signedInfo, oid, ctm, compositeObjectBoundary) {
    let div = document.createElement('div');
    if (isStampAnnot) {
        div.setAttribute("name", "seal_img_div");
        div.setAttribute('data-ses-signature', `${JSON.stringify(SES_Signature)}`);
        div.setAttribute('data-signed-info', `${JSON.stringify(signedInfo)}`);
    }
    let img = document.createElement('img');
    img.src = imgSrc;
    if (isStampAnnot) {
        img.setAttribute('width', '100%');
        img.setAttribute('height', '100%');
    }
    if (ctm) {
        const ctms = parseCtm(ctm);
        img.setAttribute('width', `${converterDpi(ctms[0])}px`);
        img.setAttribute('height', `${converterDpi(ctms[3])}px`);
        img.setAttribute('transform', `matrix(${ctms[0]} ${ctms[1]} ${ctms[2]} ${ctms[3]} ${converterDpi(ctms[4])} ${converterDpi(ctms[5])})`)
    }
    if (compositeObjectBoundary) {
        img.setAttribute('width', '100%');
        img.setAttribute('height', '100%');
        img.removeAttribute('transform');
    }
    div.appendChild(img);
    const pw = parseFloat(pageWidth.replace('px', ''));
    const ph = parseFloat(pageHeight.replace('px', ''));
    const w = boundary.w > pw ? pw : boundary.w;
    const h = boundary.h > ph ? ph : boundary.h;
    let c = '';
    if (clip) {
        clip = converterBox(clip);
        c = `clip: rect(${clip.y}px, ${clip.w + clip.x}px, ${clip.h + clip.y}px, ${clip.x}px)`
    }
    div.setAttribute('style', `cursor: pointer; overflow: hidden; position: absolute; left: ${c ? boundary.x : boundary.x < 0 ? 0 : boundary.x}px; top: ${c ? boundary.y : boundary.y < 0 ? 0 : boundary.y}px; width: ${w}px; height: ${h}px; ${c};z-index: ${oid}`)
    return div;
}

export const renderTextObject = function (fontResObj, textObject, defaultFillColor, defaultStrokeColor) {
    let defaultFillOpacity = 1;
    let boundary = parseStBox(textObject['@_Boundary']);
    boundary = converterBox(boundary);
    const ctm = textObject['@_CTM'];
    const hScale = textObject['@_HScale'];
    const font = textObject['@_Font'];
    const weight = textObject['@_Weight'];
    const size = converterDpi(parseFloat(textObject['@_Size']));
    let array = [];
    array = array.concat(textObject['ofd:TextCode']);
    const textCodePointList = calTextPoint(array);
    let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('version', '1.1');
    const fillColor = textObject['ofd:FillColor'];
    let isAxialShd = false;
    if (fillColor) {
        if (fillColor['@_Value']) {
            defaultFillColor = parseColor(fillColor['@_Value']);
        }
        let alpha = fillColor['@_Alpha'];
        if (alpha) {
            defaultFillOpacity = alpha > 1 ? alpha / 255 : alpha;
        }
        const AxialShd = fillColor['ofd:AxialShd'];
        if (AxialShd) {
            isAxialShd = true;
            let linearGradient = document.createElement('linearGradient');
            linearGradient.setAttribute('id', `${textObject['@_ID']}`);
            linearGradient.setAttribute('x1', '0%');
            linearGradient.setAttribute('y1', '0%');
            linearGradient.setAttribute('x2', '100%');
            linearGradient.setAttribute('y2', '100%');
            for (const segment of AxialShd['ofd:Segment']) {
                if (segment) {
                    let stop = document.createElement('stop');
                    stop.setAttribute('offset', `${segment['@_Position']*100}%`);
                    stop.setAttribute('style', `stop-color:${parseColor(segment['ofd:Color']['@_Value'])};stop-opacity:1`);
                    linearGradient.appendChild(stop);
                    defaultFillColor = parseColor(segment['ofd:Color']['@_Value']);
                }
            }
            svg.appendChild(linearGradient);

        }
    }
    for (const textCodePoint of textCodePointList) {
        if (textCodePoint && !isNaN(textCodePoint.x)) {
            let text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', textCodePoint.x);
            text.setAttribute('y', textCodePoint.y);
            text.innerHTML = textCodePoint.text;
            if (ctm) {
                const ctms = parseCtm(ctm);
                text.setAttribute('transform', `matrix(${ctms[0]} ${ctms[1]} ${ctms[2]} ${ctms[3]} ${converterDpi(ctms[4])} ${converterDpi(ctms[5])})`)
            }
            if (hScale) {
                text.setAttribute('transform', `matrix(${hScale}, 0, 0, 1, ${(1 - hScale) * textCodePoint.x}, 0)`)
                // text.setAttribute('transform-origin', `${textCodePoint.x}`);
            }
            if (isAxialShd) {
                text.setAttribute('fill', defaultFillColor);
            } else {
                text.setAttribute('fill', defaultStrokeColor);
                text.setAttribute('fill', defaultFillColor);
                text.setAttribute('fill-opacity', defaultFillOpacity);
            }
            text.setAttribute('style', `font-weight: ${weight};font-size:${size}px;font-family: ${getFontFamily(fontResObj[font])};`)
            svg.appendChild(text);
        }

    }
    let width = boundary.w;
    let height = boundary.h;
    let left = boundary.x;
    let top = boundary.y;
    svg.setAttribute('style', `overflow:visible;position:absolute;width:${width}px;height:${height}px;left:${left}px;top:${top}px;z-index:${textObject['@_ID']}`);
    return svg;
}

export const renderPathObject = function (drawParamResObj, pathObject, defaultFillColor, defaultStrokeColor, defaultLineWith, isStampAnnot, compositeObjectAlpha, compositeObjectBoundary, compositeObjectCTM) {
    let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('version', '1.1');
    let boundary = parseStBox(pathObject['@_Boundary']);
    if (!boundary)
        return svg;
    boundary = converterBox(boundary);
    let lineWidth = pathObject['@_LineWidth'];
    const abbreviatedData = pathObject['ofd:AbbreviatedData'];
    const points = calPathPoint(convertPathAbbreviatedDatatoPoint(abbreviatedData));
    const ctm =  pathObject['@_CTM'];
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
    const strokeColor = pathObject['ofd:StrokeColor'];
    let isStrokeAxialShd = false;
    if (strokeColor) {
        if (strokeColor['@_Value']) {
            defaultStrokeColor = parseColor(strokeColor['@_Value'])
        }
        const AxialShd = strokeColor['ofd:AxialShd'];
        if (AxialShd) {
            isStrokeAxialShd = true;
            let linearGradient = document.createElement('linearGradient');
            linearGradient.setAttribute('id', `${pathObject['@_ID']}`);
            linearGradient.setAttribute('x1', '0%');
            linearGradient.setAttribute('y1', '0%');
            linearGradient.setAttribute('x2', '100%');
            linearGradient.setAttribute('y2', '100%');
            for (const segment of AxialShd['ofd:Segment']) {
                if (segment) {
                    let stop = document.createElement('stop');
                    stop.setAttribute('offset', `${segment['@_Position']*100}%`);
                    stop.setAttribute('style', `stop-color:${parseColor(segment['ofd:Color']['@_Value'])};stop-opacity:1`);
                    linearGradient.appendChild(stop);
                    defaultStrokeColor = parseColor(segment['ofd:Color']['@_Value']);
                }
            }
            svg.appendChild(linearGradient);
        }
    }
    const fillColor = pathObject['ofd:FillColor'];
    let isFillAxialShd = false;
    if (fillColor) {
        if (fillColor['@_Value']) {
            defaultFillColor = parseColor(fillColor['@_Value'])
        }
        const AxialShd = fillColor['ofd:AxialShd'];
        if (AxialShd) {
            isFillAxialShd = true;
            let linearGradient = document.createElement('linearGradient');
            linearGradient.setAttribute('id', `${pathObject['@_ID']}`);
            linearGradient.setAttribute('x1', '0%');
            linearGradient.setAttribute('y1', '0%');
            linearGradient.setAttribute('x2', '100%');
            linearGradient.setAttribute('y2', '100%');
            for (const segment of AxialShd['ofd:Segment']) {
                if (segment) {
                    let stop = document.createElement('stop');
                    stop.setAttribute('offset', `${segment['@_Position']*100}%`);
                    stop.setAttribute('style', `stop-color:${parseColor(segment['ofd:Color']['@_Value'])};stop-opacity:1`);
                    linearGradient.appendChild(stop);
                    defaultFillColor = parseColor(segment['ofd:Color']['@_Value']);
                }
            }
            svg.appendChild(linearGradient);
        }
    }
    if (defaultLineWith > 0 && !defaultStrokeColor) {
        defaultStrokeColor = defaultFillColor;
        if (!defaultStrokeColor) {
            defaultStrokeColor = 'rgb(0, 0, 0)';
        }
    }
    if (compositeObjectAlpha) {
        path.setAttribute('fill-opacity', `${compositeObjectAlpha / 255}`);
    }
    if (pathObject['@_Stroke'] != 'false') {
        path.setAttribute('stroke', `${defaultStrokeColor}`);
        path.setAttribute('stroke-width', `${defaultLineWith}px`);
        // if (isStrokeAxialShd) {
        //     path.setAttribute('stroke', `url(#${pathObject['@_ID']})`);
        // }
    }
    if (pathObject['@_Fill'] != 'false') {
        path.setAttribute('fill', `${isStampAnnot ? 'none' : defaultFillColor ? defaultFillColor : 'none'}`);
        // if (isFillAxialShd) {
        //     path.setAttribute('fill', `url(#${pathObject['@_ID']})`);
        // }
    }
    if (pathObject['@_Join']) {
        path.setAttribute('stroke-linejoin', `${pathObject['@_Join']}`);
    }
    if (pathObject['@_Cap']) {
        path.setAttribute('stroke-linecap', `${pathObject['@_Cap']}`);
    }
    if (pathObject['@_DashPattern']) {
        let dash = pathObject['@_DashPattern'];
        const dashs = parseCtm(dash);
        let offset = 0;
        if (pathObject['@_DashOffset']) {
            offset = pathObject['@_DashOffset'];
        }
        path.setAttribute('stroke-dasharray', `${converterDpi(dashs[0])},${converterDpi(dashs[1])}`);
        path.setAttribute('stroke-dashoffset', `${converterDpi(offset)}px`);
    }
    let d = '';
    for (const point of points) {
        if (point.type === 'M') {
            d += `M${point.x} ${point.y} `;
        } else if (point.type === 'L') {
            d += `L${point.x} ${point.y} `;
        } else if (point.type === 'B') {
            d += `C${point.x1} ${point.y1} ${point.x2} ${point.y2} ${point.x3} ${point.y3} `;
        } else if (point.type === 'Q') {
            d += `Q${point.x1} ${point.y1} ${point.x2} ${point.y2} `;
        } else if (point.type === 'A') {
            d += `A${point.rx},${point.ry} ${point.rotation} ${point.arc},${point.sweep} ${point.x},${point.y}`;
        } else if (point.type === 'C') {
            d += `Z`;
        }
    }
    path.setAttribute('d', d);
    svg.appendChild(path);
    let width = isStampAnnot ? boundary.w : Math.ceil(boundary.w);
    let height = isStampAnnot ? boundary.h : Math.ceil(boundary.h);
    let left = boundary.x;
    let top = boundary.y;
    svg.setAttribute('style', `overflow:visible;position:absolute;width:${width}px;height:${height}px;left:${left}px;top:${top}px;z-index:${pathObject['@_ID']}`);
    if (compositeObjectBoundary) {
        let comSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        comSvg.setAttribute('version', '1.1');
        let boundary = parseStBox(compositeObjectBoundary);
        boundary = converterBox(boundary);
        let width = Math.ceil(boundary.w);
        let height = Math.ceil(boundary.h);
        let left = boundary.x;
        let top = boundary.y;
        comSvg.setAttribute('style', `overflow:hidden;position:absolute;width:${width}px;height:${height}px;left:${left}px;top:${top}px;z-index:${pathObject['@_ID']}`);
        if (compositeObjectCTM) {
            const ctms = parseCtm(compositeObjectCTM);
            svg.setAttribute('transform', `matrix(${ctms[0]} ${ctms[1]} ${ctms[2]} ${ctms[3]} ${converterDpi(ctms[4])} ${converterDpi(ctms[5])})`)
        }
        comSvg.appendChild(svg);
        return comSvg;
    }
    return svg;
}
