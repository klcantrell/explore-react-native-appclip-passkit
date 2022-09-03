import { NativeModules } from 'react-native';

const { RNWalletManager } = NativeModules;

interface WalletManager {
  downloadWalletPassFromUrl(url: string): Promise<void>;
  hasPass(passIdentifier: string, serialNumber: string): Promise<boolean>;
  openPass(passIdentifier: string, serialNumber: string): void;
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
