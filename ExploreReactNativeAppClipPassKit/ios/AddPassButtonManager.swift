import PassKit
import React

@objc(AddPassButtonManager)
class AddPassButtonManager: RCTViewManager {
  override func view() -> UIView! {
    PKAddPassButton()
  }

  override static func requiresMainQueueSetup() -> Bool {
    return false
  }
}
