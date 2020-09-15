<template>
  <div>
    <div class="upload-icon" @click="uploadFile">
      <i class="upload-icon">选择OFD文件</i>
      <input type="file" ref="file" class="hidden" accept=".ofd"
             @change="fileChanged">
    </div>
    <div style="display: flex;flex-direction: column;align-items: center;justify-content: center">
      <div v-for="box in pageBoxs" :key="box.id" style="position: relative;margin-bottom: 5px">
        <div :id="box.id" :style="{ width: box.box.w + 'px', height: box.box.h + 'px'}" class="mycanvas"></div>
      </div>
    </div>
  </div>
</template>

<script>
import {
  parseCtm,
  parseColor,
  parseStBox,
  setPageScal,
  getFontFamily,
  converterDpi,
  convertPathAbbreviatedDatatoPoint,
  calPathPoint,
  calTextPoint
} from "../utils/ofd_util"

import {parseOfdDocument} from "@/utils/ofd_parser";
import {renderPageBox} from "@/utils/ofd_render";

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
      this.pageBoxs = [];
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
      this.getOfdDocumentObj(this.file);
      this.$refs.file.value = null;
    },


    getOfdDocumentObj(file) {
      let that = this;
      parseOfdDocument({
        ofd: file,
        success(res) {
          that.pageBoxs = renderPageBox(that.screenWidth, res.pages, res.document);
          that.drawPage(res.pages, res.tpls, false, null, res.fontResObj, res.drawParamResObj, res.multiMediaResObj);
          for (const stamp of res.stampAnnot) {
            if (stamp.type === 'ofd') {
              that.drawPage(stamp.obj.pages, stamp.obj.tpls, true, stamp.stamp.stampAnnot, stamp.obj.fontResObj, stamp.obj.drawParamResObj, stamp.obj.multiMediaResObj);
            } else if (stamp.type === 'png') {
              that.drawImageOnDiv(stamp.obj.img, stamp.obj.pageId, stamp.obj.boundary, stamp.obj.clip);
            }
          }
        },
        fail(error) {
          console.log(error)
        }
      });
    },

    drawPage(pages, tpls, isStampAnnot, stampAnnot, fontResObj, drawParamResObj, multiMediaResObj) {
      for (const page of pages) {
        const pageId = Object.keys(page)[0];
        let stampAnnotBoundary = {x: 0, y: 0, w: 0, h: 0};
        if (isStampAnnot && stampAnnot) {
          stampAnnotBoundary = stampAnnot.boundary;
        }
        const template = page[pageId]['json']['ofd:Template'];
        if (template) {
          const layer = tpls[template['@_TemplateID']]['json']['ofd:Content']['ofd:Layer'];
          this.drawLayer(fontResObj, drawParamResObj, multiMediaResObj, layer, isStampAnnot ? stampAnnot.pageRef : pageId, isStampAnnot, stampAnnotBoundary);
        }
        const contentLayer = page[pageId]['json']['ofd:Content']['ofd:Layer'];
        this.drawLayer(fontResObj, drawParamResObj, multiMediaResObj, contentLayer, isStampAnnot ? stampAnnot.pageRef : pageId, isStampAnnot, stampAnnotBoundary);
      }
    },

    drawLayer(fontResObj, drawParamResObj, multiMediaResObj, layer, pageId, isStampAnnot, stampAnnotBoundary) {
      let fillColor = null;
      let strokeColor = null;
      let lineWith = 0;
      const drawParam = layer['@_DrawParam'];
      if (drawParam && Object.keys(drawParamResObj).length > 0 && drawParamResObj[drawParam]) {
        fillColor = parseColor(drawParamResObj[drawParam]['FillColor']);
        strokeColor = parseColor(drawParamResObj[drawParam]['StrokeColor']);
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
      const boundary = parseStBox(imageObject['@_Boundary']);
      const resId = imageObject['@_ResourceID'];
      if (multiMediaResObj[resId].format === 'gbig2') {
        const img = multiMediaResObj[resId].img;
        const width = multiMediaResObj[resId].width;
        const height = multiMediaResObj[resId].height;
        const arr = new Uint8ClampedArray(4 * width * height);
        var mycanvas = document.getElementById(pageId)
        for (var i = 0; i < img.length; i++) {
          arr[4 * i] = img[i];
          arr[4 * i + 1] = img[i];
          arr[4 * i + 2] = img[i];
          arr[4 * i + 3] = 255;
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
          const pw = parseFloat(mycanvas.style.width.replace('px', ''));
          const ph = parseFloat(mycanvas.style.height.replace('px', ''));
          const w = boundary.w > pw ? pw : boundary.w;
          const h = boundary.h > ph ? ph : boundary.h;
          let c;
          if (clip) {
            c = `clip: rect(${clip.y}px, ${clip.w + clip.x}px, ${clip.h + clip.y}px, ${clip.x}px)`
          }
          div.setAttribute('style', `overflow: hidden; position: absolute; left: ${c ? boundary.x : boundary.x < 0 ? 0 : boundary.x}px; top: ${c ? boundary.y : boundary.y < 0 ? 0 : boundary.y}px; width: ${w}px; height: ${h}px; ${c}`)
          mycanvas.appendChild(div);
        }
      }, 1)
    },

    drawTextObject(fontResObj, textObject, pageId, defaultFillColor, defaultStrokeColor, isStampAnnot, stampAnnotBoundary) {
      const boundary = parseStBox(textObject['@_Boundary']);
      const ctm = textObject['@_CTM'];
      const hScale = textObject['@_HScale'];
      const font = textObject['@_Font'];
      const weight = textObject['@_Weight'];
      const size = converterDpi(parseFloat(textObject['@_Size']));
      const textCode = textObject['ofd:TextCode'];
      const textCodePointList = calTextPoint(textCode);
      let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('version', '1.1');
      svg.style.width = boundary.w;
      svg.style.height = boundary.h;
      const fillColor = textObject['ofd:FillColor'];
      if (fillColor) {
        defaultFillColor = parseColor(fillColor['@_Value']);
      }
      for (const textCodePoint of textCodePointList) {
        if (!isNaN(textCodePoint.x)) {
          let text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          text.setAttribute('x', textCodePoint.x);
          text.setAttribute('y', textCodePoint.y);
          text.innerHTML = textCodePoint.text;
          if (ctm) {
            const ctms = parseCtm(ctm);
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
      const boundary = parseStBox(pathObject['@_Boundary']);
      let lineWidth = pathObject['@_LineWidth'];
      const abbreviatedData = pathObject['ofd:AbbreviatedData'];
      const points = calPathPoint(convertPathAbbreviatedDatatoPoint(abbreviatedData));
      const ctm = pathObject['@_CTM'];
      let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('version', '1.1');
      svg.style.width = isStampAnnot ? boundary.w : Math.ceil(boundary.w);
      svg.style.height = isStampAnnot ? boundary.h : Math.ceil(boundary.h);
      let path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
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
        const ctms = parseCtm(ctm);
        path.setAttribute('transform', `matrix(${ctms[0]} ${ctms[1]} ${ctms[2]} ${ctms[3]} ${converterDpi(ctms[4])} ${converterDpi(ctms[5])})`)
      }
      let strokeStyle = '';
      const strokeColor = pathObject['ofd:StrokeColor'];
      if (strokeColor) {
        defaultStrokeColor = parseColor(strokeColor['@_Value'])
      }
      let fillStyle = 'fill: none;';
      const fillColor = pathObject['ofd:FillColor'];
      if (fillColor) {
        defaultFillColor = parseColor(fillColor['@_Value'])
      }
      if (defaultLineWith > 0 && !defaultStrokeColor) {
        defaultStrokeColor = defaultFillColor;
        if (!defaultStrokeColor) {
          defaultStrokeColor = 'rgb(0, 0, 0)';
        }
      }
      strokeStyle = `stroke:${defaultStrokeColor};stroke-width:${defaultLineWith}px;`;
      fillStyle = `fill:${isStampAnnot ? 'none' : defaultFillColor ? defaultFillColor : 'none'};`;
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

.hidden {
  display: none !important;
}


</style>
