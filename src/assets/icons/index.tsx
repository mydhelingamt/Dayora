import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';

export interface IconProps {
  size?: number;
  color?: string;
  focused?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Pure React Native vector-like glyph primitives for zero-dependency,
 * high-performance icon rendering on low-end Android devices.
 */

export const HomeIcon: React.FC<IconProps> = ({ size = 24, color = '#6B7280' }) => {
  const s = size / 24;
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View
        style={[
          styles.roof,
          {
            borderLeftWidth: 10 * s,
            borderRightWidth: 10 * s,
            borderBottomWidth: 8 * s,
            borderBottomColor: color,
          },
        ]}
      />
      <View
        style={[
          styles.houseBody,
          {
            width: 16 * s,
            height: 10 * s,
            backgroundColor: color,
            borderBottomLeftRadius: 2 * s,
            borderBottomRightRadius: 2 * s,
            marginTop: -0.5 * s,
          },
        ]}
      >
        <View
          style={[
            styles.door,
            {
              width: 5 * s,
              height: 6 * s,
              borderTopLeftRadius: 2 * s,
              borderTopRightRadius: 2 * s,
            },
          ]}
        />
      </View>
    </View>
  );
};

export const BirthdayIcon: React.FC<IconProps> = ({ size = 24, color = '#6B7280' }) => {
  const s = size / 24;
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View
        style={[
          styles.flame,
          {
            width: 3 * s,
            height: 4 * s,
            borderRadius: 2 * s,
            marginBottom: 1 * s,
          },
        ]}
      />
      <View
        style={[
          styles.cakeTier,
          {
            width: 12 * s,
            height: 5 * s,
            backgroundColor: color,
            borderRadius: 2 * s,
            marginBottom: 1.5 * s,
          },
        ]}
      />
      <View
        style={[
          styles.cakeTier,
          {
            width: 18 * s,
            height: 7 * s,
            backgroundColor: color,
            borderRadius: 2 * s,
          },
        ]}
      />
    </View>
  );
};

export const TasksIcon: React.FC<IconProps> = ({ size = 24, color = '#6B7280' }) => {
  const s = size / 24;
  return (
    <View style={[styles.container, styles.centerContent, { width: size, height: size }]}>
      <View style={[styles.taskRow, { marginBottom: 3 * s }]}>
        <View style={[styles.taskDot, { width: 4 * s, height: 4 * s, borderRadius: 2 * s, backgroundColor: color }]} />
        <View style={[styles.taskLine, { width: 12 * s, height: 2.5 * s, borderRadius: 1.5 * s, backgroundColor: color }]} />
      </View>
      <View style={[styles.taskRow, { marginBottom: 3 * s }]}>
        <View style={[styles.taskDot, { width: 4 * s, height: 4 * s, borderRadius: 2 * s, backgroundColor: color }]} />
        <View style={[styles.taskLine, { width: 10 * s, height: 2.5 * s, borderRadius: 1.5 * s, backgroundColor: color }]} />
      </View>
      <View style={styles.taskRow}>
        <View style={[styles.taskDot, { width: 4 * s, height: 4 * s, borderRadius: 2 * s, backgroundColor: color }]} />
        <View style={[styles.taskLine, { width: 14 * s, height: 2.5 * s, borderRadius: 1.5 * s, backgroundColor: color }]} />
      </View>
    </View>
  );
};

