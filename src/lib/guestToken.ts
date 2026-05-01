/**
 * Get the guest token for a specific order from localStorage.
 */
export const getGuestToken = (orderId: string): string | null => {
  try {
    return localStorage.getItem(`guest_token_${orderId}`);
  } catch {
    return null;
  }
};
