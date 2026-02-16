/**
 * Designer Field Renderer - Renders fields in design mode
 */

import * as React from 'react';
import { FormField } from '../../formEngine/core/types';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import '../../formEngine/fields/RichTextField.css';

const toolbarOptions = {
  container: [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'indent': '-1'}, { 'indent': '+1' }],
    [{ 'align': [] }],
    ['link', 'image'],
    ['clean'],
  ],
};

const quillModules = {
  toolbar: toolbarOptions,
  clipboard: {
    matchVisual: false,
  },
};

export interface DesignerFieldRendererProps {
  field: FormField;
  onChange: (field: FormField) => void;
}

export const DesignerFieldRenderer: React.FC<DesignerFieldRendererProps> = ({ field, onChange }) => {
  // 对于富文本字段，直接显示可编辑的编辑器
  if (field.type === 'richtext') {
    return (
      <div style={{ padding: '12px', background: 'white', border: '1px solid #e1dfdd', borderRadius: '4px' }}>
        <ReactQuill
          theme="snow"
          value={field.defaultValue || ''}
          onChange={(content) => {
            onChange({ ...field, defaultValue: content });
          }}
          modules={quillModules}
          formats={[
            'header', 'font', 'size',
            'bold', 'italic', 'underline', 'strike', 'blockquote',
            'list', 'bullet', 'indent',
            'link', 'image',
            'color', 'background',
            'align',
            'clean',
          ]}
          style={{ minHeight: '200px' }}
          placeholder="在此输入富文本内容..."
        />
      </div>
    );
  }

  // 其他字段类型显示为占位符
  return (
    <div style={{
      padding: '12px 16px',
      background: '#f3f2f1',
      border: '1px solid #e1dfdd',
      borderRadius: '4px',
    }}>
      <div style={{ fontSize: '12px', color: '#605e5c', marginBottom: '4px' }}>
        {field.type} 字段
      </div>
      <div style={{ fontSize: '14px', fontWeight: 500 }}>
        {field.label}
        {field.required && <span style={{ color: '#d13438', marginLeft: '4px' }}>*</span>}
      </div>
    </div>
  );
};
