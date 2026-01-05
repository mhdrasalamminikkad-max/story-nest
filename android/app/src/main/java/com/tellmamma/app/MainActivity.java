package com.tellmamma.app;

import android.webkit.CookieManager;
import android.webkit.WebSettings;
import android.webkit.JavascriptInterface;
import android.app.ActivityManager;
import android.content.Context;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.tellmamma.app.plugins.ChildModePlugin;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    
    // Register Capacitor Plugins
    registerPlugin(ChildModePlugin.class);

    // Register Child Mode JS Interface (Legacy support)
    this.bridge.getWebView().addJavascriptInterface(new ChildModeInterface(), "androidChildMode");

    // Configure WebView BEFORE any web code loads (Firebase auth fix)
    CookieManager cookieManager = CookieManager.getInstance();
    cookieManager.setAcceptCookie(true);
    cookieManager.setAcceptThirdPartyCookies(this.bridge.getWebView(), true);
    
    WebSettings settings = this.bridge.getWebView().getSettings();
    settings.setDomStorageEnabled(true);
    settings.setDatabaseEnabled(true);
    settings.setJavaScriptEnabled(true);
    settings.setAppCacheEnabled(true);
    settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
    
    String appCachePath = this.getApplicationContext().getCacheDir().getAbsolutePath();
    settings.setAppCachePath(appCachePath);
    settings.setDatabasePath(appCachePath);
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
      return;
    }
    super.onBackPressed();
  }
}
