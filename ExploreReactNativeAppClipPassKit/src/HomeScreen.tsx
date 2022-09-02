import React, { useEffect, useState, type PropsWithChildren } from 'react';
import {
  Button,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';

import { RootStackRoutes, type RootStackScreenProps } from './navigation';
import walletManager from './walletManager';

const PASS_SERIAL_NUMBER = 'analternateserialnumber'; // alt. bgsksfuioa

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
        <Section title="Home Screen">
          Edit <Text style={styles.highlight}>App.tsx</Text> to change this
          screen and then come back to see your edits.
        </Section>
      </View>
    </SafeAreaView>
  );
};

export default HomeScreen;

const Section: React.FC<
  PropsWithChildren<{
    title: string;
  }>
> = ({ children, title }) => {
  const isDarkMode = useColorScheme() === 'dark';
  const [hasPass, setHasPass] = useState(false);

  useEffect(() => {
    walletManager
      .hasPass('pass.com.kalalau.free-thing', PASS_SERIAL_NUMBER)
      .then((result) => {
        setHasPass(result);
      });
  });

  return (
    <View>
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
      <View style={{ height: 30 }} />
      {hasPass ? (
        <>
          <Text>
            {`You already have a pass: \n\n\tpassIdentifier: pass.com.kalalau.free-thing \n\tserialNumber: ${PASS_SERIAL_NUMBER}`}
          </Text>
          <View style={{ height: 30 }} />
          <Button
            title="Open it"
            onPress={() => {
              walletManager.openPass(
                'pass.com.kalalau.free-thing',
                PASS_SERIAL_NUMBER,
              );
            }}
          />
        </>
      ) : (
        <Button
          title="Give me a free thing"
          onPress={async () => {
            try {
              walletManager.downloadWalletPassFromUrl(
                'http://localhost:3000/applepass',
                async () => {
                  setHasPass(
                    await walletManager.hasPass(
                      'pass.com.kalalau.free-thing',
                      PASS_SERIAL_NUMBER,
                    ),
                  );
                },
              );
            } catch (error) {
              console.log(
                '[downloadWalletPassFromUrl button handler]: unable to download wallet pass',
              );
            }
          }}
        />
      )}
    </View>
  );
};

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
