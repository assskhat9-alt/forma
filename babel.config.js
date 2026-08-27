module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // react-native-reanimated плагині babel-preset-expo ішінде келеді (SDK 54+),
    // бөлек қосудың қажеті жоқ.
  };
};
