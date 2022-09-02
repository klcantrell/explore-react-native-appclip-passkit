import SwiftUI
import UIKit
import PassKit

struct ContentView: View {
  let walletManager: WalletManager
  
  var body: some View {
    VStack {
      Text("You likey free thing?")
        .padding()
      AddPassButton()
        .onTapGesture {
          try! walletManager.downloadWalletPass(url: "http://localhost:3000/applepass")
        }
        .frame(minWidth: 200, maxWidth: 300, minHeight: 60, maxHeight: 80)
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
