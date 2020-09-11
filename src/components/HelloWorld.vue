<template>
  <div>
    <div class="upload-icon" @click="uploadFile" >
      <i class="upload-icon">选择OFD文件</i>
      <input type="file" ref="file" class="hidden" accept="ofd"
             @change="fileChanged">
    </div>
    <div style="display: flex;flex-direction: column;align-items: center;justify-content: center">
      <div v-for="box in pageBoxs" :key="box.id" style="position: relative;margin-bottom: 5px">
        <div :id="box.id" :style="{ width: box.box.w + 'px', height: box.box.h + 'px'}"  class="mycanvas"></div>
      </div>
    </div>
  </div>
</template>

<script>
import JsZip from 'jszip'
import {Jbig2Image} from '../utils/jbig2'
import {pipeline} from "../utils/pipeline"
import { converterDpi, convertPathAbbreviatedDatatoPoint, calPathPoint, calTextPoint} from "../utils/point_cal_util"
let parser = require('fast-xml-parser');
import ASN1 from '@lapo/asn1js';
import Base64 from '@lapo/asn1js/base64';
import Hex from '@lapo/asn1js/hex';
let reHex = /^\s*(?:[0-9A-Fa-f][0-9A-Fa-f]\s*)+$/;

export default {
  name: 'HelloWorld',
  data() {
    return {
      doc: null,
      zipObj: null,
      pageBoxs: [],
      documentObj: null,
      publicResObj: null,
      documentResObj: null,
      fontResObj: {},
      drawParamResObj: {},
      multiMediaResObj: {},
      signatures: null,
      sealByte: null,
    }
  },
  created() {
    this.file = null;
  },
  methods: {
    uploadFile() {
      this.sealByte = null;
      this.signatures = null;
      this.multiMediaResObj = {},
      this.drawParamResObj = {},
      this.fontResObj = {};
      this.doc = null;
      this.zipObj = null;
      this.pageBoxs= [];
      this.documentObj= null;
      this.publicResObj= null;
      this.documentResObj = null;
      this.file = null;
      this.$refs.file.click();
    },
    fileChanged() {
      this.file = this.$refs.file.files[0];
      let ext = this.file.name.replace(/.+\./, "");
      if (["ofd"].indexOf(ext) === -1) {
        // this.$toast('error', "仅支持png、jpg、jpeg的图片类型");
        return;
      }
      if (this.file.size > 5 * 1024 * 1024) {
        // this.$toast('error', "文件大小需 < 5M");
        return;
      }
      let that = this;
      JsZip.loadAsync(this.file)
          .then(function (zip) {
            that.zipObj = zip;
            that.getDocumentObj();
          }, function (e) {
            console.log(e)
          });
      this.$refs.file.value = null;
    },


    drawPage(pages, tpls, isStampAnnot, stampAnnot) {
      for (const page of pages) {
        const pageId = Object.keys(page)[0];
        let stampAnnotBoundary = {x: 0, y: 0, w: 0, h: 0};
        if (isStampAnnot && stampAnnot) {
          stampAnnotBoundary = this.parseStBox(stampAnnot['@_Boundary']);
        }
        const template = page[pageId]['json']['ofd:Template'];
        if (template) {
          const layer = tpls[template['@_TemplateID']]['json']['ofd:Content']['ofd:Layer'];
          this.drawLayer(layer, isStampAnnot ? stampAnnot['@_PageRef'] : pageId, stampAnnotBoundary);
        }
        const contentLayer = page[pageId]['json']['ofd:Content']['ofd:Layer'];
        this.drawLayer(contentLayer, isStampAnnot ? stampAnnot['@_PageRef'] : pageId, stampAnnotBoundary);
      }
    },

    drawLayer(layer, pageId, stampAnnotBoundary) {
      let fillColor = `rgb(0, 0, 0)`;
      let strokeColor = `rgb(0, 0, 0)`;
      let lineWith = converterDpi(0.25);
      const drawParam = layer['@_DrawParam'];
      if (drawParam && Object.keys(this.drawParamResObj).length > 0 && this.drawParamResObj[drawParam]) {
        fillColor = this.parseColor(this.drawParamResObj[drawParam]['FillColor']);
        strokeColor  = this.parseColor(this.drawParamResObj[drawParam]['StrokeColor']);
        lineWith = converterDpi(this.drawParamResObj[drawParam]['LineWidth']);
      }
      const imageObjects = layer['ofd:ImageObject'];
      let imageObjectArray = [];
      imageObjectArray = imageObjectArray.concat(imageObjects);
      for (const imageObject of imageObjectArray) {
        if (imageObject) {
          this.drawImageObject(imageObject, pageId);
        }
      }
      const pathObjects = layer['ofd:PathObject'];
      let pathObjectArray = [];
      pathObjectArray = pathObjectArray.concat(pathObjects);
      for (const pathObject of pathObjectArray) {
        if (pathObject) {
          this.drawPathObject(pathObject, pageId, fillColor, strokeColor, lineWith, stampAnnotBoundary);
        }
      }
      const textObjects = layer['ofd:TextObject'];
      let textObjectArray = [];
      textObjectArray = textObjectArray.concat(textObjects);
      for (const textObject of textObjectArray) {
        if (textObject) {
          this.drawTextObject(textObject, pageId, fillColor, strokeColor, stampAnnotBoundary);
        }
      }
    },

    drawImageObject(imageObject, pageId) {
      const boundary = this.parseStBox(imageObject['@_Boundary']);
      const resId = imageObject['@_ResourceID'];
      if (this.multiMediaResObj[resId].format === 'gbig2') {
        const img = this.multiMediaResObj[resId].img;
        const width = this.multiMediaResObj[resId].width;
        const height = this.multiMediaResObj[resId].height;
        const arr = new Uint8ClampedArray(4*width*height);
        for(var i = 0; i < img.length; i++) {
          arr[4*i] = img[i];
          arr[4*i + 1] = img[i];
          arr[4*i + 2] = img[i];
          arr[4*i + 3] = 255;
        }
        let imageData = new ImageData(arr, width, height);
        let canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        let context = canvas.getContext('2d');
        context.putImageData(imageData, 0, 0);
        var mycanvas = document.getElementById(pageId)
        var a = setInterval(() => {
          mycanvas = document.getElementById(pageId)
          if (!mycanvas) {
            return false
          } else {
            clearInterval(a)
            canvas.setAttribute('style', `left: ${boundary.x}px; top: ${boundary.y}px; width: ${boundary.w}px; height: ${boundary.h}px`)
            canvas.style.position = 'absolute';
            mycanvas.appendChild(canvas);
          }
        }, 1)
      } else {
        let div = document.createElement('div');
        div.style.width = boundary.w;
        div.style.height = boundary.h;
        let img = document.createElement('img');
        img.src = this.multiMediaResObj[resId].img;
        img.setAttribute('width', boundary.w);
        img.setAttribute('height', boundary.h);
        div.appendChild(img);
        var mycanvas = document.getElementById(pageId)
        var a = setInterval(() => {
          mycanvas = document.getElementById(pageId)
          if (!mycanvas) {
            return false
          } else {
            clearInterval(a)
            div.setAttribute('style', `left: ${boundary.x}px; top: ${boundary.y}px`)
            div.style.left =  boundary.x;
            div.style.top =  boundary.y;
            div.style.position = 'absolute';
            mycanvas.appendChild(div);
          }
        }, 1)
      }

    },

    drawTextObject(textObject, pageId, defaultFillColor, defaultStrokeColor, stampAnnotBoundary) {
      const boundary = this.parseStBox(textObject['@_Boundary']);
      const ctm = textObject['@_CTM'];
      const font = textObject['@_Font'];
      const size = converterDpi(parseFloat(textObject['@_Size']));
      const textCode = textObject['ofd:TextCode'];
      const textCodePointList = calTextPoint(textCode);
      let svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
      svg.setAttribute('version','1.1');
      svg.style.width = boundary.w;
      svg.style.height = boundary.h;
      const fillColor = textObject['ofd:FillColor'];
      if (fillColor) {
        defaultFillColor = this.parseColor(fillColor['@_Value']);
      }
      for (const textCodePoint of textCodePointList) {
        if ( !isNaN(textCodePoint.x) ) {
          let text = document.createElementNS('http://www.w3.org/2000/svg','text');
          text.setAttribute('x', textCodePoint.x);
          text.setAttribute('y', textCodePoint.y);
          text.innerHTML = textCodePoint.text;
          if (ctm) {
            const ctms = this.parseCtm(ctm);
            text.setAttribute('transform', `matrix(${ctms[0]} ${ctms[1]} ${ctms[2]} ${ctms[3]} ${converterDpi(ctms[4])} ${converterDpi(ctms[5])})`)
          }
          text.setAttribute('fill', defaultStrokeColor);
          text.setAttribute('fill', defaultFillColor);
          text.setAttribute('style', `font-size:${size}px;font-family: ${this.fontResObj[font]};`)
          svg.appendChild(text);
        }

      }
      var mycanvas = document.getElementById(pageId);
      var a = setInterval(() => {
        mycanvas = document.getElementById(pageId)
        if (!mycanvas) {
          return false
        } else {
          clearInterval(a);
          svg.style.left = stampAnnotBoundary.x + boundary.x;
          svg.style.top = stampAnnotBoundary.y + boundary.y;
          svg.style.position = 'absolute';
          mycanvas.appendChild(svg);
        }
      }, 1)
    },

    drawPathObject(pathObject, pageId, defaultFillColor, defaultStrokeColor, defaultLineWith, stampAnnotBoundary) {
      const boundary = this.parseStBox(pathObject['@_Boundary']);
      const lineWidth = pathObject['@_LineWidth'];
      const abbreviatedData = pathObject['ofd:AbbreviatedData'];
      const points = calPathPoint(convertPathAbbreviatedDatatoPoint(abbreviatedData))
      const ctm = pathObject['@_CTM'];
      let svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
      svg.setAttribute('version','1.1');
      svg.style.width = boundary.w;
      svg.style.height = boundary.h;
      let path = document.createElementNS('http://www.w3.org/2000/svg','path');
      if (lineWidth) {
        defaultLineWith = converterDpi(lineWidth);
      }
      if (ctm) {
        const ctms = this.parseCtm(ctm);
        path.setAttribute('transform', `matrix(${ctms[0]} ${ctms[1]} ${ctms[2]} ${ctms[3]} ${converterDpi(ctms[4])} ${converterDpi(ctms[5])})`)
      }
      const strokeColor = pathObject['ofd:StrokeColor'];
      if (strokeColor) {
        defaultStrokeColor = this.parseColor(strokeColor['@_Value'])
      }
      path.setAttribute('style', `stroke:${defaultStrokeColor};stroke-width:${defaultLineWith};fill: none`)
      let d = '';
      for (const point of points) {
        if (point.type === 'M') {
          d += `M${point.x} ${point.y}`;
        } else if (point.type === 'L') {
          d += `L${point.x} ${point.y}`;
        } else if (point.type === 'B') {
          d += `C${point.x1} ${point.y1} ${point.x2} ${point.y2} ${point.x3} ${point.y3}`;
        }
      }
      path.setAttribute('d', d);
      svg.appendChild(path);
      var mycanvas = document.getElementById(pageId)
      var a = setInterval(() => {
        mycanvas = document.getElementById(pageId)
        if (!mycanvas) {
          return false
        } else {
          clearInterval(a)
          svg.style.left = stampAnnotBoundary.x + boundary.x;
          svg.style.top = stampAnnotBoundary.y + boundary.y;
          svg.style.position = 'absolute';
          mycanvas.appendChild(svg);
        }
      }, 1)
    },

    parseCtm(ctm) {
      let array = ctm.split(' ');
      return array;
    },

    parseColor(color) {
      if (color) {
        let array = color.split(' ');
        return `rgb(${array[0]}, ${array[1]}, ${array[2]})`
      } else {
        return `rgb(0, 0, 0)`
      }
    },

    parseStBox(obj) {
      if (obj) {
        let array = obj.split(' ');
        return {
          x: converterDpi(parseFloat(array[0])), y: converterDpi(parseFloat(array[1])),
          w: converterDpi(parseFloat(array[2])), h: converterDpi(parseFloat(array[3]))
        };
      } else {
        return {};
      }
    },

    getPageBox(pages) {
      for (const page of pages) {
        const area = page[Object.keys(page)[0]]['json']['ofd:Area'];
        let box;
        if (area) {
          const physicalBox = area['ofd:PhysicalBox']
          if (physicalBox) {
            box = this.parseStBox(physicalBox);
          } else {
            const applicationBox = area['ofd:ApplicationBox']
            if (applicationBox) {
              box = this.parseStBox(applicationBox);
            } else {
              const contentBox = area['ofd:ContentBox']
              if (contentBox) {
                box = this.parseStBox(contentBox);
              }
            }
          }
        } else {
          let documentArea = this.documentObj['ofd:CommonData']['ofd:PageArea']
          const physicalBox = documentArea['ofd:PhysicalBox']
          if (physicalBox) {
            box = this.parseStBox(physicalBox);
          } else {
            const applicationBox = documentArea['ofd:ApplicationBox']
            if (applicationBox) {
              box = this.parseStBox(applicationBox);
            } else {
              const contentBox = documentArea['ofd:ContentBox']
              if (contentBox) {
                box = this.parseStBox(contentBox);
              }
            }
          }
        }
        let boxObj = {};
        boxObj['id'] = Object.keys(page)[0];
        boxObj['box'] = box;
        this.pageBoxs.push(boxObj);
      }
    },

    getDocumentObj() {
      pipeline.call(this, async () => await this.getDocRoot(), this.getDocument,
          this.getDocumentRes, this.getPublicRes, this.getTemplatePage, this.getPage)
          .then(res => {
            console.log('Document', res.stampAnnot)
            this.getPageBox(res.pages);
            this.drawPage(res.pages, res.tpls, false, null);
            this.unzipSeal(res.stampAnnot);
          })
          .catch(res => {
            console.log(res)
          });
    },

    getSealDocumentObj(stampAnnot) {
      pipeline.call(this, async () => await this.getDocRoot(), this.getDocument,
          this.getDocumentRes, this.getPublicRes, this.getTemplatePage, this.getPage)
          .then(res => {
            console.log('seal Document', res)
            this.drawPage(res.pages, res.tpls, true, stampAnnot);
          })
          .catch(res => {
            console.log(res)
          });
    },

    async parsePage(obj) {
      let pagePath = obj['@_BaseLoc'];
      if (pagePath.indexOf(this.doc) == -1) {
        pagePath = `${this.doc}/${pagePath}`;
      }
      const data = await this.getJsonFromXmlContent(pagePath);
      let pageObj = {};
      pageObj[obj['@_ID']] = {'json': data['json']['ofd:Page'], 'xml': data['xml']};
      return pageObj;
    },

    async getPage([Document, stampAnnot, tpls]) {
      let pages = Document['ofd:Pages']['ofd:Page'];
      let array = [];
      array = array.concat(pages);
      let res = [];
      for (const page of array) {
        if (page) {
          let pageObj = await this.parsePage(page);
          res.push(pageObj);
        }
      }
      return {'document': Document, 'pages': res, 'tpls': tpls, 'stampAnnot': stampAnnot};
    },

    async getTemplatePage([Document, stampAnnot]) {
      let templatePages = Document['ofd:CommonData']['ofd:TemplatePage'];
      let array = [];
      array = array.concat(templatePages);
      let tpls = {};
      for (const templatePage of array) {
        if (templatePage) {
          let pageObj = await this.parsePage(templatePage);
          tpls[Object.keys(pageObj)[0]] = pageObj[Object.keys(pageObj)[0]];
        }
      }
      return [Document, stampAnnot, tpls];
    },

    async getPublicRes([Document, stampAnnot]) {
      let publicResPath = Document['ofd:CommonData']['ofd:PublicRes'];
      if (publicResPath) {
        if (publicResPath.indexOf(this.doc) == -1) {
          publicResPath = `${this.doc}/${publicResPath}`;
        }
        const data = await this.getJsonFromXmlContent(publicResPath);
        this.publicResObj = data['json']['ofd:Res'];
        await this.getFont(this.publicResObj);
        await this.getDrawParam(this.publicResObj);
        await this.getMultiMediaRes(this.publicResObj);
      }
      return [Document, stampAnnot];
    },

    async getDocumentRes([Document, stampAnnot]) {
      let documentResPath = Document['ofd:CommonData']['ofd:DocumentRes'];
      if (documentResPath) {
        if (documentResPath.indexOf('/') == -1) {
          documentResPath = `${this.doc}/${documentResPath}`;
        }
        const data = await this.getJsonFromXmlContent(documentResPath);
        this.documentResObj = data['json']['ofd:Res'];
        await this.getFont(this.documentResObj);
        await this.getDrawParam(this.documentResObj);
        await this.getMultiMediaRes(this.documentResObj);
      }
      return [Document, stampAnnot];
    },

    async getFont(res) {
      const fonts = res['ofd:Fonts'];
      if (fonts) {
        let fontArray = [];
        fontArray = fontArray.concat(fonts['ofd:Font']);
        for (const font of fontArray) {
          if (font) {
            if (font['@_FamilyName']) {
              this.fontResObj[font['@_ID']] = font['@_FamilyName'];
            } else {
              this.fontResObj[font['@_ID']] = font['@_FontName'];
            }
          }
        }
      }
    },

    async getDrawParam(res) {
      const drawParams = res['ofd:DrawParams'];
      if (drawParams) {
        let array = [];
        array = array.concat(drawParams['ofd:DrawParam']);
        for (const item of array) {
          if (item) {
            this.drawParamResObj[item['@_ID']] = { 'LineWidth': item['@_LineWidth'],
            'FillColor': item['ofd:FillColor']?item['ofd:FillColor']['@_Value']:'',
                'StrokeColor': item['ofd:StrokeColor']?item['ofd:StrokeColor']['@_Value']:""};
          }
        }
      }
    },

    async getMultiMediaRes(res) {
      const multiMedias = res['ofd:MultiMedias'];
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
            if (file.indexOf(this.doc) === -1) {
              file = `${this.doc}/${file}`
            }
            if (item['@_Type'].toLowerCase() === 'image') {
              if (item['@_Format'].toLowerCase() === 'gbig2') {
                const jbig2 = await this.getImageArrayFromZip(file);
                this.multiMediaResObj[item['@_ID']] = jbig2;
              } else {
                const img = await this.getImageFromZip(file);
                this.multiMediaResObj[item['@_ID']] = {img, 'format': 'png'};
              }
            } else {
              this.multiMediaResObj[item['@_ID']] = file;
            }
          }
        }
      }
    },

    async getDocument([docRoot, stampAnnot]) {
      const data = await this.getJsonFromXmlContent(docRoot);
      this.documentObj = data['json']['ofd:Document'];
      return [this.documentObj, stampAnnot];
    },

    async getDocRoot() {
      const data = await this.getJsonFromXmlContent('OFD.xml');
      const docRoot = data['json']['ofd:OFD']['ofd:DocBody']['ofd:DocRoot'];
      this.signatures = data['json']['ofd:OFD']['ofd:DocBody']['ofd:Signatures'];
      const stampAnnot = await this.getSignature();
      this.doc = docRoot.split('/')[0];
      return [docRoot, stampAnnot];
    },

    async getSignature() {
      let stampAnnot = null;
      if (this.signatures) {
        let data = await this.getJsonFromXmlContent(this.signatures);
        let signature = (data['json']['ofd:Signatures']['ofd:Signature']['@_BaseLoc']);
        signature = signature.toString().replace('/', '');
        stampAnnot = await this.getSignatureData(signature);
      }
      return stampAnnot;
    },

    async getSignatureData(signature) {
      const data = await this.getJsonFromXmlContent(signature);
      let signedValue = (data['json']['ofd:Signature']['ofd:SignedValue'])
      signedValue = signedValue.toString().replace('/', '');
      await this.getByteFromZip(signedValue);
      return data['json']['ofd:Signature']['ofd:SignedInfo']['ofd:StampAnnot'];
    },

    async getJsonFromXmlContent(xmlName) {
      let that = this;
      return new Promise((resolve, reject) => {
        that.zipObj.files[xmlName].async('string').then(function (content) {
          let ops = {
            attributeNamePrefix: "@_",
            ignoreAttributes: false,
            parseNodeValue: false,
          };
          let jsonObj = parser.parse(content, ops);
          let result = {'xml': content, 'json': jsonObj};
          resolve(result);
        }, function error(e) {
          reject(e);
        })
      });
    },

    async getImageArrayFromZip(name) {
      let that = this;
      return new Promise((resolve, reject) => {
        that.zipObj.files[name].async('uint8array').then(function (bytes) {
          let jbig2 = new Jbig2Image();
          const img = jbig2.parse(bytes);
          resolve({img, width: jbig2.width, height: jbig2.height, format: 'gbig2'});
        }, function error(e) {
          reject(e);
        })
      });
    },

    async getImageFromZip(name) {
      let that = this;
      return new Promise((resolve, reject) => {
        that.zipObj.files[name].async('base64').then(function (bytes) {
          const img = 'data:image/png;base64,'+ bytes;
          resolve(img);
        }, function error(e) {
          reject(e);
        })
      });
    },

    async getByteFromZip(name) {
      let that = this;
      return new Promise((resolve, reject) => {
        that.zipObj.files[name].async('base64').then(function (bytes) {
          that.decodeText(bytes);
          resolve(bytes);
        }, function error(e) {
          reject(e);
        })
      });
    },

    decodeText(val) {
      try {
        let der = reHex.test(val) ? Hex.decode(val) : Base64.unarmor(val);
        this.decode(der);
      } catch (e) {
        console.log(e);
      }
    },

    decode(der, offset) {
      offset = offset || 0;
      try {
        let asn1 = ASN1.decode(der, offset);
        const type = this.getSealType(asn1);
        if (type === 'ofd') {
          const sealObj = asn1.sub[0].sub[1].sub[0].sub[3].sub[1];
          const ofdArray = sealObj.stream.enc.subarray(sealObj.stream.pos+sealObj.header, sealObj.stream.pos+sealObj.length+sealObj.header);
          this.sealByte = ofdArray;
        }
      } catch (e) {
        console.log(e)
      }
    },

    getSealType(asn1) {
      const sealObj = asn1.sub[0].sub[1].sub[0].sub[3].sub[0];
      const ofdArray = sealObj.stream.enc.subarray(sealObj.stream.pos+sealObj.header, sealObj.stream.pos+sealObj.length+sealObj.header);
      return this.Uint8ArrayToString(ofdArray);
    },

    Uint8ArrayToString(fileData){
      let dataString = "";
      for (let i = 0; i < fileData.length; i++) {
        dataString += String.fromCharCode(fileData[i]);
      }
      return dataString
    },

    unzipSeal(stampAnnot) {
      let that = this;
      if (this.sealByte) {
        JsZip.loadAsync(this.sealByte)
            .then(function (zip) {
              that.zipObj = zip;
              that.getSealDocumentObj(stampAnnot);
            }, function (e) {
              console.log(e)
            });
      }
    },
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.upload-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100px;
  line-height: 36px;
  background-color: rgb(59, 95, 232);
  border-radius: 2px;
  border-color: #5867dd;
  font-weight: 500;
  font-size: 1rem;
  color: white;
  font-family: "楷体";
}

.mycanvas {
  border: 1px solid rgb(199, 198, 198);
}


</style>
