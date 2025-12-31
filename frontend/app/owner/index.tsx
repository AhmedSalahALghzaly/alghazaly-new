/**
 * Owner Interface Dashboard
 * The advanced owner interface with icon grid and live metrics
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppStore, useColorMood } from '../../src/store/appStore';
import { SyncIndicator } from '../../src/components/ui/SyncIndicator';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Dashboard icon configuration
const DASHBOARD_ICONS = [
  { id: 'customers', icon: 'people', label: 'Customers', labelAr: 'العملاء', color: '#3B82F6', route: '/owner/customers' },
  { id: 'admins', icon: 'shield-checkmark', label: 'Admins', labelAr: 'المسؤولين', color: '#10B981', route: '/owner/admins' },
  { id: 'collection', icon: 'cube', label: 'Collection', labelAr: 'المجموعة', color: '#F59E0B', route: '/owner/collection' },
  { id: 'subscriptions', icon: 'card', label: 'Subscriptions', labelAr: 'الاشتراكات', color: '#8B5CF6', route: '/owner/subscriptions' },
  { id: 'analytics', icon: 'bar-chart', label: 'Analytics', labelAr: 'التحليلات', color: '#EC4899', route: '/owner/analytics' },
  { id: 'suppliers', icon: 'briefcase', label: 'Suppliers', labelAr: 'الموردين', color: '#14B8A6', route: '/owner/suppliers' },
  { id: 'distributors', icon: 'car', label: 'Distributors', labelAr: 'الموزعين', color: '#EF4444', route: '/owner/distributors' },
  { id: 'settings', icon: 'settings', label: 'Settings', labelAr: 'الإعدادات', color: '#6B7280', route: '/owner/settings' },
];

export default function OwnerDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const mood = useColorMood();
  const language = useAppStore((state) => state.language);
  const user = useAppStore((state) => state.user);
  const orders = useAppStore((state) => state.orders);
  const customers = useAppStore((state) => state.customers);
  const products = useAppStore((state) => state.products);

  // Calculate live metrics from store
  const metrics = {
    todayOrders: orders.filter((o: any) => {
      const today = new Date().toDateString();
      return new Date(o.created_at).toDateString() === today;
    }).length,
    pendingOrders: orders.filter((o: any) => o.status === 'pending').length,
    totalRevenue: orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0),
    activeCustomers: customers.length,
    totalProducts: products.length,
    lowStock: products.filter((p: any) => (p.quantity || 0) < 10).length,
  };

  const isRTL = language === 'ar';

  const handleIconPress = (route: string) => {
    router.push(route as any);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Gradient Background */}
      <LinearGradient
        colors={mood.gradient.length >= 3 ? mood.gradient as [string, string, string] : ['#1E1E3F', '#2D2D5F', '#3D3D7F']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, isRTL && styles.headerRTL]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons
              name={isRTL ? 'arrow-forward' : 'arrow-back'}
              size={24}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>
              {language === 'ar' ? 'لوحة التحكم' : 'Owner Dashboard'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {user?.name || user?.email}
            </Text>
          </View>

          <SyncIndicator compact />
        </View>

        {/* Icon Grid */}
        <View style={styles.gridContainer}>
          <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>
            {language === 'ar' ? 'الإدارة' : 'Management'}
          </Text>
          
          <View style={styles.iconGrid}>
            {DASHBOARD_ICONS.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.iconCard}
                onPress={() => handleIconPress(item.route)}
                activeOpacity={0.7}
              >
                <BlurView intensity={20} tint="light" style={styles.iconBlur}>
                  <View style={[styles.iconCircle, { backgroundColor: item.color + '30' }]}>
                    <Ionicons name={item.icon as any} size={28} color={item.color} />
                  </View>
                  <Text style={styles.iconLabel}>
                    {isRTL ? item.labelAr : item.label}
                  </Text>
                </BlurView>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Live Metrics Panel */}
        <View style={styles.metricsContainer}>
          <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>
            {language === 'ar' ? 'المقاييس الحية' : 'Live Metrics'}
          </Text>

          <View style={styles.metricsGrid}>
            <MetricCard
              icon="receipt"
              label={language === 'ar' ? 'طلبات اليوم' : 'Today Orders'}
              value={metrics.todayOrders}
              color="#3B82F6"
            />
            <MetricCard
              icon="time"
              label={language === 'ar' ? 'قيد الانتظار' : 'Pending'}
              value={metrics.pendingOrders}
              color="#F59E0B"
            />
            <MetricCard
              icon="cash"
              label={language === 'ar' ? 'الإيرادات' : 'Revenue'}
              value={`${(metrics.totalRevenue / 1000).toFixed(1)}K`}
              color="#10B981"
            />
            <MetricCard
              icon="people"
              label={language === 'ar' ? 'العملاء' : 'Customers'}
              value={metrics.activeCustomers}
              color="#8B5CF6"
            />
            <MetricCard
              icon="cube"
              label={language === 'ar' ? 'المنتجات' : 'Products'}
              value={metrics.totalProducts}
              color="#EC4899"
            />
            <MetricCard
              icon="alert"
              label={language === 'ar' ? 'مخزون منخفض' : 'Low Stock'}
              value={metrics.lowStock}
              color="#EF4444"
            />
          </View>
        </View>

        {/* Bottom padding */}
        <View style={{ height: insets.bottom + 40 }} />
      </ScrollView>
    </View>
  );
}

// Metric Card Component
interface MetricCardProps {
  icon: string;
  label: string;
  value: number | string;
  color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ icon, label, value, color }) => {
  return (
    <View style={styles.metricCard}>
      <BlurView intensity={15} tint="light" style={styles.metricBlur}>
        <View style={[styles.metricIconContainer, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon as any} size={20} color={color} />
        </View>
        <Text style={styles.metricValue}>{value}</Text>
        <Text style={styles.metricLabel}>{label}</Text>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E3F',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  headerRTL: {
    flexDirection: 'row-reverse',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  textRTL: {
    textAlign: 'right',
  },
  gridContainer: {
    marginTop: 24,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  iconCard: {
    width: (SCREEN_WIDTH - 56) / 4,
    aspectRatio: 0.85,
    borderRadius: 16,
    overflow: 'hidden',
  },
  iconBlur: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iconLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  metricsContainer: {
    marginTop: 32,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    width: (SCREEN_WIDTH - 52) / 3,
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  metricBlur: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  metricIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  metricLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: 4,
  },
});
