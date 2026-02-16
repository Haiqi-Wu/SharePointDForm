/**
 * NewLine Field - Forces a line break in grid layout
 */

import * as React from 'react';
import { BaseFieldProps } from './BaseField';

export interface NewLineFieldValue {
  // Empty - this field only controls layout
}

export interface NewLineFieldProps extends BaseFieldProps {}

export const NewLineField: React.FC<NewLineFieldProps> = () => {
  return (
    <div style={{
      width: '100%',
      gridColumn: '1 / -1',
      height: '1px',
      background: 'transparent',
      margin: '8px 0',
    }} />
  );
};
