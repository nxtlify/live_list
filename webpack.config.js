const nodeExternals = require('webpack-node-externals');

module.exports = {
  target: 'node',
  externals: [
    nodeExternals({
      whitelist: [
        'fp-ts/lib/Option',
        'fp-ts/lib/Either',
        'fp-ts/lib/TaskEither',
        'jsdom',
      ],
    }),
    'canvas',
  ],
};
