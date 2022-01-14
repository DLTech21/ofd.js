<template>
  <el-container style="width:100vw; height: 100vh;">
    <el-header style="background:#F5F5F5;display: flex; height: 40px; border: 1px solid #e8e8e8; align-items: center;">
      <div class="upload-icon" @click="uploadFile">
        <div class="upload-icon">打开OFD</div>
        <input type="file" ref="file" class="hidden" accept=".ofd"
               @change="fileChanged">
      </div>

      <div class="upload-icon" @click="uploadOfdFile">
        <div class="upload-icon">OFD2PDF</div>
        <input type="file" ref="ofdFile" class="hidden" accept=".ofd"
               @change="ofdFileChanged">
      </div>

      <div class="upload-icon" @click="uploadPdfFile">
        <div class="upload-icon">PDF2OFD</div>
        <input type="file" ref="pdfFile" class="hidden" accept=".pdf"
               @change="pdfFileChanged">
      </div>
      <div class="upload-icon" @click="getSealPosition" v-if="dragseal">
        <div class="upload-icon">获取签章坐标</div>
      </div>
      <div class="upload-icon" @click="print">
        <div class="upload-icon">打印</div>
      </div>
      <div class="upload-icon" @click="printSecret">
        <div class="upload-icon">脱密打印</div>
      </div>
      <div style="display: flex;align-items: center" v-if="ofdObj">
        <div class="upload-icon" style="margin-left: 10px" @click="downPdf" v-if="ofdBase64">
          下载PDF
        </div>

        <div class="scale-icon" style="margin-left: 10px" @click="plus">
          <i class="el-icon-circle-plus-outline"></i>
        </div>

        <div class="scale-icon" @click="minus">
          <i class="el-icon-remove-outline"></i>
        </div>
        <div class="scale-icon" @click="firstPage">
          First
        </div>

        <div class="scale-icon" style="font-size: 18px" @click="prePage">
          <i class="el-icon-caret-left"></i>
        </div>

        <div class="scale-icon">
          {{ pageIndex }}/{{ pageCount }}
        </div>

        <div class="scale-icon" style="font-size: 18px" @click="nextPage">
          <i class="el-icon-caret-right"></i>
        </div>

        <div class="scale-icon" @click="lastPage">
          Last
        </div>
      </div>
    </el-header>
    <el-main style="height: auto;background: #808080;;padding: 0" v-loading="loading" id="main">
      <div class="main-section" id="content" ref="contentDiv" @mousewheel="scrool" v-html="ofdDiv">
      </div>
    </el-main>

    <el-dialog :visible.sync="dialogSignVisible" :close-on-click-modal="false">
      <div class="SealContainer-content">
        <p class="content-title">签章信息</p>
        <div class="subcontent">
          <span class="title">签章人</span>
          <span class="value" id="spSigner">{{ spSigner }}</span>
        </div>
        <div class="subcontent">
          <span class="title">签章提供者</span>
          <span class="value" id="spProvider">{{ spProvider }}</span>
        </div>
        <div class="subcontent">
          <span class="title">原文摘要值</span>
          <span class="value" id="spHashedValue" @click="showMore('原文摘要值', 'spHashedValue')"
                style="cursor: pointer">{{ spHashedValue }}</span>
        </div>
        <div class="subcontent">
          <span class="title">签名值</span>
          <span class="value" id="spSignedValue" @click="showMore('签名值', 'spSignedValue')"
                style="cursor: pointer">{{ spSignedValue }}</span>
        </div>
        <div class="subcontent">
          <span class="title">签名算法</span>
          <span class="value" id="spSignMethod">{{ spSignMethod }}</span>
        </div>
        <div class="subcontent">
          <span class="title">版本号</span>
          <span class="value" id="spVersion">{{ spVersion }}</span>
        </div>
        <div class="subcontent">
          <span class="title">验签结果</span>
          <span class="value" id="VerifyRet">{{ VerifyRet }}</span>
        </div>

        <p class="content-title">印章信息</p>
        <div class="subcontent">
          <span class="title">印章标识</span>
          <span class="value" id="spSealID">{{ spSealID }}</span>
        </div>
        <div class="subcontent">
          <span class="title">印章名称</span>
          <span class="value" id="spSealName">{{ spSealName }}</span>
        </div>
        <div class="subcontent">
          <span class="title">印章类型</span>
          <span class="value" id="spSealType">{{ spSealType }}</span>
        </div>
        <div class="subcontent">
          <span class="title">有效时间</span>
          <span class="value" id="spSealAuthTime">{{ spSealAuthTime }}</span>
        </div>
        <div class="subcontent">
          <span class="title">制章日期</span>
          <span class="value" id="spSealMakeTime">{{ spSealMakeTime }}</span>
        </div>
        <div class="subcontent">
          <span class="title">印章版本</span>
          <span class="value" id="spSealVersion">{{ spSealVersion }}</span>
        </div>
      </div>
    </el-dialog>

    <el-dialog :title="title" :visible.sync="dialogFormVisible">
      <span style="text-align: left">
        {{ value }}
      </span>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="dialogFormVisible = false">确 定</el-button>
      </div>
    </el-dialog>
  </el-container>
