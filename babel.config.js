module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      // SOLO este plugin. Nada de 'worklets'.
      "react-native-reanimated/plugin",
    ],
  };
};