export const ProfileIcon: React.FC<IconProps> = ({ size = 24, color = '#6B7280' }) => {
  const s = size / 24;
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View
        style={[
          styles.profileHead,
          {
            width: 8 * s,
            height: 8 * s,
            borderRadius: 4 * s,
            backgroundColor: color,
            marginBottom: 2 * s,
          },
        ]}
      />
      <View
        style={[
          styles.profileBody,
          {
            width: 16 * s,
            height: 7 * s,
            borderTopLeftRadius: 8 * s,
            borderTopRightRadius: 8 * s,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
};

export const SearchIcon: React.FC<IconProps> = ({ size = 20, color = '#94A3B8' }) => {
  const s = size / 20;
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View
        style={{
          width: 11 * s,
          height: 11 * s,
          borderRadius: 6 * s,
          borderWidth: 2 * s,
          borderColor: color,
          marginRight: 3 * s,
          marginBottom: 3 * s,
        }}
      />
      <View
        style={[
          styles.absolute,
          {
            bottom: 3 * s,
            right: 3 * s,
            width: 5 * s,
            height: 2 * s,
            backgroundColor: color,
            borderRadius: 1 * s,
            transform: [{ rotate: '45deg' }],
          },
        ]}
      />
    </View>
  );
};

export const PlusIcon: React.FC<IconProps> = ({ size = 20, color = '#FFFFFF' }) => {
  const s = size / 20;
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={{ width: 12 * s, height: 2.5 * s, backgroundColor: color, borderRadius: 1.5 * s }} />
      <View
        style={[
          styles.absolute,
          {
            width: 2.5 * s,
            height: 12 * s,
            backgroundColor: color,
            borderRadius: 1.5 * s,
          },
        ]}
      />
    </View>
  );
};

export const CheckIcon: React.FC<IconProps> = ({ size = 16, color = '#10B981' }) => {
  const s = size / 16;
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View
        style={{
          width: 4 * s,
          height: 8 * s,
          borderColor: color,
          borderBottomWidth: 2 * s,
          borderRightWidth: 2 * s,
          transform: [{ rotate: '45deg' }],
          marginBottom: 2 * s,
        }}
      />
    </View>
  );
};

export const HeartIcon: React.FC<IconProps & { filled?: boolean }> = ({
  size = 20,
  color = '#F43F5E',
  filled = true,
}) => {
  const s = size / 20;
  const bg = filled ? color : 'transparent';
  const borderWidth = filled ? 0 : 1.5 * s;
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={styles.row}>
        <View
          style={{
            width: 7 * s,
            height: 10 * s,
            backgroundColor: bg,
            borderColor: color,
            borderWidth,
            borderTopLeftRadius: 3.5 * s,
            borderTopRightRadius: 3.5 * s,
            transform: [{ rotate: '-45deg' }],
            marginRight: -1.5 * s,
          }}
        />
        <View
          style={{
            width: 7 * s,
            height: 10 * s,
            backgroundColor: bg,
            borderColor: color,
            borderWidth,
            borderTopLeftRadius: 3.5 * s,
            borderTopRightRadius: 3.5 * s,
            transform: [{ rotate: '45deg' }],
            marginLeft: -1.5 * s,
          }}
        />
      </View>
    </View>
  );
};

export const CalendarIcon: React.FC<IconProps> = ({ size = 20, color = '#6366F1' }) => {
  const s = size / 20;
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Rings */}
      <View style={[styles.calendarRingsRow, { width: 14 * s, marginBottom: -1 * s }]}>
        <View style={{ width: 2 * s, height: 3 * s, backgroundColor: color, borderRadius: 1 * s }} />
        <View style={{ width: 2 * s, height: 3 * s, backgroundColor: color, borderRadius: 1 * s }} />
      </View>
      {/* Body */}
      <View
        style={[
          styles.overflowHidden,
          {
            width: 15 * s,
            height: 13 * s,
            borderWidth: 1.5 * s,
            borderColor: color,
            borderRadius: 3 * s,
          },
        ]}
      >
        <View style={[styles.fullWidth, { height: 3.5 * s, backgroundColor: color }]} />
      </View>
    </View>
  );
};

export const ChevronRightIcon: React.FC<IconProps> = ({ size = 16, color = '#64748B' }) => {
  const s = size / 16;
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View
        style={{
          width: 6 * s,
          height: 6 * s,
          borderColor: color,
          borderTopWidth: 2 * s,
          borderRightWidth: 2 * s,
          transform: [{ rotate: '45deg' }],
          marginRight: 2 * s,
        }}
      />
    </View>
  );
};

export const StarIcon: React.FC<IconProps & { filled?: boolean }> = ({
  size = 20,
  color = '#F59E0B',
  filled = true,
}) => {
  const s = size / 20;
  const fillStyle = filled ? { backgroundColor: color, borderWidth: 0 } : styles.starOutline;
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View
        style={[
          styles.starGlyph,
          {
            width: 14 * s,
            height: 14 * s,
            borderColor: color,
            borderRadius: 3 * s,
          },
          fillStyle,
        ]}
      />
    </View>
  );
};

