# ofd.js

### 在使用ofd.js前请务必悉知  [《ofd.js免责声明》](https://github.com/DLTech21/ofd.js/blob/master/%E5%85%8D%E8%B4%A3%E5%A3%B0%E6%98%8E.md)

![-](https://img.shields.io/badge/language-js-orange.svg) [![license](https://img.shields.io/badge/license-Apache--2.0-blue)](./LICENSE)

目前方案采用：svg及canvas渲染实现，百分百纯前端渲染

效果： 
![示例](./ofd.jpg)

[体验地址](https://51shouzu.xyz/ofd/)

## Usage with npm

```
npm i ofd.js
```

```
import {parseOfdDocument, renderOfd} from "ofd.js";
```

```
其中ofd传入的file支持本地文件、二进制或者url、screenWidth为屏幕宽度
parseOfdDocument({
        ofd: file,
        success(res) {
          //输出ofd每页的div
          const divs = renderOfd(screenWidth, res);
          //获取签章div的信息, 具体看demo
          for(let ele of document.getElementsByName('seal_img_div')) {
             this.addEventOnSealDiv(ele, JSON.parse(ele.dataset.sesSignature), JSON.parse(ele.dataset.signedInfo));
          }
        },
        fail(error) {
          console.log(error)
        }
      });
```


## 愿景
希望能做到pdf.js的高度

## ofd推荐项目
[OFD Reader & Writer](https://github.com/Trisia/ofdrw)

## 参与贡献
发挥人人为我，我为人人的优良传统，多做pr~~~

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).

### 项目关注度

> 项目获得 Star曲线

[![Stargazers over time](https://starchart.cc/DLTech21/ofd.js.svg)](https://starchart.cc/DLTech21/ofd.js)
