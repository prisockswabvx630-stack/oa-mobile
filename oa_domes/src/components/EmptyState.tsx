import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface EmptyStateProps {
  icon?: keyof typeof Feather.glyphMap;
  title?: string;
  description?: string;
}

export default function EmptyState({
  icon = 'inbox',
  title = '暂无数据',
  description,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Feather name={icon} size={48} color="#ccc" />
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  title: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
  description: {
    fontSize: 13,
    color: '#bbb',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
