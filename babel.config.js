module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel", // <--- AHORA ESTÁ AQUÍ (En Presets, no Plugins)
    ],
    plugins: [
      "react-native-reanimated/plugin", // Este se queda aquí y siempre el último
    ],
  };
};