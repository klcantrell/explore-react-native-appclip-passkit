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
import walletManager, { isWalletManagerError } from './walletManager';

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    walletManager
      .hasPass('pass.com.kalalau.free-thing', PASS_SERIAL_NUMBER)
      .then((result) => {
        setHasPass(result);
      });
  });

  if (error) {
    return (
      <View>
        <Text style={styles.sectionTitle}>{error}</Text>
      </View>
    );
  }

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
              await walletManager.downloadWalletPassFromUrl(
                'http://localhost:3000/applepass',
              );
              setHasPass(
                await walletManager.hasPass(
                  'pass.com.kalalau.free-thing',
                  PASS_SERIAL_NUMBER,
                ),
              );
            } catch (error) {
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
                    break;
                }
                setError(message);
              }
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
