import { useState, type CSSProperties, type ReactNode } from 'react';

interface JsonValueProps {
  value: unknown;
  depth?: number;
  maxDepth?: number;
}

// Syntax highlighting colors
const colors = {
  string: '#a5d6a7',
  number: '#90caf9',
  boolean: '#ffcc80',
  null: '#9e9e9e',
  key: '#ce93d8',
  bracket: '#78909c',
  toggle: '#64b5f6',
};

const baseStyle: CSSProperties = {
  fontFamily: 'ui-monospace, monospace',
  fontSize: '0.7rem',
  lineHeight: 1.4,
  textAlign: 'left',
};

const truncate = (str: string, max = 80): string => {
  if (str.length <= max) return str;
  return str.slice(0, max) + '…';
};

// Render primitive inline
const Primitive = ({ children, color }: { children: ReactNode; color: string }) => (
  <span style={{ color }}>{children}</span>
);

// Collapsed preview
const CollapsedPreview = ({
  type,
  preview,
  onExpand,
}: {
  type: 'array' | 'object';
  preview: string;
  onExpand: () => void;
}) => (
  <span style={baseStyle}>
    <span
      onClick={onExpand}
      style={{ cursor: 'pointer', color: colors.toggle, marginRight: '4px' }}
    >
      ▶
    </span>
    <span style={{ color: colors.bracket }}>{type === 'array' ? '[' : '{'}</span>
    <span style={{ color: '#6b7280', fontStyle: 'italic' }}>{preview}</span>
    <span style={{ color: colors.bracket }}>{type === 'array' ? ']' : '}'}</span>
  </span>
);

export const JsonValue = ({
  value,
  depth = 0,
  maxDepth = 2,
}: JsonValueProps): ReactNode => {
  const [expanded, setExpanded] = useState(depth < maxDepth);
  const paddingLeft = depth * 16;

  // null
  if (value === null) {
    return <Primitive color={colors.null}>null</Primitive>;
  }

  // undefined
  if (value === undefined) {
    return <Primitive color={colors.null}>undefined</Primitive>;
  }

  // string
  if (typeof value === 'string') {
    return <Primitive color={colors.string}>"{truncate(value)}"</Primitive>;
  }

  // number
  if (typeof value === 'number') {
    return <Primitive color={colors.number}>{String(value)}</Primitive>;
  }

  // boolean
  if (typeof value === 'boolean') {
    return <Primitive color={colors.boolean}>{String(value)}</Primitive>;
  }

  // Array
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <Primitive color={colors.bracket}>[]</Primitive>;
    }

    if (!expanded) {
      return (
        <CollapsedPreview
          type="array"
          preview={`${value.length} items`}
          onExpand={() => setExpanded(true)}
        />
      );
    }

    return (
      <div style={{ ...baseStyle, textAlign: 'left' }}>
        <span
          onClick={() => setExpanded(false)}
          style={{ cursor: 'pointer', color: colors.toggle, marginRight: '4px' }}
        >
          ▼
        </span>
        <span style={{ color: colors.bracket }}>[</span>
        <div style={{ paddingLeft: '16px' }}>
          {value.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start' }}>
              <JsonValue value={item} depth={depth + 1} maxDepth={maxDepth} />
              {i < value.length - 1 && <span style={{ color: colors.bracket }}>,</span>}
            </div>
          ))}
        </div>
        <span style={{ color: colors.bracket }}>]</span>
      </div>
    );
  }

  // Object
  if (typeof value === 'object') {
    const entries = Object.entries(value);

    if (entries.length === 0) {
      return <Primitive color={colors.bracket}>{'{}'}</Primitive>;
    }

    if (!expanded) {
      const keys = entries.map(([k]) => k);
      const preview = keys.length <= 2 ? keys.join(', ') : `${keys.slice(0, 2).join(', ')}, …`;
      return (
        <CollapsedPreview
          type="object"
          preview={preview}
          onExpand={() => setExpanded(true)}
        />
      );
    }

    return (
      <div style={{ ...baseStyle, textAlign: 'left' }}>
        <span
          onClick={() => setExpanded(false)}
          style={{ cursor: 'pointer', color: colors.toggle, marginRight: '4px' }}
        >
          ▼
        </span>
        <span style={{ color: colors.bracket }}>{'{'}</span>
        <div style={{ paddingLeft: '16px' }}>
          {entries.map(([key, val], i) => (
            <div key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
              <span style={{ color: colors.key }}>"{key}"</span>
              <span style={{ color: colors.bracket }}>:</span>
              <JsonValue value={val} depth={depth + 1} maxDepth={maxDepth} />
              {i < entries.length - 1 && <span style={{ color: colors.bracket }}>,</span>}
            </div>
          ))}
        </div>
        <span style={{ color: colors.bracket }}>{'}'}</span>
      </div>
    );
  }

  // Fallback
  return <Primitive color={colors.null}>{String(value)}</Primitive>;
};
