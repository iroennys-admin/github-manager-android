package com.octomobile.app;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final String CUSTOM_UA =
        "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36 OctoMobile/1.0";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(OctoBridgePlugin.class);
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onResume() {
        super.onResume();
        try {
            WebView wv = getBridge().getWebView();
            if (wv != null) {
                WebSettings s = wv.getSettings();
                s.setUserAgentString(CUSTOM_UA);
                s.setDomStorageEnabled(true);
                s.setJavaScriptEnabled(true);
            }
        } catch (Exception ignored) {}
    }
}
