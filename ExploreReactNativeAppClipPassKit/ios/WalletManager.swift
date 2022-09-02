import PassKit

class WalletManager: NSObject {
  var completionHandler: () -> Void = {}

  func downloadWalletPass(url: String, completionHandler: @escaping () -> Void = {}) throws {
    guard let url = URL(string: url) else { throw Errors.invalidUrl }

    self.completionHandler = completionHandler
    let dataTask = URLSession.shared.dataTask(with: url) { (data, _, error) in
      guard let data = data, error == nil else {
        fatalError("Failed to fetch wallet pass at \(url.absoluteString)")
      }

      do {
        let pass = try PKPass(data: data)

        DispatchQueue.main.async {
          self.presentPass(pass)
        }
      } catch {
        print("Unable to download wallet pass: \(error)")
      }
    }

    dataTask.resume()
  }

  func downloadWalletPass(url: String, completionHandler: @escaping (PKPass) -> Void = { _ in }) throws {
    guard let url = URL(string: url) else { throw Errors.invalidUrl }

    let dataTask = URLSession.shared.dataTask(with: url) { (data, _, error) in
      guard let data = data, error == nil else {
        fatalError("Failed to fetch wallet pass at \(url.absoluteString)")
      }

      do {
        let pass = try PKPass(data: data)
        self.completionHandler = { completionHandler(pass) }

        DispatchQueue.main.async {
          self.presentPass(pass)
        }
      } catch {
        print("Unable to download wallet pass: \(error)")
      }
    }

    dataTask.resume()
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
      self.completionHandler()

      controller.delegate = nil
      self.completionHandler = {}
    }
  }
}

enum Errors: Error {
  case invalidUrl
}
