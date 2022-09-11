import { Pressable, requireNativeComponent, ViewProps } from 'react-native';

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
  return (
    <Pressable onPress={onPress}>
      <NativeAddPassButton
        style={[{ width: 275, height: 60 }, style]}
        {...props}
      />
    </Pressable>
  );
}
