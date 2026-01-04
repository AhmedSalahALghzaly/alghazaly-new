/**
 * OrderStatusIndicator - Real-time animated status indicator per customer row
 * Shows the status of the customer's most recent active order
 * Uses react-native-reanimated for pulse and glow effects
 */
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

// Status color mapping based on requirements
const STATUS_CONFIG = {
  'no_active_order': { color: '#3B82F6', pulse: false, label: 'No Active Order' },
  'delivered': { color: '#3B82F6', pulse: false, label: 'Delivered' },
  'pending': { color: '#EF4444', pulse: true, label: 'Order Placed' },
  'confirmed': { color: '#EF4444', pulse: true, label: 'Confirmed' },
  'preparing': { color: '#FBBF24', pulse: true, label: 'Preparing' },
  'shipped': { color: '#10B981', pulse: true, label: 'Shipped' },
  'out_for_delivery': { color: '#3B82F6', pulse: true, label: 'Out for Delivery' },
  'cancelled': { color: '#6B7280', pulse: false, label: 'Cancelled' },
};

export const OrderStatusIndicator = ({
  status = 'no_active_order',
  activeOrderCount = 0,
  size = 28,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);
  const arrowOpacity = useSharedValue(0.3);

  const config = STATUS_CONFIG[status] || STATUS_CONFIG['no_active_order'];
  const shouldPulse = config.pulse;
  const hasMultipleOrders = activeOrderCount > 1;

  // Pulse animation effect
  useEffect(() => {
    if (shouldPulse) {
      // Scale pulse animation
      scale.value = withRepeat(
        withSequence(
          withTiming(1.25, { duration: 700, easing: Easing.out(Easing.ease) }),
          withTiming(1, { duration: 700, easing: Easing.in(Easing.ease) })
        ),
        -1, // infinite
        true // reverse
      );
      
      // Opacity pulse for glow effect
      opacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 700, easing: Easing.out(Easing.ease) }),
          withTiming(0.5, { duration: 700, easing: Easing.in(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      // Reset to static
      cancelAnimation(scale);
      cancelAnimation(opacity);
      scale.value = withTiming(1, { duration: 200 });
      opacity.value = withTiming(0.6, { duration: 200 });
    }

    return () => {
      cancelAnimation(scale);
      cancelAnimation(opacity);
    };
  }, [shouldPulse, scale, opacity]);

  // Arrow animation for multiple orders
  useEffect(() => {
    if (hasMultipleOrders) {
      arrowOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 500 }),
          withTiming(0.3, { duration: 500 })
        ),
        -1,
        true
      );
    } else {
      cancelAnimation(arrowOpacity);
      arrowOpacity.value = 0;
    }

    return () => {
      cancelAnimation(arrowOpacity);
    };
  }, [hasMultipleOrders, arrowOpacity]);

  const animatedIndicatorStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const animatedArrowStyle = useAnimatedStyle(() => ({
    opacity: arrowOpacity.value,
    transform: [{ scale: arrowOpacity.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Main Status Indicator with Pulse */}
      <Animated.View
        style={[
          styles.indicator,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: config.color,
            shadowColor: config.color,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: shouldPulse ? 0.8 : 0.3,
            shadowRadius: shouldPulse ? 8 : 2,
            elevation: shouldPulse ? 8 : 2,
          },
          animatedIndicatorStyle,
        ]}
      >
        {/* Inner bright dot */}
        <View
          style={[
            styles.innerDot,
            {
              width: size * 0.35,
              height: size * 0.35,
              borderRadius: size * 0.175,
            },
          ]}
        />
      </Animated.View>

      {/* Multiple Orders Indicator */}
      {hasMultipleOrders && (
        <Animated.View
          style={[
            styles.multiOrderIndicator,
            {
              width: size * 0.6,
              height: size * 0.6,
              borderRadius: size * 0.3,
              right: -size * 0.2,
              top: -size * 0.2,
            },
            animatedArrowStyle,
          ]}
        >
          <Ionicons name="arrow-up" size={size * 0.35} color={config.color} />
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 32,
    minHeight: 32,
  },
  indicator: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerDot: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  multiOrderIndicator: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 3,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.1)',
  },
});

export default OrderStatusIndicator;
