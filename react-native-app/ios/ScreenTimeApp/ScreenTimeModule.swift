import Foundation
import FamilyControls
import ManagedSettings
import DeviceActivity

@objc(ScreenTimeModule)
class ScreenTimeModule: NSObject {
    
    // İzin İsteme (Family Controls Authorization)
    @objc
    func requestAuthorization(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        if #available(iOS 15.0, *) {
            let center = AuthorizationCenter.shared
            Task {
                do {
                    try await center.requestAuthorization(for: .individual)
                    resolve(true)
                } catch {
                    reject("AUTH_ERROR", "Screen Time yetkilendirmesi başarısız oldu.", error)
                }
            }
        } else {
            reject("UNSUPPORTED_OS", "Screen Time API iOS 15.0 ve üzeri gerektirir.", nil)
        }
    }
    
    // Günlük Kullanım Verisi (Mock / Açıklama)
    @objc
    func getDailyUsage(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        /*
         ÖNEMLİ NOT (iOS Kısıtlaması):
         Apple'ın gizlilik politikaları gereği, iOS Screen Time API (FamilyControls) 
         uygulamalara "hangi uygulamanın kaç dakika kullanıldığı" gibi ham (raw) verileri doğrudan vermez.
         
         Bunun yerine:
         1. DeviceActivityMonitor ile arka planda limitler koyabilir/takip edebilirsiniz.
         2. DeviceActivityReport extension'ı oluşturarak, Apple'ın sağladığı güvenli bir View (UI) 
            içerisinde bu verileri kullanıcıya gösterebilirsiniz. Ancak bu veriyi React Native 
            tarafına (JavaScript'e) JSON olarak çekemezsiniz.
            
         Bu nedenle bu fonksiyon iOS tarafında şimdilik boş bir yapı ve açıklama dönmektedir.
         Gerçek iOS implementasyonunda bir 'DeviceActivityReport' extension'ı yazılmalıdır.
         */
        
        let result: [String: Any] = [
            "totalMinutes": 0,
            "apps": [],
            "note": "iOS Kısıtlaması: Apple, gizlilik gereği ham kullanım verilerini (hangi uygulama kaç dakika kullanıldı) doğrudan JavaScript'e aktarmaya izin vermez. Bu verileri göstermek için iOS tarafında 'DeviceActivityReport' extension'ı yazılmalı ve Native UI olarak React Native içine gömülmelidir."
        ]
        
        resolve(result)
    }
    
    @objc
    static func requiresMainQueueSetup() -> Bool {
        return false
    }
}
