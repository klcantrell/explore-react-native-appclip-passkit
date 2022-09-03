import PassKit

class WalletManager: NSObject {
  var walletSavedCompletionHandler: () -> Void = {}
  var fetchedPass: PKPass? = nil

  @MainActor
  func downloadWalletPass(url: String, onPassSaved: @escaping () -> Void = {}) async throws {
    guard let url = URL(string: url) else {
      throw Errors.invalidUrl
    }

    self.walletSavedCompletionHandler = onPassSaved

    do {
      let (data, _) = try await URLSession.shared.data(from: url)
      let pass = try PKPass(data: data)
      self.fetchedPass = pass
      self.presentPass(pass)
    } catch is PKPassKitError {
      throw Errors.failedToDecodePass
    } catch {
      throw Errors.failedToFetchPass
    }
  }

  @MainActor
  func downloadWalletPass(url: String, onPassSaved: @escaping (PKPass) -> Void = { _ in }) async throws {
    guard let url = URL(string: url) else {
      throw Errors.invalidUrl
    }

    do {
      let (data, _) = try await URLSession.shared.data(from: url)
      let pass = try PKPass(data: data)
      self.walletSavedCompletionHandler = { onPassSaved(pass) }
      self.fetchedPass = pass
      self.presentPass(pass)
    } catch is PKPassKitError {
      throw Errors.failedToDecodePass
    } catch {
      throw Errors.failedToFetchPass
    }
  }

  func hasPass(cardIdentifier: String, serialNumber: String) -> Bool {
    let passLibrary = PKPassLibrary()
    let passes = passLibrary.passes()
    return passes.contains {
      $0.passTypeIdentifier == cardIdentifier && $0.serialNumber == serialNumber
    }
  }

  func hasPass(url: String, completionHandler: @escaping ((Bool, PKPass?)) -> Void) throws {
    guard let url = URL(string: url) else { throw Errors.invalidUrl }

    let dataTask = URLSession.shared.dataTask(with: url) { (data, _, error) in
      guard let data = data, error == nil else {
        completionHandler((false, nil))
        return
      }

      do {
        let pass = try PKPass(data: data)
        let passLibrary = PKPassLibrary()

        if passLibrary.containsPass(pass) {
          completionHandler((true, pass))
        } else {
          completionHandler((false, pass))
        }
      } catch {
        print("Unable to download wallet pass: \(error)")
      }
    }

    dataTask.resume()
  }

  func presentPass(_ pass: PKPass) {
    var viewController = UIApplication.shared.windows.first(where: \.isKeyWindow)!.rootViewController!
    let passController = PKAddPassesViewController(pass: pass)!
    passController.delegate = self

    while let presentedController = viewController.presentedViewController {
      viewController = presentedController
    }

    viewController.present(passController, animated: true)
  }

  func openPass(cardIdentifier: String, serialNumber: String) {
    let passLibrary = PKPassLibrary()
    let passes = passLibrary.passes()
    let pass = passes.first {
      $0.passTypeIdentifier == cardIdentifier && $0.serialNumber == serialNumber
    }
    if let pass = pass, let passUrl = pass.passURL {
      DispatchQueue.main.async {
        UIApplication.shared.open(passUrl)
      }
    }
  }
}

extension WalletManager: PKAddPassesViewControllerDelegate {
  func addPassesViewControllerDidFinish(_ controller: PKAddPassesViewController) {
    controller.dismiss(animated: true) {
      let passLibrary = PKPassLibrary()
      if let fetchedPass = self.fetchedPass,
         passLibrary.containsPass(fetchedPass) {
        self.walletSavedCompletionHandler()
      }

      controller.delegate = nil
      self.walletSavedCompletionHandler = {}
      self.fetchedPass = nil
    }
  }
}

enum Errors: Error {
  case invalidUrl, failedToFetchPass, failedToDecodePass
}

extension Errors {
  func asString() -> String {
    switch self {
    case .invalidUrl:
      return "invalidUrl"
    case .failedToFetchPass:
      return "failedToFetchPass"
    case .failedToDecodePass:
      return "failedToDecodePass"
    }
  }
}
