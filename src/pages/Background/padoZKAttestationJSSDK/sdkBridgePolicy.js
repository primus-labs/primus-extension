/** Re-export shared SDK bridge policy for background handlers. */
export {
  CLIENT_TYPE_ZKTLS,
  CLIENT_TYPE_NETWORK,
  ALLOWED_CLIENT_TYPES,
  SDK_INBOUND_MESSAGE_NAMES,
  isAllowedSdkInboundMessageName,
  isPlainPayloadObject,
  isAllowedClientType,
  isNetworkClientType,
  validateOwnerSession,
  validateInitBeforeStart,
  validateAllowedClientType,
  validateClientTypeMatchesSession,
} from '@/shared/sdkBridgePolicy.js';