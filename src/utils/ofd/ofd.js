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
import {pipeline} from "@/utils/ofd/pipeline";
import {
    getDocRoots,
    parseSingleDoc,
    unzipOfd
} from "@/utils/ofd/ofd_parser";
import {digestCheckProcess} from "@/utils/ofd/ses_signature_parser"
import {getPageScal, setPageScal} from "@/utils/ofd/ofd_util";
import * as JSZipUtils from "jszip-utils";

export const parseOfdDocument = function (options) {
    if (options.ofd instanceof File || options.ofd instanceof ArrayBuffer) {
        doParseOFD(options);
    } else {
        JSZipUtils.getBinaryContent(options.ofd, function (err, data) {
            if (err) {
                if (options.fail) {
                    options.fail(err);
                }
            } else {
                options.ofd = data;
                doParseOFD(options);
            }
        });
    }
}

const doParseOFD = function (options) {
    global.xmlParseFlag = 0;
    pipeline.call(this, async () => await unzipOfd(options.ofd), getDocRoots, parseSingleDoc)
        .then(res => {
            if (options.success) {
                options.success(res);
            }
        })
        .catch(res => {
            console.log(res)
            if (options.fail) {
                options.fail(res);
            }
        });
}

export const renderOfd = function (screenWidth, ofd) {
    let divArray = [];
    if (!ofd) {
        return divArray;
    }
    for (const page of ofd.pages) {
        let box = calPageBox(screenWidth, ofd.document, page);
        const pageId = Object.keys(page)[0];
        let pageDiv = document.createElement('div');
        pageDiv.id = pageId;
        pageDiv.setAttribute('style', `margin-bottom: 20px;position: relative;width:${box.w}px;height:${box.h}px;background: white;`)
        renderPage(pageDiv, page, ofd.tpls, ofd.fontResObj, ofd.drawParamResObj, ofd.multiMediaResObj);
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
        pageDiv.setAttribute('style', `margin-bottom: 20px;position: relative;width:${box.w}px;height:${box.h}px;background: white;`)
        renderPage(pageDiv, page, ofd.tpls, ofd.fontResObj, ofd.drawParamResObj, ofd.multiMediaResObj);
        divArray.push(pageDiv);
    }
    return divArray;
}

export const digestCheck = function (options) {
    // pipeline.call(this, async () => await digestCheckProcess(options.arr))
    //     .then(res => {
    //         if (options.success) {
    //             options.success(res);
    //         }
    //     });
    return digestCheckProcess(options)
}

export const setPageScale = function (scale) {
    setPageScal(scale);
}

export const getPageScale = function () {
    return getPageScal();
}

