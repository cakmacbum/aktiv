import WidgetKit
import SwiftUI

// 1. Veri Modeli
struct ScreenTimeEntry: TimelineEntry {
    let date: Date
    let todayMinutes: Int
    let yesterdayMinutes: Int
}

// 2. Timeline Provider (Arka Plan Güncellemesi)
struct Provider: TimelineProvider {
    // App Group üzerinden React Native'den gelen veriyi okuma
    func getSharedData() -> (Int, Int) {
        let sharedDefaults = UserDefaults(suiteName: "group.com.screentimeapp")
        if let jsonString = sharedDefaults?.string(forKey: "widgetData"),
           let data = jsonString.data(using: .utf8),
           let dict = try? JSONSerialization.jsonObject(with: data, options: []) as? [String: Any] {
            let today = dict["todayMinutes"] as? Int ?? 0
            let yesterday = dict["yesterdayMinutes"] as? Int ?? 0
            return (today, yesterday)
        }
        return (0, 0)
    }

    func placeholder(in context: Context) -> ScreenTimeEntry {
        ScreenTimeEntry(date: Date(), todayMinutes: 125, yesterdayMinutes: 150)
    }

    func getSnapshot(in context: Context, completion: @escaping (ScreenTimeEntry) -> ()) {
        let (today, yesterday) = getSharedData()
        let entry = ScreenTimeEntry(date: Date(), todayMinutes: today, yesterdayMinutes: yesterday)
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        let (today, yesterday) = getSharedData()
        let entry = ScreenTimeEntry(date: Date(), todayMinutes: today, yesterdayMinutes: yesterday)
        
        // Her 30 dakikada bir güncelleme planla (Background Sync)
        let nextUpdateDate = Calendar.current.date(byAdding: .minute, value: 30, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdateDate))
        completion(timeline)
    }
}

// 3. Widget UI Tasarımı (SwiftUI)
struct ScreenTimeWidgetEntryView : View {
    var entry: Provider.Entry

    var comparison: (percentage: Int, isLess: Bool, text: String) {
        if entry.yesterdayMinutes == 0 { return (0, false, "Dün veri yok") }
        let diff = entry.todayMinutes - entry.yesterdayMinutes
        let pct = Int(abs((Double(diff) / Double(entry.yesterdayMinutes)) * 100))
        let isLess = diff < 0
        let text = isLess ? "Düne göre %\(pct) daha az" : "Düne göre %\(pct) daha fazla"
        return (pct, isLess, text)
    }

    var body: some View {
        let hours = entry.todayMinutes / 60
        let minutes = entry.todayMinutes % 60

        VStack(alignment: .center, spacing: 8) {
            Text("Ekran Süresi")
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(Color(white: 0.4))
                .textCase(.uppercase)

            // Bugünkü Toplam Süre
            HStack(alignment: .firstTextBaseline, spacing: 2) {
                Text("\(hours)")
                    .font(.system(size: 42, weight: .light))
                    .foregroundColor(.black)
                Text("sa")
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(Color(white: 0.6))
                Text("\(minutes)")
                    .font(.system(size: 42, weight: .light))
                    .foregroundColor(.black)
                    .padding(.leading, 4)
                Text("dk")
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(Color(white: 0.6))
            }

            // Kıyaslama Metni ve Ok İkonu
            if entry.yesterdayMinutes > 0 {
                HStack(spacing: 4) {
                    Image(systemName: comparison.isLess ? "arrow.down.right" : "arrow.up.right")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(comparison.isLess ? Color(red: 0.06, green: 0.72, blue: 0.5) : .red) // Soft Yeşil veya Kırmızı
                    
                    Text(comparison.text)
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(comparison.isLess ? Color(red: 0.06, green: 0.72, blue: 0.5) : .red)
                }
                .padding(.top, 4)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.white)
    }
}

@main
struct ScreenTimeWidget: Widget {
    let kind: String = "ScreenTimeWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            ScreenTimeWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Ekran Süresi")
        .description("Günlük ekran sürenizi ve dünkü kıyaslamayı gösterir.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
