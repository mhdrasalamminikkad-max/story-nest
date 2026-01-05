package com.tellmamma.app;

import android.webkit.CookieManager;
import android.webkit.WebSettings;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(android.os.Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    
    // Configure WebView BEFORE any web code loads (Firebase auth fix)
    // This ensures settings persist across app resume/suspend cycles
    CookieManager cookieManager = CookieManager.getInstance();
    cookieManager.setAcceptCookie(true);
    cookieManager.setAcceptThirdPartyCookies(this.bridge.getWebView(), true);
    
    // Enable all storage mechanisms for Firebase persistence
    WebSettings settings = this.bridge.getWebView().getSettings();
    settings.setDomStorageEnabled(true);
    settings.setDatabaseEnabled(true);
    settings.setJavaScriptEnabled(true);
    settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
    
    // Force localStorage AND IndexedDB to persist across redirects
    String appCachePath = this.getApplicationContext().getCacheDir().getAbsolutePath();
    settings.setDatabasePath(appCachePath);
    
    // Enable offline storage for IndexedDB
    settings.setOffscreenPreRaster(true);
  }
}
