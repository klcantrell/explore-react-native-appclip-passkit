import { NativeModules } from 'react-native';

const { RNWalletManager } = NativeModules;

interface WalletManager {
  downloadWalletPassFromUrl(url: string, onComplete: () => void): void;
  hasPass(passIdentifier: string, serialNumber: string): Promise<boolean>;
  openPass(passIdentifier: string, serialNumber: string): void;
}

export default RNWalletManager as WalletManager;
