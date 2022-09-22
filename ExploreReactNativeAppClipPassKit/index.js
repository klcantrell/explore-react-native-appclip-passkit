import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { AppRegistry } from 'react-native';

GoogleSignin.configure();
cache.init();

import { name as appName } from './app.json';
import App from './src/App';
import cache from './src/cache';

AppRegistry.registerComponent(appName, () => App);
