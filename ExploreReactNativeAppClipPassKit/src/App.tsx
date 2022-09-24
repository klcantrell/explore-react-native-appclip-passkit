import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StripeProvider } from '@stripe/stripe-react-native';
import React from 'react';

import HomeScreen from './HomeScreen';
import { RootStackParamList, RootStackRoutes } from './navigation';

const AppStack = createNativeStackNavigator<RootStackParamList>();

const App = () => {
  return (
    <StripeProvider
      publishableKey="pk_test_chkGUsA5T8WUB5vgc1FMoRgX00Qi1Nq1t4"
      urlScheme="explorereactnativeappclippasskit.kalalau.dev" // required for 3D Secure and bank redirects
      merchantIdentifier="merchant.com.kalalau.explore.ReactNativeAppClipPassKit" // required for Apple Pay
      setReturnUrlSchemeOnAndroid>
      <NavigationContainer>
        <AppStack.Navigator
          initialRouteName={RootStackRoutes.Home}
          screenOptions={{ headerShown: false }}>
          <AppStack.Screen name={RootStackRoutes.Home} component={HomeScreen} />
        </AppStack.Navigator>
      </NavigationContainer>
    </StripeProvider>
  );
};

export default App;
