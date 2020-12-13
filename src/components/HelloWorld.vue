<template>
  <el-container style="width:100vw; height: 100vh;">
    <el-header style="background:#F5F5F5;display: flex; height: 40px; border: 1px solid #e8e8e8; align-items: center;">
      <div class="upload-icon" @click="uploadFile">
        <div class="upload-icon">打开OFD</div>
        <font-awesome-icon icon="cloud-upload-alt"/>
        <input type="file" ref="file" class="hidden" accept=".ofd"
               @change="fileChanged">
      </div>

      <div class="upload-icon" @click="uploadPdfFile">
        <div class="upload-icon">PDF2OFD</div>
        <font-awesome-icon icon="cloud-upload-alt"/>
        <input type="file" ref="pdfFile" class="hidden" accept=".pdf"
               @change="pdfFileChanged">
      </div>
      <div class="upload-icon" @click="getSealPosition" v-if="dragseal">
        <div class="upload-icon">获取签章坐标</div>
      </div>
      <div class="upload-icon" @click="print">
        <font-awesome-icon icon="print"/>
        <div class="upload-icon">打印</div>
      </div>
      <div class="upload-icon" @click="printSecret">
        <font-awesome-icon icon="print"/>
        <div class="upload-icon">脱密打印</div>
      </div>
      <div style="display: flex;align-items: center" v-if="ofdObj">
        <div class="upload-icon" style="margin-left: 10px" @click="downPdf" v-if="ofdBase64">
          下载PDF
          <font-awesome-icon icon="download"/>
        </div>

        <div class="scale-icon" style="margin-left: 10px" @click="plus">
          <font-awesome-icon icon="search-plus"/>
        </div>

        <div class="scale-icon" @click="minus">
          <font-awesome-icon icon="search-minus" />
        </div>
        <div class="scale-icon">
          <font-awesome-icon icon="step-backward" @click="firstPage"/>
        </div>

        <div class="scale-icon" style="font-size: 18px" @click="prePage">
          <font-awesome-icon icon="caret-left"/>
        </div>

        <div class="scale-icon">
          {{pageIndex}}/{{pageCount}}
        </div>

        <div class="scale-icon" style="font-size: 18px" @click="nextPage">
          <font-awesome-icon icon="caret-right"/>
        </div>

        <div class="scale-icon" @click="lastPage">
          <font-awesome-icon icon="step-forward"/>
        </div>
      </div>
    </el-header>
    <el-main style="height: auto;background: #808080;;padding: 0" v-loading="loading"  id="main">
      <div id="leftMenu"
          class="left-section">

        <div class="text-icon" @click="zoomSeal()">
          <p>拖拽签章</p>
        </div>

        <div class="text-icon" @click="demo(1)">
          <p>电子发票</p>
        </div>

        <div class="text-icon" @click="demo(2)">
          <p>电子公文</p>
        </div>

        <div class="text-icon" @click="demo(3)">
          <p>骑缝章</p>
        </div>

        <div class="text-icon" @click="demo(4)">
          <p>多页文档</p>
        </div>
      </div>
      <div class="main-section"
          id="content" ref="contentDiv" @mousewheel="scrool">
      </div>
    </el-main>
    <div class="SealContainer" id="sealInfoDiv" hidden="hidden" ref="sealInfoDiv">
      <div class="SealContainer mask" @click="closeSealInfoDialog"></div>
      <div class="SealContainer-layout">
        <div class="SealContainer-content">
          <p class="content-title">签章信息</p>
          <div class="subcontent">
            <span class="title">签章人</span>
            <span class="value" id="spSigner">[无效的签章结构]</span>
          </div>
          <div class="subcontent">
            <span class="title">签章提供者</span>
            <span class="value" id="spProvider">[无效的签章结构]</span>
          </div>
          <div class="subcontent">
            <span class="title">原文摘要值</span>
            <span class="value" id="spHashedValue" @click="showMore('原文摘要值', 'spHashedValue')"
                  style="cursor: pointer">[无效的签章结构]</span>
          </div>
          <div class="subcontent">
            <span class="title">签名值</span>
            <span class="value" id="spSignedValue" @click="showMore('签名值', 'spSignedValue')"
                  style="cursor: pointer">[无效的签章结构]</span>
          </div>
          <div class="subcontent">
            <span class="title">签名算法</span>
            <span class="value" id="spSignMethod">[无效的签章结构]</span>
          </div>
          <div class="subcontent">
            <span class="title">版本号</span>
            <span class="value" id="spVersion">[无效的签章结构]</span>
          </div>
          <div class="subcontent">
            <span class="title">验签结果</span>
            <span class="value" id="VerifyRet">[无效的签章结构]</span>
          </div>

          <p class="content-title">印章信息</p>
          <div class="subcontent">
            <span class="title">印章标识</span>
            <span class="value" id="spSealID">[无效的签章结构]</span>
          </div>
          <div class="subcontent">
            <span class="title">印章名称</span>
            <span class="value" id="spSealName">[无效的签章结构]</span>
          </div>
          <div class="subcontent">
            <span class="title">印章类型</span>
            <span class="value" id="spSealType">[无效的签章结构]</span>
          </div>
          <div class="subcontent">
            <span class="title">有效时间</span>
            <span class="value" id="spSealAuthTime">[无效的签章结构]</span>
          </div>
          <div class="subcontent">
            <span class="title">制章日期</span>
            <span class="value" id="spSealMakeTime">[无效的签章结构]</span>
          </div>
          <div class="subcontent">
            <span class="title">印章版本</span>
            <span class="value" id="spSealVersion">[无效的签章结构]</span>
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
  </el-container>
