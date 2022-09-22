# ofd.js

### 在使用ofd.js前请务必悉知  [《ofd.js免责声明》](https://github.com/DLTech21/ofd.js/blob/master/%E5%85%8D%E8%B4%A3%E5%A3%B0%E6%98%8E.md)

![-](https://img.shields.io/badge/language-js-orange.svg) [![license](https://img.shields.io/badge/license-Apache--2.0-blue)](./LICENSE)

目前方案采用：svg及canvas渲染实现，百分百纯前端渲染

效果： 
![示例](./ofd.jpg)

小程序OFD验签示例

![示例](./gh_6711026c0ea7_258.jpg)

微信

![示例](./wx.jpg)


```md
npm i ofd.js
```

#### 解析OFD文件
```
parseOfdDocument({
        ofd: ofdFile,
        success() {
            
        },
        fail(error){
            console.log(error)
        }
    })
```

#### 一次性渲染OFD对应文档的所有页，适合页数少
**此方法需要在parseOfdDocument success回调后使用**

| 参数        | 说明                                                           | 是否必填 |
| ----------- | ------------------------------------------------------------ | -------- |
| documentIndex   | ofd文档中document的索引，默认从0开始                              | 是       |
| width   | 预期渲染的宽度，像素值 ，如800                             | 否       |

```
renderOfd(documentIndex, width).then(divs=>{
    // do something
})
```

#### 渲染OFD对应文档的对应页
**此方法需要在parseOfdDocument success回调后使用**

| 参数        | 说明                                                           | 是否必填 |
| ----------- | ------------------------------------------------------------ | -------- |
| documentIndex   | ofd文档中document的索引，默认从0开始                              | 是       |
| pageIndex   | ofd文档中页码，默认从0开始                              | 是       |
| width   | 预期渲染的宽度，像素值 ，如800                             | 否       |

```
renderOfdByIndex(documentIndex, pageIndex, width).then(div => {
    // do something
}})
```

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
