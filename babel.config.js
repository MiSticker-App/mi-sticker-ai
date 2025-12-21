module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // NativeWind para los estilos
      "nativewind/babel",
      // Reanimated siempre debe ir el último
      "react-native-reanimated/plugin",
    ],
  };
};
