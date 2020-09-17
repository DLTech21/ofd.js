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


import Hex from "@lapo/asn1js/hex";
import Base64 from "@lapo/asn1js/base64";
import ASN1 from "@lapo/asn1js";
let reHex = /^\s*(?:[0-9A-Fa-f][0-9A-Fa-f]\s*)+$/;

export const parseSesSignature = async function (zip, name) {
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
        const SES_Signature = decodeSES_Signature(der,offset);
        const type = SES_Signature.toSign.eseal.esealInfo.picture.type;
        const ofdArray = SES_Signature.toSign.eseal.esealInfo.picture.data.byte;
        return {ofdArray, 'type': type.toLowerCase(), SES_Signature};
    } catch (e) {
        console.log(e)
        return {};
    }
}

const decodeSES_Signature = function (der, offset) {
    offset = offset || 0;
    try {
        let asn1 = ASN1.decode(der, offset);
        const certListType = asn1.sub[0]?.sub[1]?.sub[0]?.sub[2]?.sub[2]?.stream.parseInteger(asn1.sub[0].sub[1].sub[0].sub[2].sub[2].stream.pos + asn1.sub[0].sub[1].sub[0].sub[2].sub[2].header, asn1.sub[0].sub[1].sub[0].sub[2].sub[2].stream.pos + asn1.sub[0].sub[1].sub[0].sub[2].sub[2].header + asn1.sub[0].sub[1].sub[0].sub[2].sub[2].length);
        const asn1CertList = asn1.sub[0]?.sub[1]?.sub[0]?.sub[2]?.sub[3];
        let certList = new Array();
        if(asn1CertList){
            asn1CertList.sub.forEach(asn1Cert => {
                certList.push(asn1Cert.stream.parseOctetString(asn1Cert.stream.pos + asn1Cert.header, asn1Cert.stream.pos + asn1Cert.header+asn1Cert.length));
            });
        }
        const asn1ExtDatas = asn1.sub[0]?.sub[1]?.sub[0]?.sub[4];
        let extDatas = new Array();
        if(asn1ExtDatas){
            asn1ExtDatas.sub.forEach(asn1ExtData => {
                extDatas.push({
                    'extnID':asn1ExtData.sub[0]?.stream.parseOID(asn1ExtData.sub[0].stream.pos + asn1ExtData.sub[0].header, asn1ExtData.sub[0].stream.pos + asn1ExtData.sub[0].header+asn1ExtData.sub[0].length),
                    'critical':asn1ExtData.sub[1]?.stream.parseInteger(asn1ExtData.sub[1].stream.pos + asn1ExtData.sub[1].header, asn1ExtData.sub[1].stream.pos + asn1ExtData.sub[1].header+asn1ExtData.sub[1].length),
                    'extnValue':asn1ExtData.sub[2]?.stream.parseOctetString(asn1ExtData.sub[2].stream.pos + asn1ExtData.sub[2].header, asn1ExtData.sub[2].stream.pos + asn1ExtData.sub[2].header+asn1ExtData.sub[2].length),
                })
            });
        }
        const SES_Signature =
            {
                'toSign':{
                    'version':asn1.sub[0]?.sub[0]?.stream.parseInteger(asn1.sub[0].sub[0].stream.pos + asn1.sub[0].sub[0].header, asn1.sub[0].sub[0].stream.pos + asn1.sub[0].sub[0].header + asn1.sub[0].sub[0].length),
                    'eseal':{
                        'esealInfo':{
                            'header':{
                                'ID':asn1.sub[0]?.sub[1]?.sub[0]?.sub[0]?.sub[0]?.stream.parseStringUTF(asn1.sub[0].sub[1].sub[0].sub[0].sub[0].stream.pos + asn1.sub[0].sub[1].sub[0].sub[0].sub[0].header, asn1.sub[0].sub[1].sub[0].sub[0].sub[0].stream.pos + asn1.sub[0].sub[1].sub[0].sub[0].sub[0].header + asn1.sub[0].sub[1].sub[0].sub[0].sub[0].length),
                                'version':asn1.sub[0]?.sub[1]?.sub[0]?.sub[0]?.sub[1]?.stream.parseInteger(asn1.sub[0].sub[1].sub[0].sub[0].sub[1].stream.pos + asn1.sub[0].sub[1].sub[0].sub[0].sub[1].header, asn1.sub[0].sub[1].sub[0].sub[0].sub[1].stream.pos + asn1.sub[0].sub[1].sub[0].sub[0].sub[1].header + asn1.sub[0].sub[1].sub[0].sub[0].sub[1].length),
                                'Vid':asn1.sub[0]?.sub[1]?.sub[0]?.sub[0]?.sub[2]?.stream.parseStringUTF(asn1.sub[0].sub[1].sub[0].sub[0].sub[2].stream.pos + asn1.sub[0].sub[1].sub[0].sub[0].sub[2].header, asn1.sub[0].sub[1].sub[0].sub[0].sub[2].stream.pos + asn1.sub[0].sub[1].sub[0].sub[0].sub[2].header + asn1.sub[0].sub[1].sub[0].sub[0].sub[2].length),
                            },
                            'esID':asn1.sub[0]?.sub[1]?.sub[0]?.sub[1]?.stream.parseStringUTF(asn1.sub[0].sub[1].sub[0].sub[1].stream.pos + asn1.sub[0].sub[1].sub[0].sub[1].header, asn1.sub[0].sub[1].sub[0].sub[1].stream.pos + asn1.sub[0].sub[1].sub[0].sub[1].header + asn1.sub[0].sub[1].sub[0].sub[1].length),
                            'property':{
                                'type':asn1.sub[0]?.sub[1]?.sub[0]?.sub[2]?.sub[0]?.stream.parseInteger(asn1.sub[0].sub[1].sub[0].sub[2].sub[0].stream.pos + asn1.sub[0].sub[1].sub[0].sub[2].sub[0].header, asn1.sub[0].sub[1].sub[0].sub[2].sub[0].stream.pos + asn1.sub[0].sub[1].sub[0].sub[2].sub[0].header + asn1.sub[0].sub[1].sub[0].sub[2].sub[0].length),
                                'name':asn1.sub[0]?.sub[1]?.sub[0]?.sub[2]?.sub[1]?.stream.parseStringUTF(asn1.sub[0].sub[1].sub[0].sub[2].sub[1].stream.pos + asn1.sub[0].sub[1].sub[0].sub[2].sub[1].header, asn1.sub[0].sub[1].sub[0].sub[2].sub[1].stream.pos + asn1.sub[0].sub[1].sub[0].sub[2].sub[1].header + asn1.sub[0].sub[1].sub[0].sub[2].sub[1].length),
                                'certListType':certListType,
                                'certList':certList,
                                'createDate':asn1.sub[0]?.sub[1]?.sub[0]?.sub[2]?.sub[4]?.stream.parseTime(asn1.sub[0].sub[1].sub[0].sub[2].sub[4].stream.pos + asn1.sub[0].sub[1].sub[0].sub[2].sub[4].header, asn1.sub[0].sub[1].sub[0].sub[2].sub[4].stream.pos + asn1.sub[0].sub[1].sub[0].sub[2].sub[4].header + asn1.sub[0].sub[1].sub[0].sub[2].sub[4].length),
                                'validStart':asn1.sub[0]?.sub[1]?.sub[0]?.sub[2]?.sub[5]?.stream.parseTime(asn1.sub[0].sub[1].sub[0].sub[2].sub[5].stream.pos + asn1.sub[0].sub[1].sub[0].sub[2].sub[5].header, asn1.sub[0].sub[1].sub[0].sub[2].sub[5].stream.pos + asn1.sub[0].sub[1].sub[0].sub[2].sub[5].header + asn1.sub[0].sub[1].sub[0].sub[2].sub[5].length),
                                'validEnd':asn1.sub[0]?.sub[1]?.sub[0]?.sub[2]?.sub[6]?.stream.parseTime(asn1.sub[0].sub[1].sub[0].sub[2].sub[6].stream.pos + asn1.sub[0].sub[1].sub[0].sub[2].sub[6].header, asn1.sub[0].sub[1].sub[0].sub[2].sub[6].stream.pos + asn1.sub[0].sub[1].sub[0].sub[2].sub[6].header + asn1.sub[0].sub[1].sub[0].sub[2].sub[6].length),

                            },
                            'picture':{
                                'type':asn1.sub[0]?.sub[1]?.sub[0]?.sub[3]?.sub[0]?.stream.parseStringUTF(asn1.sub[0].sub[1].sub[0].sub[3].sub[0].stream.pos + asn1.sub[0].sub[1].sub[0].sub[3].sub[0].header, asn1.sub[0].sub[1].sub[0].sub[3].sub[0].stream.pos + asn1.sub[0].sub[1].sub[0].sub[3].sub[0].header + asn1.sub[0].sub[1].sub[0].sub[3].sub[0].length),
                                'data': {'hex': asn1.sub[0]?.sub[1]?.sub[0]?.sub[3]?.sub[1]?.stream.parseOctetString(asn1.sub[0].sub[1].sub[0].sub[3].sub[1].stream.pos + asn1.sub[0].sub[1].sub[0].sub[3].sub[1].header, asn1.sub[0].sub[1].sub[0].sub[3].sub[1].stream.pos + asn1.sub[0].sub[1].sub[0].sub[3].sub[1].header + asn1.sub[0].sub[1].sub[0].sub[3].sub[1].length), byte: asn1.sub[0]?.sub[1]?.sub[0]?.sub[3]?.sub[1]?.stream.enc.subarray(asn1.sub[0].sub[1].sub[0].sub[3].sub[1].stream.pos + asn1.sub[0].sub[1].sub[0].sub[3].sub[1].header, asn1.sub[0].sub[1].sub[0].sub[3].sub[1].stream.pos + asn1.sub[0].sub[1].sub[0].sub[3].sub[1].header + asn1.sub[0].sub[1].sub[0].sub[3].sub[1].length)},
                                'width':asn1.sub[0]?.sub[1]?.sub[0]?.sub[3]?.sub[2]?.stream.parseInteger(asn1.sub[0].sub[1].sub[0].sub[3].sub[2].stream.pos + asn1.sub[0].sub[1].sub[0].sub[3].sub[2].header, asn1.sub[0].sub[1].sub[0].sub[3].sub[2].stream.pos + asn1.sub[0].sub[1].sub[0].sub[3].sub[2].header + asn1.sub[0].sub[1].sub[0].sub[3].sub[2].length),
                                'height':asn1.sub[0]?.sub[1]?.sub[0]?.sub[3]?.sub[3]?.stream.parseInteger(asn1.sub[0].sub[1].sub[0].sub[3].sub[3].stream.pos + asn1.sub[0].sub[1].sub[0].sub[3].sub[3].header, asn1.sub[0].sub[1].sub[0].sub[3].sub[3].stream.pos + asn1.sub[0].sub[1].sub[0].sub[3].sub[3].header + asn1.sub[0].sub[1].sub[0].sub[3].sub[3].length),
                            },
                            'extDatas':extDatas,
                        },
                        'cert':decodeCert(asn1.sub[0]?.sub[1]?.sub[1]),
                        'signAlgID':asn1.sub[0]?.sub[1]?.sub[2]?.stream.parseOID(asn1.sub[0].sub[1].sub[2].stream.pos + asn1.sub[0].sub[1].sub[2].header, asn1.sub[0].sub[1].sub[2].stream.pos + asn1.sub[0].sub[1].sub[2].header + asn1.sub[0].sub[1].sub[2].length),
                        'signedValue':asn1.sub[0]?.sub[1]?.sub[3]?.stream.hexDump(asn1.sub[0].sub[1].sub[3].stream.pos + asn1.sub[0].sub[1].sub[3].header, asn1.sub[0].sub[1].sub[3].stream.pos + asn1.sub[0].sub[1].sub[3].header + asn1.sub[0].sub[1].sub[3].length, false)
                    },
                    'timeInfo':asn1.sub[0]?.sub[2]?.stream.parseTime(asn1.sub[0].sub[2].stream.pos + asn1.sub[0].sub[2].header, asn1.sub[0].sub[2].stream.pos + asn1.sub[0].sub[2].header + asn1.sub[0].sub[2].length, false),
                    'dataHash':asn1.sub[0]?.sub[3]?.stream.hexDump(asn1.sub[0].sub[3].stream.pos + asn1.sub[0].sub[3].header, asn1.sub[0].sub[3].stream.pos + asn1.sub[0].sub[3].header + asn1.sub[0].sub[3].length, false),
                    'propertyInfo':Uint8ArrayToString(asn1.sub[0].sub[4])
                },
                'cert':decodeCert(asn1.sub[1]),
                'signatureAlgID':asn1.sub[2]?.stream.parseOID(asn1.sub[2].stream.pos + asn1.sub[2].header, asn1.sub[2].stream.pos + asn1.sub[2].header + asn1.sub[2].length),
                'signature':asn1.sub[3]?.stream.hexDump(asn1.sub[3].stream.pos + asn1.sub[3].header, asn1.sub[3].stream.pos + asn1.sub[3].header + asn1.sub[3].length, false),
                'timpStamp':asn1.sub[4]?.stream.parseTime(asn1.sub[4].stream.pos + asn1.sub[4].header, asn1.sub[4].stream.pos + asn1.sub[4].header + asn1.sub[4].length)
            };
        return SES_Signature;
    } catch (e) {
        console.log(e)
        return {};
    }
}

const decodeCert = function (asn1, offset) {
    offset = offset || 0;
    try {
        const asn1Subject = asn1.sub[0].sub[0].sub[5];
        let subject = new Map();
        asn1Subject.sub.forEach(element => {
            const key = element.sub[0].sub[0].content().split('\n')[0];
            const value = element.sub[0].sub[1]?.stream.parseStringUTF(element.sub[0].sub[1].stream.pos + element.sub[0].sub[1].header, element.sub[0].sub[1].stream.pos + element.sub[0].sub[1].header + element.sub[0].sub[1].length);
            subject.set(key, value);
        });
        console.log(subject);
        return {subject,'commonName':subject.get("2.5.4.3")};
    } catch (e) {
        console.log(e)
        return {};
    }
}

const Uint8ArrayToString = function (fileData) {
    let dataString = "";
    for (let i = 0; i < fileData.length; i++) {
        dataString += String.fromCharCode(fileData[i]);
    }
    return dataString
}
