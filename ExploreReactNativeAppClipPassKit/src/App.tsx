import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import HomeScreen from './HomeScreen';
import { RootStackParamList, RootStackRoutes } from './navigation';

const AppStack = createNativeStackNavigator<RootStackParamList>();

const App = () => {
  return (
    <NavigationContainer>
      <AppStack.Navigator
        initialRouteName={RootStackRoutes.Home}
        screenOptions={{ headerShown: false }}>
        <AppStack.Screen name={RootStackRoutes.Home} component={HomeScreen} />
      </AppStack.Navigator>
    </NavigationContainer>
  );
};

export default App;
