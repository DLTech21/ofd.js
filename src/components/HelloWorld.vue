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
import {setPageScal,getFontFamily, getExtensionByPath, replaceFirstSlash, converterDpi, convertPathAbbreviatedDatatoPoint, calPathPoint, calTextPoint} from "../utils/ofd_util"
let parser = require('fast-xml-parser');
import ASN1 from '@lapo/asn1js';
import Base64 from '@lapo/asn1js/base64';
import Hex from '@lapo/asn1js/hex';
let reHex = /^\s*(?:[0-9A-Fa-f][0-9A-Fa-f]\s*)+$/;

export default {
  name: 'HelloWorld',
  data() {
    return {
      pageBoxs: [],

      screenWidth: document.body.clientWidth,
    }
  },

  created() {
    this.file = null;
  },

  mounted() {
    let that = this;
    window.onresize = () => {
      return (() => {
        setPageScal(5)
        that.screenWidth = (document.body.clientWidth);
      })()
    }
  },

  methods: {
    uploadFile() {
      this.pageBoxs= [];
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
            that.getDocumentObj(zip);
          }, function (e) {
            console.log(e)
          });
      this.$refs.file.value = null;
    },


    drawPage(pages, tpls, isStampAnnot, stampAnnot, fontResObj, drawParamResObj, multiMediaResObj) {
      for (const page of pages) {
        const pageId = Object.keys(page)[0];
        let stampAnnotBoundary = {x: 0, y: 0, w: 0, h: 0};
        if (isStampAnnot && stampAnnot) {
          stampAnnotBoundary = this.parseStBox(stampAnnot['@_Boundary']);
        }
        const template = page[pageId]['json']['ofd:Template'];
        if (template) {
          const layer = tpls[template['@_TemplateID']]['json']['ofd:Content']['ofd:Layer'];
          this.drawLayer(fontResObj, drawParamResObj, multiMediaResObj, layer, isStampAnnot ? stampAnnot['@_PageRef'] : pageId, isStampAnnot, stampAnnotBoundary);
        }
        const contentLayer = page[pageId]['json']['ofd:Content']['ofd:Layer'];
        this.drawLayer(fontResObj, drawParamResObj, multiMediaResObj, contentLayer, isStampAnnot ? stampAnnot['@_PageRef'] : pageId, isStampAnnot, stampAnnotBoundary);
      }
    },

    drawLayer(fontResObj, drawParamResObj, multiMediaResObj, layer, pageId, isStampAnnot, stampAnnotBoundary) {
      let fillColor = null;
      let strokeColor = null;
      let lineWith = 0;
      const drawParam = layer['@_DrawParam'];
      if (drawParam && Object.keys(drawParamResObj).length > 0 && drawParamResObj[drawParam]) {
        fillColor = this.parseColor(drawParamResObj[drawParam]['FillColor']);
        strokeColor  = this.parseColor(drawParamResObj[drawParam]['StrokeColor']);
        lineWith = converterDpi(drawParamResObj[drawParam]['LineWidth']);
      }
      const imageObjects = layer['ofd:ImageObject'];
      let imageObjectArray = [];
      imageObjectArray = imageObjectArray.concat(imageObjects);
      for (const imageObject of imageObjectArray) {
        if (imageObject) {
          this.drawImageObject(multiMediaResObj, imageObject, pageId);
        }
      }
      const pathObjects = layer['ofd:PathObject'];
      let pathObjectArray = [];
      pathObjectArray = pathObjectArray.concat(pathObjects);
      for (const pathObject of pathObjectArray) {
        if (pathObject) {
          this.drawPathObject(drawParamResObj, pathObject, pageId, fillColor, strokeColor, lineWith, isStampAnnot, stampAnnotBoundary);
        }
      }
      const textObjects = layer['ofd:TextObject'];
      let textObjectArray = [];
      textObjectArray = textObjectArray.concat(textObjects);
      for (const textObject of textObjectArray) {
        if (textObject) {
          this.drawTextObject(fontResObj, textObject, pageId, fillColor, strokeColor, isStampAnnot, stampAnnotBoundary);
        }
      }
    },

    drawImageObject(multiMediaResObj, imageObject, pageId) {
      const boundary = this.parseStBox(imageObject['@_Boundary']);
      const resId = imageObject['@_ResourceID'];
      if (multiMediaResObj[resId].format === 'gbig2') {
        const img = multiMediaResObj[resId].img;
        const width = multiMediaResObj[resId].width;
        const height = multiMediaResObj[resId].height;
        const arr = new Uint8ClampedArray(4*width*height);
        var mycanvas = document.getElementById(pageId)
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
        this.drawImageOnDiv(multiMediaResObj[resId].img, pageId, boundary);
      }
    },

    drawImageOnDiv(imgSrc, pageId, boundary, clip) {
      let mycanvas = document.getElementById(pageId);
      let div = document.createElement('div');
      let img = document.createElement('img');
      img.src = imgSrc;
      img.setAttribute('width', '100%');
      img.setAttribute('height', '100%');
      div.appendChild(img);
      var a = setInterval(() => {
        mycanvas = document.getElementById(pageId)
        if (!mycanvas) {
          return false
        } else {
          clearInterval(a)
          const pw = parseFloat(mycanvas.style.width.replace('px',''));
          const ph = parseFloat(mycanvas.style.height.replace('px',''));
          const w = boundary.w > pw ? pw: boundary.w;
          const h = boundary.h > ph ? ph :boundary.h;
          let c;
          if (clip) {
            c = `clip: rect(${clip.y}px, ${clip.w+clip.x}px, ${clip.h+clip.y}px, ${clip.x}px)`
          }
          div.setAttribute('style', `overflow: hidden; position: absolute; left: ${c?boundary.x : boundary.x<0?0:boundary.x}px; top: ${c? boundary.y : boundary.y<0?0:boundary.y}px; width: ${w}px; height: ${h}px; ${c}`)
          mycanvas.appendChild(div);
        }
      }, 1)
    },

    drawTextObject(fontResObj, textObject, pageId, defaultFillColor, defaultStrokeColor, isStampAnnot, stampAnnotBoundary) {
      const boundary = this.parseStBox(textObject['@_Boundary']);
      const ctm = textObject['@_CTM'];
      const hScale = textObject['@_HScale'];
      const font = textObject['@_Font'];
      const weight = textObject['@_Weight'];
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
          if (hScale) {
            text.setAttribute('transform', `scale(${hScale}, 1)`)
            text.setAttribute('transform-origin', `${textCodePoint.x}`);
          }
          text.setAttribute('fill', defaultStrokeColor);
          text.setAttribute('fill', defaultFillColor);
          text.setAttribute('style', `font-weight: ${weight};font-size:${size}px;font-family: ${getFontFamily(fontResObj[font])};`)
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

    drawPathObject(drawParamResObj, pathObject, pageId, defaultFillColor, defaultStrokeColor, defaultLineWith, isStampAnnot, stampAnnotBoundary) {
      const boundary = this.parseStBox(pathObject['@_Boundary']);
      let lineWidth = pathObject['@_LineWidth'];
      const abbreviatedData = pathObject['ofd:AbbreviatedData'];
      const points = calPathPoint(convertPathAbbreviatedDatatoPoint(abbreviatedData));
      const ctm = pathObject['@_CTM'];
      let svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
      svg.setAttribute('version','1.1');
      svg.style.width = isStampAnnot? boundary.w: Math.ceil(boundary.w);
      svg.style.height = isStampAnnot? boundary.h : Math.ceil(boundary.h);
      let path = document.createElementNS('http://www.w3.org/2000/svg','path');
      if (lineWidth) {
        defaultLineWith = converterDpi(lineWidth);
      }
      const drawParam = pathObject['@_DrawParam'];
      if (drawParam) {
        lineWidth = drawParamResObj[drawParam].LineWidth;
        if (lineWidth) {
          defaultLineWith = converterDpi(lineWidth);
        }
      }
      if (ctm) {
        const ctms = this.parseCtm(ctm);
        path.setAttribute('transform', `matrix(${ctms[0]} ${ctms[1]} ${ctms[2]} ${ctms[3]} ${converterDpi(ctms[4])} ${converterDpi(ctms[5])})`)
      }
      let strokeStyle = '';
      const strokeColor = pathObject['ofd:StrokeColor'];
      if (strokeColor) {
        defaultStrokeColor = this.parseColor(strokeColor['@_Value'])
      }
      let fillStyle = 'fill: none;';
      const fillColor = pathObject['ofd:FillColor'];
      if (fillColor) {
        defaultFillColor = this.parseColor(fillColor['@_Value'])
      }
      if (defaultLineWith > 0 && !defaultStrokeColor) {
        defaultStrokeColor = defaultFillColor;
        if (!defaultStrokeColor) {
          defaultStrokeColor = 'rgb(0, 0, 0)';
        }
      }
      strokeStyle = `stroke:${defaultStrokeColor};stroke-width:${defaultLineWith}px;`;
      fillStyle = `fill:${isStampAnnot?'none': defaultFillColor?defaultFillColor:'none'};`;
      path.setAttribute('style', `${strokeStyle};${fillStyle}`)
      let d = '';
      for (const point of points) {
        if (point.type === 'M') {
          d += `M${point.x} ${point.y} `;
        } else if (point.type === 'L') {
          d += `L${point.x} ${point.y} `;
        } else if (point.type === 'B') {
          d += `C${point.x1} ${point.y1} ${point.x2} ${point.y2} ${point.x3} ${point.y3} `;
        } else if (point.type === 'C') {
          d += `Z`;
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
        if (color.indexOf('#') !== -1) {
          color = color.replaceAll('#', '');
          color = color.replaceAll(' ', '');
          color = '#'+color.toString();
          return color;
        }
        let array = color.split(' ');
        return `rgb(${array[0]}, ${array[1]}, ${array[2]})`
      } else {
        return `rgb(0, 0, 0)`
      }
    },

    parsePageBox(obj) {
      if (obj) {
        let array = obj.split(' ');
        let width = converterDpi(parseFloat(array[2]));
        if (width > this.screenWidth) {
          const scale = (this.screenWidth-5) / parseFloat(array[2]);
          setPageScal(scale>0?scale:1);
        }
        return {
          x: converterDpi(parseFloat(array[0])), y: converterDpi(parseFloat(array[1])),
          w: converterDpi(parseFloat(array[2])), h: converterDpi(parseFloat(array[3]))
        };
      } else {
        return null;
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
        return null;
      }
    },

    getPageBox(pages, document) {
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
        box = this.parsePageBox(box);
        let boxObj = {};
        boxObj['id'] = Object.keys(page)[0];
        boxObj['box'] = box;
        this.pageBoxs.push(boxObj);
      }
    },

    getDocumentObj(zip) {
      console.log('start'+ new Date())
      pipeline.call(this, async () => await this.getDocRoot(zip), this.getDocument,
          this.getDocumentRes, this.getPublicRes, this.getTemplatePage, this.getPage)
          .then(res => {
            console.log('end'+ new Date())
            this.getPageBox(res.pages, res.document);
            this.drawPage(res.pages, res.tpls, false, null, res.fontResObj, res.drawParamResObj, res.multiMediaResObj);
            for (const stamp of res.stampAnnot) {
              this.unzipSeal(stamp);
            }
          })
          .catch(res => {
            console.log(res)
          });
    },

    getSealDocumentObj(zip, stampAnnot) {
      pipeline.call(this, async () => await this.getDocRoot(zip), this.getDocument,
          this.getDocumentRes, this.getPublicRes, this.getTemplatePage, this.getPage)
          .then(res => {
            console.log('seal Document', res)
            this.drawPage(res.pages, res.tpls, true, stampAnnot.stampAnnot, res.fontResObj, res.drawParamResObj, res.multiMediaResObj);
          })
          .catch(res => {
            console.log(res)
          });
    },

    async parsePage(zip, obj, doc) {
      let pagePath = obj['@_BaseLoc'];
      if (pagePath.indexOf(doc) == -1) {
        pagePath = `${doc}/${pagePath}`;
      }
      const data = await this.getJsonFromXmlContent(zip, pagePath);
      let pageObj = {};
      pageObj[obj['@_ID']] = {'json': data['json']['ofd:Page'], 'xml': data['xml']};
      return pageObj;
    },

    async getPage([zip, doc, Document, stampAnnot, tpls, fontResObj, drawParamResObj, multiMediaResObj]) {
      let pages = Document['ofd:Pages']['ofd:Page'];
      let array = [];
      array = array.concat(pages);
      let res = [];
      for (const page of array) {
        if (page) {
          let pageObj = await this.parsePage(zip, page, doc);
          res.push(pageObj);
        }
      }
      return {'doc': doc, 'document': Document, 'pages': res, 'tpls': tpls, 'stampAnnot': stampAnnot, fontResObj, drawParamResObj, multiMediaResObj};
    },

    async getTemplatePage([zip, doc, Document, stampAnnot, fontResObj, drawParamResObj, multiMediaResObj]) {
      let templatePages = Document['ofd:CommonData']['ofd:TemplatePage'];
      let array = [];
      array = array.concat(templatePages);
      let tpls = {};
      for (const templatePage of array) {
        if (templatePage) {
          let pageObj = await this.parsePage(zip, templatePage, doc);
          tpls[Object.keys(pageObj)[0]] = pageObj[Object.keys(pageObj)[0]];
        }
      }
      return [zip, doc, Document, stampAnnot, tpls, fontResObj, drawParamResObj, multiMediaResObj];
    },

    async getPublicRes([zip, doc, Document, stampAnnot, fontResObj, drawParamResObj, multiMediaResObj]) {
      let publicResPath = Document['ofd:CommonData']['ofd:PublicRes'];
      if (publicResPath) {
        if (publicResPath.indexOf(doc) == -1) {
          publicResPath = `${doc}/${publicResPath}`;
        }
        if (zip.files[publicResPath]) {
          const data = await this.getJsonFromXmlContent(zip, publicResPath);
          const publicResObj = data['json']['ofd:Res'];
          let fontObj = await this.getFont(publicResObj);
          fontResObj = Object.assign(fontResObj, fontObj);
          let drawParamObj = await this.getDrawParam(publicResObj);
          drawParamResObj = Object.assign(drawParamResObj, drawParamObj);
          let multiMediaObj = await this.getMultiMediaRes(zip, publicResObj, doc);
          multiMediaResObj = Object.assign(multiMediaResObj, multiMediaObj);
        }
      }
      return [zip, doc, Document, stampAnnot, fontResObj, drawParamResObj, multiMediaResObj];
    },

    async getDocumentRes([zip, doc, Document, stampAnnot]) {
      let documentResPath = Document['ofd:CommonData']['ofd:DocumentRes'];
      let fontResObj = {};
      let drawParamResObj = {};
      let multiMediaResObj = {};
      if (documentResPath) {
        if (documentResPath.indexOf('/') == -1) {
          documentResPath = `${doc}/${documentResPath}`;
        }
        if (zip.files[documentResPath]) {
          const data = await this.getJsonFromXmlContent(zip, documentResPath);
          const documentResObj = data['json']['ofd:Res'];
          fontResObj = await this.getFont(documentResObj);
          drawParamResObj = await this.getDrawParam(documentResObj);
          multiMediaResObj = await this.getMultiMediaRes(zip, documentResObj, doc);
        }
      }
      return [zip, doc, Document, stampAnnot, fontResObj, drawParamResObj, multiMediaResObj];
    },

    async getFont(res) {
      const fonts = res['ofd:Fonts'];
      let fontResObj = {};
      if (fonts) {
        let fontArray = [];
        fontArray = fontArray.concat(fonts['ofd:Font']);
        for (const font of fontArray) {
          if (font) {
            if (font['@_FamilyName']) {
              fontResObj[font['@_ID']] = font['@_FamilyName'];
              // this.fontResObj[font['@_ID']] = font['@_FamilyName'];
            } else {
              fontResObj[font['@_ID']] = font['@_FontName'];
              // this.fontResObj[font['@_ID']] = font['@_FontName'];
            }
          }
        }
      }
      return fontResObj;
    },

    async getDrawParam(res) {
      const drawParams = res['ofd:DrawParams'];
      let drawParamResObj = {};
      if (drawParams) {
        let array = [];
        array = array.concat(drawParams['ofd:DrawParam']);
        for (const item of array) {
          if (item) {
            // this.drawParamResObj[item['@_ID']] = { 'LineWidth': item['@_LineWidth'],
            // 'FillColor': item['ofd:FillColor']?item['ofd:FillColor']['@_Value']:'',
            //     'StrokeColor': item['ofd:StrokeColor']?item['ofd:StrokeColor']['@_Value']:""};
            drawParamResObj[item['@_ID']] = { 'LineWidth': item['@_LineWidth'],
              'FillColor': item['ofd:FillColor']?item['ofd:FillColor']['@_Value']:'',
              'StrokeColor': item['ofd:StrokeColor']?item['ofd:StrokeColor']['@_Value']:""};
          }
        }
      }
      return drawParamResObj;
    },

    async getMultiMediaRes(zip, res, doc) {
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
                const jbig2 = await this.getImageArrayFromZip(zip, file);
                // this.multiMediaResObj[item['@_ID']] = jbig2;
                multiMediaResObj[item['@_ID']] = jbig2;
              } else {
                const img = await this.getImageFromZip(zip, file);
                // this.multiMediaResObj[item['@_ID']] = {img, 'format': 'png'};
                multiMediaResObj[item['@_ID']] = {img, 'format': 'png'};
              }
            } else {
              // this.multiMediaResObj[item['@_ID']] = file;
              multiMediaResObj[item['@_ID']] = file;
            }
          }
        }
      }
      return multiMediaResObj;
    },

    async getDocument([zip, doc, docRoot, stampAnnot]) {
      const data = await this.getJsonFromXmlContent(zip, docRoot);
      const documentObj = data['json']['ofd:Document'];
      return [zip, doc, documentObj, stampAnnot];
    },

    async getDocRoot(zip) {
      const data = await this.getJsonFromXmlContent(zip, 'OFD.xml');
      let docRoot = data['json']['ofd:OFD']['ofd:DocBody']['ofd:DocRoot'];
      docRoot = replaceFirstSlash(docRoot);
      const doc = docRoot.split('/')[0];
      const signatures = data['json']['ofd:OFD']['ofd:DocBody']['ofd:Signatures'];
      const stampAnnot = await this.getSignature(zip, signatures, doc);
      return [zip, doc, docRoot, stampAnnot];
    },

    async getSignature(zip, signatures, doc) {
      let stampAnnot = [];
      if (signatures) {
        signatures = replaceFirstSlash(signatures);
        if (signatures.indexOf(doc) === -1) {
          signatures = `${doc}/${signatures}`
        }
        if (zip.files[signatures]) {
          let data = await this.getJsonFromXmlContent(zip, signatures);
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
              stampAnnot.push(await this.getSignatureData(zip, signatureLoc));
            }
          }
        }
      }
      return stampAnnot;
    },

    async getSignatureData(zip, signature) {
      const data = await this.getJsonFromXmlContent(zip, signature);
      let signedValue = (data['json']['ofd:Signature']['ofd:SignedValue'])
      signedValue = signedValue.toString().replace('/', '');
      let sealObj = await this.getByteFromZip(zip, signedValue);
      return {'stampAnnot': data['json']['ofd:Signature']['ofd:SignedInfo']['ofd:StampAnnot'],
          'sealObj': sealObj};
    },

    async getJsonFromXmlContent(zip, xmlName) {
      return new Promise((resolve, reject) => {
        zip.files[xmlName].async('string').then(function (content) {
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

    async getImageArrayFromZip(zip, name) {
      return new Promise((resolve, reject) => {
        zip.files[name].async('uint8array').then(function (bytes) {
          let jbig2 = new Jbig2Image();
          const img = jbig2.parse(bytes);
          resolve({img, width: jbig2.width, height: jbig2.height, format: 'gbig2'});
        }, function error(e) {
          reject(e);
        })
      });
    },

    async getImageFromZip(zip, name) {
      return new Promise((resolve, reject) => {
        zip.files[name].async('base64').then(function (bytes) {
          const img = 'data:image/png;base64,'+ bytes;
          resolve(img);
        }, function error(e) {
          reject(e);
        })
      });
    },

    async getByteFromZip(zip, name) {
      let that = this;
      return new Promise((resolve, reject) => {
        zip.files[name].async('base64').then(function (bytes) {
          let res = that.decodeText(bytes);
          resolve(res);
        }, function error(e) {
          reject(e);
        })
      });
    },

    decodeText(val) {
      try {
        let der = reHex.test(val) ? Hex.decode(val) : Base64.unarmor(val);
        return this.decode(der);
      } catch (e) {
        console.log(e)
        return {};
      }
    },

    decode(der, offset) {
      offset = offset || 0;
      try {
        let asn1 = ASN1.decode(der, offset);
        const type = this.getSealType(asn1);
        const sealObj = asn1.sub[0].sub[1].sub[0].sub[3].sub[1];
        const ofdArray = sealObj.stream.enc.subarray(sealObj.stream.pos+sealObj.header, sealObj.stream.pos+sealObj.length+sealObj.header);
        return {ofdArray, 'type': type.toLowerCase()};
      } catch (e) {
        console.log(e)
        return {};
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
      if (stampAnnot.sealObj && Object.keys(stampAnnot.sealObj).length > 0) {
        if (stampAnnot.sealObj.type === 'ofd') {
          JsZip.loadAsync(stampAnnot.sealObj.ofdArray)
              .then(function (zip) {
                console.log(zip)
                that.getSealDocumentObj(zip, stampAnnot);
              }, function (e) {
                console.log(e)
              });
        } else if (stampAnnot.sealObj.type === 'png') {
          let img = 'data:image/png;base64,' + btoa(String.fromCharCode.apply(null, stampAnnot.sealObj.ofdArray));
          let stampArray = [];
          stampArray = stampArray.concat(stampAnnot.stampAnnot);
          for (const annot of stampArray) {
            if (annot) {
              // console.log(annot)
              this.drawImageOnDiv(img, annot['@_PageRef'], this.parseStBox(annot['@_Boundary']), this.parseStBox(annot['@_Clip']));
            }
          }
        }
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
  font-family: "Kai, KaiTi";
}

.mycanvas {
  border: 1px solid rgb(199, 198, 198);
}

.hidden{
  display: none !important;
}


</style>
