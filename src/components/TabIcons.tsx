import React from 'react';
import { ColorValue } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type IconName =
  | 'home'
  | 'list'
  | 'store'
  | 'settings'
  | 'plus'
  | 'chevron-left'
  | 'chevron-right';

type Props = { name: IconName; color: ColorValue; size?: number };

/** Minimal line icons, drawn so no icon font needs to be installed. */
export function TabIcon({ name, color, size = 24 }: Props) {
  const common = {
    stroke: color,
    strokeWidth: 1.9,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'home' && (
        <>
          <Path d="M3.5 11 12 4l8.5 7" {...common} />
          <Path d="M5.5 9.8V19a1 1 0 0 0 1 1H10v-5h4v5h3.5a1 1 0 0 0 1-1V9.8" {...common} />
        </>
      )}
      {name === 'list' && (
        <>
          <Rect x="4" y="3.5" width="16" height="17" rx="3" {...common} />
          <Path d="M8 9h8M8 13h8M8 17h4.5" {...common} />
        </>
      )}
      {name === 'store' && (
        <>
          <Path d="M4 9.5 5.5 4h13L20 9.5" {...common} />
          <Path d="M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0" {...common} />
          <Path d="M5.5 12.5V20h13v-7.5" {...common} />
          <Path d="M10 20v-4.5h4V20" {...common} />
        </>
      )}
      {name === 'settings' && (
        <>
          <Circle cx="12" cy="12" r="3" {...common} />
          <Path
            d="M12 3.5v2.2M12 18.3v2.2M20.5 12h-2.2M5.7 12H3.5M18 6l-1.6 1.6M7.6 16.4 6 18M18 18l-1.6-1.6M7.6 7.6 6 6"
            {...common}
          />
        </>
      )}
      {name === 'plus' && <Path d="M12 5v14M5 12h14" {...common} strokeWidth={2.4} />}
      {name === 'chevron-left' && <Path d="M14.5 6 8.5 12l6 6" {...common} strokeWidth={2.4} />}
      {name === 'chevron-right' && <Path d="m9.5 6 6 6-6 6" {...common} strokeWidth={2.4} />}
    </Svg>
  );
}
