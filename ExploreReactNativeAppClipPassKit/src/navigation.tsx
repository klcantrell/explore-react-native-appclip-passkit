import dynamicLinks from '@react-native-firebase/dynamic-links';
import { LinkingOptions } from '@react-navigation/native';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { Linking } from 'react-native';

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

export const enum RootStackRoutes {
  Home = 'Home',
}

export type RootStackParamList = {
  [RootStackRoutes.Home]: undefined;
};

export type RootStackScreenProps<Screen extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, Screen>;

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [
    'https://explorereactnativeappclippasskit.page.link',
    'reactnativeappkitpasskit://',
  ],

  async getInitialURL() {
    const dynamicLink = await dynamicLinks().getInitialLink();
    if (dynamicLink?.url) {
      return dynamicLink.url;
    }
    const url = await Linking.getInitialURL();
    if (url) {
      return url;
    }
    return null;
  },

  subscribe(listener) {
    const onReceiveUrl = ({ url }: { url: string }) => {
      listener(url);
    };
    const unsubscribeFirebase = dynamicLinks().onLink(onReceiveUrl);
    const linkingSubscription = Linking.addEventListener('url', onReceiveUrl);
    const cleanUpSubscriptions = () => {
      linkingSubscription.remove();
      unsubscribeFirebase();
    };
    return cleanUpSubscriptions;
  },

  config: {
    initialRouteName: RootStackRoutes.Home,
    screens: {
      [RootStackRoutes.Home]: '/',
    },
  },
};

export default linking;
