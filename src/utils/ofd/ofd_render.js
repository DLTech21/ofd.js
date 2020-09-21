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
    const scale = ((screenWidth - 5) / parseFloat(array[2])).toFixed(1);
    setMaxPageScal(scale);
    setPageScal(scale);
    box = parseStBox( box);
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
    box = parseStBox( box);
    box = converterBox(box)
    return box;
}



export const renderPage = function (pageDiv, page, tpls, fontResObj, drawParamResObj, multiMediaResObj) {
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
            renderSealPage(pageDiv, stamp.obj.pages, stamp.obj.tpls, true, stamp.stamp.stampAnnot, stamp.obj.fontResObj, stamp.obj.drawParamResObj, stamp.obj.multiMediaResObj, stamp.stamp.sealObj.SES_Signature, stamp.stamp.signedInfo);
          } else if (stamp.type === 'png') {
              let sealBoundary = converterBox(stamp.obj.boundary);
              let element = renderImageOnDiv(pageDiv.style.width, pageDiv.style.height, stamp.obj.img, sealBoundary, stamp.obj.clip, true, stamp.stamp.sealObj.SES_Signature, stamp.stamp.signedInfo);
              pageDiv.appendChild(element);
          }
        }
    }
}

const renderSealPage = function (pageDiv, pages, tpls, isStampAnnot, stampAnnot, fontResObj, drawParamResObj, multiMediaResObj, SES_Signature, signedInfo) {
    for (const page of pages) {
        const pageId = Object.keys(page)[0];
        let stampAnnotBoundary = {x: 0, y: 0, w: 0, h: 0};
        if (isStampAnnot && stampAnnot) {
            stampAnnotBoundary = stampAnnot.boundary;
        }
        let divBoundary = converterBox(stampAnnotBoundary);
        let div = document.createElement('div');
        div.setAttribute("name","seal_img_div");
        div.setAttribute('style', `cursor: pointer; position:relative; left: ${divBoundary.x}px; top: ${divBoundary.y}px; width: ${divBoundary.w}px; height: ${divBoundary.h}px`)
        addEventOnSealDiv(div, SES_Signature, signedInfo);
        const template = page[pageId]['json']['ofd:Template'];
        if (template) {
            const layer = tpls[template['@_TemplateID']]['json']['ofd:Content']['ofd:Layer'];
            renderLayer(div, fontResObj, drawParamResObj, multiMediaResObj, layer,  isStampAnnot, stampAnnotBoundary);
        }
        const contentLayer = page[pageId]['json']['ofd:Content']['ofd:Layer'];
        renderLayer(div, fontResObj, drawParamResObj, multiMediaResObj, contentLayer, isStampAnnot, stampAnnotBoundary);
        pageDiv.appendChild(div);
    }
}

