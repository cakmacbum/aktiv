package com.screentime;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.SharedPreferences;
import android.widget.RemoteViews;
import org.json.JSONObject;

public class ScreenTimeWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        // SharedPreferences'dan React Native'in kaydettiği veriyi oku
        SharedPreferences prefs = context.getSharedPreferences("com.screentime.PREFERENCE_FILE_KEY", Context.MODE_PRIVATE);
        String widgetDataJson = prefs.getString("widgetData", "{\"todayMinutes\":0, \"yesterdayMinutes\":0}");

        int todayMinutes = 0;
        int yesterdayMinutes = 0;

        try {
            JSONObject json = new JSONObject(widgetDataJson);
            todayMinutes = json.getInt("todayMinutes");
            yesterdayMinutes = json.getInt("yesterdayMinutes");
        } catch (Exception e) {
            e.printStackTrace();
        }

        int hours = todayMinutes / 60;
        int minutes = todayMinutes % 60;
        String timeText = hours + "sa " + minutes + "dk";

        // Kıyaslama Algoritması
        String comparisonText = "Dün veri yok";
        int iconRes = R.drawable.ic_arrow_up; // Varsayılan ikon
        int colorRes = android.graphics.Color.parseColor("#10B981"); // Soft Yeşil

        if (yesterdayMinutes > 0) {
            int diff = todayMinutes - yesterdayMinutes;
            int pct = (int) Math.abs(((double) diff / yesterdayMinutes) * 100);
            
            if (diff < 0) {
                comparisonText = "Düne göre %" + pct + " daha az";
                iconRes = R.drawable.ic_arrow_down;
                colorRes = android.graphics.Color.parseColor("#10B981"); // Soft Yeşil
            } else {
                comparisonText = "Düne göre %" + pct + " daha fazla";
                iconRes = R.drawable.ic_arrow_up;
                colorRes = android.graphics.Color.parseColor("#EF4444"); // Kırmızı
            }
        }

        // Tüm widget instance'larını güncelle
        for (int appWidgetId : appWidgetIds) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_screen_time);
            
            views.setTextViewText(R.id.tv_time, timeText);
            views.setTextViewText(R.id.tv_comparison, comparisonText);
            views.setTextColor(R.id.tv_comparison, colorRes);
            views.setImageViewResource(R.id.iv_arrow, iconRes);
            
            appWidgetManager.updateAppWidget(appWidgetId, views);
        }
    }
}
