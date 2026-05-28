package com.octomobile.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.widget.Toast;

import androidx.core.app.NotificationCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Native bridge for OctoMobile:
 *  - Token storage in SharedPreferences (for the widget background process)
 *  - Local notifications (issues / PR / mentions polling)
 *  - Clipboard / vibrate / toast / open URL externally
 *  - Trigger widget refresh
 */
@CapacitorPlugin(name = "OctoBridge")
public class OctoBridgePlugin extends Plugin {

    public static final String PREFS = "octomobile";
    public static final String KEY_TOKEN = "token";
    public static final String KEY_LOGIN = "login";
    public static final String CHANNEL_ID = "octomobile-default";

    @Override
    public void load() {
        // Ensure notification channel
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = (NotificationManager) getContext().getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null && nm.getNotificationChannel(CHANNEL_ID) == null) {
                NotificationChannel ch = new NotificationChannel(CHANNEL_ID, "OctoMobile", NotificationManager.IMPORTANCE_DEFAULT);
                ch.setDescription("Issues, PRs and mentions");
                nm.createNotificationChannel(ch);
            }
        }
    }

    @PluginMethod
    public void saveToken(PluginCall call) {
        String token = call.getString("token", "");
        String login = call.getString("login", "");
        getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit().putString(KEY_TOKEN, token).putString(KEY_LOGIN, login).apply();
        JSObject r = new JSObject(); r.put("value", true); call.resolve(r);
    }

    @PluginMethod
    public void clearToken(PluginCall call) {
        getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().clear().apply();
        JSObject r = new JSObject(); r.put("value", true); call.resolve(r);
    }

    @PluginMethod
    public void vibrate(PluginCall call) {
        int ms = call.getInt("ms", 30);
        try {
            Vibrator v = (Vibrator) getContext().getSystemService(Context.VIBRATOR_SERVICE);
            if (v != null) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    v.vibrate(VibrationEffect.createOneShot(ms, VibrationEffect.DEFAULT_AMPLITUDE));
                } else { v.vibrate(ms); }
            }
            JSObject r = new JSObject(); r.put("value", true); call.resolve(r);
        } catch (Exception e) { call.reject(e.getMessage()); }
    }

    @PluginMethod
    public void toast(PluginCall call) {
        final String msg = call.getString("message", "");
        try {
            new Handler(Looper.getMainLooper()).post(
                () -> Toast.makeText(getContext(), msg, Toast.LENGTH_SHORT).show());
            JSObject r = new JSObject(); r.put("value", true); call.resolve(r);
        } catch (Exception e) { call.reject(e.getMessage()); }
    }

    @PluginMethod
    public void copy(PluginCall call) {
        String text = call.getString("text", "");
        try {
            new Handler(Looper.getMainLooper()).post(() -> {
                ClipboardManager cm = (ClipboardManager) getContext().getSystemService(Context.CLIPBOARD_SERVICE);
                if (cm != null) cm.setPrimaryClip(ClipData.newPlainText("OctoMobile", text));
            });
            JSObject r = new JSObject(); r.put("value", true); call.resolve(r);
        } catch (Exception e) { call.reject(e.getMessage()); }
    }

    @PluginMethod
    public void openUrl(PluginCall call) {
        String url = call.getString("url", "");
        try {
            Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
            JSObject r = new JSObject(); r.put("value", true); call.resolve(r);
        } catch (Exception e) { call.reject(e.getMessage()); }
    }

    @PluginMethod
    public void notify(PluginCall call) {
        String title = call.getString("title", "OctoMobile");
        String body = call.getString("body", "");
        int id = call.getInt("id", 1);
        try {
            NotificationManager nm = (NotificationManager) getContext().getSystemService(Context.NOTIFICATION_SERVICE);
            NotificationCompat.Builder b = new NotificationCompat.Builder(getContext(), CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_dialog_email)
                .setContentTitle(title)
                .setContentText(body)
                .setAutoCancel(true);
            if (nm != null) nm.notify(id, b.build());
            JSObject r = new JSObject(); r.put("value", true); call.resolve(r);
        } catch (Exception e) { call.reject(e.getMessage()); }
    }
}
