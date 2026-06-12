import { Fragment } from 'react';
import { StyleSheet, Text } from 'react-native';
import { ThemedText } from '@/components/themed-text';

interface MessageMarkdownProps {
  text: string;
  color?: string;
}

const TOKEN_REGEX = /(\*\*[^*]+\*\*|_[^_]+_|~~[^~]+~~|`[^`]+`)/g;

const renderInlineTokens = (line: string, color?: string) => {
  const segments = line.split(TOKEN_REGEX).filter(Boolean);

  return segments.map((segment, index) => {
    if (segment.startsWith('**') && segment.endsWith('**')) {
      return (
        <Text key={`${segment}-${index}`} style={[styles.bold, color ? { color } : null]}>
          {segment.slice(2, -2)}
        </Text>
      );
    }

    if (segment.startsWith('_') && segment.endsWith('_')) {
      return (
        <Text key={`${segment}-${index}`} style={[styles.italic, color ? { color } : null]}>
          {segment.slice(1, -1)}
        </Text>
      );
    }

    if (segment.startsWith('~~') && segment.endsWith('~~')) {
      return (
        <Text key={`${segment}-${index}`} style={[styles.strike, color ? { color } : null]}>
          {segment.slice(2, -2)}
        </Text>
      );
    }

    if (segment.startsWith('`') && segment.endsWith('`')) {
      return (
        <Text key={`${segment}-${index}`} style={[styles.code, color ? { color } : null]}>
          {segment.slice(1, -1)}
        </Text>
      );
    }

    return (
      <Text key={`${segment}-${index}`} style={color ? { color } : null}>
        {segment}
      </Text>
    );
  });
};

export function MessageMarkdown({ text, color }: MessageMarkdownProps) {
  const lines = String(text || '').split('\n');

  return (
    <ThemedText style={[styles.baseText, color ? { color } : null]}>
      {lines.map((line, index) => (
        <Fragment key={`${line}-${index}`}>
          {renderInlineTokens(line, color)}
          {index < lines.length - 1 ? '\n' : null}
        </Fragment>
      ))}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  baseText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bold: {
    fontWeight: '700',
  },
  italic: {
    fontStyle: 'italic',
  },
  strike: {
    textDecorationLine: 'line-through',
  },
  code: {
    fontFamily: 'monospace',
    backgroundColor: 'rgba(15, 23, 42, 0.08)',
    paddingHorizontal: 4,
    borderRadius: 4,
  },
});
