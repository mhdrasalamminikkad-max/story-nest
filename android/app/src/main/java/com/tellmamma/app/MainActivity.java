package com.tellmamma.app;

import android.webkit.CookieManager;
import android.webkit.WebSettings;
import android.webkit.JavascriptInterface;
import android.app.ActivityManager;
import android.content.Context;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(android.os.Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    
    // Register Child Mode JS Interface
    this.bridge.getWebView().addJavascriptInterface(new ChildModeInterface(), "androidChildMode");

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
    settings.setAppCacheEnabled(true);
    settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
    
    // Force localStorage AND IndexedDB to persist across redirects
    String appCachePath = this.getApplicationContext().getCacheDir().getAbsolutePath();
    settings.setAppCachePath(appCachePath);
    settings.setDatabasePath(appCachePath);
    
    // Enable offline storage for IndexedDB
    settings.setOffscreenPreRaster(true);
  }

  public class ChildModeInterface {
    @JavascriptInterface
    public void enterChildMode() {
      runOnUiThread(() -> {
        startLockTask();
      });
    }

    @JavascriptInterface
    public void exitChildMode(String password) {
      if ("1234".equals(password)) {
        runOnUiThread(() -> {
          stopLockTask();
        });
      }
    }
  }

  @Override
  public void onBackPressed() {
    ActivityManager am = (ActivityManager) getSystemService(Context.ACTIVITY_SERVICE);
    if (am.getLockTaskModeState() != ActivityManager.LOCK_TASK_MODE_NONE) {
      // Block back button during Child Mode
      return;
    }
    super.onBackPressed();
  }
}
