package com.tellmamma.app.plugins;

import android.app.Activity;
import android.os.Build;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "ChildMode")
public class ChildModePlugin extends Plugin {

    @PluginMethod
    public void enterChildMode(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity is null");
            return;
        }

        activity.runOnUiThread(() -> {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    activity.startLockTask();
                    call.resolve();
                } else {
                    call.reject("Lock Task Mode not supported on this Android version");
                }
            } catch (Exception e) {
                call.reject("Failed to enter Child Mode: " + e.getMessage());
            }
        });
    }

    @PluginMethod
    public void exitChildMode(PluginCall call) {
        String password = call.getString("password");
        Activity activity = getActivity();
        
        if (activity == null) {
            call.reject("Activity is null");
            return;
        }

        // Native password validation (hardcoded for demo as requested)
        if ("1234".equals(password)) {
            activity.runOnUiThread(() -> {
                try {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                        activity.stopLockTask();
                        call.resolve();
                    } else {
                        call.reject("Lock Task Mode not supported");
                    }
                } catch (Exception e) {
                    call.reject("Failed to exit Child Mode: " + e.getMessage());
                }
            });
        } else {
            call.reject("Incorrect parent password");
        }
    }
}