export const ChevronLeftIcon: React.FC<IconProps> = ({ size = 16, color = '#64748B' }) => {
  const s = size / 16;
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View
        style={{
          width: 6 * s,
          height: 6 * s,
          borderColor: color,
          borderTopWidth: 2 * s,
          borderLeftWidth: 2 * s,
          transform: [{ rotate: '-45deg' }],
          marginLeft: 2 * s,
        }}
      />
    </View>
  );
};

export const EditIcon: React.FC<IconProps> = ({ size = 18, color = '#94A3B8' }) => {
  const s = size / 18;
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View
        style={{
          width: 9 * s,
          height: 4 * s,
          borderColor: color,
          borderWidth: 1.5 * s,
          borderRadius: 1 * s,
          transform: [{ rotate: '-45deg' }],
        }}
      />
    </View>
  );
};

export const TrashIcon: React.FC<IconProps> = ({ size = 18, color = '#EF4444' }) => {
  const s = size / 18;
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={{ width: 10 * s, height: 2 * s, backgroundColor: color, borderRadius: 1 * s, marginBottom: 1 * s }} />
      <View
        style={{
          width: 8 * s,
          height: 8 * s,
          borderWidth: 1.5 * s,
          borderColor: color,
          borderBottomLeftRadius: 2 * s,
          borderBottomRightRadius: 2 * s,
        }}
      />
    </View>
  );
};

export const KeyboardIcon: React.FC<IconProps> = ({ size = 20, color = '#C4C0D0' }) => {
  const s = size / 20;
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View
        style={{
          width: 18 * s,
          height: 12 * s,
          borderRadius: 3 * s,
          borderWidth: 1.5 * s,
          borderColor: color,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 1.5 * s,
        }}
      >
        <View style={{ flexDirection: 'row', gap: 1.5 * s, marginBottom: 1.5 * s }}>
          <View style={{ width: 1.5 * s, height: 1.5 * s, borderRadius: 0.5 * s, backgroundColor: color }} />
          <View style={{ width: 1.5 * s, height: 1.5 * s, borderRadius: 0.5 * s, backgroundColor: color }} />
          <View style={{ width: 1.5 * s, height: 1.5 * s, borderRadius: 0.5 * s, backgroundColor: color }} />
          <View style={{ width: 1.5 * s, height: 1.5 * s, borderRadius: 0.5 * s, backgroundColor: color }} />
        </View>
        <View style={{ width: 9 * s, height: 1 * s, borderRadius: 0.5 * s, backgroundColor: color }} />
      </View>
    </View>
  );
};

export const CloseIcon: React.FC<IconProps> = ({ size = 16, color = '#94A3B8' }) => {
  const s = size / 16;
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View
        style={[
          styles.closeBar,
          {
            width: 10 * s,
            height: 2 * s,
            backgroundColor: color,
            borderRadius: 1 * s,
          },
        ]}
      />
      <View
        style={[
          styles.absolute,
          styles.closeBarCross,
          {
            width: 10 * s,
            height: 2 * s,
            backgroundColor: color,
            borderRadius: 1 * s,
          },
        ]}
      />
    </View>
  );
};

export const ClockIcon: React.FC<IconProps> = ({ size = 16, color = '#94A3B8' }) => {
  const s = size / 16;
  return (
    <View
      style={[
        styles.container,
        styles.circleBorder,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: color,
          borderWidth: 1.5 * s,
        },
      ]}
    >
      {/* Hour hand */}
      <View
        style={[
          styles.clockHourHand,
          {
            width: 1.5 * s,
            height: 4 * s,
            backgroundColor: color,
            top: 3 * s,
          },
        ]}
      />
      {/* Minute hand */}
      <View
        style={[
          styles.clockMinuteHand,
          {
            width: 3.5 * s,
            height: 1.5 * s,
            backgroundColor: color,
            left: 7 * s,
            top: 6.5 * s,
          },
        ]}
      />
    </View>
  );
};

