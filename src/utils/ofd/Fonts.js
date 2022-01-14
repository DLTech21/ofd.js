
const FreetypeKit = window['FreetypeKit'];

export const onRuntimeInitialized = function (callback) {
    FreetypeKit.wasmModule.onRuntimeInitialized = () => {
        if (callback) {
            callback()
        }
    }
};

export const freeMemory = function (memory) {
    FreetypeKit.wasmModule["_ASC_FT_Free"](memory.data)
};

let library;

export const CreateLibrary = function () {
    library = FreetypeKit.wasmModule["_ASC_FT_Init"]();
};

export const CreateNativeStream = function (buffer) {
    const fontBinary = new Uint8Array(buffer)
    const memory = FreetypeKit.wasmModule["_malloc"](buffer.byteLength)
    const HEAPU8 = FreetypeKit.wasmModule.HEAPU8
    HEAPU8.set(fontBinary, memory)
    return {data: memory, length: buffer.byteLength};
};

export const FT_Open_Face = function (stream) {
    return FreetypeKit.wasmModule["_ASC_FT_Open_Face"](library, stream.data, stream.length, 0);
};

export const loadFaceInfo = function (face) {
    var _bufferPtr = FreetypeKit.wasmModule["_ASC_FT_GetFaceInfo"](face);
    if (!_bufferPtr)
        return;

    var _info = new FreetypeKit.CFaceInfo();

    var _len_buffer = Math.min((FreetypeKit.wasmModule["HEAP8"].length - _bufferPtr) >> 2, 250); //max 230 symbols on name & style
    var _buffer = new Int32Array(FreetypeKit.wasmModule["HEAP8"].buffer, _bufferPtr, _len_buffer);
    var _index = 0;

    _info.units_per_EM = Math.abs(_buffer[_index++]);
    _info.ascender = _buffer[_index++];
    _info.descender = _buffer[_index++];
    _info.height = _buffer[_index++];
    _info.face_flags = _buffer[_index++];
    _info.num_faces = _buffer[_index++];
    _info.num_glyphs = _buffer[_index++];
    _info.num_charmaps = _buffer[_index++];
    _info.style_flags = _buffer[_index++];
    _info.face_index = _buffer[_index++];

    var c = _buffer[_index++];
    while (c) {
        _info.family_name += String.fromCharCode(c);
        c = _buffer[_index++];
    }

    c = _buffer[_index++];
    while (c) {
        _info.style_name += String.fromCharCode(c);
        c = _buffer[_index++];
    }

    _info.os2_version = _buffer[_index++];
    _info.os2_usWeightClass = _buffer[_index++];
    _info.os2_fsSelection = _buffer[_index++];
    _info.os2_usWinAscent = _buffer[_index++];
    _info.os2_usWinDescent = _buffer[_index++];
    _info.os2_usDefaultChar = _buffer[_index++];
    _info.os2_sTypoAscender = _buffer[_index++];
    _info.os2_sTypoDescender = _buffer[_index++];
    _info.os2_sTypoLineGap = _buffer[_index++];

    _info.os2_ulUnicodeRange1 = IntToUInt(_buffer[_index++]);
    _info.os2_ulUnicodeRange2 = IntToUInt(_buffer[_index++]);
    _info.os2_ulUnicodeRange3 = IntToUInt(_buffer[_index++]);
    _info.os2_ulUnicodeRange4 = IntToUInt(_buffer[_index++]);
    _info.os2_ulCodePageRange1 = IntToUInt(_buffer[_index++]);
    _info.os2_ulCodePageRange2 = IntToUInt(_buffer[_index++]);

    _info.os2_nSymbolic = _buffer[_index++];
    _info.header_yMin = _buffer[_index++];
    _info.header_yMax = _buffer[_index++];

    var fixedSizesCount = _buffer[_index++];
    for (var i = 0; i < fixedSizesCount; i++)
        _info.monochromeSizes.push(_buffer[_index++]);

    FreetypeKit.wasmModule["_ASC_FT_Free"](_bufferPtr);
    _bufferPtr = null;
    return _info;
};


export const FT_Glyph_Get_Measure = function (face, glyphIndex) {
    const error = FreetypeKit.wasmModule["_AST_FT_Load_Glyph"](face, glyphIndex, 1)
    if (error > 0)
        return ' '
    var _bufferPtr = FreetypeKit.wasmModule["_ASC_FT_Get_Glyph_Measure_Params"](face, 1);
    if (!_bufferPtr)
        return null;

    var _len = FreetypeKit.wasmModule["HEAP32"][_bufferPtr >> 2];

    var _buffer = new Int32Array(FreetypeKit.wasmModule["HEAP8"].buffer, _bufferPtr, _len);

    var _info = new FreetypeKit.CGlyphMetrics();
    _info.bbox_xMin = _buffer[1];
    _info.bbox_yMin = _buffer[2];
    _info.bbox_xMax = _buffer[3];
    _info.bbox_yMax = _buffer[4];

    _info.width = _buffer[5];
    _info.height = _buffer[6];

    _info.horiAdvance = _buffer[7];
    _info.horiBearingX = _buffer[8];
    _info.horiBearingY = _buffer[9];

    _info.vertAdvance = _buffer[10];
    _info.vertBearingX = _buffer[11];
    _info.vertBearingY = _buffer[12];

    _info.linearHoriAdvance = _buffer[13];
    _info.linearVertAdvance = _buffer[14];
    _info.horiUnderlinePosition = _info.horiBearingY - _info.height;

    var _pos = 15;
    let path = ''
    while (_pos < _len) {
        switch (_buffer[_pos++]) {
            case 0: {
                path += ` M ${_buffer[_pos++]} ${_buffer[_pos++]}`
                break;
            }
            case 1: {
                path += ` L ${_buffer[_pos++]} ${_buffer[_pos++]}`
                break;
            }
            case 2: {
                path += ` Q ${_buffer[_pos++]} ${_buffer[_pos++]} ${_buffer[_pos++]} ${_buffer[_pos++]}`
                break;
            }
            case 3: {
                path += ` C ${_buffer[_pos++]} ${_buffer[_pos++]} ${_buffer[_pos++]} ${_buffer[_pos++]} ${_buffer[_pos++]} ${_buffer[_pos++]}`
                break;
            }
            default:
                break;
        }
    }
    _info.glyphPath = path
    FreetypeKit.wasmModule["_ASC_FT_Free"](_bufferPtr);
    _buffer = null;

    return _info;
};


