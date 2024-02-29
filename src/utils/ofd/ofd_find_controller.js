/*
 * odf查找
 */

/**
 * 查找ofd文档
 * @param ofdObj ofd文档对象
 * @param keyword 关键字
 */
export const searchKeywordFunc = (ofdObj, keyword) => {
	let pages = ofdObj.pages
	// 搜索到的文本列表，将page和对象加入
	let searchTextList = []
	pages.forEach((page, index) => {
		// 对page循环
		for (const pageKey in page) {
			// 每个页面的page对象
			let pageObj = page[pageKey]
			let textObjectList = pageObj.json["ofd:Content"]["ofd:Layer"]["ofd:TextObject"]
			// 文本列表
			if ( textObjectList && textObjectList.length ) {
				textObjectList.forEach(textObject => {
					if ( textObject && textObject["ofd:TextCode"]) {
						let originText = textObject["ofd:TextCode"]["#text"]
						if ( originText.indexOf(keyword) >= 0 ) {
							// 查找到的对象
							searchTextList.push({
								pageIndex: index,
								page: pageObj,
								searchTextObject: textObject
							})
						}
					}
				})
			}
		}
	})
	return searchTextList
}

/**
 * 高亮内容重新渲染
 */
export const hightLightSearchText = () => {

}
