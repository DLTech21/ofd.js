import {
    sm2
} from "sm-crypto";
import {sm3} from "@/utils/ofd/sm3";
import md5 from "js-md5";
import sha1 from "js-sha1"
import rsa from "jsrsasign"
import {Uint8ArrayToHexString} from "@/utils/ofd/ofd_util";
import Base64 from "@lapo/asn1js/base64";

export const digestByteArray = function(data,hashedBase64,checkMethod){
    const hashedHex = Uint8ArrayToHexString(Base64.decode(hashedBase64));
    if(checkMethod.indexOf("1.2.156.10197.1.401")>=0 || checkMethod.indexOf("sm3")>=0){
        return hashedHex==sm3(Uint8ArrayToHexString(data));
    }else if(checkMethod.indexOf("md5")>=0){
        return hashedHex==md5(data);
    }else if(checkMethod.indexOf("sha1")>=0){
        return hashedHex==sha1(data);
    }else{
        return "";
    }
}

export const SES_Signature_Verify = function(SES_Signature){
    const signAlg = SES_Signature.toSign.version<4?SES_Signature.toSign.signatureAlgorithm:SES_Signature.signatureAlgID;
    const msg = SES_Signature.toSignDer;
    if(signAlg.indexOf("1.2.156.10197.1.501")>=0 || signAlg.indexOf("sm2")>=0){
        let sigValueHex = SES_Signature.signature.replace(/ /g,'').replace(/\n/g,'');
        if(sigValueHex.indexOf('00')==0){
            sigValueHex = sigValueHex.substr(2,sigValueHex.length-2);
        }
        const cert = SES_Signature.toSign.version<4?SES_Signature.toSign.cert:SES_Signature.cert;
        let publicKey = cert.subjectPublicKeyInfo.subjectPublicKey.replace(/ /g,'').replace(/\n/g,'');
        if(publicKey.indexOf('00')==0){
            publicKey = publicKey.substr(2,publicKey.length-2);
        }
        return sm2.doVerifySignature(msg, sigValueHex, publicKey, {
            der : true,
            hash: true,
            userId:"1234567812345678"
        });
    }else{
        let sig = new rsa.KJUR.crypto.Signature({"alg": "SHA1withRSA"});
        const cert = SES_Signature.toSign.version<4?SES_Signature.toSign.cert:SES_Signature.cert;
        let sigValueHex = SES_Signature.signature.replace(/ /g,'').replace(/\n/g,'');
        if(sigValueHex.indexOf('00')==0){
            sigValueHex = sigValueHex.substr(2,sigValueHex.length-2);
        }
        sig.init(cert);
        sig.updateHex(msg);
        return sig.verify(sigValueHex);
    }
}
