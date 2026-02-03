/**
 * Designer Canvas
 */

import * as React from 'react';
import { FormSchema, FormField, FieldType, SPFieldInfo } from '../../formEngine/core/types';
import { DropZone } from '../controls/DropZone';
import { PropertyPanel } from './PropertyPanel';
import { v4 as uuidv4 } from 'uuid';
import { TextField } from '@fluentui/react';

export interface DesignerCanvasProps {
  schema: FormSchema;
  onChange: (schema: FormSchema) => void;
  spFields?: SPFieldInfo[];
}

export const DesignerCanvas: React.FC<DesignerCanvasProps> = ({ schema, onChange, spFields }) => {
  // Ensure spFields is always an array
  const safeSpFields = Array.isArray(spFields) ? spFields : [];
  const [selectedStepIndex, setSelectedStepIndex] = React.useState(0);
  const [selectedField, setSelectedField] = React.useState<FormField | null>(null);
  const [isPropertyPanelOpen, setIsPropertyPanelOpen] = React.useState(false);

  // Ensure currentStep exists to prevent undefined errors
  const currentStep = schema.steps?.[selectedStepIndex];
  if (!currentStep) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#605e5c' }}>
        未找到步骤
      </div>
    );
  }

  const handleAddField = (type: FieldType): void => {
    const newField: FormField = { id: uuidv4(), type, label: `新${type}字段`, fieldName: `Field_${uuidv4().substring(0, 8)}` };
    const newSteps = [...schema.steps];
    newSteps[selectedStepIndex] = { ...currentStep, fields: [...currentStep.fields, newField] };
    onChange({ ...schema, steps: newSteps });
    setSelectedField(newField);
    setIsPropertyPanelOpen(true);
  };

  const handleSelectField = (field: FormField): void => {
    setSelectedField(field);
    setIsPropertyPanelOpen(true);
  };

  const handleDeleteField = (fieldId: string): void => {
    const newSteps = [...schema.steps];
    newSteps[selectedStepIndex] = { ...currentStep, fields: currentStep.fields.filter(f => f.id !== fieldId) };
    onChange({ ...schema, steps: newSteps });
    if (selectedField?.id === fieldId) {
      setSelectedField(null);
      setIsPropertyPanelOpen(false);
    }
  };

  const handleSaveField = (field: FormField): void => {
    const newSteps = [...schema.steps];
    const stepFields = [...newSteps[selectedStepIndex].fields];
    const index = stepFields.findIndex(f => f.id === field.id);
    if (index >= 0) {
      stepFields[index] = field;
      newSteps[selectedStepIndex] = { ...newSteps[selectedStepIndex], fields: stepFields };
      onChange({ ...schema, steps: newSteps });
    }
    setSelectedField(field);
  };

  const getStepTabStyle = (index: number): React.CSSProperties => ({
    padding: '8px 16px',
    background: index === selectedStepIndex ? '#0078d4' : 'white',
    color: index === selectedStepIndex ? 'white' : 'inherit',
    border: '1px solid #e1dfdd',
    borderRadius: '4px',
    cursor: 'pointer',
  });

  return (
    <div style={{
      background: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex',
        padding: '16px 24px',
        background: '#faf9f8',
        borderBottom: '1px solid #e1dfdd',
        gap: '4px',
      }}>
        {schema.steps.map((step, index) => (
          <button
            key={step.id}
            style={getStepTabStyle(index)}
            onClick={() => setSelectedStepIndex(index)}
            onMouseEnter={(e) => {
              if (index !== selectedStepIndex) {
                e.currentTarget.style.background = '#f3f2f1';
              }
            }}
            onMouseLeave={(e) => {
              if (index !== selectedStepIndex) {
                e.currentTarget.style.background = 'white';
              }
            }}
          >
            {step.title}
          </button>
        ))}
      </div>

      <div style={{ padding: '24px' }}>
        <div style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '24px',
          paddingBottom: '16px',
          borderBottom: '1px solid #e1dfdd',
        }}>
          <TextField
            value={currentStep.title}
            onChange={(_e, v) => {
              const newSteps = [...schema.steps];
              newSteps[selectedStepIndex] = { ...currentStep, title: v || '' };
              onChange({ ...schema, steps: newSteps });
            }}
            placeholder="步骤标题"
            styles={{ root: { width: 300 } }}
          />
          <TextField
            value={currentStep.description || ''}
            onChange={(_e, v) => {
              const newSteps = [...schema.steps];
              newSteps[selectedStepIndex] = { ...currentStep, description: v || undefined };
              onChange({ ...schema, steps: newSteps });
            }}
            placeholder="步骤描述"
            styles={{ root: { width: 400 } }}
          />
        </div>

        <DropZone
          stepId={currentStep.id}
          fields={currentStep.fields}
          onFieldSelect={handleSelectField}
          onFieldDelete={handleDeleteField}
        />
      </div>

      <PropertyPanel
        isOpen={isPropertyPanelOpen}
        field={selectedField || undefined}
        spFields={safeSpFields}
        onSave={handleSaveField}
        onClose={() => { setIsPropertyPanelOpen(false); setSelectedField(null); }}
      />
    </div>
  );
};
