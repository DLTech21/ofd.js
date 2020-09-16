<template>
  <div>
    <div style="display: flex">
      <div class="upload-icon" @click="uploadFile">
        <i class="upload-icon">选择文件</i>
        <input type="file" ref="file" class="hidden" accept=".ofd"
               @change="fileChanged">
      </div>

      <button class="upload-icon" @click="demo(1)">
        <i class="upload-icon">电票</i>
      </button>

      <div class="upload-icon" @click="demo(2)">
        <i class="upload-icon">电子公文</i>
      </div>

      <div class="upload-icon" @click="demo(3)">
        <i class="upload-icon">骑缝章</i>
      </div>

      <div class="upload-icon" @click="demo(4)">
        <i class="upload-icon">多页文档</i>
      </div>
    </div>
    <div style="margin-top:10px;display: flex;flex-direction: column;align-items: center;justify-content: center" id="content">
    </div>
  </div>
</template>

<script>

import {parseOfdDocument} from "@/utils/ofd_parser";
import {renderOfd} from "@/utils/ofd_render";
import * as JSZipUtils from "jszip-utils";
export default {
  name: 'HelloWorld',
  data() {
    return {
      ofdObj: null,
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
        // setPageScal(5)
        that.screenWidth = (document.body.clientWidth);
        const divs = renderOfd(that.screenWidth, that.ofdObj);
        let contentDiv = document.getElementById('content');
        contentDiv.innerHTML ='';
        for (const div of divs) {
          contentDiv.appendChild(div)
        }
      })()
    }
  },

  methods: {
    demo(value) {
      let ofdFile = null;
      switch (value) {
        case 1:
          ofdFile = 'https://51shouzu.xyz/999.ofd';
          break;
        case 2:
          ofdFile = 'https://51shouzu.xyz/n.ofd';
          break;
        case 3:
          ofdFile = 'https://51shouzu.xyz/h.ofd';
          break;
        case 4:
          ofdFile = 'https://51shouzu.xyz/2.ofd';
          break;
      }
      let that = this;
      JSZipUtils.getBinaryContent(ofdFile, function(err, data) {
        if(err) {
          throw err; // or handle err
        }
        that.getOfdDocumentObj(data, that.screenWidth);
      });

    },

    uploadFile() {
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
      this.getOfdDocumentObj(this.file, this.screenWidth);
      this.$refs.file.value = null;
    },


    getOfdDocumentObj(file, screenWidth) {
      let that = this;
      parseOfdDocument({
        ofd: file,
        success(res) {
          that.ofdObj = res;
          const divs = renderOfd(screenWidth, res);
          let contentDiv = document.getElementById('content');
          contentDiv.innerHTML ='';
          for (const div of divs) {
            contentDiv.appendChild(div)
          }
          // that.pageBoxs = renderPageBox(that.screenWidth, res.pages, res.document);
          // console.log(that.pageBoxs)
          // that.drawPage(res.pages, res.tpls, false, null, res.fontResObj, res.drawParamResObj, res.multiMediaResObj);
          // for (const stamp of res.stampAnnot) {
          //   if (stamp.type === 'ofd') {
          //     that.drawPage(stamp.obj.pages, stamp.obj.tpls, true, stamp.stamp.stampAnnot, stamp.obj.fontResObj, stamp.obj.drawParamResObj, stamp.obj.multiMediaResObj);
          //   } else if (stamp.type === 'png') {
          //     that.drawImageOnDiv(stamp.obj.img, stamp.obj.pageId, stamp.obj.boundary, stamp.obj.clip);
          //   }
          // }
        },
        fail(error) {
          console.log(error)
        }
      });
    },

    // drawPage(pages, tpls, isStampAnnot, stampAnnot, fontResObj, drawParamResObj, multiMediaResObj) {
    //   for (const page of pages) {
    //     const pageId = Object.keys(page)[0];
    //     let stampAnnotBoundary = {x: 0, y: 0, w: 0, h: 0};
    //     if (isStampAnnot && stampAnnot) {
    //       stampAnnotBoundary = stampAnnot.boundary;
    //     }
    //     const template = page[pageId]['json']['ofd:Template'];
    //     if (template) {
    //       const layer = tpls[template['@_TemplateID']]['json']['ofd:Content']['ofd:Layer'];
    //       this.drawLayer(fontResObj, drawParamResObj, multiMediaResObj, layer, isStampAnnot ? stampAnnot.pageRef : pageId, isStampAnnot, stampAnnotBoundary);
    //     }
    //     const contentLayer = page[pageId]['json']['ofd:Content']['ofd:Layer'];
    //     this.drawLayer(fontResObj, drawParamResObj, multiMediaResObj, contentLayer, isStampAnnot ? stampAnnot.pageRef : pageId, isStampAnnot, stampAnnotBoundary);
    //   }
    // },

    // drawLayer(fontResObj, drawParamResObj, multiMediaResObj, layer, pageId, isStampAnnot, stampAnnotBoundary) {
    //   let fillColor = null;
    //   let strokeColor = null;
    //   let lineWith = 0;
    //   const drawParam = layer['@_DrawParam'];
    //   if (drawParam && Object.keys(drawParamResObj).length > 0 && drawParamResObj[drawParam]) {
    //     fillColor = parseColor(drawParamResObj[drawParam]['FillColor']);
    //     strokeColor = parseColor(drawParamResObj[drawParam]['StrokeColor']);
    //     lineWith = converterDpi(drawParamResObj[drawParam]['LineWidth']);
    //   }
    //   const imageObjects = layer['ofd:ImageObject'];
    //   let imageObjectArray = [];
    //   imageObjectArray = imageObjectArray.concat(imageObjects);
    //   for (const imageObject of imageObjectArray) {
    //     if (imageObject) {
    //       this.drawImageObject(multiMediaResObj, imageObject, pageId);
    //     }
    //   }
    //   const pathObjects = layer['ofd:PathObject'];
    //   let pathObjectArray = [];
    //   pathObjectArray = pathObjectArray.concat(pathObjects);
    //   for (const pathObject of pathObjectArray) {
    //     if (pathObject) {
    //       this.drawPathObject(drawParamResObj, pathObject, pageId, fillColor, strokeColor, lineWith, isStampAnnot, stampAnnotBoundary);
    //     }
    //   }
    //   const textObjects = layer['ofd:TextObject'];
    //   let textObjectArray = [];
    //   textObjectArray = textObjectArray.concat(textObjects);
    //   for (const textObject of textObjectArray) {
    //     if (textObject) {
    //       this.drawTextObject(fontResObj, textObject, pageId, fillColor, strokeColor, isStampAnnot, stampAnnotBoundary);
    //     }
    //   }
    // },

    // drawImageObject(multiMediaResObj, imageObject, pageId) {
    //   let pageDiv = document.getElementById(pageId);
    //   let a = setInterval(() => {
    //     pageDiv = document.getElementById(pageId)
    //     if (!pageDiv) {
    //       return false
    //     } else {
    //       clearInterval(a);
    //       let element = renderImageObject(pageDiv.style.width, pageDiv.style.height, multiMediaResObj, imageObject)
    //       pageDiv.appendChild(element);
    //     }
    //   }, 1);
    // },

    // drawImageOnDiv(imgSrc, pageId, boundary, clip) {
    //   let pageDiv = document.getElementById(pageId);
    //   let a = setInterval(() => {
    //     pageDiv = document.getElementById(pageId)
    //     if (!pageDiv) {
    //       return false
    //     } else {
    //       clearInterval(a);
    //       let element = renderImageOnDiv(pageDiv.style.width, pageDiv.style.height, imgSrc, boundary, clip)
    //       pageDiv.appendChild(element);
    //     }
    //   }, 1);
    // },

    // drawTextObject(fontResObj, textObject, pageId, defaultFillColor, defaultStrokeColor, isStampAnnot, stampAnnotBoundary) {
    //   let pageDiv = document.getElementById(pageId);
    //   let a = setInterval(() => {
    //     pageDiv = document.getElementById(pageId)
    //     if (!pageDiv) {
    //       return false
    //     } else {
    //       clearInterval(a);
    //       let svg = renderTextObject(fontResObj, textObject, defaultFillColor, defaultStrokeColor, isStampAnnot, stampAnnotBoundary);
    //       pageDiv.appendChild(svg);
    //     }
    //   }, 1)
    // },

    // drawPathObject(drawParamResObj, pathObject, pageId, defaultFillColor, defaultStrokeColor, defaultLineWith, isStampAnnot, stampAnnotBoundary) {
    //   let pageDiv = document.getElementById(pageId)
    //   let a = setInterval(() => {
    //     pageDiv = document.getElementById(pageId)
    //     if (!pageDiv) {
    //       return false
    //     } else {
    //       clearInterval(a)
    //       let svg = renderPathObject(drawParamResObj, pathObject, null, defaultStrokeColor, defaultLineWith, isStampAnnot, stampAnnotBoundary)
    //       pageDiv.appendChild(svg);
    //     }
    //   }, 1)
    // },
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.upload-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 80px;
  line-height: 36px;
  background-color: rgb(59, 95, 232);
  border-radius: 2px;
  border-color: #5867dd;
  font-weight: 500;
  font-size: 1rem;
  color: white;
  margin: 1px;
}

.pageDiv {
  border: 1px solid rgb(199, 198, 198);
}

.hidden {
  display: none !important;
}


</style>