</template>

<script>

import {parseOfdDocument, renderOfd, renderOfdByScale, digestCheck, getPageScale, setPageScale} from "@/utils/ofd/ofd";
import * as JSZipUtils from "jszip-utils";

export default {
  name: 'HelloWorld',
  data() {
    return {
      dragseal:false,//是否显示公章图片位置
      docleft:0,//公章距离左侧文档边缘的距离
      leftMenu_width:0,//左侧菜单宽度
      pdfFile: null,
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
    }
  },

  created() {
    this.pdfFile = null;
    this.file = null;
  },

  mounted() {
    this.leftMenu_width=document.getElementById('leftMenu').getBoundingClientRect().width;
    this.screenWidth = document.body.clientWidth - this.leftMenu_width;
    let that = this;
    this.$refs.contentDiv.addEventListener('scroll', this.scrool);
    window.onresize = () => {
      return (() => {
        /* that.screenWidth = (document.body.clientWidth - 88);
       const divs = renderOfd(that.screenWidth, that.ofdObj);
       that.displayOfdDiv(divs);*/

        let content = document.getElementById("content");
        let nowleft=content.childNodes[0].offsetLeft;
        let seal = document.getElementById("seal");
        seal.style.left=(that.docleft+nowleft+this.leftMenu_width)+"px";
      })()
    }

  },

  methods: {
    print() {
      let dom = this.$refs["contentDiv"];
      let childs = dom.children;
      this.loading = true;
      this.progressVisible=true;
      let list=[];
      let i=0;
      for (let ele of childs) {
        list.push(ele.cloneNode(true));
        this.percentage=i/childs.length;
      }
      if(list.length>0){
        var mywindow = window.open("打印窗口", "_blank");
        //给新打开的标签页添加画布内容（这里指的是id=div2img元素的内容）
        var documentBody = mywindow.document.body;
        console.log(list.length)
        for (let canvas of list) {
          documentBody.appendChild(canvas);
        }
        this.progressVisible=false;
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
      let sealdivs=document.getElementsByTagName('img')
      //公章图片
      for (let ele of sealdivs) {
        ele.style.filter="grayscale(100%)";
      }
      this.print();
      for (let ele of sealdivs) {
        ele.style.filter="";
      }
    },
    createSealImg(){//创建公章
      let contentDiv = document.getElementById('content');
      var imgdiv=document.createElement("div");
      imgdiv.setAttribute("class","seal");
      imgdiv.setAttribute("id","seal");
      imgdiv.setAttribute("style","display:none;top:0px;position: absolute;z-index: 999999;")
      contentDiv.appendChild(imgdiv);
      imgdiv.innerHTML="<img src='./seal.png' id='sealimage' style='opacity:0.9;' height='210px' width='210px'>";
    },
    zoomSeal(){//签章
      this.dragseal=true;//显示获取签章位置的按钮
      var that=this;
      let seal = document.getElementById("seal");
      let content = document.getElementById("content");
      let sealimage = document.getElementById("sealimage");
      let main = document.getElementById("main");
      seal.style.display="block";

      document.onmousemove=function (e) {
        seal.style.top=main.scrollTop+e.clientY-content.offsetTop-(sealimage.width/2)+"px";
        seal.style.left=main.scrollLeft-that.leftMenu_width+e.clientX-(sealimage.height/2)+"px";
      }
      seal.onmousedown=function () {
        document.onmousemove=function (e) {
          seal.style.top= main.scrollTop+e.clientY-content.offsetTop-(sealimage.width/2)+"px";
          seal.style.left=main.scrollLeft-that.leftMenu_width+e.clientX-(sealimage.height/2)+"px";
        }
        document.onmouseup=function () {
          //计算距离文档左边缘距离
          that.docleft=parseFloat(seal.style.left)-that.leftMenu_width-content.childNodes[0].offsetLeft;
          document.onmousemove=null;
          document.onmouseup=null;
        }
      }
    },
    getSealPosition(){//获得公章位置信息
      let seal = document.getElementById("seal");//公章容器
      let content = document.getElementById("content");//主容器
      let sealimage = document.getElementById("sealimage");//公章图片
      let sealLeft=parseFloat(seal.style.left);
      let sealTop=parseFloat(seal.style.top);
      let x=(sealLeft-content.childNodes[0].offsetLeft)/this.scale;//公章左侧开始坐标
      let pageHeight=parseFloat(content.childNodes[0].style.height);
      let page=Math.ceil(sealTop/pageHeight);//获得当前页
      let y=(sealTop%pageHeight- page * 20)/this.scale;//获取距离当前页顶部距离
      let position={
        x:x,//左边缘位置 毫米
        y:y,//上边缘位置 毫米
        page:page,//页
        width:sealimage.width/this.scale,//公章图片宽度 毫米
        height:sealimage.height/this.scale//公章图片高度 毫米
      }
      alert(JSON.stringify(position));
    },
    scrool() {
      let scrolled = this.$refs.contentDiv.firstElementChild?.getBoundingClientRect()?.top - 60;
      let top = 0
      let index = 0;
      for (let i=0;i<this.$refs.contentDiv.childElementCount; i ++) {
        top += (Math.abs(this.$refs.contentDiv.children.item(i)?.style.height.replace('px','')) + Math.abs(this.$refs.contentDiv.children.item(i)?.style.marginBottom.replace('px','')));
        if (Math.abs(scrolled) < top) {
          index = i;
          break;
        }
      }
      this.pageIndex = index+1;
    },

    closeSealInfoDialog() {
      this.$refs.sealInfoDiv.setAttribute('style', 'display: none');
      document.getElementById('spSigner').innerText = "[无效的签章结构]";
      document.getElementById('spProvider').innerText = "[无效的签章结构]";
      document.getElementById('spHashedValue').innerText = "[无效的签章结构]";
      document.getElementById('spSignedValue').innerText = "[无效的签章结构]";
      document.getElementById('spSignMethod').innerText = "[无效的签章结构]";
      document.getElementById('spSealID').innerText = "[无效的签章结构]";
      document.getElementById('spSealName').innerText = "[无效的签章结构]";
      document.getElementById('spSealType').innerText = "[无效的签章结构]";
      document.getElementById('spSealAuthTime').innerText = "[无效的签章结构]";
      document.getElementById('spSealMakeTime').innerText = "[无效的签章结构]";
      document.getElementById('spSealVersion').innerText = "[无效的签章结构]";
      document.getElementById('spVersion').innerText = "[无效的签章结构]";
      document.getElementById('VerifyRet').innerText = "[无效的签章结构]";
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
        var blob = new Blob( [view], null);
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
              message: `action: ${ action }`
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
        var blob = new Blob( [view], { type: "application/pdf" });
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
              message: `action: ${ action }`
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
      let ele = contentDiv.children.item(this.pageIndex-2);
      ele?.scrollIntoView(true);
      ele?this.pageIndex=this.pageIndex-1:'';
    },

    firstPage() {
      let contentDiv = document.getElementById('content');
      let ele = contentDiv.firstElementChild;
      ele?.scrollIntoView(true);
      ele?this.pageIndex=1:'';
    },

    nextPage() {
      let contentDiv = document.getElementById('content');
      let ele = contentDiv.children.item(this.pageIndex);
      ele?.scrollIntoView(true);
      ele?++this.pageIndex:'';
    },

    lastPage() {
      let contentDiv = document.getElementById('content');
      let ele = contentDiv.lastElementChild;
      ele?.scrollIntoView(true);
      ele?this.pageIndex=contentDiv.childElementCount:'';
    },

    demo(value) {
      let ofdFile = null;
      switch (value) {
        case 1:
          ofdFile = '999.ofd';
          break;
        case 2:
          ofdFile = 'n.ofd';
          break;
        case 3:
          ofdFile = 'h.ofd';
          break;
        case 4:
          ofdFile = '2.ofd';
          break;
      }
      let that = this;
      JSZipUtils.getBinaryContent(ofdFile, function (err, data) {
        if (err) {
          console.log(err)
        } else {
          let base64String = btoa(String.fromCharCode.apply(null, new Uint8Array(data)));
          that.ofdBase64 = base64String;
        }
      });
      this.getOfdDocumentObj(ofdFile, this.screenWidth);

    },

    uploadFile() {
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
              message: `action: ${ action }`
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
              message: `action: ${ action }`
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
              message: `action: ${ action }`
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
              message: `action: ${ action }`
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


    getOfdDocumentObj(file, screenWidth) {
      let that = this;
      let t = new Date().getTime();
      this.loading = true;
      parseOfdDocument({
        ofd: file,
        success(res) {
          console.log(res)
          let t1 = new Date().getTime();
          console.log('解析ofd',t1 - t);
          that.ofdObj = res[0];
          that.pageCount = res[0].pages.length;
          const divs = renderOfd(screenWidth, res[0]);
          let t2 = new Date().getTime();
          console.log('xml转svg', t2 - t1)
          that.displayOfdDiv(divs);
          //创建拖拽签章容器
          that.createSealImg();
          let t3 = new Date().getTime();
          console.log('svg渲染到页面', t3 - t2);
          that.loading = false;
        },
        fail(error) {
          that.loading = false;
          that.$alert('OFD打开失败', error, {
            confirmButtonText: '确定',
            callback: action => {
              this.$message({
                type: 'info',
                message: `action: ${ action }`
              });
            }
          });
        }
      });
    },

    displayOfdDiv(divs) {
      this.scale = getPageScale();
      let contentDiv = document.getElementById('content');
      contentDiv.innerHTML = '';
      for (const div of divs) {
        contentDiv.appendChild(div)
      }
      for(let ele of document.getElementsByName('seal_img_div')) {
        this.addEventOnSealDiv(ele, JSON.parse(ele.dataset.sesSignature), JSON.parse(ele.dataset.signedInfo));
      }
    },

    addEventOnSealDiv(div, SES_Signature, signedInfo) {
      try {
        global.HashRet=null;
        global.VerifyRet=signedInfo.VerifyRet;
        div.addEventListener("click",function(){
          document.getElementById('sealInfoDiv').hidden = false;
          document.getElementById('sealInfoDiv').setAttribute('style', 'display:flex;align-items: center;justify-content: center;');
          if(SES_Signature.realVersion<4){
            document.getElementById('spSigner').innerText = SES_Signature.toSign.cert['commonName'];
            document.getElementById('spProvider').innerText = signedInfo.Provider['@_ProviderName'];
            document.getElementById('spHashedValue').innerText = SES_Signature.toSign.dataHash.replace(/\n/g,'');
            document.getElementById('spSignedValue').innerText = SES_Signature.signature.replace(/\n/g,'');
            document.getElementById('spSignMethod').innerText = SES_Signature.toSign.signatureAlgorithm.replace(/\n/g,'');
            document.getElementById('spSealID').innerText = SES_Signature.toSign.eseal.esealInfo.esID;
            document.getElementById('spSealName').innerText = SES_Signature.toSign.eseal.esealInfo.property.name;
            document.getElementById('spSealType').innerText = SES_Signature.toSign.eseal.esealInfo.property.type;
            document.getElementById('spSealAuthTime').innerText = "从 "+SES_Signature.toSign.eseal.esealInfo.property.validStart+" 到 "+SES_Signature.toSign.eseal.esealInfo.property.validEnd;
            document.getElementById('spSealMakeTime').innerText = SES_Signature.toSign.eseal.esealInfo.property.createDate;
            document.getElementById('spSealVersion').innerText = SES_Signature.toSign.eseal.esealInfo.header.version;
          }else{
            document.getElementById('spSigner').innerText = SES_Signature.cert['commonName'];
            document.getElementById('spProvider').innerText = signedInfo.Provider['@_ProviderName'];
            document.getElementById('spHashedValue').innerText = SES_Signature.toSign.dataHash.replace(/\n/g,'');
            document.getElementById('spSignedValue').innerText = SES_Signature.signature.replace(/\n/g,'');
            document.getElementById('spSignMethod').innerText = SES_Signature.signatureAlgID.replace(/\n/g,'');
            document.getElementById('spSealID').innerText = SES_Signature.toSign.eseal.esealInfo.esID;
            document.getElementById('spSealName').innerText = SES_Signature.toSign.eseal.esealInfo.property.name;
            document.getElementById('spSealType').innerText = SES_Signature.toSign.eseal.esealInfo.property.type;
            document.getElementById('spSealAuthTime').innerText = "从 "+SES_Signature.toSign.eseal.esealInfo.property.validStart+" 到 "+SES_Signature.toSign.eseal.esealInfo.property.validEnd;
            document.getElementById('spSealMakeTime').innerText = SES_Signature.toSign.eseal.esealInfo.property.createDate;
            document.getElementById('spSealVersion').innerText = SES_Signature.toSign.eseal.esealInfo.header.version;
          }
          document.getElementById('spVersion').innerText = SES_Signature.toSign.version;
          document.getElementById('VerifyRet').innerText = "文件摘要值后台验证中，请稍等... "+(global.VerifyRet?"签名值验证成功":"签名值验证失败");
          if(global.HashRet==null||global.HashRet==undefined||Object.keys(global.HashRet).length <= 0){
            setTimeout(function(){
              const signRetStr = global.VerifyRet?"签名值验证成功":"签名值验证失败";
              global.HashRet = digestCheck(global.toBeChecked.get(signedInfo.signatureID));
              const hashRetStr = global.HashRet?"文件摘要值验证成功":"文件摘要值验证失败";
              document.getElementById('VerifyRet').innerText = hashRetStr+" "+signRetStr;
            },1000);
          }
        });
      } catch (e) {
        console.log(e);
      }
      if (!global.VerifyRet) {
        div.setAttribute('class', 'gray');
      }
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

.SealContainer {
  z-index: 99999;
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

.left-section {
  position: fixed;
  width: 88px;
  height: 100%;
  background:#F5F5F5;
  border: 1px solid #e8e8e8;
  align-items: center;
  display: flex;
  flex-direction: column
}

.main-section {
  padding-top: 20px;
  margin-left:88px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #808080;
  overflow: hidden;
  position: relative
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

  .left-section {
    position: fixed;
    width: 0px;
    height: 100%;
    background:#F5F5F5;
    border: 1px solid #e8e8e8;
    align-items: center;
    display: none;
    flex-direction: column;
  }

  .main-section {
    padding-top: 20px;
    margin-left:0px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #808080;
    overflow: hidden
  }
}
</style>
