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

import {pipeline} from "@/utils/pipeline";
import JsZip from "jszip";
import {parseStBox, getExtensionByPath, replaceFirstSlash} from "@/utils/ofd_util";
let parser = require('fast-xml-parser');
import ASN1 from '@lapo/asn1js';
import Base64 from '@lapo/asn1js/base64';
import Hex from '@lapo/asn1js/hex';
let reHex = /^\s*(?:[0-9A-Fa-f][0-9A-Fa-f]\s*)+$/;
import {Jbig2Image} from '../utils/jbig2'

export const parseOfdDocument = function (options) {
    pipeline.call(this, async () => await unzipOfd(options.ofd), getDocRoot, getDocument,
        getDocumentRes, getPublicRes, getTemplatePage, getPage)
        .then(res => {
            if (options.success) {
                options.success(res);
            }
        })
        .catch(res => {
            if (options.fail) {
                options.fail(res);
            }
        });
}

const unzipOfd = function (file) {
    return new Promise((resolve, reject) => {
        JsZip.loadAsync(file)
            .then(function (zip) {
                resolve(zip);
            }, function (e) {
                reject(e);
            });
    });
}

const getDocRoot = async function (zip) {
    const data = await getJsonFromXmlContent(zip, 'OFD.xml');
    let docRoot = data['json']['ofd:OFD']['ofd:DocBody']['ofd:DocRoot'];
    docRoot = replaceFirstSlash(docRoot);
    const doc = docRoot.split('/')[0];
    const signatures = data['json']['ofd:OFD']['ofd:DocBody']['ofd:Signatures'];
    const stampAnnot = await getSignature(zip, signatures, doc);
    let stampAnnotArray = [];
    for (const stamp of stampAnnot) {
        if (stamp.sealObj && Object.keys(stamp.sealObj).length > 0) {
            if (stamp.sealObj.type === 'ofd') {
                const stampObj = await getSealDocumentObj(stamp);
                console.log(stamp.stampAnnot)
                stamp.stampAnnot.boundary = parseStBox(stamp.stampAnnot['@_Boundary']);
                stamp.stampAnnot.pageRef = stamp.stampAnnot['@_PageRef'];
                stampAnnotArray.push({type: 'ofd', obj: stampObj, stamp});
            } else if (stamp.sealObj.type === 'png') {
                let img = 'data:image/png;base64,' + btoa(String.fromCharCode.apply(null, stamp.sealObj.ofdArray));
                let stampArray = [];
                stampArray = stampArray.concat(stamp.stampAnnot);
                for (const annot of stampArray) {
                    if (annot) {
                        const stampObj = {img, pageId: annot['@_PageRef'], 'boundary': parseStBox(annot['@_Boundary']), 'clip': parseStBox(annot['@_Clip'])};
                        stampAnnotArray.push({type: 'png', obj: stampObj});
                    }
                }
            }
        }
    }
    return [zip, doc, docRoot, stampAnnotArray];
}

const getDocument = async function ([zip, doc, docRoot, stampAnnot]) {
    const data = await getJsonFromXmlContent(zip, docRoot);
    const documentObj = data['json']['ofd:Document'];
    return [zip, doc, documentObj, stampAnnot];
}

const getDocumentRes = async function ([zip, doc, Document, stampAnnot]) {
    let documentResPath = Document['ofd:CommonData']['ofd:DocumentRes'];
    let fontResObj = {};
    let drawParamResObj = {};
    let multiMediaResObj = {};
    if (documentResPath) {
        if (documentResPath.indexOf('/') == -1) {
            documentResPath = `${doc}/${documentResPath}`;
        }
        if (zip.files[documentResPath]) {
            const data = await getJsonFromXmlContent(zip, documentResPath);
            const documentResObj = data['json']['ofd:Res'];
            fontResObj = await getFont(documentResObj);
            drawParamResObj = await getDrawParam(documentResObj);
            multiMediaResObj = await getMultiMediaRes(zip, documentResObj, doc);
        }
    }
    return [zip, doc, Document, stampAnnot, fontResObj, drawParamResObj, multiMediaResObj];
}

const getPublicRes = async function ([zip, doc, Document, stampAnnot, fontResObj, drawParamResObj, multiMediaResObj]) {
    let publicResPath = Document['ofd:CommonData']['ofd:PublicRes'];
    if (publicResPath) {
        if (publicResPath.indexOf(doc) == -1) {
            publicResPath = `${doc}/${publicResPath}`;
        }
        if (zip.files[publicResPath]) {
            const data = await getJsonFromXmlContent(zip, publicResPath);
            const publicResObj = data['json']['ofd:Res'];
            let fontObj = await getFont(publicResObj);
            fontResObj = Object.assign(fontResObj, fontObj);
            let drawParamObj = await getDrawParam(publicResObj);
            drawParamResObj = Object.assign(drawParamResObj, drawParamObj);
            let multiMediaObj = await getMultiMediaRes(zip, publicResObj, doc);
            multiMediaResObj = Object.assign(multiMediaResObj, multiMediaObj);
        }
    }
    return [zip, doc, Document, stampAnnot, fontResObj, drawParamResObj, multiMediaResObj];
}

