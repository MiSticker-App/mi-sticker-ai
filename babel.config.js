module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // NativeWind siempre va
      "nativewind/babel",
      // Reanimated SIEMPRE el último
      "react-native-reanimated/plugin",
    ],
  };
};