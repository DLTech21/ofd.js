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
    calTextPoint,
    converterDpi,
    getFontFamily,
    parseColor,
    parseCtm,
    parseStBox,
    setPageScal,
    converterBox, setMaxPageScal, ctmImageScale,
} from "@/utils/ofd/ofd_util";

import {
    base64DecodeToUint8Array, base64EncodeByByte,
    FT_Glyph_Get_Measure, JSConvertJb2InfoByBase64, JSGetImageInfoByBase64,
    loadFaceInfo,
} from "@/utils/ofd/Fonts";

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
    const area = page['Page']['Area'];
    let box;
    if (area) {
        const physicalBox = area['PhysicalBox']
        if (physicalBox) {
            box = physicalBox;
        } else {
            const applicationBox = area['ApplicationBox']
            if (applicationBox) {
                box = applicationBox;
            } else {
                const contentBox = area['ContentBox']
                if (contentBox) {
                    box = contentBox;
                }
            }
        }
    } else {
        let documentArea = document['CommonData']['PageArea']
        const physicalBox = documentArea['PhysicalBox']
        if (physicalBox) {
            box = (physicalBox);
        } else {
            const applicationBox = documentArea['ApplicationBox']
            if (applicationBox) {
                box = (applicationBox);
            } else {
                const contentBox = documentArea['ContentBox']
                if (contentBox) {
                    box = (contentBox);
                }
            }
        }
    }
    const scale = ((screenWidth - 10) / parseFloat(box.w)).toFixed(1);
    setMaxPageScal(scale);
    setPageScal(scale);
    box = converterBox(box)
    return box;
}

export const calPageBoxScale = function (document, page) {
    const area = page[Object.keys(page)[0]]['Area'];
    let box;
    if (area) {
        const physicalBox = area['PhysicalBox']
        if (physicalBox) {
            box = (physicalBox);
        } else {
            const applicationBox = area['ApplicationBox']
            if (applicationBox) {
                box = (applicationBox);
            } else {
                const contentBox = area['ContentBox']
                if (contentBox) {
                    box = (contentBox);
                }
            }
        }
    } else {
        let documentArea = document['CommonData']['PageArea']
        const physicalBox = documentArea['PhysicalBox']
        if (physicalBox) {
            box = (physicalBox);
        } else {
            const applicationBox = documentArea['ApplicationBox']
            if (applicationBox) {
                box = (applicationBox);
            } else {
                const contentBox = documentArea['ContentBox']
                if (contentBox) {
                    box = (contentBox);
                }
            }
        }
    }
    box = converterBox(box)
    return box;
}

const getFont = function (Fonts, resId) {
    for (let font of Fonts) {
        if (font.ID == resId) {
            return font
        }
    }
}

const getMultiMedia = function (MultiMedias, resId) {
    for (let media of MultiMedias) {
        if (media.ID == resId) {
            return media
        }
    }
}

const getDrawParam = function (DrawParams, resId) {
    for (let drawparam of DrawParams) {
        if (drawparam.ID == resId) {
            return drawparam
        }
    }
}

