/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

const primary = '#303841';
const accent = '#76ABAE';
const background = '#F5F5F5';
const card = '#FFFFFF';
const border = '#E6E6E6';
const cta = '#FF5722';

export const Colors = {
  light: {
    text: primary,
    background,
    card,
    border,

    tint: accent,
    accent,
    cta,

    icon: '#606870',

    tabIconDefault: '#9CA3AF',
    tabIconSelected: accent,
  },
  dark: {
    text: '#F5F5F5',

    background: '#222831',

    card: '#303841',

    border: '#44515A',

    tint: accent,
    accent,
    cta,

    icon: '#B8C1C8',

    tabIconDefault: '#8D99A4',
    tabIconSelected: accent,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
