import Capacitor
import UIKit
import WebKit

/// بيت الهجدة — in-app WKWebView with Arabic chrome. Not SFSafari / `@capacitor/browser`.
@objc(HouseDoorBrowserPlugin)
public class HouseDoorBrowserPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "HouseDoorBrowserPlugin"
    public let jsName = "HouseDoorBrowser"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "open", returnType: CAPPluginReturnPromise)
    ]

    @objc func open(_ call: CAPPluginCall) {
        guard let raw = call.getString("url"),
              let url = URL(string: raw),
              url.scheme?.lowercased() == "https"
        else {
            call.reject("https-only")
            return
        }

        let title = call.getString("title") ?? ""
        let closeLabel = call.getString("closeLabel") ?? "رجوع لواحة"

        DispatchQueue.main.async {
            guard let presenter = self.topmost(from: self.bridge?.viewController) else {
                call.reject("no-presenter")
                return
            }
            let door = HouseDoorViewController(url: url, titleText: title, closeLabel: closeLabel)
            door.modalPresentationStyle = .fullScreen
            door.modalTransitionStyle = .coverVertical
            presenter.present(door, animated: true) {
                call.resolve()
            }
        }
    }

    private func topmost(from root: UIViewController?) -> UIViewController? {
        var current = root
        while let presented = current?.presentedViewController {
            current = presented
        }
        return current
    }
}

final class HouseDoorViewController: UIViewController, WKNavigationDelegate {
    private let startURL: URL
    private let titleText: String
    private let closeLabel: String
    private var webView: WKWebView!
    private let spinner = UIActivityIndicatorView(style: .medium)
    private let oasisInk = UIColor(red: 12.0 / 255.0, green: 13.0 / 255.0, blue: 12.0 / 255.0, alpha: 1)
    private let oasisMist = UIColor(red: 197.0 / 255.0, green: 208.0 / 255.0, blue: 196.0 / 255.0, alpha: 1)

    init(url: URL, titleText: String, closeLabel: String) {
        self.startURL = url
        self.titleText = titleText
        self.closeLabel = closeLabel
        super.init(nibName: nil, bundle: nil)
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    override var preferredStatusBarStyle: UIStatusBarStyle { .lightContent }

    override func viewDidLoad() {
        super.viewDidLoad()

        view.backgroundColor = oasisInk
        view.semanticContentAttribute = .forceRightToLeft

        let navBar = UINavigationBar()
        navBar.translatesAutoresizingMaskIntoConstraints = false
        navBar.barTintColor = oasisInk
        navBar.backgroundColor = oasisInk
        navBar.isTranslucent = false
        navBar.tintColor = oasisMist
        navBar.titleTextAttributes = [
            .foregroundColor: UIColor.white,
            .font: UIFont.systemFont(ofSize: 17, weight: .semibold)
        ]
        navBar.semanticContentAttribute = .forceRightToLeft
        navBar.barStyle = .black

        let item = UINavigationItem(title: titleText)
        let close = UIBarButtonItem(
            title: closeLabel,
            style: .plain,
            target: self,
            action: #selector(closeTapped)
        )
        close.accessibilityLabel = closeLabel
        item.leftBarButtonItem = close
        navBar.setItems([item], animated: false)

        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.defaultWebpagePreferences.preferredContentMode = .mobile

        webView = WKWebView(frame: .zero, configuration: config)
        webView.translatesAutoresizingMaskIntoConstraints = false
        webView.navigationDelegate = self
        webView.semanticContentAttribute = .forceRightToLeft
        webView.isOpaque = false
        webView.backgroundColor = oasisInk
        webView.scrollView.backgroundColor = oasisInk
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.allowsBackForwardNavigationGestures = true

        spinner.translatesAutoresizingMaskIntoConstraints = false
        spinner.color = oasisMist
        spinner.hidesWhenStopped = true

        view.addSubview(navBar)
        view.addSubview(webView)
        view.addSubview(spinner)

        NSLayoutConstraint.activate([
            navBar.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            navBar.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            navBar.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            webView.topAnchor.constraint(equalTo: navBar.bottomAnchor),
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            webView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            spinner.centerXAnchor.constraint(equalTo: webView.centerXAnchor),
            spinner.centerYAnchor.constraint(equalTo: webView.centerYAnchor)
        ])

        spinner.startAnimating()
        webView.load(URLRequest(url: startURL))
    }

    @objc private func closeTapped() {
        dismiss(animated: true)
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        spinner.stopAnimating()
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        spinner.stopAnimating()
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        spinner.stopAnimating()
    }

    func webView(
        _ webView: WKWebView,
        decidePolicyFor navigationAction: WKNavigationAction,
        decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
    ) {
        guard let url = navigationAction.request.url else {
            decisionHandler(.cancel)
            return
        }
        let scheme = url.scheme?.lowercased() ?? ""
        if scheme == "https" || scheme == "about" {
            decisionHandler(.allow)
            return
        }
        if scheme == "tel" || scheme == "mailto" {
            UIApplication.shared.open(url)
        }
        decisionHandler(.cancel)
    }
}