const getTemplatePage = async function ([zip, doc, Document, stampAnnot, fontResObj, drawParamResObj, multiMediaResObj]) {
    let templatePages = Document['ofd:CommonData']['ofd:TemplatePage'];
    let array = [];
    array = array.concat(templatePages);
    let tpls = {};
    for (const templatePage of array) {
        if (templatePage) {
            let pageObj = await parsePage(zip, templatePage, doc);
            tpls[Object.keys(pageObj)[0]] = pageObj[Object.keys(pageObj)[0]];
        }
    }
    return [zip, doc, Document, stampAnnot, tpls, fontResObj, drawParamResObj, multiMediaResObj];
}

const getPage = async function ([zip, doc, Document, stampAnnot, tpls, fontResObj, drawParamResObj, multiMediaResObj]) {
    let pages = Document['ofd:Pages']['ofd:Page'];
    let array = [];
    array = array.concat(pages);
    let res = [];
    for (const page of array) {
        if (page) {
            let pageObj = await parsePage(zip, page, doc);
            res.push(pageObj);
        }
    }
    return {
        'doc': doc,
        'document': Document,
        'pages': res,
        'tpls': tpls,
        'stampAnnot': stampAnnot,
        fontResObj,
        drawParamResObj,
        multiMediaResObj
    };
}

const getFont = async function (res) {
    const fonts = res['ofd:Fonts'];
    let fontResObj = {};
    if (fonts) {
        let fontArray = [];
        fontArray = fontArray.concat(fonts['ofd:Font']);
        for (const font of fontArray) {
            if (font) {
                if (font['@_FamilyName']) {
                    fontResObj[font['@_ID']] = font['@_FamilyName'];
                } else {
                    fontResObj[font['@_ID']] = font['@_FontName'];
                }
            }
        }
    }
    return fontResObj;
}

const getDrawParam = async function (res) {
    const drawParams = res['ofd:DrawParams'];
    let drawParamResObj = {};
    if (drawParams) {
        let array = [];
        array = array.concat(drawParams['ofd:DrawParam']);
        for (const item of array) {
            if (item) {
                drawParamResObj[item['@_ID']] = {
                    'LineWidth': item['@_LineWidth'],
                    'FillColor': item['ofd:FillColor'] ? item['ofd:FillColor']['@_Value'] : '',
                    'StrokeColor': item['ofd:StrokeColor'] ? item['ofd:StrokeColor']['@_Value'] : ""
                };
            }
        }
    }
    return drawParamResObj;
}

const getMultiMediaRes = async function (zip, res, doc) {
    const multiMedias = res['ofd:MultiMedias'];
    let multiMediaResObj = {};
    if (multiMedias) {
        let array = [];
        array = array.concat(multiMedias['ofd:MultiMedia']);
        for (const item of array) {
            if (item) {
                let file = item['ofd:MediaFile'];
                if (res['@_BaseLoc']) {
                    if (file.indexOf(res['@_BaseLoc']) === -1) {
                        file = `${res['@_BaseLoc']}/${file}`
                    }
                }
                if (file.indexOf(doc) === -1) {
                    file = `${doc}/${file}`
                }
                if (item['@_Type'].toLowerCase() === 'image') {
                    const format = item['@_Format'];
                    const ext = getExtensionByPath(file);
                    if ((format && (format.toLowerCase() === 'gbig2' || format.toLowerCase() === 'jb2')) || ext && (ext.toLowerCase() === 'jb2' || ext.toLowerCase() === 'gbig2')) {
                        const jbig2 = await getImageArrayFromZip(zip, file);
                        multiMediaResObj[item['@_ID']] = jbig2;
                    } else {
                        const img = await getImageFromZip(zip, file);
                        multiMediaResObj[item['@_ID']] = {img, 'format': 'png'};
                    }
                } else {
                    multiMediaResObj[item['@_ID']] = file;
                }
            }
        }
    }
    return multiMediaResObj;
}

const parsePage = async function (zip, obj, doc) {
    let pagePath = obj['@_BaseLoc'];
    if (pagePath.indexOf(doc) == -1) {
        pagePath = `${doc}/${pagePath}`;
    }
    const data = await getJsonFromXmlContent(zip, pagePath);
    let pageObj = {};
    pageObj[obj['@_ID']] = {'json': data['json']['ofd:Page'], 'xml': data['xml']};
    return pageObj;
}

