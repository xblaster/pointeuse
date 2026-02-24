import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { useTimeTracker } from '../hooks/useTimeTracker';
import { formatDuration, formatDate, formatTime } from '../utils/timeUtils';

// ---------------------------------------------------------------------------
// Palette de couleurs
// ---------------------------------------------------------------------------
const COLORS = {
  bg: '#0f0f1a',
  surface: '#1a1a2e',
  surfaceLight: '#22224a',
  accent: '#7c6ff7',
  green: '#4ade80',
  red: '#f87171',
  textPrimary: '#f0f0ff',
  textSecondary: '#8888aa',
  textMuted: '#555577',
  border: '#2a2a4a',
  deductBadge: '#92400e',
  deductBadgeText: '#fcd34d',
};

// ---------------------------------------------------------------------------
// Composant principal
// ---------------------------------------------------------------------------
export default function HomeScreen() {
  const {
    loading,
    status,
    totalMilliseconds,
    currentSessionStart,
    history,
    nextResetDate,
    clockIn,
    clockOut,
  } = useTimeTracker();

  // Pendant le chargement depuis AsyncStorage
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={styles.loadingText}>Chargement de la pointeuse…</Text>
      </SafeAreaView>
    );
  }

  const isIN = status === 'IN';
  const sessionStart = currentSessionStart ? new Date(currentSessionStart) : null;

  // Historique du jour uniquement (pour l'affichage "Aujourd'hui")
  const today = new Date().toISOString().split('T')[0];
  const todayEntries = history.filter((h) => h.date === today);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ---------------------------------------------------------------- */}
        {/* EN-TÊTE                                                          */}
        {/* ---------------------------------------------------------------- */}
        <View style={styles.header}>
          <Text style={styles.appTitle}>POINTEUSE</Text>
          <View
            style={[
              styles.statusBadge,
              isIN ? styles.statusBadgeIN : styles.statusBadgeOUT,
            ]}
          >
            <View
              style={[
                styles.statusDot,
                isIN ? styles.statusDotIN : styles.statusDotOUT,
              ]}
            />
            <Text
              style={[
                styles.statusBadgeText,
                isIN ? styles.statusTextIN : styles.statusTextOUT,
              ]}
            >
              {isIN ? 'EN SERVICE' : 'HORS SERVICE'}
            </Text>
          </View>
        </View>

        {/* ---------------------------------------------------------------- */}
        {/* AFFICHAGE DU CUMUL (grand timer)                                 */}
        {/* ---------------------------------------------------------------- */}
        <View style={styles.timerCard}>
          <Text style={styles.timerLabel}>CUMUL MENSUEL</Text>
          <Text style={styles.timerDisplay}>{formatDuration(totalMilliseconds)}</Text>
          <Text style={styles.timerSubLabel}>heures travaillées ce mois</Text>
        </View>

        {/* ---------------------------------------------------------------- */}
        {/* INFOS SESSION EN COURS                                           */}
        {/* ---------------------------------------------------------------- */}
        {isIN && sessionStart && (
          <View style={styles.sessionCard}>
            <Text style={styles.sessionLabel}>Session démarrée à</Text>
            <Text style={styles.sessionTime}>{formatTime(sessionStart)}</Text>
          </View>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* BOUTONS D'ACTION                                                 */}
        {/* ---------------------------------------------------------------- */}
        <View style={styles.buttonsRow}>
          {/* Bouton ENTRÉE */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.buttonIN,
              isIN && styles.buttonDisabled,
            ]}
            onPress={clockIn}
            disabled={isIN}
            activeOpacity={0.75}
          >
            <Text style={styles.buttonIcon}>▶</Text>
            <Text style={styles.buttonLabel}>ENTRÉE</Text>
            <Text style={styles.buttonSub}>Pointer l'arrivée</Text>
          </TouchableOpacity>

          {/* Bouton SORTIE */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.buttonOUT,
              !isIN && styles.buttonDisabled,
            ]}
            onPress={clockOut}
            disabled={!isIN}
            activeOpacity={0.75}
          >
            <Text style={styles.buttonIcon}>■</Text>
            <Text style={styles.buttonLabel}>SORTIE</Text>
            <Text style={styles.buttonSub}>Pointer le départ</Text>
          </TouchableOpacity>
        </View>

        {/* ---------------------------------------------------------------- */}
        {/* INFORMATION RESET                                                */}
        {/* ---------------------------------------------------------------- */}
        {nextResetDate && (
          <Text style={styles.resetInfo}>
            Remise à zéro le {formatDate(new Date(nextResetDate))}
          </Text>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* HISTORIQUE DU JOUR                                               */}
        {/* ---------------------------------------------------------------- */}
        {todayEntries.length > 0 && (
          <View style={styles.historyCard}>
            <Text style={styles.historyTitle}>Aujourd'hui</Text>

            {todayEntries.map((entry, index) => {
              const entryStart = new Date(entry.start);
              const entryEnd = new Date(entry.end);
              return (
                <View key={index} style={styles.historyRow}>
                  {/* Plage horaire */}
                  <View style={styles.historyLeft}>
                    <Text style={styles.historyRange}>
                      {formatTime(entryStart)} → {formatTime(entryEnd)}
                    </Text>
                    {entry.lunchDeducted && (
                      <View style={styles.deductBadge}>
                        <Text style={styles.deductBadgeText}>
                          −30 min pause déduite
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Durée effective */}
                  <Text style={styles.historyDuration}>
                    {formatDuration(entry.duration)}
                  </Text>
                </View>
              );
            })}

            {/* Total du jour */}
            {todayEntries.length > 1 && (
              <View style={styles.historyTotalRow}>
                <Text style={styles.historyTotalLabel}>Total du jour</Text>
                <Text style={styles.historyTotalValue}>
                  {formatDuration(
                    todayEntries.reduce((sum, e) => sum + e.duration, 0),
                  )}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Espace bas de page */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  // Conteneurs de base
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 20,
  },

  // Chargement
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },

  // En-tête
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 3,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusBadgeIN: {
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.4)',
  },
  statusBadgeOUT: {
    backgroundColor: 'rgba(248, 113, 113, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.3)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotIN: {
    backgroundColor: COLORS.green,
  },
  statusDotOUT: {
    backgroundColor: COLORS.red,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  statusTextIN: {
    color: COLORS.green,
  },
  statusTextOUT: {
    color: COLORS.red,
  },

  // Timer principal (carte centrale)
  timerCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  timerLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    letterSpacing: 2,
    marginBottom: 12,
  },
  timerDisplay: {
    fontSize: 56,
    fontWeight: '800',
    color: COLORS.textPrimary,
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
    marginBottom: 8,
  },
  timerSubLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  // Session en cours
  sessionCard: {
    backgroundColor: 'rgba(74, 222, 128, 0.08)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.2)',
  },
  sessionLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  sessionTime: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.green,
  },

  // Boutons d'action
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  buttonIN: {
    backgroundColor: 'rgba(74, 222, 128, 0.18)',
    borderWidth: 2,
    borderColor: COLORS.green,
  },
  buttonOUT: {
    backgroundColor: 'rgba(248, 113, 113, 0.18)',
    borderWidth: 2,
    borderColor: COLORS.red,
  },
  buttonDisabled: {
    opacity: 0.3,
  },
  buttonIcon: {
    fontSize: 20,
    color: COLORS.textPrimary,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 2,
  },
  buttonSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  // Info reset mensuel
  resetInfo: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 24,
  },

  // Historique du jour
  historyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  historyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  historyLeft: {
    flex: 1,
    gap: 4,
  },
  historyRange: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  deductBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.deductBadge,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  deductBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.deductBadgeText,
  },
  historyDuration: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.accent,
    fontVariant: ['tabular-nums'],
  },
  historyTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: COLORS.border,
    marginTop: 4,
  },
  historyTotalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  historyTotalValue: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    fontVariant: ['tabular-nums'],
  },

  bottomSpacer: {
    height: 40,
  },
});
