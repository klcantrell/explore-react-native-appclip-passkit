#import <Foundation/Foundation.h>

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(RNWalletManager, NSObject)

RCT_EXTERN_METHOD(downloadWalletPassFromUrl:(NSString *)url resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(hasPass:(NSString *)url serialNumber:(NSString *)serialNumber resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(openPass:(NSString *)url serialNumber:(NSString *)serialNumber)

@end
