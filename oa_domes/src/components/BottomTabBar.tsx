import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';

export default function BottomTabBar() {
  const router = useRouter();
  const pathname = usePathname();

  const tabs = [
    { name: '工作台', icon: 'menu', route: '/workbench' as const },
    { name: '消息', icon: 'message-square', route: '/messages' as const },
    { name: '通讯录', icon: 'users', route: '/contacts' as const },
    { name: '我的', icon: 'smile', route: '/profile' as const },
  ];

  return (
    <View style={styles.bottomTabBar}>
      {tabs.map((tab) => {
        const isActive = pathname === tab.route;
        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tabItem}
            onPress={() => router.push(tab.route)}
          >
            <Feather
              name={tab.icon as any}
              size={24}
              color={isActive ? '#6358ee' : '#94a3b8'}
            />
            <Text style={[styles.tabLabel, isActive && { color: '#6358ee' }]}>
              {tab.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomTabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f1f1f1',
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
    color: '#94a3b8',
  },
});