const addEventOnSealDiv = function (div, SES_Signature, signedInfo) {
    div.addEventListener("click",function(){
        document.getElementById('sealInfoDiv').hidden = false;
        document.getElementById('sealInfoDiv').setAttribute('style', 'display:flex;align-items: center;justify-content: center;');
        if(SES_Signature.toSign.version<4){
            console.log(signedInfo);
            document.getElementById('spSigner').innerText = SES_Signature.toSign.cert['commonName'];
            document.getElementById('spProvider').innerText = signedInfo['Provider']['ofd:ProviderName'];
            document.getElementById('spHashedValue').innerText = SES_Signature.toSign.dataHash.replace(/\n/g,'');
            document.getElementById('spSignedValue').innerText = SES_Signature.signature.replace(/\n/g,'');
            document.getElementById('spSignMethod').innerText = SES_Signature.toSign.signatureAlgorithm.replace(/\n/g,'');;
            document.getElementById('spSealID').innerText = SES_Signature.toSign.eseal.esealInfo.esID;
            document.getElementById('spSealName').innerText = SES_Signature.toSign.eseal.esealInfo.property.name;
            document.getElementById('spSealType').innerText = SES_Signature.toSign.eseal.esealInfo.property.type;
            document.getElementById('spSealAuthTime').innerText = "从 "+SES_Signature.toSign.eseal.esealInfo.property.validStart+" 到 "+SES_Signature.toSign.eseal.esealInfo.property.validEnd;
            document.getElementById('spSealMakeTime').innerText = SES_Signature.toSign.eseal.esealInfo.property.createDate;
            document.getElementById('spSealVersion').innerText = SES_Signature.toSign.eseal.esealInfo.header.version;
        }else{
            document.getElementById('spSigner').innerText = SES_Signature.cert['commonName'];
            document.getElementById('spProvider').innerText = signedInfo['Provider']['@_ProviderName'];
            document.getElementById('spHashedValue').innerText = SES_Signature.toSign.dataHash.replace(/\n/g,'');;
            document.getElementById('spSignedValue').innerText = SES_Signature.signature.replace(/\n/g,'');;
            document.getElementById('spSignMethod').innerText = SES_Signature.signatureAlgID.replace(/\n/g,'');;
            document.getElementById('spSealID').innerText = SES_Signature.toSign.eseal.esealInfo.esID;
            document.getElementById('spSealName').innerText = SES_Signature.toSign.eseal.esealInfo.property.name;
            document.getElementById('spSealType').innerText = SES_Signature.toSign.eseal.esealInfo.property.type;
            document.getElementById('spSealAuthTime').innerText = "从 "+SES_Signature.toSign.eseal.esealInfo.property.validStart+" 到 "+SES_Signature.toSign.eseal.esealInfo.property.validEnd;
            document.getElementById('spSealMakeTime').innerText = SES_Signature.toSign.eseal.esealInfo.property.createDate;
            document.getElementById('spSealVersion').innerText = SES_Signature.toSign.eseal.esealInfo.header.version;
        }
        document.getElementById('spVersion').innerText = SES_Signature.toSign.version;
        document.getElementById('VerifyRet').innerText = signedInfo['VerifyRet']?"签名值验证成功":"签名值验证失败";
    });
}

const renderLayer = function (pageDiv, fontResObj, drawParamResObj, multiMediaResObj, layer, isStampAnnot, stampAnnotBoundary) {
    stampAnnotBoundary = converterBox(stampAnnotBoundary);
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
    let boundary = parseStBox(imageObject['@_Boundary']);
    boundary = converterBox(boundary);
    const resId = imageObject['@_ResourceID'];
    if (multiMediaResObj[resId].format === 'gbig2') {
        const img = multiMediaResObj[resId].img;
        const width = multiMediaResObj[resId].width;
        const height = multiMediaResObj[resId].height;
        return renderImageOnCanvas(img, width, height, boundary);
    } else {
        return renderImageOnDiv(pageWidth, pageHeight, multiMediaResObj[resId].img, boundary, false);
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

export const renderImageOnDiv = function (pageWidth, pageHeight, imgSrc, boundary, clip, isStampAnnot, SES_Signature, signedInfo) {
    let div = document.createElement('div');
    if(isStampAnnot)
    {
        div.setAttribute("name","seal_img_div");
        addEventOnSealDiv(div, SES_Signature, signedInfo);
    }
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
        clip = converterBox(clip);
        c = `clip: rect(${clip.y}px, ${clip.w + clip.x}px, ${clip.h + clip.y}px, ${clip.x}px)`
    }
    div.setAttribute('style', `cursor: pointer; overflow: hidden; position: absolute; left: ${c ? boundary.x : boundary.x < 0 ? 0 : boundary.x}px; top: ${c ? boundary.y : boundary.y < 0 ? 0 : boundary.y}px; width: ${w}px; height: ${h}px; ${c}`)
    return div;
}

export const renderTextObject = function (fontResObj, textObject, defaultFillColor, defaultStrokeColor, isStampAnnot, stampAnnotBoundary) {
    let boundary = parseStBox(textObject['@_Boundary']);
    boundary = converterBox(boundary);
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
    let left = boundary.x;
    let top = boundary.y;
    svg.setAttribute('style', `position:absolute;width:${width}px;height:${height}px;left:${left}px;top:${top}px`);
    return svg;
}

export const renderPathObject = function (drawParamResObj, pathObject, defaultFillColor, defaultStrokeColor, defaultLineWith, isStampAnnot, stampAnnotBoundary) {
    let boundary = parseStBox(pathObject['@_Boundary']);
    boundary = converterBox(boundary);
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
    let left = boundary.x;
    let top = boundary.y;
    svg.setAttribute('style', `position:absolute;width:${width}px;height:${height}px;left:${left}px;top:${top}px`);
    return svg;
}
