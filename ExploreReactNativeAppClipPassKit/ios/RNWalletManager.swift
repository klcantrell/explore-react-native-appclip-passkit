import PassKit

@objc(RNWalletManager)
class RNWalletManager: NSObject {
  let walletManager = WalletManager()
  
  @objc(downloadWalletPassFromUrl:completionHandler:)
  func downloadWalletPassFromUrl(_ url: String, completionHandler: @escaping RCTResponseSenderBlock) {
    do {
      try walletManager.downloadWalletPass(url: url, completionHandler: { completionHandler([]) })
    } catch {
      print("[RNWalletManager] error downloading pass from url")
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
