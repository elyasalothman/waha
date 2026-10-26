package com.alhajda.waha;

import android.net.Uri;
import android.view.HapticFeedbackConstants;
import androidx.browser.customtabs.CustomTabColorSchemeParams;
import androidx.browser.customtabs.CustomTabsIntent;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * بيت الهجدة على أندرويد: the web app calls HouseDoorBrowser.open for house
 * doors (مداد، تهجد، محسن، ألعاب، حياة). iOS shows its own WKWebView; Android
 * opens a Custom Tab tinted like Waha, and the system back gesture returns
 * to Waha. https only, same as iOS.
 */
@CapacitorPlugin(name = "HouseDoorBrowser")
public class HouseDoorBrowserPlugin extends Plugin {

    @PluginMethod
    public void selection(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (getBridge().getWebView() != null) {
                getBridge().getWebView().performHapticFeedback(HapticFeedbackConstants.CLOCK_TICK);
            }
            call.resolve();
        });
    }

    @PluginMethod
    public void open(PluginCall call) {
        String raw = call.getString("url");
        Uri uri = raw == null ? null : Uri.parse(raw);
        if (uri == null || !"https".equalsIgnoreCase(uri.getScheme())) {
            call.reject("https-only");
            return;
        }
        getActivity().runOnUiThread(() -> {
            try {
                CustomTabColorSchemeParams colors = new CustomTabColorSchemeParams.Builder()
                    .setToolbarColor(0xFF0C0D0C)
                    .setNavigationBarColor(0xFF0C0D0C)
                    .build();
                CustomTabsIntent intent = new CustomTabsIntent.Builder()
                    .setDefaultColorSchemeParams(colors)
                    .setColorScheme(CustomTabsIntent.COLOR_SCHEME_DARK)
                    .setShowTitle(true)
                    .setShareState(CustomTabsIntent.SHARE_STATE_OFF)
                    .build();
                intent.launchUrl(getActivity(), uri);
                call.resolve();
            } catch (Exception e) {
                call.reject("no-browser", e);
            }
        });
    }
}
