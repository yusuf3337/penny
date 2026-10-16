import React from 'react';
import { Text as NativeText, TextInput as NativeTextInput } from 'react-native';
import type { TextProps, TextInputProps } from 'react-native';
import { useLocale } from '../../context/LocaleContext';

const localizeChildren = (children: React.ReactNode, t: (source: string) => string): React.ReactNode => {
  if (typeof children === 'string') return t(children);
  if (Array.isArray(children)) return children.map((child) => localizeChildren(child, t));
  return children;
};

export const Text = React.forwardRef<NativeText, TextProps & { localize?: boolean }>((props, ref) => {
  const { t } = useLocale();
  const { localize: shouldLocalize = true, ...nativeProps } = props;
  return <NativeText {...nativeProps} ref={ref} accessibilityLabel={props.accessibilityLabel && shouldLocalize ? t(props.accessibilityLabel) : props.accessibilityLabel}>
    {shouldLocalize ? localizeChildren(props.children, t) : props.children}
  </NativeText>;
});
Text.displayName = 'LocalizedText';

export const TextInput = React.forwardRef<NativeTextInput, TextInputProps>((props, ref) => {
  const { t } = useLocale();
  return <NativeTextInput
    {...props}
    ref={ref}
    placeholder={props.placeholder ? t(props.placeholder) : undefined}
    accessibilityLabel={props.accessibilityLabel ? t(props.accessibilityLabel) : undefined}
  />;
});
TextInput.displayName = 'LocalizedTextInput';