export const renderPage = function (pageDiv, page, ofdDocument) {
    const template = page.Page.Template;
    const Annotations = ofdDocument['Annotations'];
    const TemplatePage = ofdDocument['CommonData']['TemplatePage'];
    const Signatures = ofdDocument['Signatures']['Signature'];
    // const documentResArray = ofdDocument['CommonData']['DocumentRes'];
    // const publicResArray = ofdDocument['CommonData']['PublicRes'];
    let Fonts = ofdDocument['CommonData']['Res']['Fonts'];
    let DrawParams = ofdDocument['CommonData']['Res']['DrawParams'];
    let ColorSpaces = ofdDocument['CommonData']['Res']['ColorSpaces'];
    let CompositeGraphicUnits = ofdDocument['CommonData']['Res']['CompositeGraphicUnits'];
    let MultiMedias = ofdDocument['CommonData']['Res']['MultiMedias'];
    if (template) {
        for (let t of template) {
            for (let ct of TemplatePage) {
                if (ct.ID == t['TemplateID']) {
                    if (ct['Page']['Content']) {
                        const contentLayers = ct['Page']['Content']['Layer'];
                        for (let contentLayer of contentLayers) {
                            renderLayer(pageDiv, Fonts, DrawParams, MultiMedias, CompositeGraphicUnits, contentLayer, false);
                        }
                    }
                    break
                }
            }
        }
    }

    if (page['Page']['Content']) {
        const contentLayers = page['Page']['Content']['Layer'];
        for (let contentLayer of contentLayers) {
            renderLayer(pageDiv, Fonts, DrawParams, MultiMedias, CompositeGraphicUnits, contentLayer, false);
        }
    }

    for (let sign of Signatures) {
        for (let stamp of sign['Signature']['SignedInfo']['StampAnnot']) {
            const pageRef = stamp['PageRef'];
            if (page.ID == pageRef) {
                const boundary = stamp['Boundary'];
                if (sign.Signature.PicType === 'ofd') {
                    let sealOfd = sign.Signature.ofd.Document[0];
                    for (let i = 0; i < sealOfd.Pages.length; i++) {
                        const sealPage = sealOfd.Pages[i];
                        renderSealPage(pageDiv, sealPage, sealOfd, true, boundary, pageRef, stamp.ID);
                    }
                } else {
                    let sealBoundary = converterBox(boundary);
                    let img = `data:image/${sign.Signature.picType};base64,${sign.Signature.PicValue}`;
                    let element = renderImageOnDiv(pageDiv.style.width, pageDiv.style.height, img, sealBoundary.w, sealBoundary.h, sealBoundary, stamp.Clip, true, pageRef, stamp.ID);
                    pageDiv.appendChild(element);
                }
                break
            }
        }
    }

    for (let pageAnnot of Annotations) {
        if (page.ID == pageAnnot.PageID) {
            for (let anno of pageAnnot.PageAnnot.Annot) {
                // console.log(anno)
                renderAnnotation(pageDiv, anno, Fonts, DrawParams, MultiMedias, CompositeGraphicUnits);
            }
            break
        }
    }
}

const renderAnnotation = function (pageDiv, annotation, fontResObj, drawParamResObj, multiMediaResObj, compositeGraphicUnits) {
    let div = document.createElement('div');
    div.setAttribute('style', `overflow: hidden;;position:relative;`)
    let boundary = annotation['Appearance']['Boundary'];
    if (boundary) {
        let divBoundary = converterBox(boundary);
        div.setAttribute('style', `overflow: hidden;position:absolute; left: ${divBoundary.x}px; top: ${divBoundary.y}px; width: ${divBoundary.w}px; height: ${divBoundary.h}px`)
    } else {
        div.setAttribute('style', `overflow: visible;position:absolute; left: 0px; top: 0px; width: 1px; height: 1px`)
    }
    const contentLayer = annotation['Appearance'];
    renderLayer(div, fontResObj, drawParamResObj, multiMediaResObj, compositeGraphicUnits, contentLayer, false);
    pageDiv.appendChild(div);

}

const renderSealPage = function (pageDiv, page, ofdDocument, isStampAnnot, boundary, PageRef, StampId) {
    let stampAnnotBoundary = {x: 0, y: 0, w: 0, h: 0};
    if (isStampAnnot) {
        stampAnnotBoundary = boundary;
    }
    let divBoundary = converterBox(stampAnnotBoundary);
    let div = document.createElement('div');
    div.setAttribute("name", "seal_img_div");
    div.setAttribute('style', `cursor: pointer; position:relative; left: ${divBoundary.x}px; top: ${divBoundary.y}px; width: ${divBoundary.w}px; height: ${divBoundary.h}px;overflow:hidden`)
    div.setAttribute('data-signature-id', StampId);
    div.setAttribute('data-page-ref', PageRef);
    renderPage(div, page, ofdDocument);
    pageDiv.appendChild(div);
}

