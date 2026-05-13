import { Fragment, type JSX, type ReactNode } from 'react';
import { isNullOrEmpty } from '@react33/react-helpers';

type InterpolatedComponents = {
  [key: string]: (children: ReactNode[]) => ReactNode | JSX.Element;
};
type StackEntry = { tag: string; children: ReactNode[] };

/**
 * Rich interpolation: `{{var}}`, pseudo-tags `<tag>...</tag>`, `\n` → `<br />`.
 */
export function ct(
  rawText: string,
  pValues: Record<string, string | number | bigint> | null = null,
  pComponents: InterpolatedComponents | null = null,
): ReactNode[] {
  if (!rawText) return [<Fragment key="ct-empty" />];
  const values: Record<string, string> = {};
  if (!isNullOrEmpty(pValues) && pValues) {
    for (const [k, v] of Object.entries(pValues)) {
      values[k] = String(v);
    }
  }
  const components: InterpolatedComponents = isNullOrEmpty(pComponents) ? {} : pComponents;

  const regex = /<(\/?)(\w+)>|{{(\w+)}}|\n/g;
  const stack: StackEntry[] = [{ tag: 'root', children: [] }];
  let lastIndex = 0;
  let keyIndex = 0;

  let match: RegExpExecArray | null;

  while ((match = regex.exec(rawText)) !== null) {
    const [fullMatch, closingSlash, tag, varName] = match;
    const current = stack[stack.length - 1]!;

    if (match.index > lastIndex) {
      current.children.push(rawText.slice(lastIndex, match.index));
    }

    if (fullMatch === '\n') {
      current.children.push(<br key={`br-${keyIndex++}`} />);
    } else if (varName) {
      const v = values[varName];
      current.children.push(v !== undefined ? v : `{{${varName}}}`);
    } else if (!closingSlash) {
      stack.push({ tag: tag!, children: [] });
    } else {
      const popped = stack.pop()!;
      const { tag: openTag, children } = popped;
      if (openTag !== tag) {
        console.warn(`Tag mismatch: expected </${openTag}> but found </${tag}>`);
      }
      const wrapped = components[tag!] ? (
        <Fragment key={`ct-${keyIndex++}`}>{components[tag!]!(children)}</Fragment>
      ) : (
        <Fragment key={`ct-${keyIndex++}`}>{children}</Fragment>
      );

      stack[stack.length - 1]!.children.push(wrapped);
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < rawText.length) {
    stack[stack.length - 1]!.children.push(rawText.slice(lastIndex));
  }

  return stack[0]!.children;
}
