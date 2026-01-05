package com.tellmamma.app;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.tasks.Task;

@CapacitorPlugin(name = "GoogleSignInPlugin")
public class GoogleSignInPlugin extends Plugin {

    private GoogleSignInClient mGoogleSignInClient;
    private static final int RC_SIGN_IN = 9001;
    private PluginCall signInCall;

    @PluginMethod
    public void signInWithGoogle(PluginCall call) {
        String clientId = call.getString("clientId", "");
        
        if (clientId.isEmpty()) {
            call.reject("Client ID is required");
            return;
        }
        
        GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                .requestIdToken(clientId)
                .requestEmail()
                .requestProfile()
                .build();

        mGoogleSignInClient = GoogleSignIn.getClient(this.getActivity(), gso);
        signInCall = call;
        
        this.startActivityForResult(call, mGoogleSignInClient.getSignInIntent(), RC_SIGN_IN);
    }

    @PluginMethod
    public void signOut(PluginCall call) {
        if (mGoogleSignInClient != null) {
            mGoogleSignInClient.signOut().addOnCompleteListener(task -> {
                JSObject result = new JSObject();
                result.put("success", true);
                call.resolve(result);
            });
        } else {
            call.reject("Google Sign-In not initialized");
        }
    }

    @PluginMethod
    public void getCurrentUser(PluginCall call) {
        GoogleSignInAccount account = GoogleSignIn.getLastSignedInAccount(this.getContext());
        if (account != null) {
            JSObject result = buildUserResult(account);
            call.resolve(result);
        } else {
            call.reject("No user signed in");
        }
    }

    @Override
    protected void handleOnActivityResult(int requestCode, int resultCode, android.content.Intent data) {
        super.handleOnActivityResult(requestCode, resultCode, data);
        
        if (requestCode == RC_SIGN_IN) {
            Task<GoogleSignInAccount> task = GoogleSignIn.getSignedInAccountFromIntent(data);
            try {
                GoogleSignInAccount account = task.getResult(ApiException.class);
                
                if (signInCall != null) {
                    JSObject result = buildUserResult(account);
                    signInCall.resolve(result);
                    signInCall = null;
                }
                
                JSObject eventData = buildUserResult(account);
                notifyListeners("signInSuccess", eventData);
            } catch (ApiException e) {
                if (signInCall != null) {
                    signInCall.reject("Sign-in failed: " + e.getStatusCode());
                    signInCall = null;
                }
                
                JSObject error = new JSObject();
                error.put("error", e.getStatusCode());
                error.put("message", e.getMessage());
                notifyListeners("signInFailure", error);
            }
        }
    }
    
    private JSObject buildUserResult(GoogleSignInAccount account) {
        JSObject result = new JSObject();
        result.put("id", account.getId() != null ? account.getId() : "");
        result.put("email", account.getEmail() != null ? account.getEmail() : "");
        result.put("displayName", account.getDisplayName() != null ? account.getDisplayName() : "");
        result.put("photoUrl", account.getPhotoUrl() != null ? account.getPhotoUrl().toString() : null);
        result.put("idToken", account.getIdToken() != null ? account.getIdToken() : "");
        result.put("accessToken", ""); // Not directly available in GoogleSignInAccount
        return result;
    }
}