const renderLayer = function (pageDiv, Fonts, DrawParams, MultiMedias, CompositeGraphicUnits, layer, isStampAnnot, compositeObjectAlpha, compositeObjectBoundary, compositeObjectCTM) {
    let fillColor = null;
    let strokeColor = null;
    let lineWith = converterDpi(0.353);
    let drawParam = layer['DrawParam'];
    if (drawParam && getDrawParam(DrawParams, drawParam)) {
        let currentDrawParam = getDrawParam(DrawParams, drawParam);
        if (getDrawParam(DrawParams, currentDrawParam['Relative'])) {
            currentDrawParam = getDrawParam(DrawParams, currentDrawParam['Relative'])
        }
        if (currentDrawParam['FillColor']) {
            fillColor = parseColor(currentDrawParam['FillColor']['Value']);
        }
        if (currentDrawParam['StrokeColor']) {
            fillColor = parseColor(currentDrawParam['StrokeColor']['Value']);
        }
        if (currentDrawParam['LineWidth']) {
            lineWith = converterDpi(currentDrawParam['LineWidth']);
        }
    }
    const pageBlock = layer['PageBlock'];
    for (let block of pageBlock) {
        if (block['Type'] == 'ImageObject') {
            let element = renderImageObject(pageDiv.style.width, pageDiv.style.height, MultiMedias, block, isStampAnnot, compositeObjectBoundary, compositeObjectCTM)
            pageDiv.appendChild(element);
        } else if (block['Type'] == 'PathObject') {
            let svg = renderPathObject(DrawParams, block, fillColor, strokeColor, lineWith, isStampAnnot, compositeObjectAlpha, compositeObjectBoundary, compositeObjectCTM)
            pageDiv.appendChild(svg);
        } else if (block['Type'] == 'TextObject') {
            let svg = renderTextObject(pageDiv, Fonts, block, fillColor, strokeColor, DrawParams, compositeObjectAlpha, compositeObjectBoundary, compositeObjectCTM);
            if (svg.childElementCount > 0) {
                pageDiv.appendChild(svg);
            }
        } else if (block['Type'] == 'CompositeObject') {
            for (const compositeGraphicUnit of CompositeGraphicUnits) {
                if (compositeGraphicUnit['ID'] === block['ResourceID']) {
                    const currentCompositeObjectAlpha = block['Alpha'];
                    const currentCompositeObjectBoundary = block['Boundary'];
                    const currentCompositeObjectCTM = block['CTM'];
                    renderLayer(pageDiv, Fonts, DrawParams, MultiMedias, CompositeGraphicUnits, compositeGraphicUnit, false, currentCompositeObjectAlpha, currentCompositeObjectBoundary, currentCompositeObjectCTM);
                    break;
                }
            }
        }
    }
}

export const renderImageObject = function (pageWidth, pageHeight, MultiMedias, imageObject, isStampAnnot, compositeObjectBoundary, compositeObjectCTM) {
    let boundary = imageObject['Boundary'];
    boundary = converterBox(boundary);
    const resId = imageObject['ResourceID'];
    const media = getMultiMedia(MultiMedias, resId);
    if (!(media.width > 0 || media.height > 0)) {
        const res = JSGetImageInfoByBase64(media.FileBase64);

        media.width = res.width;
        media.height = res.height;
        media.FileBase64 = res.fileBase64;

    }
    const ctm = imageObject['CTM'];
    return renderImageOnDiv(pageWidth, pageHeight, media.FileBase64, media.width, media.height, boundary, false, isStampAnnot, null, null, ctm, compositeObjectBoundary, compositeObjectCTM);
}

// const renderImageOnCanvas = function (img, imgWidth, imgHeight, boundary) {
//     const arr = new Uint8ClampedArray(4 * imgWidth * imgHeight);
//     for (var i = 0; i < img.length; i++) {
//         arr[4 * i] = img[i];
//         arr[4 * i + 1] = img[i];
//         arr[4 * i + 2] = img[i];
//         arr[4 * i + 3] = 255;
//     }
//     let imageData = new ImageData(arr, imgWidth, imgHeight);
//     let canvas = document.createElement('canvas');
//     canvas.width = imgWidth;
//     canvas.height = imgHeight;
//     let context = canvas.getContext('2d');
//     context.putImageData(imageData, 0, 0);
//     canvas.setAttribute('style', `left: ${boundary.x}px; top: ${boundary.y}px; width: ${boundary.w}px; height: ${boundary.h}px;`)
//     canvas.style.position = 'absolute';
//     return canvas;
// }

