import { Tabs } from "expo-router";
import { Sparkles, Grid } from "lucide-react-native";
import { Platform } from "react-native";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          borderTopWidth: 0,
          position: "absolute",
          bottom: Platform.OS === "ios" ? 20 : 10,
          left: 20,
          right: 20,
          height: 60,
          borderRadius: 30,
          paddingBottom: 8,
          paddingTop: 8,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: "#ffffff",
        tabBarInactiveTintColor: "#71717a",
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="create"
        options={{
          title: "Create",
          tabBarIcon: ({ color, size }) => (
            <Sparkles size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="gallery"
        options={{
          title: "Gallery",
          tabBarIcon: ({ color, size }) => (
            <Grid size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="result"
        options={{
          href: null, // Ocultar del tab bar
        }}
      />
    </Tabs>
  );
}

