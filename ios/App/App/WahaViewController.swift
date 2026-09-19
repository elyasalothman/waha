import Capacitor
import UIKit

/// واحة WebView: edge-to-edge, RTL, dark status bar. Same chrome idea as تهجد.
final class WahaViewController: CAPBridgeViewController {
    private let oasisInk = UIColor(
        red: 12.0 / 255.0,
        green: 13.0 / 255.0,
        blue: 12.0 / 255.0,
        alpha: 1
    )

    override var preferredStatusBarStyle: UIStatusBarStyle {
        .lightContent
    }

    override var prefersStatusBarHidden: Bool {
        false
    }

    override func viewDidLoad() {
        super.viewDidLoad()

        view.backgroundColor = oasisInk
        view.semanticContentAttribute = .forceRightToLeft
        webView?.semanticContentAttribute = .forceRightToLeft
        webView?.isOpaque = false
        webView?.backgroundColor = oasisInk
        webView?.scrollView.backgroundColor = oasisInk
        webView?.scrollView.contentInsetAdjustmentBehavior = .never
        webView?.scrollView.semanticContentAttribute = .forceRightToLeft
        lockWebViewZoom()
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        lockWebViewZoom()
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
