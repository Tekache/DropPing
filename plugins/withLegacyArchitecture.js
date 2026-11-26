const { withGradleProperties } = require('@expo/config-plugins');

module.exports = function withLegacyArchitecture(config) {
  return withGradleProperties(config, (config) => {
    const properties = config.modResults.filter((item) => item.key !== 'newArchEnabled');
    properties.push({ type: 'property', key: 'newArchEnabled', value: 'false' });
    config.modResults = properties;
    return config;
  });
};
