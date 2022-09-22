import {
  appleAuth,
  AppleButton,
  AppleRequestResponse,
} from '@invertase/react-native-apple-authentication';
import {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes as GoogleSigninStatusCodes,
  User as GoogleUser,
} from '@react-native-google-signin/google-signin';
import React, { useEffect, useState, type PropsWithChildren } from 'react';
import {
  Button,
  Image,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';

import AddPassButton from './AddPassButton';
import cache, { AppleUser } from './cache';
import { RootStackRoutes, type RootStackScreenProps } from './navigation';
import WalletManager, { isWalletManagerError } from './WalletManager';

const APPLE_PASS_IDENTIFIER = 'pass.com.kalalau.free-thing';
const APPLE_PASS_SERIAL_NUMBER = 'analternateserialnumber'; // alt. bgsksfuioa

const HomeScreen = (props: RootStackScreenProps<RootStackRoutes.Home>) => {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    flexGrow: 1,
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <View
        style={{
          flexGrow: 1,
          paddingTop: 30,
          paddingHorizontal: 30,
          backgroundColor: isDarkMode ? Colors.black : Colors.white,
        }}>
        <HomeScreenContent title="Home Screen">
          Edit <Text style={styles.highlight}>App.tsx</Text> to change this
          screen and then come back to see your edits.
        </HomeScreenContent>
      </View>
    </SafeAreaView>
  );
};

export default HomeScreen;

const HomeScreenContent: React.FC<
  PropsWithChildren<{
    title: string;
  }>
