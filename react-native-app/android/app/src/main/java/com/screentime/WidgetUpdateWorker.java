package com.screentime;

import android.content.Context;
import androidx.annotation.NonNull;
import androidx.work.Worker;
import androidx.work.WorkerParameters;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Intent;

public class WidgetUpdateWorker extends Worker {

    public WidgetUpdateWorker(@NonNull Context context, @NonNull WorkerParameters workerParams) {
        super(context, workerParams);
    }

    @NonNull
    @Override
    public Result doWork() {
        Context context = getApplicationContext();
        
        // 1. Burada UsageStatsManager kullanılarak güncel veri çekilir
        // (UsageStatsModule.java'daki mantığın aynısı arka planda çalıştırılır)
        // 2. Çekilen veri SharedPreferences'a kaydedilir.
        
        // 3. Widget'ı güncellemesi için AppWidgetProvider'a broadcast gönderilir
        Intent intent = new Intent(context, ScreenTimeWidgetProvider.class);
        intent.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
        
        int[] ids = AppWidgetManager.getInstance(context)
                .getAppWidgetIds(new ComponentName(context, ScreenTimeWidgetProvider.class));
        intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids);
        
        context.sendBroadcast(intent);

        return Result.success();
    }
}
