package com.screentime;

import android.app.AppOpsManager;
import android.app.usage.UsageStats;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.provider.Settings;
import android.os.Process;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;

import java.util.Calendar;
import java.util.List;

public class UsageStatsModule extends ReactContextBaseJavaModule {
    private final ReactApplicationContext reactContext;

    public UsageStatsModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "UsageStatsModule";
    }

    // İzin kontrolü
    @ReactMethod
    public void checkPermission(Promise promise) {
        AppOpsManager appOps = (AppOpsManager) reactContext.getSystemService(Context.APP_OPS_SERVICE);
        int mode = appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), reactContext.getPackageName());
        promise.resolve(mode == AppOpsManager.MODE_ALLOWED);
    }

    // Kullanıcıyı ayarlar sayfasına yönlendirme
    @ReactMethod
    public void requestPermission() {
        Intent intent = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        reactContext.startActivity(intent);
    }

    // Günlük kullanım verilerini çekme
    @ReactMethod
    public void getDailyUsage(Promise promise) {
        UsageStatsManager usm = (UsageStatsManager) reactContext.getSystemService(Context.USAGE_STATS_SERVICE);
        
        // Bugünün başlangıç ve bitiş zamanlarını hesapla
        Calendar calendar = Calendar.getInstance();
        calendar.set(Calendar.HOUR_OF_DAY, 0);
        calendar.set(Calendar.MINUTE, 0);
        calendar.set(Calendar.SECOND, 0);
        long startTime = calendar.getTimeInMillis();
        long endTime = System.currentTimeMillis();

        // Günlük periyotta verileri sorgula
        List<UsageStats> usageStatsList = usm.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, startTime, endTime);
        
        long totalTime = 0;
        WritableArray appsArray = Arguments.createArray();

        if (usageStatsList != null) {
            for (UsageStats stats : usageStatsList) {
                long timeInForeground = stats.getTotalTimeInForeground();
                // Sadece 0'dan büyük kullanım süresi olanları al
                if (timeInForeground > 0) {
                    totalTime += timeInForeground;
                    
                    WritableMap appMap = Arguments.createMap();
                    appMap.putString("packageName", stats.getPackageName());
                    appMap.putDouble("minutes", timeInForeground / 1000.0 / 60.0);
                    appsArray.pushMap(appMap);
                }
            }
        }

        WritableMap result = Arguments.createMap();
        result.putDouble("totalMinutes", totalTime / 1000.0 / 60.0);
        result.putArray("apps", appsArray);

        promise.resolve(result);
    }
}