> = ({ children, title }) => {
  const isDarkMode = useColorScheme() === 'dark';
  const [hasApplePass, setHasApplePass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleSigninInProgress, setGoogleSigninInProgress] = useState(false);
  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(null);
  const [appleSigninInProgress, setAppleSigninInProgress] = useState(false);
  const [appleUser, setAppleUser] = useState<AppleUser | null>(null);

  useEffect(() => {
    if (Platform.OS === 'ios') {
      WalletManager.hasPass(
        APPLE_PASS_IDENTIFIER,
        APPLE_PASS_SERIAL_NUMBER,
      ).then((result) => {
        setHasApplePass(result);
      });
    } else if (Platform.OS === 'android') {
      WalletManager.isGoogleWalletApiAvailable().then((result) => {
        if (result) {
          console.log('Google Wallet APIs are available!');
        } else {
          console.log('Google Wallet APIs are not available...');
        }
      });
    }
  }, []);

  useEffect(() => {
    async function checkGoogleSignin() {
      console.log('GoogleSignin.isSignedIn()', await GoogleSignin.isSignedIn());
    }

    checkGoogleSignin();
  }, []);

  if (error) {
    return (
      <View>
        <Text style={styles.sectionTitle}>{error}</Text>
      </View>
    );
  }

  return (
    <View>
      <View style={{ borderBottomWidth: 1, paddingBottom: 16 }}>
        <Text
          style={[
            styles.sectionTitle,
            {
              color: isDarkMode ? Colors.white : Colors.black,
            },
          ]}>
          {title}
        </Text>
        <Text
          style={[
            styles.sectionDescription,
            {
              color: isDarkMode ? Colors.light : Colors.dark,
            },
          ]}>
          {children}
        </Text>
      </View>
      <Text style={{ marginVertical: 16 }}>Wallet passes</Text>
      {hasApplePass ? (
        <>
          <Text>
            {`You already have a pass: \n\n\tpassIdentifier: ${APPLE_PASS_IDENTIFIER} \n\tserialNumber: ${APPLE_PASS_SERIAL_NUMBER}`}
          </Text>
          <View style={{ height: 30 }} />
          <Button
            title="Open it"
            onPress={() => {
              WalletManager.openPass(
                APPLE_PASS_IDENTIFIER,
                APPLE_PASS_SERIAL_NUMBER,
              );
            }}
          />
        </>
      ) : (
        <AddPassButton
          style={{ alignSelf: 'center' }}
          onPress={async () => {
            try {
              await WalletManager.downloadWalletPassFromUrl(
                `http://localhost:3000/${
                  Platform.OS === 'ios' ? 'applepass' : 'androidpassjwt'
                }`,
              );
              setHasApplePass(
                await WalletManager.hasPass(
                  APPLE_PASS_IDENTIFIER,
                  APPLE_PASS_SERIAL_NUMBER,
                ),
              );
            } catch (error) {
              const defaultErrorMessage =
                'Something went haywire. Please try again later.';
              if (isWalletManagerError(error)) {
                let message =
                  'Something went really wrong downloading the pass. Please check your internet connection and try again';
                switch (error.code) {
                  case 'invalidUrl':
                    message = 'The wallet pass download URL is incorrect';
                    break;
                  case 'failedToFetchPass':
                    message =
                      'Could not fetch your pass. Please check your internet connection and try again.';
                    break;
                  default:
                    message = defaultErrorMessage;
                    break;
                }
                setError(message);
              } else {
                setError(defaultErrorMessage);
              }
            }
          }}
        />
      )}
      <View style={{ borderTopWidth: 1, marginTop: 16 }}>
        <Text style={{ marginVertical: 16 }}>Single sign on</Text>
        <View style={{ alignItems: 'center' }}>
          <GoogleSigninButton
            style={{
              width: 192,
              height: 48,
            }}
            size={GoogleSigninButton.Size.Wide}
            color={GoogleSigninButton.Color.Dark}
            onPress={async () => {
              setGoogleSigninInProgress(true);
              const googleUser = await signInWithGoogle();
              setGoogleUser(googleUser);
            }}
            disabled={googleSigninInProgress}
          />
          <View style={{ height: 12 }} />
          {Platform.OS === 'ios' ? (
            <AppleButton
              style={{ width: 192, height: 44 }}
              cornerRadius={5}
              buttonStyle={
                appleSigninInProgress
                  ? AppleButton.Style.WHITE
                  : AppleButton.Style.BLACK
              }
              buttonType={AppleButton.Type.SIGN_IN}
              onPress={
                appleSigninInProgress
                  ? () => {}
                  : async () => {
                      setAppleSigninInProgress(true);
                      const appleAuthResponse = await signInWithApple();
                      if (appleAuthResponse !== null) {
                        const appleUserResponse = {
                          userId: appleAuthResponse.user,
                          firstName:
                            appleAuthResponse.fullName?.givenName ?? '',
                          lastName:
                            appleAuthResponse.fullName?.familyName ?? '',
                        };
                        const cachedAppleUser = cache.getAppleUserById(
                          appleAuthResponse.user,
                        );
                        if (cachedAppleUser !== null) {
                          const updatedUser = {
                            ...cachedAppleUser,
                            firstName:
                              appleUserResponse.firstName !== ''
                                ? appleUserResponse.firstName
                                : cachedAppleUser.firstName,
                            lastName:
                              appleUserResponse.lastName !== ''
                                ? appleUserResponse.lastName
                                : cachedAppleUser.lastName,
                          };
                          setAppleUser(updatedUser);
                          cache.saveAppleUser(updatedUser);
                        } else {
                          setAppleUser(appleUserResponse);
                          cache.saveAppleUser(appleUserResponse);
                        }
                      } else {
                        setError('Failed to sign in with Apple');
                      }
                    }
              }
            />
          ) : null}
        </View>

        {googleUser !== null ? (
          <View style={{ marginTop: 16, alignItems: 'center' }}>
            <Text>Logged in as: {googleUser.user.name}</Text>
            {googleUser.user.photo !== null ? (
              <Image
                resizeMode="cover"
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 9999,
                  marginTop: 8,
                }}
                source={{ uri: googleUser.user.photo }}
              />
            ) : null}
          </View>
        ) : null}
        {appleUser !== null ? (
          <View style={{ marginTop: 16, alignItems: 'center' }}>
            <Text>
              {appleUser.firstName === '' && appleUser.lastName === ''
                ? `Signed in with Apple (user ${appleUser.userId})`
                : `Logged in as: ${appleUser.firstName} ${appleUser.lastName}`}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
};

async function signInWithGoogle(): Promise<GoogleUser | null> {
  try {
    await GoogleSignin.hasPlayServices();
    console.log(
      'GoogleSignin.hasPlayServices()',
      await GoogleSignin.hasPlayServices(),
    );
    const userInfo = await GoogleSignin.signIn();
    console.log('GoogleSignin userInfo', userInfo);
    return userInfo;
  } catch (error) {
    if (isGoogleSigninError(error)) {
      if (error.code === GoogleSigninStatusCodes.SIGN_IN_CANCELLED) {
        console.log('user cancelled the login flow');
      } else if (error.code === GoogleSigninStatusCodes.IN_PROGRESS) {
        console.log('operation (e.g. sign in) is in progress already');
      } else if (
        error.code === GoogleSigninStatusCodes.PLAY_SERVICES_NOT_AVAILABLE
      ) {
        console.log('play services not available or outdated');
      } else {
        console.log('some other error happened');
      }
    } else {
      console.log('not a Google signin error');
    }
    return null;
  }
}

async function signInWithApple(): Promise<AppleRequestResponse | null> {
  try {
    const appleAuthRequestResponse = await appleAuth.performRequest({
      requestedOperation: appleAuth.Operation.LOGIN,
      requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
    });
    const credentialState = await appleAuth.getCredentialStateForUser(
      appleAuthRequestResponse.user,
    );

    if (credentialState === appleAuth.State.AUTHORIZED) {
      console.log('Apple sign in response', appleAuthRequestResponse);
      return appleAuthRequestResponse;
    } else {
      console.log('login failed');
      return null;
    }
  } catch (error) {
    if (isGoogleSigninError(error)) {
      if (error.code === GoogleSigninStatusCodes.SIGN_IN_CANCELLED) {
        console.log('user cancelled the login flow');
      } else if (error.code === GoogleSigninStatusCodes.IN_PROGRESS) {
        console.log('operation (e.g. sign in) is in progress already');
      } else if (
        error.code === GoogleSigninStatusCodes.PLAY_SERVICES_NOT_AVAILABLE
      ) {
        console.log('play services not available or outdated');
      } else {
        console.log('some other error happened');
      }
    } else {
      console.log('not a Google signin error');
    }
    return null;
  }
}

interface GoogleSigninError {
  code: any;
}

function isGoogleSigninError(error: unknown): error is GoogleSigninError {
  return error != null && (error as GoogleSigninError).code != null;
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
});