const getSignature = async function (zip, signatures, doc) {
    let stampAnnot = [];
    if (signatures) {
        signatures = replaceFirstSlash(signatures);
        if (signatures.indexOf(doc) === -1) {
            signatures = `${doc}/${signatures}`
        }
        if (zip.files[signatures]) {
            let data = await getJsonFromXmlContent(zip, signatures);
            let signature = data['json']['ofd:Signatures']['ofd:Signature'];
            let signatureArray = [];
            signatureArray = signatureArray.concat(signature);
            for (const sign of signatureArray) {
                if (sign) {
                    let signatureLoc = sign['@_BaseLoc'];
                    signatureLoc = replaceFirstSlash(signatureLoc);
                    if (signatureLoc.indexOf('Signs') === -1) {
                        signatureLoc = `Signs/${signatureLoc}`
                    }
                    if (signatureLoc.indexOf(doc) === -1) {
                        signatureLoc = `${doc}/${signatureLoc}`
                    }
                    stampAnnot.push(await getSignatureData(zip, signatureLoc));
                }
            }
        }
    }
    return stampAnnot;
}

const getSignatureData = async function (zip, signature) {
    const data = await getJsonFromXmlContent(zip, signature);
    let signedValue = (data['json']['ofd:Signature']['ofd:SignedValue'])
    signedValue = signedValue.toString().replace('/', '');
    let sealObj = await getByteFromZip(zip, signedValue);
    return {
        'stampAnnot': data['json']['ofd:Signature']['ofd:SignedInfo']['ofd:StampAnnot'],
        'sealObj': sealObj
    };
}

const getSealDocumentObj = function (stampAnnot) {
    return new Promise((resolve, reject) => {
        pipeline.call(this, async () => await unzipOfd(stampAnnot.sealObj.ofdArray), getDocRoot, getDocument,
            getDocumentRes, getPublicRes, getTemplatePage, getPage)
            .then(res => {
                resolve(res)
            })
            .catch(res => {
                reject(res);
            });
    });
}

const getJsonFromXmlContent = async function (zip, xmlName) {
    return new Promise((resolve, reject) => {
        zip.files[xmlName].async('string').then(function (content) {
            let ops = {
                attributeNamePrefix: "@_",
                ignoreAttributes: false,
                parseNodeValue: false,
                trimValues: false
            };
            let jsonObj = parser.parse(content, ops);
            let result = {'xml': content, 'json': jsonObj};
            resolve(result);
        }, function error(e) {
            reject(e);
        })
    });
}

const getByteFromZip = async function (zip, name) {
    return new Promise((resolve, reject) => {
        zip.files[name].async('base64').then(function (bytes) {
            let res = decodeText(bytes);
            resolve(res);
        }, function error(e) {
            reject(e);
        })
    });
}

const decodeText = function (val) {
    try {
        let der = reHex.test(val) ? Hex.decode(val) : Base64.unarmor(val);
        return decode(der);
    } catch (e) {
        console.log(e)
        return {};
    }
}

const decode = function (der, offset) {
    offset = offset || 0;
    try {
        let asn1 = ASN1.decode(der, offset);
        const type = getSealType(asn1);
        const sealObj = asn1.sub[0].sub[1].sub[0].sub[3].sub[1];
        const ofdArray = sealObj.stream.enc.subarray(sealObj.stream.pos + sealObj.header, sealObj.stream.pos + sealObj.length + sealObj.header);
        return {ofdArray, 'type': type.toLowerCase()};
    } catch (e) {
        console.log(e)
        return {};
    }
}

const getSealType = function (asn1) {
    const sealObj = asn1.sub[0].sub[1].sub[0].sub[3].sub[0];
    const ofdArray = sealObj.stream.enc.subarray(sealObj.stream.pos + sealObj.header, sealObj.stream.pos + sealObj.length + sealObj.header);
    return Uint8ArrayToString(ofdArray);
}

const Uint8ArrayToString = function (fileData) {
    let dataString = "";
    for (let i = 0; i < fileData.length; i++) {
        dataString += String.fromCharCode(fileData[i]);
    }
    return dataString
}

const getImageArrayFromZip = async function (zip, name) {
    return new Promise((resolve, reject) => {
        zip.files[name].async('uint8array').then(function (bytes) {
            let jbig2 = new Jbig2Image();
            const img = jbig2.parse(bytes);
            resolve({img, width: jbig2.width, height: jbig2.height, format: 'gbig2'});
        }, function error(e) {
            reject(e);
        })
    });
}

const getImageFromZip = async function (zip, name) {
    return new Promise((resolve, reject) => {
        zip.files[name].async('base64').then(function (bytes) {
            const img = 'data:image/png;base64,' + bytes;
            resolve(img);
        }, function error(e) {
            reject(e);
        })
    });
}


