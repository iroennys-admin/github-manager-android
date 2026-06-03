package com.octomobile.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.AsyncTask;
import android.os.Build;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

/**
 * Home-screen widget: shows GitHub notification count and last item.
 * Tapping the widget opens the OctoMobile app.
 */
public class NotifWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context ctx, AppWidgetManager mgr, int[] ids) {
        for (int id : ids) updateWidget(ctx, mgr, id);
    }

    private void updateWidget(final Context ctx, final AppWidgetManager mgr, final int widgetId) {
        final SharedPreferences prefs = ctx.getSharedPreferences(OctoBridgePlugin.PREFS, Context.MODE_PRIVATE);
        final String token = prefs.getString(OctoBridgePlugin.KEY_TOKEN, "");
        final String login = prefs.getString(OctoBridgePlugin.KEY_LOGIN, "");

        RemoteViews views = new RemoteViews(ctx.getPackageName(), R.layout.widget_layout);
        Intent openApp = ctx.getPackageManager().getLaunchIntentForPackage(ctx.getPackageName());
        if (openApp != null) {
            PendingIntent pi = PendingIntent.getActivity(ctx, 0, openApp,
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
            views.setOnClickPendingIntent(R.id.widget_root, pi);
        }
        views.setTextViewText(R.id.widget_login, login.isEmpty() ? "Not logged in" : "@" + login);

        if (token.isEmpty()) {
            views.setTextViewText(R.id.widget_count, "—");
            views.setTextViewText(R.id.widget_subtitle, "Open the app to sign in");
            mgr.updateAppWidget(widgetId, views);
            return;
        }

        // Quick & dirty background fetch (within OS limits)
        new AsyncTask<Void, Void, int[]>() {
            String latest = "";
            @Override protected int[] doInBackground(Void... v) {
                int total = 0, unread = 0;
                try {
                    URL u = new URL("https://api.github.com/notifications?per_page=30");
                    HttpURLConnection c = (HttpURLConnection) u.openConnection();
                    c.setRequestProperty("Authorization", "Bearer " + token);
                    c.setRequestProperty("Accept", "application/vnd.github+json");
                    c.setConnectTimeout(8000); c.setReadTimeout(8000);
                    int code = c.getResponseCode();
                    if (code == 200) {
                        StringBuilder sb = new StringBuilder();
                        try (BufferedReader r = new BufferedReader(new InputStreamReader(c.getInputStream(), StandardCharsets.UTF_8))) {
                            char[] buf = new char[2048]; int n;
                            while ((n = r.read(buf)) != -1) sb.append(buf, 0, n);
                        }
                        JSONArray arr = new JSONArray(sb.toString());
                        total = arr.length();
                        for (int i = 0; i < arr.length(); i++) {
                            JSONObject o = arr.getJSONObject(i);
                            if (o.optBoolean("unread", false)) unread++;
                            if (latest.isEmpty()) {
                                JSONObject sub = o.optJSONObject("subject");
                                if (sub != null) latest = sub.optString("title", "");
                            }
                        }
                    }
                } catch (Exception ignored) {}
                return new int[]{ unread, total };
            }
            @Override protected void onPostExecute(int[] r) {
                int unread = r[0];
                views.setTextViewText(R.id.widget_count, String.valueOf(unread));
                views.setTextViewText(R.id.widget_subtitle, latest.isEmpty()
                    ? (unread == 0 ? "All caught up ✨" : unread + " notifications")
                    : latest.substring(0, Math.min(latest.length(), 64)));
                mgr.updateAppWidget(widgetId, views);
            }
        }.execute();
    }
}
