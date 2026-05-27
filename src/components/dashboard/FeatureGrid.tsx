import React from 'react';
import { FlatList, ListRenderItemInfo, StyleSheet, View } from 'react-native';
import FeatureCard from './FeatureCard';

type GridItem = {
  id: string;
  title: string;
  subtitle: string;
  iconName: string;
  color?: string;
  badgeCount?: number;
  route: string;
};

type FeatureGridProps = {
  data: GridItem[];
  numColumns: number;
  cardWidth: number;
  onPressItem: (item: GridItem) => void;
  contentBottomPadding?: number;
  refreshing?: boolean;
  onRefresh?: () => void;
  ListHeaderComponent?: React.ReactElement | null;
  ListEmptyComponent?: React.ReactElement | null;
};

const FeatureGrid: React.FC<FeatureGridProps> = ({
  data,
  numColumns,
  cardWidth,
  onPressItem,
  contentBottomPadding = 36,
  refreshing = false,
  onRefresh,
  ListHeaderComponent,
  ListEmptyComponent,
}) => {
  const renderItem = ({ item, index }: ListRenderItemInfo<GridItem>) => {
    const isRightColumn = numColumns > 1 && index % numColumns !== 0;
    return (
      <View style={[styles.itemWrap, isRightColumn && styles.leftGap]}>
        <FeatureCard
          title={item.title}
          subtitle={item.subtitle}
          iconName={item.iconName}
          color={item.color}
          badgeCount={item.badgeCount}
          width={cardWidth}
          onPress={() => onPressItem(item)}
        />
      </View>
    );
  };

  return (
    <FlatList
      data={data}
      key={numColumns}
      keyExtractor={item => item.route}
      renderItem={renderItem}
      numColumns={numColumns}
      showsVerticalScrollIndicator={false}
      columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
      contentContainerStyle={{ paddingBottom: contentBottomPadding }}
      removeClippedSubviews={false}
      refreshing={refreshing}
      onRefresh={onRefresh}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={ListEmptyComponent}
    />
  );
};

const styles = StyleSheet.create({
  row: {
    justifyContent: 'flex-start',
  },
  itemWrap: {
    marginBottom: 12,
  },
  leftGap: {
    marginLeft: 12,
  },
});

export default FeatureGrid;
