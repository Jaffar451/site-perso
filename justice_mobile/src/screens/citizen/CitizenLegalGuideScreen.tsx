import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  StatusBar, 
  Platform,
  Modal,
  ScrollView,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ✅ Architecture
import ScreenContainer from '../../components/layout/ScreenContainer';
import AppHeader from '../../components/layout/AppHeader';
import SmartFooter from '../../components/layout/SmartFooter';
import { useAppTheme } from '../../theme/AppThemeProvider';

// ✅ Données
import { LEGAL_ARTICLES, LEGAL_CATEGORIES } from '../../data/legalData';

export default function CitizenLegalGuideScreen({ navigation }: any) {
  const { theme, isDark } = useAppTheme();
  const primaryColor = theme.colors.primary;

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedArticle, setSelectedArticle] = useState<any>(null); // Pour la modal

  // 🎨 Palette
  const colors = {
    bgMain: isDark ? "#0F172A" : "#F8FAFC",
    bgCard: isDark ? "#1E293B" : "#FFFFFF",
    textMain: isDark ? "#FFFFFF" : "#1E293B",
    textSub: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#334155" : "#E2E8F0",
    inputBg: isDark ? "#1E293B" : "#FFFFFF",
  };

  // 🔍 Moteur de Recherche Optimisé
  const filteredArticles = useMemo(() => {
    const term = search.toLowerCase().trim();
    
    return LEGAL_ARTICLES.filter(item => {
      // 1. Filtre par Catégorie
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;

      // 2. Filtre par Texte (Titre, Contenu, Mots-clés cachés)
      if (term.length === 0) return true;
      
      return (
        item.title.toLowerCase().includes(term) ||
        item.content.toLowerCase().includes(term) ||
        item.keywords.toLowerCase().includes(term)
      );
    });
  }, [search, selectedCategory]);

  // 🏷️ Rendu d'une carte article
  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
      onPress={() => setSelectedArticle(item)}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.iconBox, { backgroundColor: primaryColor + '15' }]}>
           <Ionicons name="library-outline" size={22} color={primaryColor} />
        </View>
        <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: colors.textMain }]}>{item.title}</Text>
            <Text style={[styles.cardCategory, { color: primaryColor }]}>
                {LEGAL_CATEGORIES.find(c => c.id === item.category)?.label.toUpperCase()}
            </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textSub} />
      </View>
      <Text style={[styles.cardSummary, { color: colors.textSub }]} numberOfLines={2}>
        {item.summary}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <AppHeader title="Guide du Citoyen" showBack />

      {/* 🔍 SEARCH BAR FIXE */}
      <View style={[styles.searchSection, { backgroundColor: colors.bgMain }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Ionicons name="search" size={20} color={colors.textSub} />
          <TextInput
            style={[styles.searchInput, { color: colors.textMain }]}
            placeholder="Rechercher un droit, une procédure..."
            placeholderTextColor={colors.textSub}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            onSubmitEditing={Keyboard.dismiss}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={colors.textSub} />
            </TouchableOpacity>
          )}
        </View>

        {/* 🏷️ FILTRES HORIZONTAUX */}
        <FlatList
          horizontal
          data={LEGAL_CATEGORIES}
          keyExtractor={item => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
          renderItem={({ item }) => {
            const isActive = selectedCategory === item.id;
            return (
              <TouchableOpacity
                onPress={() => setSelectedCategory(item.id)}
                style={[
                  styles.categoryChip,
                  { 
                    backgroundColor: isActive ? primaryColor : colors.bgCard,
                    borderColor: isActive ? primaryColor : colors.border,
                    borderWidth: 1
                  }
                ]}
              >
                <Text style={[styles.categoryText, { color: isActive ? '#FFF' : colors.textSub }]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* 📋 LISTE DES RÉSULTATS */}
      <FlatList
        data={filteredArticles}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={60} color={colors.border} />
            <Text style={{ color: colors.textSub, marginTop: 10, textAlign: 'center' }}>
              Aucun article trouvé pour "{search}".{'\n'}Essayez d'autres mots-clés.
            </Text>
          </View>
        }
      />

      {/* 📖 MODAL DE LECTURE (Détail) */}
      <Modal
        visible={!!selectedArticle}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedArticle(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1E293B' : '#FFF' }]}>
            {/* Header Modal */}
            <View style={styles.modalHeader}>
                <TouchableOpacity 
                    onPress={() => setSelectedArticle(null)}
                    style={[styles.closeBtn, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]}
                >
                    <Ionicons name="close" size={24} color={colors.textMain} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 24 }}>
                <Text style={[styles.modalCategory, { color: primaryColor }]}>
                    {selectedArticle && LEGAL_CATEGORIES.find(c => c.id === selectedArticle.category)?.label.toUpperCase()}
                </Text>
                <Text style={[styles.modalTitle, { color: colors.textMain }]}>
                    {selectedArticle?.title}
                </Text>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                
                <Text style={[styles.modalBody, { color: colors.textMain }]}>
                    {selectedArticle?.content}
                </Text>

                {/* Footer Modal : Actions */}
                <View style={styles.modalActions}>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: primaryColor + '15' }]}>
                        <Ionicons name="share-social-outline" size={20} color={primaryColor} />
                        <Text style={{ color: primaryColor, fontWeight: '700', marginLeft: 8 }}>Partager</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <SmartFooter />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  searchSection: { paddingBottom: 15, paddingTop: 10 },
  searchBar: {
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 15
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, fontWeight: '500' },
  
  categoriesList: { paddingHorizontal: 16, gap: 8 },
  categoryChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  categoryText: { fontSize: 13, fontWeight: '700' },

  card: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    ...Platform.select({
        ios: { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width:0, height:2 } },
        android: { elevation: 2 }
    })
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '800' },
  cardCategory: { fontSize: 10, fontWeight: '700', marginTop: 2 },
  cardSummary: { fontSize: 13, lineHeight: 20 },

  emptyState: { alignItems: 'center', marginTop: 60, paddingHorizontal: 40 },

  // MODAL STYLES
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { 
    height: '85%', 
    borderTopLeftRadius: 30, 
    borderTopRightRadius: 30,
    overflow: 'hidden'
  },
  modalHeader: { alignItems: 'flex-end', padding: 16 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  modalCategory: { fontSize: 12, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  modalTitle: { fontSize: 24, fontWeight: '900', lineHeight: 30 },
  divider: { height: 1, width: '100%', marginVertical: 20 },
  modalBody: { fontSize: 16, lineHeight: 26, fontWeight: '400' },
  modalActions: { flexDirection: 'row', marginTop: 30, justifyContent: 'flex-end' },
  actionBtn: { flexDirection: 'row', padding: 12, borderRadius: 12, alignItems: 'center' }
});