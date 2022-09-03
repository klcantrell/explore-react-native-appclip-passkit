import SwiftUI
import UIKit
import PassKit

struct ContentView: View {
  let walletManager: WalletManager

  private let APP_GROUP = "group.com.kalalau.explore.ReactNativeAppClipPassKit";
  private let PASS_ID = "PASS_ID"

  @State var alreadyHasPass: Bool? = nil
  @State var fetchedPass: PKPass? = nil
  @State var errorMessage: String? = nil

  var body: some View {
    VStack {
      if let errorMessage = errorMessage {
        Text(errorMessage)
          .padding()
      } else {
        if let hasPass = alreadyHasPass {
          if hasPass {
            Text("You already have a pass")
              .padding()
          } else {
            Text("You likey free thing?")
              .padding()
            AddPassButton()
              .onTapGesture {
                if let fetchedPass = fetchedPass {
                  walletManager.presentPass(fetchedPass)
                } else {
                  Task {
                    do {
                      try await walletManager.downloadWalletPass(url: "http://localhost:3000/applepass", onPassSaved: { (pass: PKPass) in
                        alreadyHasPass = true
                        if let defaults = UserDefaults(suiteName: APP_GROUP) {
                          defaults.set(pass.serialNumber, forKey: PASS_ID)
                        }
                      })
                    } catch {
                      errorMessage = "Something went wrong downloading your pass. Please check your connection and try again."
                    }
                  }
                }
              }
              .frame(minWidth: 200, maxWidth: 300, minHeight: 60, maxHeight: 80)
          }
        } else {
          ProgressView()
        }
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
