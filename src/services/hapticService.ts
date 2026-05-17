/**
 * Haptic feedback service — centralizes all haptic calls.
 * Uses expo-haptics with Platform.OS guard so web doesn't crash.
 */

import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

const canHaptic = Platform.OS !== 'web';

export const haptic = {
  /** Light tap — button press, tab switch */
  light: () => {
    if (canHaptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },

  /** Medium tap — toggle, card selection */
  medium: () => {
    if (canHaptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },

  /** Heavy tap — SOS initiation, critical action */
  heavy: () => {
    if (canHaptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  },

  /** Success feedback — OTP verified, journey ended */
  success: () => {
    if (canHaptic)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },

  /** Warning feedback — SOS countdown started */
  warning: () => {
    if (canHaptic)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  },

  /** Error feedback — failed action */
  error: () => {
    if (canHaptic)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },

  /** Selection tick — picker/scroll selection */
  selection: () => {
    if (canHaptic) Haptics.selectionAsync();
  },
};
