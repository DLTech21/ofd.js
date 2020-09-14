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

import {converterDpi, setPageScal} from "@/utils/ofd_util";

export const renderPageBox = function (screenWidth, pages, document) {
    let pageBoxs = [];
    for (const page of pages) {
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
        let boxObj = {};
        boxObj['id'] = Object.keys(page)[0];
        boxObj['box'] = box;
        pageBoxs.push(boxObj);
    }
    return pageBoxs;
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
