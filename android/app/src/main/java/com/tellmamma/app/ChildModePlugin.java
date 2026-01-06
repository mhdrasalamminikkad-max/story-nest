package com.tellmamma.app;

import android.app.Activity;
import android.app.ActivityManager;
import android.content.Context;
import android.os.Build;

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
            // Get ActivityManager
            ActivityManager activityManager = (ActivityManager) activity.getSystemService(Context.ACTIVITY_SERVICE);
            
            if (activityManager != null) {
                // Start lock task mode (app pinning)
                activityManager.startLockTask();
                
                JSObject result = new JSObject();
                result.put("success", true);
                result.put("message", "Child mode enabled with app pinning");
                call.resolve(result);
            } else {
                call.reject("ActivityManager not available");
            }
        } catch (Exception e) {
            call.reject("Failed to enable child mode: " + e.getMessage());
        }
    }

    /**
     * Disable screen pinning (app pinning) on Android
     * User must provide correct password to exit
     */
    @PluginMethod
    public void exitChildMode(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity not available");
            return;
        }

        try {
            // Get ActivityManager
            ActivityManager activityManager = (ActivityManager) activity.getSystemService(Context.ACTIVITY_SERVICE);
            
            if (activityManager != null) {
                // Stop lock task mode (app pinning)
                activityManager.stopLockTask();
                
                JSObject result = new JSObject();
                result.put("success", true);
                result.put("message", "Child mode disabled");
                call.resolve(result);
            } else {
                call.reject("ActivityManager not available");
            }
        } catch (Exception e) {
            call.reject("Failed to disable child mode: " + e.getMessage());
        }
    }

    /**
     * Check if device supports app pinning
     */
    @PluginMethod
    public void isSupported(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity not available");
            return;
        }

        try {
            // App pinning is supported on Android 5.0+ (API 21+)
            boolean supported = Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP;
            
            JSObject result = new JSObject();
            result.put("supported", supported);
            result.put("apiLevel", Build.VERSION.SDK_INT);
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Failed to check support: " + e.getMessage());
        }
    }
}
