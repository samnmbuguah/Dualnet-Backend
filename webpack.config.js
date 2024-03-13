import path from 'path';
import webpack from 'webpack';



const environment = 'production';//process.env.ENVIRONMENT;

console.log('environment:::::', environment);

let ENVIRONMENT_VARIABLES = {
  'process.env.ENVIRONMENT': JSON.stringify('development'),
  'process.env.PORT': JSON.stringify('3000'),
  // 'process.env.MONGO_CONNECTION_STRING': JSON.stringify('mongodb://mongo-db:27017')
};

if (environment === 'test') {
  ENVIRONMENT_VARIABLES = {
    'process.env.ENVIRONMENT': JSON.stringify('test'),
    'process.env.PORT': JSON.stringify('3000'),
    // 'process.env.MONGO_CONNECTION_STRING': JSON.stringify('mongodb://mongo-db:27017')
  };
} else if (environment === 'production') {
  ENVIRONMENT_VARIABLES = {
    'process.env.ENVIRONMENT': JSON.stringify('production'),
    'process.env.PORT': JSON.stringify('3000'),
    // 'process.env.MONGO_CONNECTION_STRING': JSON.stringify('mongodb+srv://Tester123:51FWAl9CFZuJe9xF@todo-cluster.dc3nz.mongodb.net/todos?retryWrites=true&w=majority')
  };
}

export default {
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