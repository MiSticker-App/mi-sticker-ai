module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      "nativewind/babel",             // <--- ESTE ES EL QUE FALTABA PARA LOS ESTILOS
      "react-native-reanimated/plugin", // <--- Este siempre va el ÚLTIMO
    ],
  };
};