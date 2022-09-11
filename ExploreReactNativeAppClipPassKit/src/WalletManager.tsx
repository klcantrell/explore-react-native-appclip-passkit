import { NativeModules } from 'react-native';

const { RNWalletManager } = NativeModules;

interface WalletManager {
  hasPass(passIdentifier: string, serialNumber: string): Promise<boolean>; // iOS only
  openPass(passIdentifier: string, serialNumber: string): void; // iOS only
  isGoogleWalletApiAvailable(): Promise<boolean>; // Android only
  downloadWalletPassFromUrl(url: string): Promise<void>;
}

type WalletManagerErrorCodes =
  | 'invalidUrl'
  | 'failedToFetchPass'
  | 'failedToDecodePass';

interface WalletManagerError {
  code: WalletManagerErrorCodes;
}

export function isWalletManagerError(
  error: unknown,
): error is WalletManagerError {
  return error != null && (error as WalletManagerError).code != null;
}

export default RNWalletManager as WalletManager;
