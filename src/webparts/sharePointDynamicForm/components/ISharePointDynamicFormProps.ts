import { FormMode } from '../../../formEngine/core/types';

export interface ISharePointDynamicFormProps {
  formSchemaJson: string;
  listName: string;
  mode: FormMode;
  useItemId: boolean;
  itemId: number;
  itemIdQueryParam?: string;
  isDarkTheme: boolean;
  hasTeamsContext: boolean;
  context: any;
  showFieldDescription?: boolean;
}
