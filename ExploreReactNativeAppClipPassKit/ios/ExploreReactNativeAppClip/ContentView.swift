import SwiftUI
import UIKit
import PassKit
import AuthenticationServices
import GoogleSignInSwift

struct ContentView: View {
  let walletManager: WalletManager

  private let APP_GROUP = "group.com.kalalau.explore.ReactNativeAppClipPassKit";
  private let KEY_PASS_ID = "PASS_ID"

  @State var alreadyHasPass: Bool? = nil
  @State var fetchedPass: PKPass? = nil
  @State var errorMessage: String? = nil
  @State var signInWithGoogleAlertIsPresented = false

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
                  walletManager.downloadWalletPass(
                    url: "https://ad0e-2600-1700-8c21-c160-c6a-4ccf-ce03-b1e1.ngrok.io/applepass",
                    onSuccess: { (pass: PKPass) in
                      alreadyHasPass = true
                      if let defaults = UserDefaults(suiteName: APP_GROUP) {
                        defaults.set(pass.serialNumber, forKey: KEY_PASS_ID)
                      }
                    }, onFailure: { _ in
                      errorMessage = "Could not download your pass. Please check your internet connection and try again."
                    })
                }
              }
              .frame(width: 275, height: 60)
            AppleSignInButton()
              .frame(width: 275, height: 60)
              .padding()
            GoogleSignInButton(scheme: .dark, style: .wide) {
              signInWithGoogleAlertIsPresented = true
            }
              .frame(width: 275)
              .alert(isPresented: $signInWithGoogleAlertIsPresented) {
                Alert(
                  title: Text("Sign in with Google"),
                  message: Text("You just signed in with Google!")
                )
              }
          }
        } else {
          ProgressView().frame(height: 40)
        }
      }
    }
    .onAppear {
      if let defaults = UserDefaults(suiteName: APP_GROUP),
         let passId = defaults.string(forKey: KEY_PASS_ID) {
        do {
          try walletManager.hasPass(url: "http://localhost:3000/applepass/\(passId)") { (hasPass, pass) in
            if let pass = pass {
              if !hasPass {
                fetchedPass = pass
              }
              defaults.set(pass.serialNumber, forKey: KEY_PASS_ID)
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

  func makeUIView(context: Context) -> UIViewType {
    return PKAddPassButton()
  }

  func updateUIView(_ uiView: UIViewType, context: Context) {
  }
}

struct AppleSignInButton: UIViewRepresentable {
  typealias UIViewType = ASAuthorizationAppleIDButton

  func makeUIView(context: Context) -> UIViewType {
    return ASAuthorizationAppleIDButton()
  }

  func updateUIView(_ uiView: UIViewType, context: Context) {
  }
}

struct ContentView_Previews: PreviewProvider {
  static var previews: some View {
    ContentView(walletManager: WalletManager())
  }
}
