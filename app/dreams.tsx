// app/dreams.tsx
import { router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";

const colors = {
  bg: "#FFF1F2",
  card: "#FFFFFF",
  accent: "#ec4899",
  accentDark: "#be185d",
  text: "#111827",
  subtext: "#6b7280",
  border: "#f5d0ea",
};

type Dream = {
  id: string;
  place_name: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  created_at: string | null;
  keyword?: string | null;
};

export default function DreamsScreen() {
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // filters
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [keywordMenuOpen, setKeywordMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const { data, error } = await supabase
        .from("dreams")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDreams((data || []) as Dream[]);
    } catch (e: any) {
      console.log("DREAMS ERROR:", e);
      setErr(e?.message || "Κάτι πήγε στραβά.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const openAsMemory = (item: Dream) => {
    router.push({
      pathname: "/add",
      params: {
        name: item.place_name ?? "",
        address: item.address ?? "",
        lat: item.lat != null ? String(item.lat) : "",
        lng: item.lng != null ? String(item.lng) : "",
      },
    });
  };

  const deleteDream = async (id: string) => {
    try {
      const { error } = await supabase.from("dreams").delete().eq("id", id);
      if (error) throw error;
      setDreams((prev) => prev.filter((d) => d.id !== id));
    } catch (e: any) {
      console.log("DELETE DREAM ERROR:", e);
    }
  };

  // Όλα τα διαθέσιμα keywords από τα dreams
  const availableKeywords = useMemo(() => {
    const s = new Set<string>();
    dreams.forEach((d) => {
      if (d.keyword && d.keyword.trim().length > 0) {
        s.add(d.keyword.trim());
      }
    });
    return Array.from(s).sort((a, b) => a.localeCompare(b, "el"));
  }, [dreams]);

  // Εφαρμογή keyword + search filters
  const filteredDreams = useMemo(() => {
    let list = dreams;

    if (selectedKeyword) {
      list = list.filter((d) => d.keyword?.trim() === selectedKeyword);
    }

    const q = searchQuery.trim().toLowerCase();
    if (q.length > 0) {
      list = list.filter((d) => {
        const place = (d.place_name || "").toLowerCase();
        const addr = (d.address || "").toLowerCase();
        const keyw = (d.keyword || "").toLowerCase();
        return place.includes(q) || addr.includes(q) || keyw.includes(q);
      });
    }

    return list;
  }, [dreams, selectedKeyword, searchQuery]);

  // Header
  const Header = () => (
    <View
      style={{
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: colors.accent,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Pressable
        onPress={() => router.back()}
        style={{
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 999,
          backgroundColor: "rgba(255,255,255,0.2)",
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "600" }}>←</Text>
      </Pressable>

      <Text
        style={{
          fontSize: 18,
          fontWeight: "800",
          color: "#fff",
          letterSpacing: 0.4,
        }}
        numberOfLines={1}
      >
        Τι ωραίο 🪣 list!
      </Text>

      <View style={{ width: 30 }} />
    </View>
  );

  // Filter bar (keyword + search)
  const FilterBar = () => (
    <View
      style={{
        backgroundColor: colors.accent,
        paddingHorizontal: 16,
        paddingBottom: 8,
      }}
    >
      {/* Keyword row */}
      <View
        style={{
          borderRadius: 999,
          backgroundColor: "rgba(255,255,255,0.2)",
          paddingHorizontal: 12,
          paddingVertical: 6,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={{ color: "#fff", marginRight: 6 }}>🏷️</Text>
          <Text style={{ color: "#fff", fontSize: 13 }} numberOfLines={1}>
            Keyword:
            <Text style={{ fontWeight: "700" }}>
              {" "}
              {selectedKeyword ? `#${selectedKeyword}` : "Όλα"}
            </Text>
          </Text>
        </View>

        {availableKeywords.length > 0 && (
          <Pressable
            onPress={() => setKeywordMenuOpen((prev) => !prev)}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 999,
              backgroundColor: "rgba(255,255,255,0.9)",
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: colors.accentDark,
              }}
            >
              Επιλογή
            </Text>
          </Pressable>
        )}
      </View>

      {/* Dropdown με τα keywords */}
      {keywordMenuOpen && availableKeywords.length > 0 && (
        <View
          style={{
            marginTop: 6,
            borderRadius: 14,
            backgroundColor: colors.card,
            paddingVertical: 4,
            shadowColor: "#000",
            shadowOpacity: 0.15,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Pressable
            onPress={() => {
              setSelectedKeyword(null);
              setKeywordMenuOpen(false);
            }}
            style={{ paddingHorizontal: 12, paddingVertical: 8 }}
          >
            <Text
              style={{
                fontSize: 13,
                color: selectedKeyword ? colors.text : colors.accentDark,
                fontWeight: selectedKeyword ? "400" : "700",
              }}
            >
              Όλα τα keywords
            </Text>
          </Pressable>

          {availableKeywords.map((key) => {
            const active = key === selectedKeyword;
            return (
              <Pressable
                key={key}
                onPress={() => {
                  setSelectedKeyword(key);
                  setKeywordMenuOpen(false);
                }}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  backgroundColor: active ? "#ffe4ef" : "transparent",
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    color: active ? colors.accentDark : colors.text,
                    fontWeight: active ? "700" : "400",
                  }}
                >
                  #{key}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Search bar */}
      <View
        style={{
          marginTop: 8,
          borderRadius: 999,
          backgroundColor: "#fff",
          paddingHorizontal: 12,
          paddingVertical: 4,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <Text style={{ marginRight: 6 }}>🔍</Text>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Ψάξε με μέρος ή διεύθυνση..."
          placeholderTextColor={colors.subtext}
          style={{
            flex: 1,
            fontSize: 13,
            color: colors.text,
            paddingVertical: 4,
          }}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery("")}>
            <Text style={{ fontSize: 16 }}>✕</Text>
          </Pressable>
        )}
      </View>
    </View>
  );

  // Loading state
  if (loading) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.accent }}
        edges={["top", "left", "right"]}
      >
        <StatusBar style="light" backgroundColor={colors.accent} />
        <Header />
        <FilterBar />
        <View
          style={{
            flex: 1,
            backgroundColor: colors.bg,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ActivityIndicator color={colors.accentDark} />
          <Text style={{ marginTop: 8, color: colors.subtext }}>
            Φόρτωση wishlist...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.accent }}
      edges={["top", "left", "right"]}
    >
      <StatusBar style="light" backgroundColor={colors.accent} />
      <Header />
      <FilterBar />

      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        {filteredDreams.length === 0 ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
            }}
          >
            <Text style={{ color: colors.subtext, textAlign: "center" }}>
              Δεν βρέθηκαν dreams
              {selectedKeyword ? ` με keyword #${selectedKeyword}` : ""}
              {searchQuery.trim()
                ? ` για "${searchQuery.trim()}"…`
                : ".\nΔιάλεξε άλλο φίλτρο ή καθάρισέ τα 💭"}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredDreams}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              padding: 16,
              paddingBottom: 40,
              gap: 10,
            }}
            renderItem={({ item }) => (
              <View
                style={{
                  padding: 12,
                  borderRadius: 16,
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                  shadowColor: "#000",
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 4 },
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "700",
                        color: colors.text,
                      }}
                      numberOfLines={1}
                    >
                      {item.place_name || "Unknown place"}
                    </Text>
                    {!!item.address && (
                      <Text
                        style={{
                          color: colors.subtext,
                          marginTop: 2,
                          fontSize: 12,
                        }}
                        numberOfLines={2}
                      >
                        {item.address}
                      </Text>
                    )}
                  </View>

                  <View style={{ alignItems: "flex-end", gap: 4 }}>
                    
                    {item.keyword && (
                      <View
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 999,
                          backgroundColor: "#fce7f3",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: "700",
                            color: colors.accentDark,
                          }}
                        >
                          #{item.keyword}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    marginTop: 10,
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <Pressable
                    onPress={() => openAsMemory(item)}
                    style={{
                      flex: 1,
                      paddingVertical: 8,
                      borderRadius: 999,
                      backgroundColor: colors.accentDark,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: "#fff",
                        fontWeight: "700",
                        fontSize: 12,
                      }}
                    >
                      Πήγαμε εκεί! 😇
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => deleteDream(item.id)}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: "#fecaca",
                      backgroundColor: "#fef2f2",
                    }}
                  >
                    <Text
                      style={{
                        color: "#b91c1c",
                        fontWeight: "600",
                        fontSize: 12,
                      }}
                    >
                      Δεν θέλω τελικά 😈
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}
          />
        )}

        {err && <Text style={{ color: "crimson", padding: 16 }}>{err}</Text>}
      </View>
    </SafeAreaView>
  );
}