export const RepeatIcon: React.FC<IconProps> = ({ size = 16, color = '#94A3B8' }) => {
  const s = size / 16;
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Top loop */}
      <View
        style={[
          styles.repeatTopLoop,
          {
            width: 10 * s,
            height: 4 * s,
            borderColor: color,
            borderTopWidth: 1.5 * s,
            borderRightWidth: 1.5 * s,
            borderTopRightRadius: 3 * s,
          },
        ]}
      />
      {/* Bottom loop */}
      <View
        style={[
          styles.repeatBottomLoop,
          {
            width: 10 * s,
            height: 4 * s,
            borderColor: color,
            borderBottomWidth: 1.5 * s,
            borderLeftWidth: 1.5 * s,
            borderBottomLeftRadius: 3 * s,
          },
        ]}
      />
      {/* Top arrow */}
      <View
        style={[
          styles.repeatTopArrow,
          {
            borderLeftColor: color,
            borderTopWidth: 2 * s,
            borderBottomWidth: 2 * s,
            borderLeftWidth: 3 * s,
            top: 2 * s,
            right: 1 * s,
          },
        ]}
      />
      {/* Bottom arrow */}
      <View
        style={[
          styles.repeatBottomArrow,
          {
            borderRightColor: color,
            borderTopWidth: 2 * s,
            borderBottomWidth: 2 * s,
            borderRightWidth: 3 * s,
            bottom: 2 * s,
            left: 1 * s,
          },
        ]}
      />
    </View>
  );
};

export const PinIcon: React.FC<IconProps> = ({ size = 16, color = '#94A3B8' }) => {
  const s = size / 16;
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View
        style={[
          styles.pinHead,
          {
            width: 8 * s,
            height: 8 * s,
            borderRadius: 4 * s,
            borderColor: color,
            borderWidth: 1.5 * s,
          },
        ]}
      >
        <View
          style={[
            styles.pinDot,
            {
              width: 2.5 * s,
              height: 2.5 * s,
              borderRadius: 1.5 * s,
              backgroundColor: color,
            },
          ]}
        />
      </View>
      <View
        style={[
          styles.pinPoint,
          {
            borderTopColor: color,
            borderLeftWidth: 2.5 * s,
            borderRightWidth: 2.5 * s,
            borderTopWidth: 4 * s,
            marginTop: -1 * s,
          },
        ]}
      />
    </View>
  );
};

export const TagIcon: React.FC<IconProps> = ({ size = 16, color = '#94A3B8' }) => {
  const s = size / 16;
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View
        style={[
          styles.tagBody,
          {
            width: 10 * s,
            height: 7 * s,
            borderColor: color,
            borderWidth: 1.5 * s,
            borderRadius: 1.5 * s,
          },
        ]}
      >
        <View
          style={[
            styles.tagHole,
            {
              width: 2 * s,
              height: 2 * s,
              borderRadius: 1 * s,
              backgroundColor: color,
            },
          ]}
        />
      </View>
    </View>
  );
};

export const AlertCircleIcon: React.FC<IconProps> = ({ size = 16, color = '#EF4444' }) => {
  const s = size / 16;
  return (
    <View
      style={[
        styles.container,
        styles.circleBorder,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: color,
          borderWidth: 1.5 * s,
        },
      ]}
    >
      <View
        style={[
          styles.alertBar,
          {
            width: 1.5 * s,
            height: 5 * s,
            backgroundColor: color,
            borderRadius: 0.75 * s,
            marginBottom: 1.5 * s,
          },
        ]}
      />
      <View
        style={[
          styles.alertDot,
          {
            width: 1.5 * s,
            height: 1.5 * s,
            backgroundColor: color,
            borderRadius: 0.75 * s,
          },
        ]}
      />
    </View>
  );
};

export const CameraIcon: React.FC<IconProps> = ({ size = 18, color = '#94A3B8' }) => {
  const s = size / 18;
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Top flash bump */}
      <View
        style={[
          styles.cameraBump,
          {
            width: 5 * s,
            height: 2 * s,
            backgroundColor: color,
            borderTopLeftRadius: 1 * s,
            borderTopRightRadius: 1 * s,
          },
        ]}
      />
      {/* Camera body */}
      <View
        style={[
          styles.cameraBody,
          {
            width: 14 * s,
            height: 10 * s,
            borderColor: color,
            borderWidth: 1.5 * s,
            borderRadius: 2 * s,
          },
        ]}
      >
        {/* Center lens */}
        <View
          style={[
            styles.cameraLens,
            {
              width: 5 * s,
              height: 5 * s,
              borderRadius: 2.5 * s,
              borderColor: color,
              borderWidth: 1.5 * s,
            },
          ]}
        />
      </View>
    </View>
  );
};

