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

import {calPageBox, renderPage} from "@/utils/ofd/ofd_render";
import {pipeline} from "@/utils/ofd/pipeline";
import {
    getDocRoot,
    getDocument,
    getDocumentRes,
    getPage,
    getPublicRes,
    getTemplatePage,
    unzipOfd
} from "@/utils/ofd/ofd_parser";

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

export const renderOfd = function (screenWidth, ofd) {
    let divArray = [];
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
