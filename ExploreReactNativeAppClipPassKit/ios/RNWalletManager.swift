import PassKit

@objc(RNWalletManager)
class RNWalletManager: NSObject {
  let walletManager = WalletManager()
  
  @objc(downloadWalletPassFromUrl:resolve:reject:)
  func downloadWalletPassFromUrl(_ url: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    walletManager.downloadWalletPass(url: url) {(error: Errors?) in
      if error != nil {
        reject(error!.asString(), "", nil)
      } else {
        resolve(nil)
      }
    }
  }

  @objc(hasPass:serialNumber:resolve:reject:)
  func hasPass(_ cardIdentifier: String, serialNumber: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
      resolve(walletManager.hasPass(cardIdentifier: cardIdentifier, serialNumber: serialNumber))
  }

  @objc(openPass:serialNumber:)
  func openPass(_ cardIdentifier: String, serialNumber: String) {
      walletManager.openPass(cardIdentifier: cardIdentifier, serialNumber: serialNumber)
  }

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
}
