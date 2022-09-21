import React from 'react';
import {
  Pressable,
  requireNativeComponent,
  View,
  ViewProps,
  ViewStyle,
} from 'react-native';

const DEFAULT_WIDTH = 275;
const DEFAULT_HEIGHT = 60;

interface NativeProps extends ViewProps {}

const NativeAddPassButton =
  requireNativeComponent<NativeProps>('AddPassButton');

interface Props extends NativeProps {
  onPress?: () => void;
}

export default function AddPassButton({
  onPress = () => {},
  style,
  ...props
}: Props) {
  const _style = style as ViewStyle | undefined;
  return (
    <View
      style={{
        position: 'relative',
        width: _style?.width ?? DEFAULT_WIDTH,
        height: _style?.height ?? DEFAULT_HEIGHT,
        alignSelf: _style?.alignSelf ?? 'auto',
      }}>
      <NativeAddPassButton
        style={[{ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT }, style]}
        {...props}
      />
      {/* covering the native component is a workaround on Android until I find a way to handle */}
      {/* press events. Currently, press events fail on the native side with the following error */}
      {/* com.facebook.react.bridge.ReactNoCrashSoftException: Cannot find EventEmitter for receivedTouches */}
      <Pressable
        onPress={onPress}
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
        }}
      />
    </View>
  );
}
