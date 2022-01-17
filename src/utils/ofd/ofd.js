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

import {calPageBox, calPageBoxScale, renderPage} from "@/utils/ofd/ofd_render";
import {getPageScal, setPageScal} from "@/utils/ofd/ofd_util";
import {CreateLibrary, JSBase64ByHashFile, readOFD} from "./Fonts";

export const hashOfdDocument = function (options) {
    if (options.ofd instanceof File) {
        var reader = new FileReader();
        // 读取这四个字节
        reader.readAsArrayBuffer(options.ofd);
        reader.onload = function () {
            if (options.success) {
                options.success(JSBase64ByHashFile(reader.result, options.list, options.method))
            }
        }
    } else if (options.ofd instanceof ArrayBuffer) {
        if (options.success) {
            options.success(JSBase64ByHashFile(options.ofd, options.list, options.method))
        }
    }
}

export const parseOfdDocument = function (options) {
    CreateLibrary();
    if (options.ofd instanceof File) {
        var reader = new FileReader();
        // 读取这四个字节
        reader.readAsArrayBuffer(options.ofd);
        reader.onload = function () {
            if (options.success) {
                options.success(readOFD(reader.result))
            }
        }
    } else if (options.ofd instanceof ArrayBuffer) {
        if (options.success) {
            options.success(readOFD(options.ofd))
        }
    }
}

export const renderOfd = function (screenWidth, ofdDocument) {
    let divArray = [];
    if (!ofdDocument) {
        return divArray;
    }
    for (let i = 0; i < ofdDocument.Pages.length; i++) {
        const page = ofdDocument.Pages[i];
        let box = calPageBox(screenWidth, ofdDocument, page);
        let pageDiv = document.createElement('div');
        pageDiv.setAttribute('style', `margin-bottom: 20px;position: relative;width:${box.w}px;height:${box.h}px;background: white;overflow: hidden`)
        renderPage(pageDiv, page, ofdDocument);
        divArray.push(pageDiv);
    }
    return divArray;
}

export const renderOfdByScale = function (ofd) {
    let divArray = [];
    if (!ofd) {
        return divArray;
    }
    for (const page of ofd.pages) {
        let box = calPageBoxScale(ofd.document, page);
        const pageId = Object.keys(page)[0];
        let pageDiv = document.createElement('div');
        pageDiv.id = pageId;
        pageDiv.setAttribute('style', `overflow: hidden;margin-bottom: 20px;position: relative;width:${box.w}px;height:${box.h}px;background: white;`)
        renderPage(pageDiv, page, ofd.tpls, ofd.fontResObj, ofd.drawParamResObj, ofd.multiMediaResObj, ofd.compositeGraphicUnits);
        divArray.push(pageDiv);
    }
    return divArray;
}

export const digestCheck = function (options) {
    return digestCheckProcess(options)
}

export const setPageScale = function (scale) {
    setPageScal(scale);
}

export const getPageScale = function () {
    return getPageScal();
}

