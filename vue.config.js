module.exports = {
    publicPath: '/ofd',
    lintOnSave: false,
    configureWebpack: {
        externals: {
            // UMD 模式下不需要排除依赖，打包成完整单文件
        }
    }
}