</template>

<script>

import {
  parseOfdDocument,
  renderOfd,
  renderOfdByScale,
  getPageScale,
  setPageScale,
} from "@/utils/ofd/ofd";
import {hashOfdDocument} from "../utils/ofd/ofd";
import {readUTF, replaceFirstSlash, replaceFirstTarget} from "../utils/ofd/ofd_util";
import {sm2VerifySig} from "../utils/ofd/Fonts";

export default {
  name: 'HelloWorld',
  data() {
    return {
      dragseal: false,//是否显示公章图片位置
      docleft: 0,//公章距离左侧文档边缘的距离
      pdfFile: null,
      ofdFile: null,
      ofdBase64: null,
      loading: false,
      pageIndex: 1,
      pageCount: 0,
      scale: 0,
      title: null,
      value: null,
      dialogFormVisible: false,
      ofdObj: null,
      screenWidth: document.body.clientWidth,
      ofdDiv: null,
      isFont: false,
      currentFile: null,
      dialogSignVisible: false,
      VerifyRet: null,
      spSigner: null,
      spProvider: null,
      spHashedValue: null,
      spSignedValue: null,
      spSignMethod: null,
      spSealID: null,
      spSealName: null,
      spSealType: null,
      spSealAuthTime: null,
      spSealMakeTime: null,
      spSealVersion: null,
      spVersion: null
    }
  },

  created() {
    this.pdfFile = null;
    this.file = null;
  },

  mounted() {
    this.screenWidth = document.body.clientWidth
    let that = this;
    this.$refs.contentDiv.addEventListener('scroll', this.scrool);
    window.onresize = () => {
      return (() => {
        /* that.screenWidth = (document.body.clientWidth - 88);
       const divs = renderOfd(that.screenWidth, that.ofdObj);
       that.displayOfdDiv(divs);*/

        let seal = document.getElementById("seal");
        seal.style.left = (that.docleft) + "px";
      })()
    }
  },

  methods: {
    print() {
      let dom = this.$refs["contentDiv"];
      let childs = dom.children;
      this.loading = true;
      this.progressVisible = true;
      let list = [];
      let i = 0;
      for (let ele of childs) {
        list.push(ele.cloneNode(true));
        this.percentage = i / childs.length;
      }
      if (list.length > 0) {
        var mywindow = window.open("打印窗口", "_blank");
        //给新打开的标签页添加画布内容（这里指的是id=div2img元素的内容）
        var documentBody = mywindow.document.body;
        console.log(list.length)
        for (let canvas of list) {
          documentBody.appendChild(canvas);
        }
        this.progressVisible = false;
        this.loading = false;
        //焦点移到新打开的标签页
        mywindow.focus();
        //执行打印的方法（注意打印方法是打印的当前窗口内的元素，所以前面才新建一个窗口：print()--打印当前窗口的内容。）
        mywindow.print();
        //操作完成之后关闭当前标签页（点击确定或者取消都会关闭）
        mywindow.close();
      }


    },
    printSecret() {
      let sealdivs = document.getElementsByTagName('img')
      //公章图片
      for (let ele of sealdivs) {
        ele.style.filter = "grayscale(100%)";
      }
      this.print();
      for (let ele of sealdivs) {
        ele.style.filter = "";
      }
    },
    createSealImg() {//创建公章
      let contentDiv = document.getElementById('content');
      var imgdiv = document.createElement("div");
      imgdiv.setAttribute("class", "seal");
      imgdiv.setAttribute("id", "seal");
      imgdiv.setAttribute("style", "display:none;top:0px;position: absolute;z-index: 999999;")
      contentDiv.appendChild(imgdiv);
      imgdiv.innerHTML = "<img src='./seal.png' id='sealimage' style='opacity:0.9;' height='210px' width='210px'>";
    },
    zoomSeal() {//签章
      this.dragseal = true;//显示获取签章位置的按钮
      var that = this;
      let seal = document.getElementById("seal");
      let content = document.getElementById("content");
      let sealimage = document.getElementById("sealimage");
      let main = document.getElementById("main");
      seal.style.display = "block";

      document.onmousemove = function (e) {
        seal.style.top = main.scrollTop + e.clientY - content.offsetTop - (sealimage.width / 2) + "px";
        seal.style.left = main.scrollLeft - that.leftMenu_width + e.clientX - (sealimage.height / 2) + "px";
      }
      seal.onmousedown = function () {
        document.onmousemove = function (e) {
          seal.style.top = main.scrollTop + e.clientY - content.offsetTop - (sealimage.width / 2) + "px";
          seal.style.left = main.scrollLeft - that.leftMenu_width + e.clientX - (sealimage.height / 2) + "px";
        }
        document.onmouseup = function () {
          //计算距离文档左边缘距离
          that.docleft = parseFloat(seal.style.left) - that.leftMenu_width - content.childNodes[0].offsetLeft;
          document.onmousemove = null;
          document.onmouseup = null;
        }
      }
    },
    getSealPosition() {//获得公章位置信息
      let seal = document.getElementById("seal");//公章容器
      let content = document.getElementById("content");//主容器
      let sealimage = document.getElementById("sealimage");//公章图片
      let sealLeft = parseFloat(seal.style.left);
      let sealTop = parseFloat(seal.style.top);
      let x = (sealLeft - content.childNodes[0].offsetLeft) / this.scale;//公章左侧开始坐标
      let pageHeight = parseFloat(content.childNodes[0].style.height);
      let page = Math.ceil(sealTop / pageHeight);//获得当前页
      let y = (sealTop % pageHeight - page * 20) / this.scale;//获取距离当前页顶部距离
      let position = {
        x: x,//左边缘位置 毫米
        y: y,//上边缘位置 毫米
        page: page,//页
        width: sealimage.width / this.scale,//公章图片宽度 毫米
        height: sealimage.height / this.scale//公章图片高度 毫米
      }
      alert(JSON.stringify(position));
    },
    scrool() {
      let scrolled = this.$refs.contentDiv.firstElementChild?.getBoundingClientRect()?.top - 60;
      let top = 0
      let index = 0;
      for (let i = 0; i < this.$refs.contentDiv.childElementCount; i++) {
        top += (Math.abs(this.$refs.contentDiv.children.item(i)?.style.height.replace('px', '')) + Math.abs(this.$refs.contentDiv.children.item(i)?.style.marginBottom.replace('px', '')));
        if (Math.abs(scrolled) < top) {
          index = i;
          break;
        }
      }
      this.pageIndex = index + 1;
    },

    showMore(title, id) {
      this.dialogFormVisible = true;
      this.value = document.getElementById(id).innerText;
      this.title = title;
    },

    downOfd(pdfBase64) {
      let that = this;
      this.loading = true;
      this.$axios({
        method: "post",
        url: "https://51shouzu.xyz/api/ofd/convertOfd",
        data: {
          pdfBase64,
        }
      }).then(response => {
        that.loading = false;
        var binary = atob(response.data.data.replace(/\s/g, ''));
        var len = binary.length;
        var buffer = new ArrayBuffer(len);
        var view = new Uint8Array(buffer);
        for (var i = 0; i < len; i++) {
          view[i] = binary.charCodeAt(i);
        }
        var blob = new Blob([view], null);
        var url = URL.createObjectURL(blob);
        let link = document.createElement('a')
        link.style.display = 'none'
        link.href = url
        link.setAttribute('download', 'ofd.ofd')
        document.body.appendChild(link)
        link.click()

      }).catch(error => {
        console.log(error, "error")
        that.$alert('PDF打开失败', error, {
          confirmButtonText: '确定',
          callback: action => {
            this.$message({
              type: 'info',
              message: `action: ${action}`
            });
          }
        });
      });
    },

    downPdf() {
      let that = this;
      this.loading = true;
      this.$axios({
        method: "post",
        url: "https://51shouzu.xyz/api/ofd/convertPdf",
        data: {
          ofdBase64: this.ofdBase64
        }
      }).then(response => {
        that.loading = false;
        var binary = atob(response.data.data.replace(/\s/g, ''));
        var len = binary.length;
        var buffer = new ArrayBuffer(len);
        var view = new Uint8Array(buffer);
        for (var i = 0; i < len; i++) {
          view[i] = binary.charCodeAt(i);
        }
        var blob = new Blob([view], {type: "application/pdf"});
        var url = URL.createObjectURL(blob);
        let link = document.createElement('a')
        link.style.display = 'none'
        link.href = url
        link.setAttribute('download', 'ofd.pdf')
        document.body.appendChild(link)
        link.click()

      }).catch(error => {
        console.log(error, "error")
        that.$alert('OFD打开失败', error, {
          confirmButtonText: '确定',
          callback: action => {
            this.$message({
              type: 'info',
              message: `action: ${action}`
            });
          }
        });
      });
    },

    plus() {
      setPageScale(++this.scale);
      const divs = renderOfdByScale(this.ofdObj);
      this.displayOfdDiv(divs);
    },

    minus() {
      setPageScale(--this.scale);
      const divs = renderOfdByScale(this.ofdObj);
      this.displayOfdDiv(divs);
    },

    prePage() {
      let contentDiv = document.getElementById('content');
      let ele = contentDiv.children.item(this.pageIndex - 2);
      ele?.scrollIntoView(true);
      ele ? this.pageIndex = this.pageIndex - 1 : '';
    },

    firstPage() {
      let contentDiv = document.getElementById('content');
      let ele = contentDiv.firstElementChild;
      ele?.scrollIntoView(true);
      ele ? this.pageIndex = 1 : '';
    },

    nextPage() {
      let contentDiv = document.getElementById('content');
      if (this.pageIndex >= contentDiv.childElementCount - 1) return
      let ele = contentDiv.children.item(this.pageIndex);
      ele?.scrollIntoView(true);
      ele ? ++this.pageIndex : '';
    },

    lastPage() {
      let contentDiv = document.getElementById('content');
      this.pageIndex = contentDiv.childElementCount - 1
      let ele = contentDiv.children.item(this.pageIndex - 1);
      ele?.scrollIntoView(true);
    },

    uploadFile() {
      this.isFont = false
      this.file = null;
      this.$refs.file.click();
    },
    fileChanged() {
      this.file = this.$refs.file.files[0];
      let ext = this.file.name.replace(/.+\./, "");
      if (["ofd"].indexOf(ext) === -1) {
        this.$alert('error', '仅支持ofd类型', {
          confirmButtonText: '确定',
          callback: action => {
            this.$message({
              type: 'info',
              message: `action: ${action}`
            });
          }
        });
        return;
      }
      if (this.file.size > 100 * 1024 * 1024) {
        this.$alert('error', '文件大小需 < 100M', {
          confirmButtonText: '确定',
          callback: action => {
            this.$message({
              type: 'info',
              message: `action: ${action}`
            });
          }
        });
        return;
      }
      let that = this;
      let reader = new FileReader();
      reader.readAsDataURL(this.file);
      reader.onload = function (e) {
        that.ofdBase64 = e.target.result.split(',')[1];
      }
      this.getOfdDocumentObj(this.file, this.screenWidth);
      this.$refs.file.value = null;
    },

    uploadPdfFile() {
      this.pdfFile = null;
      this.$refs.pdfFile.click();
    },
    pdfFileChanged() {
      this.pdfFile = this.$refs.pdfFile.files[0];
      let ext = this.pdfFile.name.replace(/.+\./, "");
      if (["pdf"].indexOf(ext) === -1) {
        this.$alert('error', '仅支持pdf类型', {
          confirmButtonText: '确定',
          callback: action => {
            this.$message({
              type: 'info',
              message: `action: ${action}`
            });
          }
        });
        return;
      }
      if (this.pdfFile.size > 100 * 1024 * 1024) {
        this.$alert('error', '文件大小需 < 100M', {
          confirmButtonText: '确定',
          callback: action => {
            this.$message({
              type: 'info',
              message: `action: ${action}`
            });
          }
        });
        return;
      }
      let that = this;
      let reader = new FileReader();
      reader.readAsDataURL(this.pdfFile);
      reader.onload = function (e) {
        let pdfBase64 = e.target.result.split(',')[1];
        that.downOfd(pdfBase64);
      }
      this.$refs.pdfFile.value = null;
    },

    uploadOfdFile() {
      this.ofdFile = null;
      this.$refs.ofdFile.click();
    },
    ofdFileChanged() {
      this.ofdFile = this.$refs.ofdFile.files[0];
      let ext = this.ofdFile.name.replace(/.+\./, "");
      if (["ofd"].indexOf(ext) === -1) {
        this.$alert('error', '仅支持ofd类型', {
          confirmButtonText: '确定',
          callback: action => {
            this.$message({
              type: 'info',
              message: `action: ${action}`
            });
          }
        });
        return;
      }
      if (this.ofdFile.size > 100 * 1024 * 1024) {
        this.$alert('error', '文件大小需 < 100M', {
          confirmButtonText: '确定',
          callback: action => {
            this.$message({
              type: 'info',
              message: `action: ${action}`
            });
          }
        });
        return;
      }
      let that = this;
      let reader = new FileReader();
      reader.readAsDataURL(this.ofdFile);
      reader.onload = function (e) {
        let ofdBase64 = e.target.result.split(',')[1];
        that.ofdBase64 = ofdBase64
        that.downPdf();
      }
      this.$refs.ofdFile.value = null;
    },


    getOfdDocumentObj(file, screenWidth) {
      let t = new Date().getTime();
      let that = this
      this.currentFile = file;
      this.loading = true;
      let contentDiv = document.getElementById('content');
      contentDiv.innerHTML = '';
      parseOfdDocument({
        ofd: file,
        success(res) {
          if (res.code == 0) {
            that.ofdObj = res.data.ofd;
            let t1 = new Date().getTime();
            console.log('解析ofd', t1 - t);
            that.pageCount = that.ofdObj.Document[0].Pages.length;
            const divs = renderOfd(screenWidth, that.ofdObj.Document[0]);
            let t2 = new Date().getTime();
            console.log('xml转svg', t2 - t1)
            let t3 = new Date().getTime();
            that.displayOfdDiv(divs);
            console.log('svg渲染到页面', t3 - t2);
            that.loading = false;
          } else {
            console.log(res.msg);
          }
        }
      })

    },

    displayOfdDiv(divs) {
      this.scale = getPageScale();
      let contentDiv = document.getElementById('content');
      contentDiv.innerHTML = '';
      for (const div of divs) {
        contentDiv.appendChild(div)
      }
      for (let ele of document.getElementsByName('seal_img_div')) {
        this.addEventOnSealDiv(ele, ele.dataset.pageRef, ele.dataset.signatureId);
      }
    },

    addEventOnSealDiv(div, pageRef, signatureId) {
      try {
        let that = this;
        div.addEventListener("click", function () {
          that.dialogSignVisible = true
          let currentStamp = that.findStamp(pageRef, signatureId)
          if (currentStamp) {
            that.VerifyRet = "文件摘要值后台验证中，请稍等... ";
            let refer = '';
            for (let r of currentStamp.SignedInfo.References) {
              refer += `${replaceFirstSlash(r.FileRef)}|`
            }
            hashOfdDocument({
              ofd: that.currentFile,
              list: refer,
              method: currentStamp.SignedInfo.ReferencesCheckMethod,
              success(res) {
                let hashCheck = true
                for (let r of currentStamp.SignedInfo.References) {
                  let value = r.CheckValue;
                  let calValue = res[`${replaceFirstSlash(r.FileRef)}`]
                  hashCheck &= (value === calValue)
                  const hashRetStr = hashCheck ? "文件摘要值验证成功" : "文件摘要值验证失败";
                  that.VerifyRet = `${currentStamp.SignatureValid ? "签名值验证成功" : "签名值验证失败"}, ${hashRetStr}`
                }
              }
            })
          }
        });
      } catch (e) {
        console.log(e);
      }
    },

    findStamp(pageRef, signatureId) {
      let currentStamp = null
      for (let i = 0; i < this.ofdObj.Document[0].Signatures.Signature.length; i++) {
        let obj = this.ofdObj.Document[0].Signatures.Signature
        for (let s of obj) {
          for (let st of s.Signature.SignedInfo.StampAnnot) {
            if (st.ID == signatureId && st.PageRef == pageRef) {
              currentStamp = s.Signature;
              break
            }
          }
        }
      }
      if (!currentStamp)
        return null;
      this.spProvider = currentStamp.SignedInfo.Provider.ProviderName
      this.spSignMethod = currentStamp.SignedInfo.SignatureMethod
      this.spSignedValue = currentStamp.signatureHex
      this.spHashedValue = currentStamp.HashHex
      this.spSealID = currentStamp.SignedInfo.Seal.esID
      this.spSealVersion = currentStamp.SignedInfo.Seal.Header.version
      this.spSealName =  currentStamp.SignedInfo.Seal.Property.name
      this.spSealType = currentStamp.SignedInfo.Seal.Property.type
      this.spSealMakeTime = currentStamp.SignedInfo.Seal.Property.createDate
      this.spSealAuthTime = `${currentStamp.SignedInfo.Seal.Property.validStart} 至 ${currentStamp.SignedInfo.Seal.Property.validEnd}`
      const subjectArray = replaceFirstSlash(currentStamp.SignCert.subject).split('/');
      for(let item of subjectArray) {
        if (item.toLowerCase().indexOf('ou') === 0) {
          let ouContent = item.substr(3, item.length);
          if (ouContent.indexOf('\\x') === 0) {
            let ouArray = replaceFirstTarget(ouContent, '\\').split('\\');
            let utf = []
            for (let s of ouArray) {
              utf.push(`0${s}`-0)
            }
            let a = readUTF(utf);
            this.spSigner = a
          } else {
            this.spSigner = ouContent
          }
          break
        }
      }
      return currentStamp;
    }

  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.upload-icon {
  display: flex;
  cursor: pointer;
  justify-content: center;
  align-items: center;
  height: 28px;
  padding-left: 10px;
  padding-right: 10px;
  background-color: rgb(59, 95, 232);
  border-radius: 1px;
  border-color: #5867dd;
  font-weight: 500;
  font-size: 12px;
  color: white;
  margin: 1px;
}

.scale-icon {
  display: flex;
  cursor: pointer;
  justify-content: center;
  align-items: center;
  width: 33px;
  height: 28px;
  background-color: #F5F5F5;;
  border-radius: 1px;
  font-weight: 500;
  font-size: 12px;
  color: #333333;
  text-align: center;
  padding: 2px;

}

.scale-icon :active {
  color: rgb(59, 95, 232);
}

.scale-icon :hover {
  color: rgb(59, 95, 232);
}

.text-icon {
  display: flex;
  cursor: pointer;
  justify-content: center;
  align-items: center;
  height: 28px;
  width: 90%;
  background-color: rgb(59, 95, 232);
  border-radius: 1px;
  border-color: #5867dd;
  font-weight: 500;
  font-size: 10px;
  color: white;
  margin-top: 20px;

}

.hidden {
  display: none !important;
}

.content-title {
  font-size: 16px;
  text-align: center;
  border-bottom: 1px solid rgb(59, 95, 232);
  color: rgb(59, 95, 232);
  margin-top: 10px;
}


.SealContainer-content {
  width: 100%;
  height: 60vh;
  overflow: hidden;
  overflow-y: auto;
  background: white;
  display: flex;
  flex-direction: column;
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

.main-section {
  padding-top: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #808080;
  overflow: hidden;
  position: relative
}

.main-section-font {
  background: white;
  margin-left: 88px;
  display: flex;
  flex-wrap: wrap;
}

@media (max-width: 767px) {
  .subcontent {
    width: 95%;
    display: flex;
    flex-direction: column;
    text-align: left;
    margin-bottom: 10px;
    font-family: simsun;
  }

  .left-section {
    position: fixed;
    width: 0px;
    height: 100%;
    background: #F5F5F5;
    border: 1px solid #e8e8e8;
    align-items: center;
    display: none;
    flex-direction: column;
  }

  .main-section {
    padding-top: 20px;
    margin-left: 0px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #808080;
    overflow: hidden
  }

  .main-section-font {
    background: white;
    margin-left: 0px;
    display: flex;
    flex-wrap: wrap;
  }
}


</style>
