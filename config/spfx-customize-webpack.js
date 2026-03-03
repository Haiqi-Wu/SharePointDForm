/**
 * SPFx 1.22 + @pnp/spfx-controls-react CSS compatibility patch
 *
 * Fixes double-hashing of pre-hashed PnP control CSS module class names.
 */
module.exports = function customizeWebpackConfiguration(generatedConfiguration) {
  const isPnpControlsCss = (cssPath) => {
    if (typeof cssPath !== 'string') return false;
    const normalized = cssPath.replace(/\\/g, '/').split('?')[0];
    return normalized.includes('/@pnp/spfx-controls-react/');
  };

  const isPreHashedClassName = (className) => {
    return typeof className === 'string' && /_[0-9a-f]{8}$/i.test(className);
  };

  const isSpCssLoader = (loader) => {
    return typeof loader === 'string' && loader.includes('sp-css-loader');
  };

  const patchLoaderUse = (useEntry) => {
    if (!useEntry) return useEntry;

    if (typeof useEntry === 'string') {
      if (!isSpCssLoader(useEntry)) return useEntry;
      return patchLoaderUse({
        loader: useEntry,
        options: {},
      });
    }

    if (typeof useEntry !== 'object') return useEntry;

    const loader = typeof useEntry.loader === 'string' ? useEntry.loader : '';
    if (!isSpCssLoader(loader)) return useEntry;

    useEntry.options = useEntry.options || {};
    if (useEntry.options.__spfxPnpCssFixApplied) return useEntry;

    const originalGenerator = useEntry.options.generateCssClassName;

    useEntry.options.generateCssClassName = (existingClassName, cssFilePath, cssContent, production) => {
      if (isPnpControlsCss(cssFilePath) || isPreHashedClassName(existingClassName)) {
        return existingClassName;
      }

      if (typeof originalGenerator === 'function') {
        return originalGenerator(existingClassName, cssFilePath, cssContent, production);
      }

      return existingClassName;
    };

    useEntry.options.__spfxPnpCssFixApplied = true;
    return useEntry;
  };

  const visitRule = (rule) => {
    if (!rule || typeof rule !== 'object') return;

    if (Array.isArray(rule.use)) {
      for (let i = 0; i < rule.use.length; i += 1) {
        rule.use[i] = patchLoaderUse(rule.use[i]);
      }
    } else if (typeof rule.use === 'string') {
      rule.use = patchLoaderUse(rule.use);
    } else if (rule.use && typeof rule.use === 'object') {
      rule.use = patchLoaderUse(rule.use);
    } else if (rule.loader) {
      patchLoaderUse(rule);
    }

    if (Array.isArray(rule.oneOf)) {
      for (const nested of rule.oneOf) visitRule(nested);
    }

    if (Array.isArray(rule.rules)) {
      for (const nested of rule.rules) visitRule(nested);
    }
  };

  const patchConfiguration = (configuration) => {
    if (!configuration?.module?.rules || !Array.isArray(configuration.module.rules)) return;
    for (const rule of configuration.module.rules) {
      visitRule(rule);
    }
  };

  if (Array.isArray(generatedConfiguration)) {
    for (const configuration of generatedConfiguration) {
      patchConfiguration(configuration);
    }
    return;
  }

  patchConfiguration(generatedConfiguration);
};
