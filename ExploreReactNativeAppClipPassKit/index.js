import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { AppRegistry } from 'react-native';

GoogleSignin.configure();

import { name as appName } from './app.json';
import App from './src/App';

AppRegistry.registerComponent(appName, () => App);
