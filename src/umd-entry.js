import {
  parseOfdDocument,
  renderOfd,
  renderOfdByScale,
  setPageScale,
  getPageScale
} from "./utils/ofd/ofd";

/**
 * OFD.js UMD 入口
 * 提供简单的 API 用于在任意网页中预览 OFD 文件
 *
 * 用法：
 *   // 通过 CDN 引入后，全局变量为 OFD
 *   OFD.preview('https://example.com/file.ofd', document.getElementById('ofd-container'));
 *
 *   // 或使用选择器字符串
 *   OFD.preview('https://example.com/file.ofd', '#ofd-container');
 */
 /**
   * 预览 OFD 文件并渲染到指定 DOM 节点
   * @param {string|File|ArrayBuffer} source - OFD 文件 URL、File 对象或 ArrayBuffer
   * @param {HTMLElement|string} container - 渲染目标 DOM 节点或 CSS 选择器字符串
   * @param {Object} options - 配置项
   * @param {number} [options.width] - 容器宽度，默认使用容器实际宽度
   * @param {Function} [options.onSuccess] - 解析成功回调，参数：(ofdData, divArray)
   * @param {Function} [options.onFail] - 解析失败回调，参数：(error)
   */
 const preview=(source, container, options = {}) => {
    const { width, onSuccess, onFail } = options;

    let targetContainer;
    if (typeof container === "string") {
      targetContainer = document.querySelector(container);
    } else if (container instanceof HTMLElement) {
      targetContainer = container;
    }

    if (!targetContainer) {
      console.error("OFD Preview: 目标容器未找到，请检查传入的容器参数");
      return;
    }

    const screenWidth =
      width || targetContainer.clientWidth || document.body.clientWidth;

    parseOfdDocument({
      ofd: source,
      success(ofdArray) {
        const ofd = ofdArray[0];
        const divs = renderOfd(screenWidth, ofd);

        targetContainer.innerHTML = "";
        for (const div of divs) {
          targetContainer.appendChild(div);
        }

        if (onSuccess) {
          onSuccess(ofd, divs);
        }
      },
      fail(err) {
        console.error("OFD Preview 加载失败:", err);
        if (onFail) {
          onFail(err);
        }
      },
    });
  }
  /**
   * 设置页面缩放比例
   * @param {number} scale - 缩放比例
   */
 const setScale=(scale)=> {
    setPageScale(scale);
  }

  /**
   * 获取当前页面缩放比例
   * @returns {number} 当前缩放比例
   */
 const getScale=() =>{
    return getPageScale();
  }
const OFD = {
 
preview,
setScale,
getScale,
  // 暴露底层 API，便于高级用户自定义渲染逻辑
  parseOfdDocument,
  renderOfd,
  renderOfdByScale,
  setPageScale,
  getPageScale,
};

export default OFD;
export {
  preview,
setScale,
getScale,
  parseOfdDocument,
  renderOfd,
  renderOfdByScale,
  setPageScale,
  getPageScale,
};