export const MusicIcon: React.FC<IconProps> = ({ size = 20, color = '#FFFFFF' }) => {
  const s = size / 20;
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={[styles.musicStem, { width: 2 * s, height: 11 * s, backgroundColor: color, left: 11 * s, top: 3 * s }]} />
      <View style={[styles.musicFlag, { width: 6 * s, height: 3.5 * s, backgroundColor: color, borderTopRightRadius: 3 * s, left: 11 * s, top: 3 * s }]} />
      <View style={[styles.musicHead, { width: 6 * s, height: 5 * s, borderRadius: 2.5 * s, backgroundColor: color, left: 7 * s, top: 11 * s, transform: [{ rotate: '-25deg' }] }]} />
    </View>
  );
};

export const MusicOffIcon: React.FC<IconProps> = ({ size = 20, color = '#94A3B8' }) => {
  const s = size / 20;
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={[styles.musicStem, styles.dimmed, { width: 2 * s, height: 11 * s, backgroundColor: color, left: 11 * s, top: 3 * s }]} />
      <View style={[styles.musicHead, styles.dimmed, { width: 6 * s, height: 5 * s, borderRadius: 2.5 * s, backgroundColor: color, left: 7 * s, top: 11 * s, transform: [{ rotate: '-25deg' }] }]} />
      <View style={[styles.musicSlash, { width: 2 * s, height: 18 * s, backgroundColor: color, transform: [{ rotate: '45deg' }] }]} />
    </View>
  );
};

export const SaveDiskIcon: React.FC<IconProps> = ({ size = 20, color = '#FFFFFF' }) => {
  const s = size / 20;
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View
        style={{
          width: 15 * s,
          height: 15 * s,
          borderWidth: 1.5 * s,
          borderColor: color,
          borderRadius: 2.5 * s,
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 1.5 * s,
          paddingBottom: 1.5 * s,
        }}
      >
        <View
          style={{
            width: 7 * s,
            height: 4 * s,
            backgroundColor: color,
            borderBottomLeftRadius: 1 * s,
            borderBottomRightRadius: 1 * s,
          }}
        />
        <View
          style={{
            width: 9 * s,
            height: 4.5 * s,
            borderWidth: 1.2 * s,
            borderColor: color,
            borderRadius: 1 * s,
          }}
        />
      </View>
    </View>
  );
};

export const ChevronDownIcon: React.FC<IconProps> = ({ size = 16, color = '#94A3B8' }) => {
  const s = size / 16;
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View
        style={{
          width: 6 * s,
          height: 6 * s,
          borderColor: color,
          borderBottomWidth: 2 * s,
          borderRightWidth: 2 * s,
          transform: [{ rotate: '45deg' }],
          marginTop: -2 * s,
        }}
      />
    </View>
  );
};

export const UserIcon: React.FC<IconProps> = ({ size = 18, color = '#94A3B8' }) => {
  const s = size / 18;
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View
        style={{
          width: 7 * s,
          height: 7 * s,
          borderRadius: 3.5 * s,
          borderWidth: 1.5 * s,
          borderColor: color,
          marginBottom: 1.5 * s,
        }}
      />
      <View
        style={{
          width: 13 * s,
          height: 6 * s,
          borderTopLeftRadius: 6 * s,
          borderTopRightRadius: 6 * s,
          borderWidth: 1.5 * s,
          borderBottomWidth: 0,
          borderColor: color,
        }}
      />
    </View>
  );
};

export const PeopleGroupIcon: React.FC<IconProps> = ({ size = 18, color = '#94A3B8' }) => {
  const s = size / 18;
  return (
    <View style={[styles.container, { width: size, height: size, flexDirection: 'row', justifyContent: 'center' }]}>
      <View style={{ alignItems: 'center', marginRight: -2 * s }}>
        <View style={{ width: 5 * s, height: 5 * s, borderRadius: 2.5 * s, borderWidth: 1.2 * s, borderColor: color }} />
        <View style={{ width: 9 * s, height: 4 * s, borderTopLeftRadius: 4 * s, borderTopRightRadius: 4 * s, borderWidth: 1.2 * s, borderBottomWidth: 0, borderColor: color, marginTop: 1 * s }} />
      </View>
      <View style={{ alignItems: 'center', marginLeft: -2 * s }}>
        <View style={{ width: 5 * s, height: 5 * s, borderRadius: 2.5 * s, borderWidth: 1.2 * s, borderColor: color }} />
        <View style={{ width: 9 * s, height: 4 * s, borderTopLeftRadius: 4 * s, borderTopRightRadius: 4 * s, borderWidth: 1.2 * s, borderBottomWidth: 0, borderColor: color, marginTop: 1 * s }} />
      </View>
    </View>
  );
};