export const renderImageOnDiv = function (pageWidth, pageHeight, imgSrc, imgWidth, imgHeight, boundary, clip, isStampAnnot, PageRef, StampId, ctm, compositeObjectBoundary, compositeObjectCTM) {
    const pw = parseFloat(pageWidth.replace('px', ''));
    const ph = parseFloat(pageHeight.replace('px', ''));
    const w = boundary.w > pw ? pw : boundary.w;
    const h = boundary.h > ph ? ph : boundary.h;

    let div = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    let img = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    if (isStampAnnot) {
        div.setAttribute("viewbox", `0 0 ${w} ${h}`)
        div.setAttribute("name", "seal_img_div");
        div.setAttribute('data-signature-id', StampId);
        div.setAttribute('data-page-ref', PageRef);
        img.setAttribute("preserveAspectRatio", 'none slice')
    }

    let imgW = imgWidth;
    let imgH = imgHeight;
    img.setAttribute('xlink:href', imgSrc);
    img.href.baseVal = imgSrc
    img.setAttribute('width', `${imgW}px`);
    img.setAttribute('height', `${imgH}px`);
    let transform = '';
    if (ctm) {
        // if (ctm.b == 0 && ctm.c == 0) {
        //     img.setAttribute('width', `${w}px`);
        //     img.setAttribute('height', `${h}px`);
        // } else {
        transform = `matrix(${ctm.a / imgW / ctmImageScale()} ${ctm.b / imgW / ctmImageScale()} ${ctm.c / imgH / ctmImageScale()} ${ctm.d / imgH / ctmImageScale()} ${converterDpi(ctm.e)} ${converterDpi(ctm.f)})`;
        // }
    }
    if (compositeObjectCTM) {
        transform = `${transform} matrix(${compositeObjectCTM.a} ${compositeObjectCTM.b} ${compositeObjectCTM.c} ${compositeObjectCTM.d} ${converterDpi(compositeObjectCTM.e)} ${converterDpi(compositeObjectCTM.f)})`;
    }
    img.setAttribute('transform', transform)
    div.appendChild(img);

    let c = '';
    if (clip) {
        clip = converterBox(clip);
        c = `clip: rect(${clip.y}px, ${clip.w + clip.x}px, ${clip.h + clip.y}px, ${clip.x}px)`
    }
    let left = boundary.x;
    let top = boundary.y;
    if (compositeObjectCTM) {
        const a = compositeObjectCTM.a;
        const b = compositeObjectCTM.b;
        const c = compositeObjectCTM.c;
        const d = compositeObjectCTM.d;
        const sx = a > 0 ? Math.sign(a) * Math.sqrt(a * a + c * c) : Math.sqrt(a * a + c * c);
        const sy = d > 0 ? Math.sign(d) * Math.sqrt(b * b + d * d) : Math.sqrt(b * b + d * d);
        const angel = Math.atan2(-b, d);
        if (!(angel == 0 && a != 0 && d == 1)) {
            top *= sy;
            left *= sx;
        }
    }
    div.setAttribute('style', `cursor: pointer; overflow: visible; position: absolute; left: ${left}px; top: ${top}px; width: ${w}px; height: ${h}px; ${c};`)
    return div;
}

