import { useEffect, useState } from 'react';
import {
  type DimensionValue,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
  View,
} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useThemeColor } from '@/constants/colors';
import { Tokens } from '@/constants/tokens';

export interface SkeletonLoaderProps {
  width?: DimensionValue;
  height: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

export function SkeletonLoader({
  width = '100%',
  height,
  radius = Tokens.radius.md,
  style,
}: SkeletonLoaderProps) {
  const colors = useThemeColor();
  const [containerWidth, setContainerWidth] = useState(200);
  const shimmerProgress = useSharedValue(0);

  useEffect(() => {
    shimmerProgress.value = withRepeat(
      withTiming(1, { duration: 1300 }),
      -1,
      false
    );
  }, [shimmerProgress]);

  const animatedShimmerStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmerProgress.value,
      [0, 1],
      [-containerWidth, containerWidth]
    );

    return {
      transform: [{ translateX }],
    };
  });

  return (
    <View
      onLayout={(e) => {
        const measuredWidth = e.nativeEvent.layout.width;
        if (measuredWidth > 0) {
          setContainerWidth(measuredWidth);
        }
      }}
      style={[
        styles.base,
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: colors.surfaceAlt,
        },
        style,
      ]}>
      <Animated.View
        style={[
          styles.shimmerBar,
          {
            backgroundColor: colors.glassBorder,
          },
          animatedShimmerStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
    position: 'relative',
  },
  shimmerBar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '60%',
    opacity: 0.6,
  },
});
