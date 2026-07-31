using Qaflaty.Domain.Common.Errors;

namespace Qaflaty.Domain.Ads.Errors;

public static class AdsErrors
{
    public static readonly Error ProviderNotFound = new("Ads.ProviderNotFound", "This provider is not connected for the store");
    public static readonly Error ProviderAlreadyConnected = new("Ads.ProviderAlreadyConnected", "This provider is already connected for the store");
    public static readonly Error CredentialsRequired = new("Ads.CredentialsRequired", "Provider credentials are required");
    public static readonly Error VerificationFailed = new("Ads.VerificationFailed", "Could not verify the connection with the provider");
    public static readonly Error NotVerified = new("Ads.NotVerified", "Connect and verify this provider before sending events");
    public static readonly Error TrackingEventNotFound = new("Ads.TrackingEventNotFound", "Tracking event not found");
    public static readonly Error DispatchLogNotFound = new("Ads.DispatchLogNotFound", "Dispatch log not found");
    public static readonly Error Forbidden = new("Ads.Forbidden", "You don't have access to this store's ad tracking settings");
    public static readonly Error StoreNotFound = new("Ads.StoreNotFound", "Store not found");
}
