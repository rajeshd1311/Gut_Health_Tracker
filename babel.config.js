module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          // react-native-reanimated/plugin (v4) requires react-native-worklets
          // which is not installed, and reanimated APIs are not used in this
          // project, so disable the plugin to allow compilation.
          reanimated: false,
        },
      ],
    ],
  };
};