export const readOFD = function (content) {
    const stream = CreateNativeStream(content)
    const ofd = FreetypeKit.wasmModule["JSReadOFD"](library, stream.data, stream.length)
    freeMemory(stream)
    return ofd
};

export const readOFDByBase64 = function (content) {
    const ofd = FreetypeKit.wasmModule["JSReadOFDByBase64"](library, content)
    return ofd
};

export const MD5 = function (content) {
    const res = FreetypeKit.wasmModule["JSMD5"](content)
    return res
};

export const SHA1 = function (content) {
    const res = FreetypeKit.wasmModule["JSSHA1"](content)
    return res
};

export const SM3 = function (content) {
    const res = FreetypeKit.wasmModule["JSSM3"](content)
    return res
};

export const base64EncodeByByte = function (content) {
    const stream = CreateNativeStream(content)
    const res = FreetypeKit.wasmModule["JSBase64EncodeByByte"](stream.data, stream.length)
    freeMemory(stream)
    return res
};

export const base64Encode = function (content) {
    const res = FreetypeKit.wasmModule["JSBase64Encode"](content)
    return res
};


export const base64DecodeToUint8Array = function (stream) {
    const obj =  FreetypeKit.wasmModule["JSBase64Decode"](stream);
    const heapBytes = new Uint8Array(FreetypeKit.wasmModule.HEAPU8.buffer, obj.ptr, obj.len);
    const typeArray = heapBytes.slice(0, obj.len);
    return typeArray;
};

export const JSBase64ByHashFile = function (content, list, method) {
    const stream = CreateNativeStream(content)
    const res = FreetypeKit.wasmModule["JSBase64ByHashFile"](stream.data, stream.length, list, method)
    return res
};

export const JSGetImageInfoByBase64 = function (content) {
    const res = FreetypeKit.wasmModule["JSGetImageInfoByBase64"](content)
    // if (res.ext == 'tif') {
    //     var image = FreetypeKit.wasmModule.HEAPU8.subarray(res.imageDataPtr, res.imageDataPtr + res.imageDataPtrLen * 4);
    //     var canvas = document.createElement('canvas');
    //     var context = canvas.getContext('2d');
    //     canvas.width = res.width;
    //     canvas.height = res.height;
    //     var imageData = context.createImageData(res.width, res.height);
    //     imageData.data.set(image);
    //     context.putImageData(imageData, 0, 0);
    //     res.fileBase64 = canvas.toDataURL();
    //     res.ext = 'png';
    // }
    // if (res.ext == 'jp2') {
    //     var jpxImage = new JpxImage();
    //     jpxImage.parse(base64DecodeToUint8Array(content));
    //     var canvas1 = document.createElement('canvas')
    //     var ctx = canvas1.getContext('2d')
    //     canvas1.width = jpxImage.width;
    //     canvas1.height = jpxImage.height;
    //     var ctxImageData = ctx.createImageData(jpxImage.width, jpxImage.height);
    //     for (let i = 0; i < (jpxImage.width * jpxImage.height) ; i++) {
    //         var val = jpxImage.tiles[0].items[i*jpxImage.componentsCount];
    //         ctxImageData.data[i*4+0] = val;
    //         ctxImageData.data[i*4+1] = val;
    //         ctxImageData.data[i*4+2] = val;
    //         ctxImageData.data[i*4+3] = 255;
    //     }
    //     ctx.putImageData(ctxImageData,0, 0);
    //     res.fileBase64 = canvas1.toDataURL();
    //     res.ext = 'png';
    //     res.width = jpxImage.width;
    //     res.height = jpxImage.height;
    // }
    if (res.ext == 'jb2'||res.ext=='jp2'||res.ext=='tif') {
        res.ext = 'png';
    }
    if (res.fileBase64.length === 0) {
        res.fileBase64 = content
    }
    if (res.fileBase64.indexOf('data:image') !== 0) {
        res.fileBase64 = `data:image/${res.ext};base64,${res.fileBase64}`
    }
    return res
};


export const CFaceInfo = FreetypeKit.CFaceInfo

const IntToUInt = function (v) {
    return (v < 0) ? v + 4294967296 : v;
}

