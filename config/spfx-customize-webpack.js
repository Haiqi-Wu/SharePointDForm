/**
 * SPFx 1.22 Webpack 自定义配置
 * 
 * 解决 @pnp/spfx-controls-react 在 SPFx 1.22 下的样式问题
 * 
 * 问题原因：SPFx 1.22 使用 Heft 构建时，会对 CSS 模块的类名进行二次哈希，
 * 而 PnP Controls 的包已经预哈希了类名，二次哈希导致样式选择器与运行时类名不匹配。
 * 
 * 参考：https://github.com/pnp/sp-dev-fx-controls-react/issues/2082
 */

module.exports = function customize(webpackConfig /*, taskSession, heftConfiguration, webpack */) {
  // Ensure PnP SPFx controls' CSS module classnames are not rehashed by our loader
  // Their package ships pre-hashed classnames; rehashing appends a second suffix which breaks selectors.
  try {
    const isPnpControlsCss = (cssPath) => /node_modules[\\/]+@pnp[\\/]+spfx-controls-react[\\/]/i.test(cssPath);
    
    const visitRules = (rules) => {
      if (!Array.isArray(rules)) return;
      
      for (const rule of rules) {
        if (rule.oneOf) visitRules(rule.oneOf);
        
        const uses = Array.isArray(rule.use) ? rule.use : (rule.loader ? [rule] : []);
        
        for (const use of uses) {
          const loader = use.loader || use;
          if (typeof loader === "string" && loader.includes("sp-css-loader")) {
            use.options = use.options || {};
            const prevGen = use.options.generateCssClassName;
            
            use.options.generateCssClassName = (existingClassName, cssFilePath, cssContent, production) => {
              if (isPnpControlsCss(cssFilePath)) return existingClassName;
              return typeof prevGen === "function"
                ? prevGen(existingClassName, cssFilePath, cssContent, production)
                : existingClassName;
            };
          }
        }
      }
    };
    
    if (webpackConfig.module && Array.isArray(webpackConfig.module.rules)) {
      visitRules(webpackConfig.module.rules);
    }
  } catch (e) {
    console.warn("CSS loader customization failed:", e?.message ?? e);
  }

  return webpackConfig;
};
