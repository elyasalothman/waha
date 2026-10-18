import Capacitor
import Foundation
import NetworkExtension

/// درع الإعلانات — native DNS-over-HTTPS toggle via NEDNSSettingsManager (iOS 14+).
/// Requires the Network Extensions capability with the `dns-settings` value
/// (see App.entitlements). iOS never lets an app switch DNS on silently: after `enable`,
/// the user selects «واحة» once in Settings › General › VPN & Device Management › DNS.
@objc(DnsShieldPlugin)
public class DnsShieldPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "DnsShieldPlugin"
    public let jsName = "DnsShield"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "status", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "enable", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "disable", returnType: CAPPluginReturnPromise)
    ]

    static let defaultServer = "https://dns.alhajda.com/dns-query"

    private func result(_ manager: NEDNSSettingsManager) -> [String: Any] {
        [
            "enabled": manager.isEnabled,
            "configured": manager.dnsSettings != nil,
            "serverURL": (manager.dnsSettings as? NEDNSOverHTTPSSettings)?.serverURL?.absoluteString ?? ""
        ]
    }

    @objc func status(_ call: CAPPluginCall) {
        let manager = NEDNSSettingsManager.shared()
        manager.loadFromPreferences { error in
            if let error = error { call.reject(error.localizedDescription); return }
            call.resolve(self.result(manager))
        }
    }

    @objc func enable(_ call: CAPPluginCall) {
        let raw = call.getString("serverURL") ?? Self.defaultServer
        guard let url = URL(string: raw), url.scheme == "https",
              url.host?.hasSuffix("alhajda.com") == true else {
            call.reject("https-alhajda-only")
            return
        }
        let manager = NEDNSSettingsManager.shared()
        manager.loadFromPreferences { error in
            if let error = error { call.reject(error.localizedDescription); return }
            // Empty bootstrap list: iOS resolves dns.alhajda.com with the network's resolver.
            let doh = NEDNSOverHTTPSSettings(servers: [])
            doh.serverURL = url
            manager.dnsSettings = doh
            manager.localizedDescription = "درع واحة"
            // Apply on every network (Wi-Fi + cellular).
            let always = NEOnDemandRuleConnect()
            always.interfaceTypeMatch = .any
            manager.onDemandRules = [always]
            manager.saveToPreferences { error in
                if let error = error { call.reject(error.localizedDescription); return }
                manager.loadFromPreferences { _ in call.resolve(self.result(manager)) }
            }
        }
    }

    @objc func disable(_ call: CAPPluginCall) {
        let manager = NEDNSSettingsManager.shared()
        manager.loadFromPreferences { _ in
            manager.removeFromPreferences { error in
                if let error = error { call.reject(error.localizedDescription); return }
                call.resolve(["enabled": false, "configured": false, "serverURL": ""])
            }
        }
    }
}