export const renderTextObject = function (pageDiv, Fonts, textObject, defaultFillColor, defaultStrokeColor, DrawParams, compositeObjectAlpha, compositeObjectBoundary, compositeObjectCTM) {
    let defaultFillOpacity = 1;
    let boundary = textObject['Boundary'];
    boundary = converterBox(boundary);
    const ctm = textObject['CTM'];
    let hScale = textObject['HScale'];
    const font = textObject['Font'];
    const weight = textObject['Weight'];
    let size = converterDpi(parseFloat(textObject['Size']));

    const textCodePointList = calTextPoint(textObject['TextCode'], textObject['CGTransform'], ctm, textObject['Boundary'], compositeObjectBoundary, compositeObjectCTM);
    let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('version', '1.1');

    const fillColor = textObject['FillColor'];
    let isAxialShd = false;

    let drawParam = textObject['DrawParam'];
    if (drawParam) {
        let dp = getDrawParam(DrawParams, drawParam)
        if (dp['FillColor']) {
            defaultFillColor = parseColor(dp['FillColor']);
        }
    }

    if (fillColor) {
        if (fillColor['Value']) {
            defaultFillColor = parseColor(fillColor['Value']);
        }
        let alpha = fillColor['Alpha'];
        if (alpha) {
            defaultFillOpacity = alpha > 1 ? alpha / 255 : alpha;
        }
        const AxialShd = fillColor['AxialShd'];
        if (AxialShd) {
            isAxialShd = true;
            let linearGradient = document.createElement('linearGradient');
            linearGradient.setAttribute('id', `${textObject['ID']}`);
            linearGradient.setAttribute('x1', '0%');
            linearGradient.setAttribute('y1', '0%');
            linearGradient.setAttribute('x2', '100%');
            linearGradient.setAttribute('y2', '100%');
            for (const segment of AxialShd['ofd:Segment']) {
                if (segment) {
                    let stop = document.createElement('stop');
                    stop.setAttribute('offset', `${segment['@_Position'] * 100}%`);
                    stop.setAttribute('style', `stop-color:${parseColor(segment['ofd:Color']['@_Value'])};stop-opacity:1`);
                    linearGradient.appendChild(stop);
                    defaultFillColor = parseColor(segment['ofd:Color']['@_Value']);
                }
            }
            svg.appendChild(linearGradient);

        }
    }

    if (!textObject['Fill']) {
        defaultFillOpacity = 0;
    }
    let width = boundary.w;
    let height = boundary.h;
    let left = boundary.x;
    let top = boundary.y;
    let xsize = size
    let ysize = size
    if (ctm) {
        const a = ctm.a;
        const b = ctm.b;
        const c = ctm.c;
        const d = ctm.d;
        const sx = a > 0 ? Math.sign(a) * Math.sqrt(a * a + c * c) : Math.sqrt(a * a + c * c);
        const sy = d > 0 ? Math.sign(d) * Math.sqrt(b * b + d * d) : Math.sqrt(b * b + d * d);
        const angel = Math.atan2(-b, d);
        if (!(angel == 0 && a != 0 && d == 1)) {
            xsize = (xsize * sx);
            ysize = (ysize * sy);
        }
        if (angel == 0) {
            hScale = a / d
            if (hScale > 0) {
                xsize = xsize * hScale
            }
        }
    }
    if (compositeObjectCTM) {
        const a = compositeObjectCTM.a;
        const b = compositeObjectCTM.b;
        const c = compositeObjectCTM.c;
        const d = compositeObjectCTM.d;
        const sx = a > 0 ? Math.sign(a) * Math.sqrt(a * a + c * c) : Math.sqrt(a * a + c * c);
        const sy = d > 0 ? Math.sign(d) * Math.sqrt(b * b + d * d) : Math.sqrt(b * b + d * d);
        const angel = Math.atan2(-b, d);
        if (!(angel == 0 && a != 0 && d == 1)) {
            xsize = (xsize * sx);
            ysize = (ysize * sy);
            top *= sy;
            left *= sx;
            width *= sx;
            height *= sy;
        }
    }
    const fontObj = getFont(Fonts, font);
    for (const textCodePoint of textCodePointList) {
        if (textCodePoint && !isNaN(textCodePoint.x)) {
            if (textCodePoint.glyph) {
                // 如果内置字体通过canvas画图
                if (fontObj && !!fontObj['face']) {
                    let m_pFaceInfo = loadFaceInfo(fontObj['face'])
                    const glyphMetrics = FT_Glyph_Get_Measure(fontObj['face'], textCodePoint.glyph)
                    const imgObj = drawGlyph(glyphMetrics.glyphPath, glyphMetrics.horiUnderlinePosition, m_pFaceInfo.units_per_EM, xsize, ysize, defaultStrokeColor ? defaultStrokeColor : defaultFillColor, defaultFillOpacity)
                    imgObj.img.setAttribute('style', `position:absolute; left: ${Math.ceil(textCodePoint.cx)}px; top: ${textCodePoint.cy - imgObj.yScale * (glyphMetrics.horiUnderlinePosition) - ysize}px;width: ${Math.ceil(xsize)}px; height:${Math.ceil(ysize)}px`)
                    pageDiv.appendChild(imgObj.img);
                }
            } else {
                let text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', textCodePoint.x);
                text.setAttribute('y', textCodePoint.y);
                text.innerHTML = textCodePoint.text;
                let transform = ''
                if (ctm) {
                    transform = `matrix(${ctm.a} ${ctm.b} ${ctm.c} ${ctm.d} ${converterDpi(ctm.e)} ${converterDpi(ctm.f)})`;
                }
                if (compositeObjectCTM) {
                    transform = `${transform} matrix(${compositeObjectCTM.a} ${compositeObjectCTM.b} ${compositeObjectCTM.c} ${compositeObjectCTM.d} ${converterDpi(compositeObjectCTM.e)} ${converterDpi(compositeObjectCTM.f)})`;
                }
                if (hScale) {
                    transform = `${transform} matrix(${hScale}, 0, 0, 1, ${(1 - hScale) * textCodePoint.x}, 0)`;
                }
                text.setAttribute('transform', transform)
                if (isAxialShd) {
                    text.setAttribute('fill', defaultFillColor);
                } else {
                    text.setAttribute('fill', defaultStrokeColor);
                    text.setAttribute('fill', defaultFillColor);
                    text.setAttribute('fill-opacity', defaultFillOpacity);
                }
                text.setAttribute('style', `font-weight: ${weight};font-size:${size}px;font-family: ${getFontFamily(fontObj)};`)
                svg.appendChild(text);
            }

        }

    }

    svg.setAttribute('style', `overflow:hidden;position:absolute;width:${width}px;height:${height}px;left:${left}px;top:${top}px;`);
    return svg;
}

