import SwiftUI
import UIKit
import PassKit

struct ContentView: View {
  let walletManager: WalletManager

  private let APP_GROUP = "group.com.kalalau.explore.ReactNativeAppClipPassKit";
  private let PASS_ID = "PASS_ID"

  @State var alreadyHasPass: Bool? = nil
  @State var fetchedPass: PKPass? = nil

  var body: some View {
    VStack {
      if let hasPass = alreadyHasPass {
        if hasPass {
          Text("You already have a pass")
        } else {
          Text("You likey free thing?")
            .padding()
          AddPassButton()
            .onTapGesture {
              do {
                if let fetchedPass = fetchedPass {
                  walletManager.presentPass(fetchedPass)
                } else {
                  try walletManager.downloadWalletPass(url: "http://localhost:3000/applepass") { (pass: PKPass) in
                    alreadyHasPass = true
                    if let defaults = UserDefaults(suiteName: APP_GROUP) {
                      defaults.set(pass.serialNumber, forKey: PASS_ID)
                    }
                  }
                }
              } catch {
                print("Failed to download new pass")
              }
            }
            .frame(minWidth: 200, maxWidth: 300, minHeight: 60, maxHeight: 80)
        }
      } else {
        ProgressView()
      }
    }
    .onAppear {
      if let defaults = UserDefaults(suiteName: APP_GROUP),
         let passId = defaults.string(forKey: PASS_ID) {
        do {
          try walletManager.hasPass(url: "http://localhost:3000/applepass/\(passId)") { (hasPass, pass) in
            if let pass = pass {
              if !hasPass {
                fetchedPass = pass
              }
              defaults.set(pass.serialNumber, forKey: PASS_ID)
            }

            alreadyHasPass = hasPass
          }
        } catch {
          print("Error checking initial pass")
        }
      } else {
        alreadyHasPass = false
      }
    }
  }
}

struct AddPassButton: UIViewRepresentable {
  typealias UIViewType = PKAddPassButton

  func makeUIView(context: Context) -> PKAddPassButton {
    return PKAddPassButton()
  }

  func updateUIView(_ uiView: PKAddPassButton, context: Context) {
  }
}

struct ContentView_Previews: PreviewProvider {
  static var previews: some View {
    ContentView(walletManager: WalletManager())
  }
}
