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
    <div style="margin-top:10px;display: flex;flex-direction: column;align-items: center;justify-content: center"
         id="content">
    </div>

    <div class="SealContainer" id="sealInfoDiv" hidden="hidden" ref="sealInfoDiv">
      <div class="SealContainer mask" @click="closeSealInfoDialog"></div>
      <div class="SealContainer-layout">
        <div class="SealContainer-content">
          <p class="content-title">签章信息</p>
          <div class="subcontent">
            <span class="title">签章人</span>
            <span class="value" id="spSigner">Signer</span>
          </div>
          <div class="subcontent">
            <span class="title">签章提供者</span>
            <span class="value" id="spProvider">Provider</span>
          </div>
          <div class="subcontent">
            <span class="title">原文摘要值</span>
            <span class="value" id="spHashedValue" @click="showMore('原文摘要值', 'spHashedValue')"
                  style="cursor: pointer">HashedValue</span>
          </div>
          <div class="subcontent">
            <span class="title">签名值</span>
            <span class="value" id="spSignedValue" @click="showMore('签名值', 'spSignedValue')"
                  style="cursor: pointer">SignedValue</span>
          </div>
          <div class="subcontent">
            <span class="title">签名算法</span>
            <span class="value" id="spSignMethod">SignMethod</span>
          </div>
          <div class="subcontent">
            <span class="title">版本号</span>
            <span class="value" id="spVersion">Version</span>
          </div>

          <p class="content-title">印章信息</p>
          <div class="subcontent">
            <span class="title">印章标识</span>
            <span class="value" id="spSealID">SealID</span>
          </div>
          <div class="subcontent">
            <span class="title">印章名称</span>
            <span class="value" id="spSealName">SealName</span>
          </div>
          <div class="subcontent">
            <span class="title">印章类型</span>
            <span class="value" id="spSealType">SealType</span>
          </div>
          <div class="subcontent">
            <span class="title">有效时间</span>
            <span class="value" id="spSealAuthTime">从NotBefore到NotAfter</span>
          </div>
          <div class="subcontent">
            <span class="title">制章日期</span>
            <span class="value" id="spSealMakeTime">MakeTime</span>
          </div>
          <div class="subcontent">
            <span class="title">印章版本</span>
            <span class="value" id="spSealVersion">Version</span>
          </div>
        </div>
        <input style="position:absolute;right:1%;top:1%;" type="button" name="" id="" value="X"
               @click="closeSealInfoDialog()"/>
      </div>

    </div>


    <el-dialog :title="title" :visible.sync="dialogFormVisible">
      <span style="text-align: left">
        {{value}}
      </span>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="dialogFormVisible = false">确 定</el-button>
      </div>
    </el-dialog>

  </div>

</template>

<script>

import {parseOfdDocument, renderOfd} from "@/utils/ofd/ofd";
import * as JSZipUtils from "jszip-utils";

export default {
  name: 'HelloWorld',
  data() {
    return {
      title: null,
      value: null,
      dialogFormVisible: false,
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
        contentDiv.innerHTML = '';
        for (const div of divs) {
          contentDiv.appendChild(div)
        }
      })()
    }
  },

  methods: {
    closeSealInfoDialog() {
      this.$refs.sealInfoDiv.setAttribute('style', 'display: none');
    },

    showMore(title, id) {
      this.dialogFormVisible = true;
      this.value = document.getElementById(id).innerText;
      this.title = title;
    },

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
      JSZipUtils.getBinaryContent(ofdFile, function (err, data) {
        if (err) {
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
          contentDiv.innerHTML = '';
          for (const div of divs) {
            contentDiv.appendChild(div)
          }
        },
        fail(error) {
          console.log(error)
        }
      });
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

.SealContainer {
  position: fixed;
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
}

.SealContainer .mask {
  background: #000000;
  opacity: 0.3;
}

.content-title {
  font-size: 16px;
  text-align: center;
  border-bottom: 1px solid rgb(59, 95, 232);
  color: rgb(59, 95, 232);
  margin-top: 10px;
}



.SealContainer-content {
  position: relative;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  background: white;
  display: flex;
  flex-direction: column;
  padding: 10px;
  align-items: center;
}

.SealContainer-layout {
  position: relative;
  width: 60%;
  height: 80vh;
  overflow-y: auto;
  background: white;
  z-index: 100;
  display: flex;
  flex-direction: column;
  padding: 10px;
  align-items: center;
}

.subcontent {
  width: 80%;
  display: flex;
  flex-direction: column;
  text-align: left;
  margin-bottom: 10px;
  font-family: simsun;
}

@media (max-width: 767px) {
  .SealContainer-layout {
    position: relative;
    width: 90%;
    height: 90vh;
    overflow-y: auto;
    background: white;
    z-index: 100;
    display: flex;
    flex-direction: column;
    padding: 10px;
    align-items: center;
  }

  .subcontent {
    width: 95%;
    display: flex;
    flex-direction: column;
    text-align: left;
    margin-bottom: 10px;
    font-family: simsun;
  }
}
.subcontent .title {
  font-weight: 600;
}

.subcontent .value {
  font-weight: 400;
  -webkit-line-clamp: 1;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