export const renderPathObject = function (DrawParams, pathObject, defaultFillColor, defaultStrokeColor, defaultLineWith, isStampAnnot, compositeObjectAlpha, compositeObjectBoundary, compositeObjectCTM) {
    let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('version', '1.1');
    let boundary = pathObject['Boundary'];
    if (!boundary)
        return svg;
    boundary = converterBox(boundary);
    let lineWidth = pathObject['LineWidth'];
    const abbreviatedData = pathObject['AbbreviatedData'];
    // console.log(abbreviatedData)
    // const points = calPathPoint(abbreviatedData);
    const ctm = pathObject['CTM'];
    let path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    if (lineWidth) {
        defaultLineWith = converterDpi(lineWidth);
    }
    const drawParam = pathObject['DrawParam'];
    if (drawParam) {
        let dp = getDrawParam(DrawParams, drawParam)
        lineWidth = dp.LineWidth;
        if (lineWidth) {
            defaultLineWith = converterDpi(lineWidth);
        }
    }
    if (ctm) {
        path.setAttribute('transform', `matrix(${ctm.a} ${ctm.b} ${ctm.c} ${ctm.d} ${converterDpi(ctm.e)} ${converterDpi(ctm.f)})`)
    }
    const strokeColor = pathObject['StrokeColor'];
    let isStrokeAxialShd = false;
    if (strokeColor) {
        if (strokeColor['Value']) {
            defaultStrokeColor = parseColor(strokeColor['Value'])
        }
        const AxialShd = strokeColor['AxialShd'];
        if (AxialShd) {
            isStrokeAxialShd = true;
            let linearGradient = document.createElement('linearGradient');
            linearGradient.setAttribute('id', `${pathObject['ID']}`);
            linearGradient.setAttribute('x1', '0%');
            linearGradient.setAttribute('y1', '0%');
            linearGradient.setAttribute('x2', '100%');
            linearGradient.setAttribute('y2', '100%');
            for (const segment of AxialShd['ofd:Segment']) {
                if (segment) {
                    let stop = document.createElement('stop');
                    stop.setAttribute('offset', `${segment['Position'] * 100}%`);
                    stop.setAttribute('style', `stop-color:${parseColor(segment['Color']['Value'])};stop-opacity:1`);
                    linearGradient.appendChild(stop);
                    defaultStrokeColor = parseColor(segment['ofd:Color']['@_Value']);
                }
            }
            svg.appendChild(linearGradient);
        }
    }
    const fillColor = pathObject['FillColor'];
    let isFillAxialShd = false;
    if (fillColor) {

        if (fillColor['Value']) {
            defaultFillColor = parseColor(fillColor['Value'])
        }
        if (fillColor['Alpha'] && fillColor['Alpha'] == 0) {
            defaultFillColor = 'none'
        }
        const AxialShd = fillColor['AxialShd'];
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
                    stop.setAttribute('offset', `${segment['Position'] * 100}%`);
                    stop.setAttribute('style', `stop-color:${parseColor(segment['Color']['Value'])};stop-opacity:1`);
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
    if (pathObject['Stroke']) {
        path.setAttribute('stroke', `${defaultStrokeColor}`);
        path.setAttribute('stroke-width', `${defaultLineWith}px`);
    }
    if (!pathObject['Fill']) {
        path.setAttribute('fill', 'none')
    } else {
        path.setAttribute('fill', `${isStampAnnot ? 'none' : defaultFillColor ? defaultFillColor : 'none'}`);
        // if (isFillAxialShd) {
        //     path.setAttribute('fill', `url(#${pathObject['@_ID']})`);
        // }
    }
    if (pathObject['Join']) {
        path.setAttribute('stroke-linejoin', `${pathObject['@_Join']}`);
    }
    if (pathObject['Cap']) {
        path.setAttribute('stroke-linecap', `${pathObject['@_Cap']}`);
    }
    if (pathObject['DashPattern']) {
        let dash = pathObject['DashPattern'];
        const dashs = parseCtm(dash);
        let offset = 0;
        if (pathObject['DashOffset']) {
            offset = pathObject['DashOffset'];
        }
        path.setAttribute('stroke-dasharray', `${converterDpi(dashs[0])},${converterDpi(dashs[1])}`);
        path.setAttribute('stroke-dashoffset', `${converterDpi(offset)}px`);
    }
    let d = '';
    for (const point of abbreviatedData) {
        if (point.cmd === 'M' || point.cmd === 'S') {
            d += `M ${converterDpi(point.crds[0])} ${converterDpi(point.crds[1])} `;
        } else if (point.cmd === 'L') {
            d += `L ${converterDpi(point.crds[0])} ${converterDpi(point.crds[1])} `;
        } else if (point.cmd === 'B') {
            d += `C ${converterDpi(point.crds[0])} ${converterDpi(point.crds[1])} ${converterDpi(point.crds[2])} ${converterDpi(point.crds[3])} ${converterDpi(point.crds[4])} ${converterDpi(point.crds[5])} `;
        } else if (point.cmd === 'Q') {
            d += `Q ${converterDpi(point.crds[0])} ${converterDpi(point.crds[1])} ${converterDpi(point.crds[2])} ${converterDpi(point.crds[3])} `;
        } else if (point.cmd === 'A') {
            d += `A ${converterDpi(point.crds[0])},${converterDpi(point.crds[1])} ${converterDpi(point.crds[2])} ${converterDpi(point.crds[3])},${converterDpi(point.crds[4])} ${converterDpi(point.crds[5])},${converterDpi(point.crds[6])}`;
        } else if (point.cmd === 'C') {
            d += `Z`;
        }
    }
    path.setAttribute('d', d);
    svg.appendChild(path);
    let width = isStampAnnot ? boundary.w : Math.ceil(boundary.w);
    let height = isStampAnnot ? boundary.h : Math.ceil(boundary.h);
    let left = boundary.x;
    let top = boundary.y;
    svg.setAttribute('style', `overflow:hidden;position:absolute;width:${width}px;height:${height}px;left:${left}px;top:${top}px;`);
    if (compositeObjectBoundary) {
        let comSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        comSvg.setAttribute('version', '1.1');
        let boundary = parseStBox(compositeObjectBoundary);
        boundary = converterBox(boundary);
        let width = Math.ceil(boundary.w);
        let height = Math.ceil(boundary.h);
        let left = boundary.x;
        let top = boundary.y;
        comSvg.setAttribute('style', `overflow:hidden;position:absolute;width:${width}px;height:${height}px;left:${left}px;top:${top}px;`);
        if (compositeObjectCTM) {
            const ctms = parseCtm(compositeObjectCTM);
            svg.setAttribute('transform', `matrix(${ctms[0]} ${ctms[1]} ${ctms[2]} ${ctms[3]} ${converterDpi(ctms[4])} ${converterDpi(ctms[5])})`)
        }
        comSvg.appendChild(svg);
        return comSvg;
    }
    return svg;
}

const drawGlyph = function (path, horiUnderlinePosition, units_per_EM, xsize, ysize, color, defaultFillOpacity) {
    let xScale = xsize / units_per_EM;
    let yScale = ysize / units_per_EM;

    let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('version', '1.1');
    let svgPathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    svgPathElement.setAttribute('transform', `translate(0, ${ysize}) scale(${xScale}, ${-yScale}) translate(0, ${-horiUnderlinePosition})`);
    svgPathElement.setAttribute('d', path);
    if (color) {
        svgPathElement.setAttribute('fill', color);
    }
    svgPathElement.setAttribute('fill-opacity', defaultFillOpacity);
    svg.appendChild(svgPathElement);
    return {img: svg, yScale};
}
