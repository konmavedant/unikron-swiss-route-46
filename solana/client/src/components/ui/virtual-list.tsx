import React, { useMemo, useState, useEffect, useRef } from 'react';
import { FixedSizeList as List } from 'react-window';
import { cn } from '@/lib/utils';
import { APP_CONFIG } from '@/constants/app';

interface VirtualListProps<T> {
  items: T[];
  height: number;
  width?: number;
  itemHeight?: number;
  overscan?: number;
  className?: string;
  renderItem: (props: { item: T; index: number; style: React.CSSProperties }) => React.ReactNode;
  getItemKey?: (item: T, index: number) => string | number;
  onScroll?: (scrollOffset: number) => void;
}

export function VirtualList<T>({
  items,
  height,
  width = 300,
  itemHeight = APP_CONFIG.VIRTUAL_LIST_ITEM_HEIGHT,
  overscan = APP_CONFIG.VIRTUAL_LIST_OVERSCAN,
  className,
  renderItem,
  getItemKey,
  onScroll,
}: VirtualListProps<T>) {
  const listRef = useRef<List>(null);
  
  const itemData = useMemo(() => ({
    items,
    renderItem,
  }), [items, renderItem]);

  const itemKeyGetter = useMemo(() => {
    if (getItemKey) {
      return (index: number) => getItemKey(items[index], index);
    }
    return undefined;
  }, [getItemKey, items]);

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = items[index];
    if (!item) return null;
    
    return renderItem({ item, index, style });
  };

  const handleScroll = ({ scrollOffset }: { scrollOffset: number }) => {
    onScroll?.(scrollOffset);
  };

  // Scroll to top when items change
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTo(0);
    }
  }, [items.length]);

  return (
    <div className={cn('virtual-list-container', className)}>
      <List
        ref={listRef}
        height={height}
        width={width}
        itemCount={items.length}
        itemSize={itemHeight}
        itemData={itemData}
        itemKey={itemKeyGetter}
        overscanCount={overscan}
        onScroll={handleScroll}
      >
        {Row}
      </List>
    </div>
  );
}

interface VirtualGridProps<T> {
  items: T[];
  height: number;
  width: number;
  columnCount: number;
  rowHeight?: number;
  columnWidth?: number;
  className?: string;
  renderItem: (props: { 
    item: T; 
    rowIndex: number; 
    columnIndex: number; 
    style: React.CSSProperties 
  }) => React.ReactNode;
  getItemKey?: (item: T, rowIndex: number, columnIndex: number) => string | number;
}

export function VirtualGrid<T>({
  items,
  height,
  width,
  columnCount,
  rowHeight = APP_CONFIG.VIRTUAL_LIST_ITEM_HEIGHT,
  columnWidth,
  className,
  renderItem,
  getItemKey,
}: VirtualGridProps<T>) {
  const rowCount = Math.ceil(items.length / columnCount);
  const itemWidth = columnWidth || width / columnCount;

  const Cell = ({ 
    rowIndex, 
    columnIndex, 
    style 
  }: { 
    rowIndex: number; 
    columnIndex: number; 
    style: React.CSSProperties 
  }) => {
    const itemIndex = rowIndex * columnCount + columnIndex;
    const item = items[itemIndex];
    
    if (!item) return null;
    
    return renderItem({ 
      item, 
      rowIndex, 
      columnIndex, 
      style: {
        ...style,
        width: itemWidth,
      }
    });
  };

  const itemKeyGetter = useMemo(() => {
    if (getItemKey) {
      return (index: number) => {
        const rowIndex = Math.floor(index / columnCount);
        const columnIndex = index % columnCount;
        const itemIndex = rowIndex * columnCount + columnIndex;
        const item = items[itemIndex];
        if (!item) return `${rowIndex}-${columnIndex}`;
        return getItemKey(item, rowIndex, columnIndex);
      };
    }
    return undefined;
  }, [getItemKey, items, columnCount]);

  return (
    <div className={cn('virtual-grid-container', className)}>
      <List
        height={height}
        itemCount={rowCount}
        itemSize={rowHeight}
        itemKey={itemKeyGetter}
        width={width}
      >
        {({ index, style }) => (
          <div style={style} className="flex">
            {Array.from({ length: columnCount }, (_, columnIndex) => (
              <Cell
                key={columnIndex}
                rowIndex={index}
                columnIndex={columnIndex}
                style={{}}
              />
            ))}
          </div>
        )}
      </List>
    </div>
  );
}