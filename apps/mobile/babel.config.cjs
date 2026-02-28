module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
    ],
    plugins: [
      // Reanimated v4: worklets plugin replaces react-native-reanimated/plugin
      "react-native-worklets/plugin",
    ],
  };
};
