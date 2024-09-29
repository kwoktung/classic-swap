const nativeAddress = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

export function isNativeToken(address?: string): boolean {
  return address?.toLowerCase() === nativeAddress;
}
