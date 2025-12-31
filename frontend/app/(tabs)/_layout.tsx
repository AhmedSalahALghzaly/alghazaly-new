import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../src/hooks/useTheme';
import { useTranslation } from '../../src/hooks/useTranslation';
import { useAppStore, useCanAccessOwnerInterface } from '../../src/store/appStore';

// Owner email that can always access the interface
const OWNER_EMAIL = 'pc.2025.ai@gmail.com';

export default function TabLayout() {
  const { colors } = useTheme();
  const { t, isRTL } = useTranslation();
  const cartItems = useAppStore((state) => state.cartItems);
  const user = useAppStore((state) => state.user);
  const partners = useAppStore((state) => state.partners);
  
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Check if user can access owner interface
  const isOwner = user?.email?.toLowerCase() === OWNER_EMAIL.toLowerCase();
  const isPartner = partners.some(
    (p: any) => p.email?.toLowerCase() === user?.email?.toLowerCase()
  );
  const canAccessOwner = isOwner || isPartner;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('home'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: t('categories'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid" size={size} color={color} />
          ),
        }}
      />
      
      {/* Owner Access Tab - Only visible to owner and partners */}
      {canAccessOwner && (
        <Tabs.Screen
          name="owner-access"
          options={{
            title: isRTL ? 'المالك' : 'Owner',
            href: '/owner',
            tabBarIcon: ({ focused }) => (
              <View style={styles.ownerIconContainer}>
                <LinearGradient
                  colors={focused ? ['#6366F1', '#8B5CF6', '#A855F7'] : ['#9CA3AF', '#9CA3AF', '#9CA3AF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.ownerIconGradient}
                >
                  <Ionicons name="diamond" size={20} color="#FFFFFF" />
                </LinearGradient>
              </View>
            ),
            tabBarActiveTintColor: '#8B5CF6',
          }}
        />
      )}

      <Tabs.Screen
        name="cart"
        options={{
          title: t('cart'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cart" size={size} color={color} />
          ),
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.error,
            fontSize: 10,
          },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('profile'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  ownerIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  ownerIconGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
