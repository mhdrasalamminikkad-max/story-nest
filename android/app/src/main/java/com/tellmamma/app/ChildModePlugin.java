package com.tellmamma.app;

import android.app.Activity;
import android.app.ActivityManager;
import android.content.Context;
import android.os.Build;
import android.view.WindowManager;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "ChildMode")
public class ChildModePlugin extends Plugin {

    /**
     * Enable screen pinning (app pinning) on Android
     * This prevents users from leaving the app without exiting pinning
     */
    @PluginMethod
    public void enterChildMode(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity not available");
            return;
        }

        try {
            // Method 1: Try startLockTask (Android 5.0+)
            // This requires the activity to be explicitly pinned
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    // This will fail with permission denied for non-system apps
                    // But we try anyway in case device allows it
                    activity.startLockTask();
                    
                    JSObject result = new JSObject();
                    result.put("success", true);
                    result.put("message", "Child mode enabled with app pinning");
                    call.resolve(result);
                    return;
                }
            } catch (Exception e) {
                // startLockTask failed, fall through to kiosk mode
                android.util.Log.w("ChildMode", "startLockTask failed: " + e.getMessage());
            }

            // Method 2: Enable fullscreen kiosk mode
            // Disable status bar and navigation bar
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                int uiOptions = activity.getWindow().getDecorView().getSystemUiVisibility();
                uiOptions |= android.view.View.SYSTEM_UI_FLAG_HIDE_NAVIGATION;
                uiOptions |= android.view.View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY;
                uiOptions |= android.view.View.SYSTEM_UI_FLAG_FULLSCREEN;
                activity.getWindow().getDecorView().setSystemUiVisibility(uiOptions);
            }
            
            // Keep screen on
            activity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "Child mode enabled with fullscreen kiosk");
            call.resolve(result);
            
        } catch (Exception e) {
            call.reject("Failed to enable child mode: " + e.getMessage());
        }
    }

    /**
     * Disable screen pinning (app pinning) on Android
     */
    @PluginMethod
    public void exitChildMode(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity not available");
            return;
        }

        try {
            // Try to exit lock task mode
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    activity.stopLockTask();
                }
            } catch (Exception e) {
                android.util.Log.w("ChildMode", "stopLockTask failed: " + e.getMessage());
            }

            // Exit fullscreen kiosk mode
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                int uiOptions = activity.getWindow().getDecorView().getSystemUiVisibility();
                uiOptions &= ~android.view.View.SYSTEM_UI_FLAG_HIDE_NAVIGATION;
                uiOptions &= ~android.view.View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY;
                uiOptions &= ~android.view.View.SYSTEM_UI_FLAG_FULLSCREEN;
                activity.getWindow().getDecorView().setSystemUiVisibility(uiOptions);
            }
            
            // Allow screen to sleep
            activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "Child mode disabled");
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Failed to disable child mode: " + e.getMessage());
        }
    }

    /**
     * Check if device supports app pinning
     */
    @PluginMethod
    public void isSupported(PluginCall call) {
        JSObject result = new JSObject();
        result.put("supported", true); // Fullscreen kiosk is always supported
        result.put("apiLevel", Build.VERSION.SDK_INT);
        result.put("lockTaskSupported", Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP);
        call.resolve(result);
    }
}
