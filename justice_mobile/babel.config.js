module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // 1. Gestion des métadonnées d'importation (nécessaire pour certaines libs web)
      '@babel/plugin-syntax-import-meta',
      'babel-plugin-transform-import-meta',

      // 2. Configuration des alias (permet d'utiliser @/ au lieu de ../../)
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src',
          },
        },
      ],

      // 3. Plugin Reanimated - DOIT TOUJOURS ÊTRE EN DERNIER
      'react-native-reanimated/plugin',
    ],
    overrides: [
      {
        // Correction spécifique pour la transformation import.meta dans les modules Expo
        include: /node_modules\/(expo|@expo)\/.*/,
        plugins: ['babel-plugin-transform-import-meta'],
      },
    ],
  };
};