import { useState, useEffect } from 'react';
import { Keyboard, Platform } from 'react-native';

/**
 * Hook that dynamically computes extra bottom padding for ScrollViews
 * when the software keyboard opens, allowing content to smoothly scroll above the keyboard.
 */
export function useKeyboardBottomPadding(basePadding = 32): number {
  const [bottomPadding, setBottomPadding] = useState(basePadding);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        // On Android with windowSoftInputMode="adjustResize", the window is already resized.
        // Adding the full keyboard height creates an enormous artificial whitespace and pushes inputs off screen.
        const extra = Platform.OS === 'ios' ? e.endCoordinates.height : 24;
        setBottomPadding(basePadding + extra);
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setBottomPadding(basePadding);
      }
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [basePadding]);

  return bottomPadding;
}