export const HashIcon: React.FC<IconProps> = ({ size = 18, color = '#94A3B8' }) => {
  const s = size / 18;
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={{ position: 'absolute', top: 5 * s, width: 13 * s, height: 1.6 * s, backgroundColor: color, borderRadius: 0.8 * s }} />
      <View style={{ position: 'absolute', top: 11 * s, width: 13 * s, height: 1.6 * s, backgroundColor: color, borderRadius: 0.8 * s }} />
      <View style={{ position: 'absolute', left: 5 * s, width: 1.6 * s, height: 14 * s, backgroundColor: color, borderRadius: 0.8 * s, transform: [{ rotate: '12deg' }] }} />
      <View style={{ position: 'absolute', right: 5 * s, width: 1.6 * s, height: 14 * s, backgroundColor: color, borderRadius: 0.8 * s, transform: [{ rotate: '12deg' }] }} />
    </View>
  );
};

export const DocumentCheckIcon: React.FC<IconProps> = ({ size = 18, color = '#94A3B8' }) => {
  const s = size / 18;
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View
        style={{
          width: 12 * s,
          height: 15 * s,
          borderWidth: 1.5 * s,
          borderColor: color,
          borderRadius: 2 * s,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: 3 * s,
            height: 6 * s,
            borderColor: color,
            borderBottomWidth: 1.5 * s,
            borderRightWidth: 1.5 * s,
            transform: [{ rotate: '45deg' }],
            marginBottom: 2 * s,
          }}
        />
      </View>
    </View>
  );
};

export const TextLinesIcon: React.FC<IconProps> = ({ size = 18, color = '#94A3B8' }) => {
  const s = size / 18;
  return (
    <View style={[styles.container, { width: size, height: size, justifyContent: 'center', gap: 2.5 * s }]}>
      <View style={{ width: 14 * s, height: 1.8 * s, backgroundColor: color, borderRadius: 1 * s }} />
      <View style={{ width: 10 * s, height: 1.8 * s, backgroundColor: color, borderRadius: 1 * s, alignSelf: 'flex-start', marginLeft: 2 * s }} />
      <View style={{ width: 13 * s, height: 1.8 * s, backgroundColor: color, borderRadius: 1 * s }} />
    </View>
  );
};

export const CategoryShapesIcon: React.FC<IconProps> = ({ size = 18, color = '#94A3B8' }) => {
  const s = size / 18;
  return (
    <View style={[styles.container, { width: size, height: size, justifyContent: 'center', alignItems: 'center' }]}>
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: 3.5 * s,
          borderRightWidth: 3.5 * s,
          borderBottomWidth: 6 * s,
          borderStyle: 'solid',
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: color,
          marginBottom: 2 * s,
        }}
      />
      <View style={{ flexDirection: 'row', gap: 3 * s }}>
        <View style={{ width: 5 * s, height: 5 * s, borderRadius: 2.5 * s, borderWidth: 1.2 * s, borderColor: color }} />
        <View style={{ width: 5 * s, height: 5 * s, borderRadius: 1 * s, borderWidth: 1.2 * s, borderColor: color }} />
      </View>
    </View>
  );
};

export const BellIcon: React.FC<IconProps> = ({ size = 18, color = '#94A3B8' }) => {
  const s = size / 18;
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View
        style={{
          width: 10 * s,
          height: 9 * s,
          borderTopLeftRadius: 5 * s,
          borderTopRightRadius: 5 * s,
          borderWidth: 1.5 * s,
          borderBottomWidth: 0,
          borderColor: color,
        }}
      />
      <View style={{ width: 14 * s, height: 1.5 * s, backgroundColor: color, borderRadius: 0.75 * s }} />
      <View style={{ width: 3 * s, height: 2 * s, borderBottomLeftRadius: 1.5 * s, borderBottomRightRadius: 1.5 * s, backgroundColor: color, marginTop: 1 * s }} />
    </View>
  );
};

