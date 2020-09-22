import {
    sm2,
    sm3
} from "sm-crypto";
import ASN1 from "@lapo/asn1js";
//export const digestCheck()
export const SES_Signature_Verify = function(SES_Signature){
    const msg = SES_Signature.toSignDer;
    let sigValueHex = SES_Signature.signature.replace(/\s+/g,'').replace(/\n/g,'');
    if(sigValueHex.indexOf('00')==0){
        sigValueHex = sigValueHex.substr(2,sigValueHex.length-2);
    }
    const cert = SES_Signature.toSign.version<4?SES_Signature.toSign.cert:SES_Signature.cert;
    let publicKey = cert.subjectPublicKeyInfo.subjectPublicKey.replace(/\s+/g,'').replace(/\n/g,'');
    if(publicKey.indexOf('00')==0){
        publicKey = publicKey.substr(2,publicKey.length-2);
    }
    return sm2.doVerifySignature(msg, sigValueHex, publicKey, {
        der : true,
        hash: true,
        userId:"1234567812345678"
    });
}