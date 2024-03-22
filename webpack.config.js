const webpack = require('webpack');

const environment = process.env.ENVIRONMENT;
const port = process.env.PORT;

let ENVIRONMENT_VARIABLES = {
  'process.env.ENVIRONMENT': JSON.stringify(environment || 'development'),
  'process.env.PORT': JSON.stringify(port || '3042'),
};
console.log('environment:::::', environment);

if (environment === 'test') {
  ENVIRONMENT_VARIABLES = {
    'process.env.ENVIRONMENT': JSON.stringify(environment),
    'process.env.PORT': JSON.stringify(port || '3042'),
  };
} else if (environment === 'production') {
  ENVIRONMENT_VARIABLES = {
    'process.env.ENVIRONMENT': JSON.stringify(environment),
    'process.env.PORT': JSON.stringify(port || '3042'),
  };
} else {
  ENVIRONMENT_VARIABLES = {
    'process.env.ENVIRONMENT': JSON.stringify(environment || 'development'),
    'process.env.PORT': JSON.stringify(port || '3042'),
  };
}

module.exports = {
  entry: './index.js',
  output: {
    path: '/dist', //path.resolve(__dirname, 'dist'),
    filename: 'api.bundle.js',
  },
  target: 'node',
  'mode': environment,
  experiments: {
    topLevelAwait: true
  },
  plugins: [
    new webpack.DefinePlugin(ENVIRONMENT_VARIABLES),
  ],
};