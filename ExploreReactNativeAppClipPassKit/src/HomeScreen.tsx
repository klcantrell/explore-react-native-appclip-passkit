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
import { useStripe } from '@stripe/stripe-react-native';
import React, {
  useCallback,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  Image,
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
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

const API_URL = 'https://ed14-2600-1700-8c21-c160-cc84-91d1-3a75-b194.ngrok.io';

const HomeScreen = (_props: RootStackScreenProps<RootStackRoutes.Home>) => {
  const isDarkMode = useColorScheme() === 'dark';
  const [error, setError] = useState<string | null>(null);

  const backgroundStyle = {
    flexGrow: 1,
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ScrollView
        style={{
          flexGrow: 1,
          backgroundColor: isDarkMode ? Colors.black : Colors.white,
        }}
        contentContainerStyle={{
          paddingTop: 30,
          paddingHorizontal: 30,
        }}>
        {error ? (
          <View>
            <Text style={styles.sectionTitle}>{error}</Text>
          </View>
        ) : null}
        <HomeScreenContent title="Home Screen">
          Edit <Text style={styles.highlight}>App.tsx</Text> to change this
          screen and then come back to see your edits.
        </HomeScreenContent>
        <WalletPasses updateError={setError} />
        <SingleSignOn updateError={setError} />
        <PaymentsWithStripe updateError={setError} />
      </ScrollView>
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
    </View>
  );
};

function WalletPasses({
  updateError,
}: {
  updateError: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  const [hasApplePass, setHasApplePass] = useState(false);

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

  return (
    <View>
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
                `${API_URL}/${
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
                updateError(message);
              } else {
                updateError(defaultErrorMessage);
              }
            }
          }}
        />
      )}
    </View>
  );
}

function SingleSignOn({
  updateError,
}: {
  updateError: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  const [googleSigninInProgress, setGoogleSigninInProgress] = useState(false);
  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(null);
  const [appleSigninInProgress, setAppleSigninInProgress] = useState(false);
  const [appleUser, setAppleUser] = useState<AppleUser | null>(null);

  useEffect(() => {
    async function checkGoogleSignin() {
      console.log('GoogleSignin.isSignedIn()', await GoogleSignin.isSignedIn());
    }

    checkGoogleSignin();
  }, []);

  return (
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
            const user = await signInWithGoogle();
            setGoogleUser(user);
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
                        firstName: appleAuthResponse.fullName?.givenName ?? '',
                        lastName: appleAuthResponse.fullName?.familyName ?? '',
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
                      updateError('Failed to sign in with Apple');
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
  );
}

function PaymentsWithStripe({
  updateError: _updateError,
}: {
  updateError: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  const { initPaymentSheet, presentPaymentSheet, handleURLCallback } =
    useStripe();
  const [stripeAddPaymentInitialized, setStripeAddPaymentInitialized] =
    useState(false);
  const [stripeAcceptPaymentInitialized, setStripeAcceptPaymentInitialized] =
    useState(false);
  const [subscription, setSubscription] = useState<
    'none' | 'loading' | 'subscribed' | 'error'
  >('none');
  const [updatingPaymentMethods, setUpdatingPaymentMethods] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<
    StripePaymentMethod[] | null
  >(null);

  const customerHasPaymentMethods =
    paymentMethods !== null && paymentMethods.length > 0;
  const paymentMethodsLoading = paymentMethods === null;

  const handleDeepLink = useCallback(
    async (url: string | null) => {
      if (url) {
        const stripeHandled = await handleURLCallback(url);
        if (stripeHandled) {
          console.log('Stripe redirect complete');
          // This was a Stripe URL - you can return or add extra handling here as you see fit
        } else {
          // This was NOT a Stripe URL – handle as you normally would
        }
      }
    },
    [handleURLCallback],
  );

  useEffect(() => {
    const getUrlAsync = async () => {
      const initialUrl = await Linking.getInitialURL();
      handleDeepLink(initialUrl);
    };

    getUrlAsync();

    const deepLinkListener = Linking.addEventListener(
      'url',
      (event: { url: string }) => {
        handleDeepLink(event.url);
      },
    );

    return () => deepLinkListener.remove();
  }, [handleDeepLink]);

  const fetchPaymentMethods = useCallback(async (): Promise<
    StripePaymentMethod[]
  > => {
    const response = await fetch(`${API_URL}/list-payment-methods`, {
      method: 'GET',
    });
    if (
      response.ok &&
      response.headers.get('content-type')?.includes('application/json')
    ) {
      return response.json();
    } else {
      console.warn('Something went wrong fetching your payment methods');
      throw Error();
    }
  }, []);

  const fetchSubscriptions =
    useCallback(async (): Promise<StripeSubscriptions> => {
      const response = await fetch(`${API_URL}/subscription`, {
        method: 'GET',
      });
      if (
        response.ok &&
        response.headers.get('content-type')?.includes('application/json')
      ) {
        return response.json();
      } else {
        console.warn('Something went wrong fetching your subscriptions');
        throw Error();
      }
    }, []);

  const refreshSubscriptions = useCallback(async () => {
    setSubscription('loading');
    const fetchedSubscriptions = await fetchSubscriptions();
    if (fetchedSubscriptions.data.length > 0) {
      setSubscription('subscribed');
    } else {
      setSubscription('none');
    }
  }, [fetchSubscriptions]);

  const refreshPaymentMethods = useCallback(async () => {
    setUpdatingPaymentMethods(true);
    const fetchedPaymentMethods = await fetchPaymentMethods();
    setPaymentMethods(fetchedPaymentMethods);
    setUpdatingPaymentMethods(false);
  }, [fetchPaymentMethods]);

  const deletePaymentMethod = async (
    paymentMethodId: string,
  ): Promise<number> => {
    const response = await fetch(
      `${API_URL}/payment-method/${paymentMethodId}`,
      {
        method: 'DELETE',
      },
    );
    if (response.ok) {
      return response.status;
    } else {
      console.warn('Something went wrong fetching your payment methods');
      throw Error();
    }
  };

  const fetchAddPaymentSheetParams = async () => {
    const response = await fetch(`${API_URL}/payment-method`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const { setupIntent, ephemeralKey, customer } = await response.json();

    return {
      setupIntent,
      ephemeralKey,
      customer,
    };
  };

  const fetchAcceptPaymentSheetParams = async () => {
    const response = await fetch(`${API_URL}/payment-sheet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const { paymentIntent, ephemeralKey, customer } = await response.json();

    return {
      paymentIntent,
      ephemeralKey,
      customer,
    };
  };

  const fetchSubscriptionPaymentSheetParams = async () => {
    const response = await fetch(`${API_URL}/create-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const { subscriptionId, clientSecret, subscriptionStatus } =
      await response.json();

    return {
      subscriptionId,
      clientSecret,
      subscriptionStatus,
    };
  };

  const payForSubscription = async (paymentMethodId: string | null = null) => {
    const response = await fetch(`${API_URL}/create-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentMethod: paymentMethodId }),
    });
    const { subscriptionId, clientSecret, subscriptionStatus } =
      await response.json();

    return {
      subscriptionId,
      clientSecret,
      subscriptionStatus,
    };
  };

  const initializeAddPaymentSheet = useCallback(async () => {
    const { setupIntent, ephemeralKey, customer } =
      await fetchAddPaymentSheetParams();

    const { error } = await initPaymentSheet({
      customerId: customer,
      customerEphemeralKeySecret: ephemeralKey,
      setupIntentClientSecret: setupIntent,
      merchantDisplayName: 'React Native Spike Shop',
      applePay: {
        merchantCountryCode: 'US',
      },
    });
    if (!error) {
      setStripeAddPaymentInitialized(true);
    }
  }, [initPaymentSheet]);

  const openAddPaymentSheet = async () => {
    const { error } = await presentPaymentSheet();

    if (error) {
      Alert.alert(`Error code: ${error.code}`, error.message, [
        {
          text: 'Ok',
          onPress: () => refreshPaymentMethods(),
        },
      ]);
    } else {
      Alert.alert(
        'Success',
        'Your payment method is successfully set up for future payments!',
        [
          {
            text: 'Ok',
            onPress: () => refreshPaymentMethods(),
          },
        ],
      );
    }
  };

  const initializeAcceptPaymentSheet = useCallback(async () => {
    const { paymentIntent, ephemeralKey, customer } =
      await fetchAcceptPaymentSheetParams();

    const { error } = await initPaymentSheet({
      customerId: customer,
      customerEphemeralKeySecret: ephemeralKey,
      paymentIntentClientSecret: paymentIntent,
      merchantDisplayName: 'React Native Spike Shop',
      applePay: {
        merchantCountryCode: 'US',
      },
    });
    if (!error) {
      setStripeAcceptPaymentInitialized(true);
    }
  }, [initPaymentSheet]);

  const openAcceptPaymentSheet = async () => {
    const { error } = await presentPaymentSheet();

    if (error) {
      Alert.alert(`Error code: ${error.code}`, error.message, [
        {
          text: 'Ok',
          onPress: () => refreshPaymentMethods(),
        },
      ]);
    } else {
      Alert.alert('Success', 'You spent $1', [
        {
          text: 'Ok',
          onPress: () => refreshPaymentMethods(),
        },
      ]);
    }
  };

  const initializeSubscriptionPaymentSheet = async () => {
    const { clientSecret } = await fetchSubscriptionPaymentSheetParams();

    const { error } = await initPaymentSheet({
      paymentIntentClientSecret: clientSecret,
      merchantDisplayName: 'React Native Spike Shop',
      applePay: {
        merchantCountryCode: 'US',
      },
    });
    if (error) {
      Alert.alert(`Error code: ${error.code}`, error.message);
    }
  };

  const showSubscriptionPaymentMethodConfirm = () => {
    Alert.alert(
      'Use your saved payment method?',
      `Should we use the payment method ending in ${
        paymentMethods![0].card.last4
      }`,
      [
        {
          text: 'Yes',
          onPress: async () => {
            try {
              setSubscription('loading');
              const { subscriptionStatus } = await payForSubscription(
                paymentMethods![0].id,
              );
              if (subscriptionStatus !== 'active') {
                throw Error();
              }
              setSubscription('subscribed');
            } catch (error) {
              console.log(
                'Failed to create subscription with existing payment method',
              );
              setSubscription('error');
            }
          },
        },
        {
          text: 'Add payment method',
          onPress: async () => {
            try {
              await initializeSubscriptionPaymentSheet();
              openSubscriptionPaymentSheet();
            } catch (error) {
              console.log(
                'Failed to create subscription with new payment method',
              );
            }
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
    );
  };

  const showSubscriptionActiveAlert = () => {
    Alert.alert('Success', 'Unlimited is yours!', [
      {
        text: 'Ok',
        onPress: async () => {
          await refreshPaymentMethods();
          setSubscription('subscribed');
        },
      },
    ]);
  };

  const openSubscriptionPaymentSheet = async () => {
    const { error } = await presentPaymentSheet();

    if (error) {
      Alert.alert(`Error code: ${error.code}`, error.message, [
        {
          text: 'Ok',
          onPress: async () => {
            await refreshPaymentMethods();
            setSubscription('none');
          },
        },
      ]);
    } else {
      showSubscriptionActiveAlert();
    }
  };

  useEffect(() => {
    if (!customerHasPaymentMethods) {
      initializeAddPaymentSheet();
    } else {
      initializeAcceptPaymentSheet();
    }
  }, [
    customerHasPaymentMethods,
    initializeAcceptPaymentSheet,
    initializeAddPaymentSheet,
  ]);

  useEffect(() => {
    refreshPaymentMethods();
  }, [refreshPaymentMethods]);

  useEffect(() => {
    refreshSubscriptions();
  }, [refreshSubscriptions]);

  return (
    <View style={{ borderTopWidth: 1, marginTop: 16 }}>
      <Text style={{ marginVertical: 16 }}>Payments With Stripe</Text>
      <View style={{ marginTop: 16, alignItems: 'center' }}>
        {paymentMethodsLoading ? (
          <ActivityIndicator style={{ margin: 10 }} />
        ) : (
          <>
            {customerHasPaymentMethods && !paymentMethodsLoading ? (
              <Text style={{ fontWeight: 'bold' }}>Your payment methods</Text>
            ) : null}
            {updatingPaymentMethods ? (
              <ActivityIndicator style={{ margin: 10 }} />
            ) : (
              (paymentMethods ?? []).map((paymentMethod) => (
                <View
                  key={paymentMethod.id}
                  style={{
                    borderWidth: 1,
                    borderRadius: 10,
                    padding: 10,
                    margin: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}>
                  <Text>
                    {paymentMethod.card.brand} ending in{' '}
                    {paymentMethod.card.last4}
                  </Text>
                  <Pressable
                    onPress={() => {
                      Alert.alert(
                        'Are you sure?',
                        'Are you sure you want to delete this payment method?',
                        [
                          {
                            style: 'destructive',
                            text: 'Delete',
                            onPress: async () => {
                              setUpdatingPaymentMethods(true);
                              await deletePaymentMethod(paymentMethod.id);
                              setPaymentMethods(await fetchPaymentMethods());
                              setSubscription('none'); // we'd want to actually delete the subscription as well most likely
                              setUpdatingPaymentMethods(false);
                            },
                          },
                        ],
                      );
                    }}
                    style={({ pressed }) => [
                      {
                        opacity: pressed ? 0.5 : 1,
                        padding: 15,
                        paddingRight: 0,
                      },
                    ]}>
                    <Text style={{ color: '#ff3b30' }}>Remove</Text>
                  </Pressable>
                </View>
              ))
            )}
            {!customerHasPaymentMethods &&
            !paymentMethodsLoading &&
            subscription !== 'subscribed' ? (
              <Button
                disabled={!stripeAddPaymentInitialized}
                title="Add payment method"
                onPress={openAddPaymentSheet}
              />
            ) : null}
            {customerHasPaymentMethods &&
            !paymentMethodsLoading &&
            subscription !== 'loading' &&
            subscription !== 'subscribed' ? (
              <Button
                disabled={!stripeAcceptPaymentInitialized}
                title="Pay $1"
                onPress={openAcceptPaymentSheet}
              />
            ) : null}
            {customerHasPaymentMethods &&
            !paymentMethodsLoading &&
            subscription === 'none' ? (
              <>
                <Text>OR</Text>
                <Button
                  title="Get Unlimited"
                  onPress={showSubscriptionPaymentMethodConfirm}
                />
              </>
            ) : null}
            {subscription === 'loading' ? (
              <ActivityIndicator style={{ margin: 10 }} />
            ) : null}
            {subscription === 'error' ? (
              <Text>Uh oh, something went wrong subscribing to unlimited</Text>
            ) : null}
            {subscription === 'subscribed' ? (
              <>
                <Text style={{ fontWeight: 'bold' }}>Subscription Status</Text>
                <Text>You have unlimited!</Text>
              </>
            ) : null}
          </>
        )}
      </View>
    </View>
  );
}

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

interface StripePaymentMethod {
  id: string;
  type: string;
  card: {
    brand: string;
    last4: string;
  };
}

interface StripeSubscriptions {
  data: { id: string }[];
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
