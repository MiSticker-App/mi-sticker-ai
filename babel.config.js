module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // ELIMINA 'expo-router/babel' de aquí.
      // Solo deja reanimated si lo estás usando
      'react-native-reanimated/plugin',
    ],
  };
};