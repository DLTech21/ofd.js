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
  parseColor,
  setPageScal,
  converterDpi,
} from "../utils/ofd_util"

import {parseOfdDocument} from "@/utils/ofd_parser";
import {renderPageBox, renderImageObject, renderImageOnDiv, renderTextObject, renderPathObject} from "@/utils/ofd_render";

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
      let mycanvas = document.getElementById(pageId);
      let a = setInterval(() => {
        mycanvas = document.getElementById(pageId)
        if (!mycanvas) {
          return false
        } else {
          clearInterval(a);
          let element = renderImageObject(mycanvas.style.width, mycanvas.style.height, multiMediaResObj, imageObject)
          mycanvas.appendChild(element);
        }
      }, 1);
    },

    drawImageOnDiv(imgSrc, pageId, boundary, clip) {
      let mycanvas = document.getElementById(pageId);
      let a = setInterval(() => {
        mycanvas = document.getElementById(pageId)
        if (!mycanvas) {
          return false
        } else {
          clearInterval(a);
          let element = renderImageOnDiv(mycanvas.style.width, mycanvas.style.height, imgSrc, boundary, clip)
          mycanvas.appendChild(element);
        }
      }, 1);
    },

    drawTextObject(fontResObj, textObject, pageId, defaultFillColor, defaultStrokeColor, isStampAnnot, stampAnnotBoundary) {
      let mycanvas = document.getElementById(pageId);
      let a = setInterval(() => {
        mycanvas = document.getElementById(pageId)
        if (!mycanvas) {
          return false
        } else {
          clearInterval(a);
          let svg = renderTextObject(fontResObj, textObject, defaultFillColor, defaultStrokeColor, isStampAnnot, stampAnnotBoundary);
          mycanvas.appendChild(svg);
        }
      }, 1)
    },

    drawPathObject(drawParamResObj, pathObject, pageId, defaultFillColor, defaultStrokeColor, defaultLineWith, isStampAnnot, stampAnnotBoundary) {
      let mycanvas = document.getElementById(pageId)
      let a = setInterval(() => {
        mycanvas = document.getElementById(pageId)
        if (!mycanvas) {
          return false
        } else {
          clearInterval(a)
          let svg = renderPathObject(drawParamResObj, pathObject, defaultFillColor, defaultStrokeColor, defaultLineWith, isStampAnnot, stampAnnotBoundary)
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
