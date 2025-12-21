module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // NativeWind va primero
      "nativewind/babel",
      // Reanimated SIEMPRE va el último
      "react-native-reanimated/plugin",
    ],
  };
};
