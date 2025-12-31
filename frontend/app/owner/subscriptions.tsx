/**
 * Subscriptions Management Screen - Full CRUD with Confetti & Void Delete
 */
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '../../src/store/appStore';
import { subscriberApi, subscriptionRequestApi } from '../../src/services/api';
import { VoidDeleteGesture } from '../../src/components/ui/VoidDeleteGesture';
import { ErrorCapsule } from '../../src/components/ui/ErrorCapsule';
import { ConfettiEffect } from '../../src/components/ui/ConfettiEffect';

type TabType = 'subscribers' | 'requests';

export default function SubscriptionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const language = useAppStore((state) => state.language);
  const subscribers = useAppStore((state) => state.subscribers);
  const setSubscribers = useAppStore((state) => state.setSubscribers);
  const isRTL = language === 'ar';

  const [activeTab, setActiveTab] = useState<TabType>('subscribers');
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const [subsRes, reqsRes] = await Promise.all([
        subscriberApi.getAll().catch(() => ({ data: [] })),
        subscriptionRequestApi.getAll().catch(() => ({ data: [] })),
      ]);
      setSubscribers(subsRes.data || []);
      setRequests(reqsRes.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  // Add subscriber with confetti
  const handleAddSubscriber = async () => {
    if (!newEmail.trim()) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticSub = {
      id: tempId,
      email: newEmail.trim(),
      created_at: new Date().toISOString(),
    };

    // Optimistic update
    setSubscribers([optimisticSub, ...subscribers]);
    setShowAddModal(false);
    setNewEmail('');
    setShowConfetti(true);

    try {
      setLoading(true);
      const res = await subscriberApi.create(newEmail.trim());
      setSubscribers([res.data, ...subscribers.filter((s: any) => s.id !== tempId)]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      // Rollback
      setSubscribers(subscribers.filter((s: any) => s.id !== tempId));
      setError(err.response?.data?.detail || 'Failed to add subscriber');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  // Delete subscriber
  const handleDeleteSubscriber = async (subId: string) => {
    const subToDelete = subscribers.find((s: any) => s.id === subId);
    if (!subToDelete) return;

    // Optimistic update
    setSubscribers(subscribers.filter((s: any) => s.id !== subId));

    try {
      await subscriberApi.delete(subId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      // Rollback
      setSubscribers([...subscribers, subToDelete]);
      setError(err.response?.data?.detail || 'Failed to delete subscriber');
    }
  };

  // Approve request
  const handleApproveRequest = async (reqId: string) => {
    const request = requests.find((r: any) => r.id === reqId);
    if (!request) return;

    // Optimistic update
    setRequests(requests.map((r: any) => r.id === reqId ? { ...r, status: 'approved' } : r));
    setShowConfetti(true);

    try {
      await subscriptionRequestApi.approve(reqId);
      // Add as subscriber
      const newSub = {
        id: `sub-${Date.now()}`,
        email: request.customer_email,
        name: request.customer_name,
        created_at: new Date().toISOString(),
      };
      setSubscribers([newSub, ...subscribers]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      // Rollback
      setRequests(requests.map((r: any) => r.id === reqId ? { ...r, status: 'pending' } : r));
      setError(err.response?.data?.detail || 'Failed to approve request');
    }
  };

  // Delete request
  const handleDeleteRequest = async (reqId: string) => {
    const reqToDelete = requests.find((r: any) => r.id === reqId);
    if (!reqToDelete) return;

    setRequests(requests.filter((r: any) => r.id !== reqId));

    try {
      await subscriptionRequestApi.delete(reqId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      setRequests([...requests, reqToDelete]);
      setError(err.response?.data?.detail || 'Failed to delete request');
    }
  };

  const pendingRequests = requests.filter((r: any) => r.status === 'pending');

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#5B21B6', '#7C3AED', '#8B5CF6']} style={StyleSheet.absoluteFill} />
      
      <ErrorCapsule message={error || ''} visible={!!error} onDismiss={() => setError(null)} />
      <ConfettiEffect active={showConfetti} onComplete={() => setShowConfetti(false)} />

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFF" />}
      >
        {/* Header */}
        <View style={[styles.header, isRTL && styles.headerRTL]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isRTL ? 'الاشتراكات' : 'Subscriptions'}</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
            <Ionicons name="add" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Ionicons name="card" size={24} color="#8B5CF6" />
            <Text style={styles.statValue}>{subscribers.length}</Text>
            <Text style={styles.statLabel}>{isRTL ? 'المشتركين' : 'Subscribers'}</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="time" size={24} color="#F59E0B" />
            <Text style={styles.statValue}>{pendingRequests.length}</Text>
            <Text style={styles.statLabel}>{isRTL ? 'قيد الانتظار' : 'Pending'}</Text>
          </View>
        </View>

        {/* Tab Toggle */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'subscribers' && styles.tabActive]}
            onPress={() => setActiveTab('subscribers')}
          >
            <Text style={[styles.tabText, activeTab === 'subscribers' && styles.tabTextActive]}>
              {isRTL ? 'المشتركين' : 'Subscribers'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'requests' && styles.tabActive]}
            onPress={() => setActiveTab('requests')}
          >
            <Text style={[styles.tabText, activeTab === 'requests' && styles.tabTextActive]}>
              {isRTL ? 'الطلبات' : 'Requests'}
            </Text>
            {pendingRequests.length > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{pendingRequests.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.listContainer}>
          {activeTab === 'subscribers' ? (
            subscribers.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="card-outline" size={64} color="rgba(255,255,255,0.5)" />
                <Text style={styles.emptyText}>{isRTL ? 'لا يوجد مشتركين' : 'No subscribers yet'}</Text>
              </View>
            ) : (
              subscribers.map((sub: any) => (
                <VoidDeleteGesture key={sub.id} onDelete={() => handleDeleteSubscriber(sub.id)}>
                  <TouchableOpacity style={styles.card}>
                    <BlurView intensity={15} tint="light" style={styles.cardBlur}>
                      <View style={styles.avatar}>
                        <Ionicons name="card" size={24} color="#8B5CF6" />
                      </View>
                      <View style={styles.info}>
                        <Text style={styles.name}>{sub.name || sub.email}</Text>
                        <Text style={styles.date}>
                          {isRTL ? 'منذ' : 'Since'} {new Date(sub.created_at).toLocaleDateString()}
                        </Text>
                      </View>
                      <View style={styles.swipeHint}>
                        <Ionicons name="arrow-back" size={16} color="rgba(255,255,255,0.4)" />
                      </View>
                    </BlurView>
                  </TouchableOpacity>
                </VoidDeleteGesture>
              ))
            )
          ) : (
            requests.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="mail-outline" size={64} color="rgba(255,255,255,0.5)" />
                <Text style={styles.emptyText}>{isRTL ? 'لا توجد طلبات' : 'No requests yet'}</Text>
              </View>
            ) : (
              requests.map((req: any) => (
                <VoidDeleteGesture key={req.id} onDelete={() => handleDeleteRequest(req.id)}>
                  <View style={styles.card}>
                    <BlurView intensity={15} tint="light" style={styles.cardBlur}>
                      <View style={[styles.avatar, { backgroundColor: req.status === 'approved' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)' }]}>
                        <Ionicons 
                          name={req.status === 'approved' ? 'checkmark-circle' : 'mail'} 
                          size={24} 
                          color={req.status === 'approved' ? '#10B981' : '#F59E0B'} 
                        />
                      </View>
                      <View style={styles.info}>
                        <Text style={styles.name}>{req.customer_name}</Text>
                        <Text style={styles.email}>{req.customer_email}</Text>
                        <Text style={styles.date}>{req.business_name}</Text>
                      </View>
                      {req.status === 'pending' && (
                        <TouchableOpacity 
                          style={styles.approveButton}
                          onPress={() => handleApproveRequest(req.id)}
                        >
                          <Ionicons name="checkmark" size={20} color="#FFF" />
                        </TouchableOpacity>
                      )}
                      {req.status === 'approved' && (
                        <View style={styles.approvedBadge}>
                          <Text style={styles.approvedText}>{isRTL ? 'موافق' : 'Approved'}</Text>
                        </View>
                      )}
                    </BlurView>
                  </View>
                </VoidDeleteGesture>
              ))
            )
          )}
        </View>

        <View style={{ height: insets.bottom + 40 }} />
      </ScrollView>

      {/* Add Modal */}
      {showAddModal && (
        <View style={styles.modalOverlay}>
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{isRTL ? 'إضافة مشترك' : 'Add Subscriber'}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder={isRTL ? 'البريد الإلكتروني' : 'Email'}
              placeholderTextColor="#9CA3AF"
              value={newEmail}
              onChangeText={setNewEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setShowAddModal(false)}>
                <Text style={styles.cancelButtonText}>{isRTL ? 'إلغاء' : 'Cancel'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.confirmButton]} onPress={handleAddSubscriber}>
                <Text style={styles.confirmButtonText}>{isRTL ? 'إضافة' : 'Add'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16 },
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, gap: 12 },
  headerRTL: { flexDirection: 'row-reverse' },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 24, fontWeight: '700', color: '#FFF' },
  addButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  statBox: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 16, alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: '700', color: '#FFF', marginTop: 8 },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  tabContainer: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 4, marginTop: 20 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, gap: 8 },
  tabActive: { backgroundColor: 'rgba(139,92,246,0.8)' },
  tabText: { fontSize: 14, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  tabTextActive: { color: '#FFF' },
  tabBadge: { backgroundColor: '#EF4444', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  tabBadgeText: { fontSize: 10, color: '#FFF', fontWeight: '700' },
  listContainer: { marginTop: 20 },
  card: { marginBottom: 12, borderRadius: 16, overflow: 'hidden' },
  cardBlur: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: 'rgba(255,255,255,0.1)' },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(139,92,246,0.2)', alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, marginLeft: 12 },
  name: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  email: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  date: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  swipeHint: { opacity: 0.5 },
  approveButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' },
  approvedBadge: { backgroundColor: 'rgba(16,185,129,0.3)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  approvedText: { fontSize: 12, color: '#10B981', fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: 'rgba(255,255,255,0.5)', fontSize: 16, marginTop: 16 },
  modalOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 20, padding: 24, width: '100%', maxWidth: 340 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1F2937', marginBottom: 20, textAlign: 'center' },
  modalInput: { backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, marginBottom: 12, color: '#1F2937' },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalButton: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  cancelButton: { backgroundColor: '#F3F4F6' },
  cancelButtonText: { fontSize: 16, fontWeight: '600', color: '#6B7280' },
  confirmButton: { backgroundColor: '#8B5CF6' },
  confirmButtonText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
});
