import Capacitor
import UIKit
import Network
import WebKit

/// واحة WebView: edge-to-edge, RTL, dark status bar. Same chrome idea as تهجد.
final class WahaViewController: CAPBridgeViewController {
    private let connectivity = NWPathMonitor()

    deinit { connectivity.cancel() }

    override var preferredStatusBarStyle: UIStatusBarStyle {
        traitCollection.userInterfaceStyle == .dark ? .lightContent : .darkContent
    }

    override var prefersStatusBarHidden: Bool {
        false
    }

    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(HouseDoorBrowserPlugin())
        bridge?.registerPluginInstance(DnsShieldPlugin())
    }

    override func viewDidLoad() {
        super.viewDidLoad()

        view.backgroundColor = .systemBackground
        view.semanticContentAttribute = .forceRightToLeft
        webView?.semanticContentAttribute = .forceRightToLeft
        webView?.isOpaque = false
        webView?.backgroundColor = .systemBackground
        webView?.scrollView.backgroundColor = .systemBackground
        webView?.scrollView.contentInsetAdjustmentBehavior = .never
        webView?.scrollView.semanticContentAttribute = .forceRightToLeft
        webView?.scrollView.keyboardDismissMode = .interactive
        webView?.allowsBackForwardNavigationGestures = true
        connectivity.pathUpdateHandler = { [weak self] path in
            guard path.status == .unsatisfied else { return }
            DispatchQueue.main.async { self?.showOfflineTools() }
        }
        connectivity.start(queue: DispatchQueue(label: "waha.connectivity"))
        lockWebViewZoom()
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        lockWebViewZoom()
    }

    // Keep Capacitor's navigation delegate and local URL scheme intact.
    // Both network loss and server.errorPath use the same persistent local origin.
    private func showOfflineTools() {
        guard let local = bridge?.config.localURL.appendingPathComponent("index.html"),
              webView?.url?.scheme != local.scheme else { return }
        webView?.load(URLRequest(url: local))
    }

    private func lockWebViewZoom() {
        guard let scrollView = webView?.scrollView else { return }
        scrollView.bouncesZoom = false
        scrollView.minimumZoomScale = 1
        scrollView.maximumZoomScale = 1
        scrollView.pinchGestureRecognizer?.isEnabled = false
        scrollView.subviews
            .flatMap { $0.gestureRecognizers ?? [] }
            .compactMap { $0 as? UITapGestureRecognizer }
            .filter { $0.numberOfTapsRequired == 2 }
            .forEach { $0.isEnabled = false }
    }
}
