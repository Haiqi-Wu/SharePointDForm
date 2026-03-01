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

/**
 * 自定义 webpack 插件：修复 PnP Controls CSS 样式问题
 */
class SpfxPnpCssFixPlugin {
  constructor() {
    this.pluginName = 'SpfxPnpCssFixPlugin';
  }

  apply(compiler) {
    const isPnpControlsCss = (cssPath) => {
      if (typeof cssPath !== 'string') return false;
      const normalized = cssPath.replace(/\\/g, '/').split('?')[0];
      return normalized.includes('/@pnp/spfx-controls-react/');
    };

    const isPreHashedClassName = (className) => {
      return typeof className === 'string' && /_[0-9a-f]{8}$/i.test(className);
    };

    const patchUse = (use) => {
      if (!use || typeof use !== 'object') return;
      const loader = typeof use.loader === 'string' ? use.loader : '';
      if (!loader.includes('sp-css-loader')) return;

      use.options = use.options || {};
      const originalGenerator = use.options.generateCssClassName;

      use.options.generateCssClassName = (existingClassName, cssFilePath, cssContent, production) => {
        if (isPnpControlsCss(cssFilePath) || isPreHashedClassName(existingClassName)) {
          return existingClassName;
        }
        if (typeof originalGenerator === 'function') {
          return originalGenerator(existingClassName, cssFilePath, cssContent, production);
        }
        return existingClassName;
      };
    };

    const visitRule = (rule) => {
      if (!rule || typeof rule !== 'object') return;

      if (Array.isArray(rule.use)) {
        for (const use of rule.use) patchUse(use);
      } else if (rule.use && typeof rule.use === 'object') {
        patchUse(rule.use);
      } else if (rule.loader) {
        patchUse(rule);
      }

      if (Array.isArray(rule.oneOf)) {
        for (const nested of rule.oneOf) visitRule(nested);
      }
      if (Array.isArray(rule.rules)) {
        for (const nested of rule.rules) visitRule(nested);
      }
    };

    // 在 webpack 配置初始化时修改规则
    const patchModuleRules = () => {
      if (compiler.options && compiler.options.module && Array.isArray(compiler.options.module.rules)) {
        for (const rule of compiler.options.module.rules) {
          visitRule(rule);
        }
      }
    };

    // 立即执行补丁
    patchModuleRules();
  }
}

/**
 * Webpack 配置函数
 * heft-webpack5-plugin 会加载此文件
 * 返回的配置会与基础配置合并
 */
module.exports = function(env, argv) {
  return {
    plugins: [
      new SpfxPnpCssFixPlugin()
    ]
  };
};

// 导出插件类
module.exports.SpfxPnpCssFixPlugin = SpfxPnpCssFixPlugin;