export const ExportIcon: React.FC<IconProps> = ({ size = 20, color = '#FFFFFF' }) => {
  const s = size / 20;
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Box Tray */}
      <View
        style={{
          width: 14 * s,
          height: 6 * s,
          borderColor: color,
          borderBottomWidth: 1.5 * s,
          borderLeftWidth: 1.5 * s,
          borderRightWidth: 1.5 * s,
          borderBottomLeftRadius: 2 * s,
          borderBottomRightRadius: 2 * s,
          position: 'absolute',
          bottom: 2 * s,
        }}
      />
      {/* Arrow stem pointing up */}
      <View
        style={{
          width: 1.5 * s,
          height: 9 * s,
          backgroundColor: color,
          position: 'absolute',
          top: 3 * s,
        }}
      />
      {/* Arrow head pointing up */}
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: 3.5 * s,
          borderRightWidth: 3.5 * s,
          borderBottomWidth: 4.5 * s,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: color,
          position: 'absolute',
          top: 1 * s,
        }}
      />
    </View>
  );
};

export const ImportIcon: React.FC<IconProps> = ({ size = 20, color = '#FFFFFF' }) => {
  const s = size / 20;
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Box Tray */}
      <View
        style={{
          width: 14 * s,
          height: 6 * s,
          borderColor: color,
          borderBottomWidth: 1.5 * s,
          borderLeftWidth: 1.5 * s,
          borderRightWidth: 1.5 * s,
          borderBottomLeftRadius: 2 * s,
          borderBottomRightRadius: 2 * s,
          position: 'absolute',
          bottom: 2 * s,
        }}
      />
      {/* Arrow stem pointing down */}
      <View
        style={{
          width: 1.5 * s,
          height: 9 * s,
          backgroundColor: color,
          position: 'absolute',
          top: 1 * s,
        }}
      />
      {/* Arrow head pointing down */}
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: 3.5 * s,
          borderRightWidth: 3.5 * s,
          borderTopWidth: 4.5 * s,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderTopColor: color,
          position: 'absolute',
          top: 7 * s,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  absolute: {
    position: 'absolute',
  },
  row: {
    flexDirection: 'row',
  },
  calendarRingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  overflowHidden: {
    overflow: 'hidden',
  },
  fullWidth: {
    width: '100%',
  },
  centerContent: {
    justifyContent: 'center',
  },
  roof: {
    width: 0,
    height: 0,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  houseBody: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  door: {
    backgroundColor: '#FFFFFF',
  },
  flame: {
    backgroundColor: '#F59E0B',
  },
  cakeTier: {},
  profileHead: {},
  profileBody: {},
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskDot: {
    marginRight: 3,
  },
  taskLine: {},
  starGlyph: {
    transform: [{ rotate: '45deg' }],
  },
  starOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
  },
  closeBar: {
    transform: [{ rotate: '45deg' }],
  },
  closeBarCross: {
    transform: [{ rotate: '-45deg' }],
  },
  circleBorder: {
    backgroundColor: 'transparent',
  },
  clockHourHand: {
    position: 'absolute',
    borderRadius: 1,
  },
  clockMinuteHand: {
    position: 'absolute',
    borderRadius: 1,
  },
  repeatTopLoop: {
    backgroundColor: 'transparent',
  },
  repeatBottomLoop: {
    backgroundColor: 'transparent',
  },
  repeatTopArrow: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  repeatBottomArrow: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  pinHead: {
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinDot: {},
  pinPoint: {
    width: 0,
    height: 0,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  tagBody: {
    backgroundColor: 'transparent',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingLeft: 2,
  },
  tagHole: {},
  alertBar: {},
  alertDot: {},
  cameraBump: {},
  cameraBody: {
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraLens: {
    backgroundColor: 'transparent',
  },
  musicStem: {
    position: 'absolute',
  },
  musicFlag: {
    position: 'absolute',
  },
  musicHead: {
    position: 'absolute',
  },
  musicSlash: {
    position: 'absolute',
    borderRadius: 1,
  },
  dimmed: {
    opacity: 0.4,
  },
});
