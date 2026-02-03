/**
 * SharePoint Data Source
 */

import { WebPartContext } from '@microsoft/sp-webpart-base';
import { SPFI, spfi } from '@pnp/sp';
import { SPFx as spSPFx } from '@pnp/sp/presets/all';
import '@pnp/sp/lists/web';
import '@pnp/sp/items/list';
import '@pnp/sp/fields/list';
import { SPFieldType, SPFieldInfo } from '../core/types';

export class SharePointDataSource {
  private sp: SPFI;

  constructor(private context: WebPartContext) {
    this.sp = spfi().using(spSPFx(this.context));
  }

  async getLists(): Promise<any[]> {
    try {
      const lists = await this.sp.web.lists.select('Id', 'Title', 'Name')();
      return lists;
    } catch (error) {
      console.error('Error fetching lists:', error);
      throw error;
    }
  }

  async getListFields(listName: string): Promise<SPFieldInfo[]> {
    try {
      // 获取列表字段，包括必要的属性用于判断是否显示
      const fields = await this.sp.web.lists.getByTitle(listName).fields.select(
        'Id', 'InternalName', 'Title', 'TypeAsString', 'Required', 'ReadOnlyField',
        'Hidden', 'FromBaseType', 'Choices', 'LookupList', 'LookupField',
        'AllowMultipleValues', 'MaxLength'
      )();

      // 过滤掉隐藏字段、基类型字段和系统字段
      const filteredFields = fields
        .filter((field: any) => !field.Hidden && !field.FromBaseType && !this.isSystemField(field.InternalName))
        .map((field: any) => this.mapToFieldInfo(field));

      return filteredFields;
    } catch (error) {
      console.error(`Error fetching fields for list ${listName}:`, error);
      throw error;
    }
  }

  private isSystemField(internalName: string): boolean {
    const systemFields = [
      'ID', 'Created', 'Modified', 'Author', 'Editor', 'OData__UIVersionString',
      'Attachments', 'GUID', 'ContentType', 'AppAuthor', 'AppEditor', 'Edit',
      'LinkTitleNoMenu', 'LinkTitle', 'ItemChildCount', 'FolderChildCount', 'ComplianceAssetId',
    ];
    return systemFields.includes(internalName);
  }

  private mapToFieldInfo(field: any): SPFieldInfo {
    const type = this.mapFieldType(field.TypeAsString);
    return {
      id: field.Id,
      internalName: field.InternalName,
      title: field.Title || field.InternalName,
      type,
      required: field.Required || false,
      readOnly: field.ReadOnlyField || false,
      choices: field.Choices ? [...field.Choices.results] : undefined,
      lookupList: field.LookupList || undefined,
      lookupField: field.LookupField || undefined,
      allowMultipleValues: field.AllowMultipleValues || false,
      maxLength: field.MaxLength || undefined,
    };
  }

  private mapFieldType(spType: string): SPFieldType {
    const typeMap: Record<string, SPFieldType> = {
      'Text': SPFieldType.Text,
      'Note': SPFieldType.Note,
      'Number': SPFieldType.Number,
      'Integer': SPFieldType.Integer,
      'Currency': SPFieldType.Number,
      'DateTime': SPFieldType.DateTime,
      'Choice': SPFieldType.Choice,
      'MultiChoice': SPFieldType.MultiChoice,
      'Lookup': SPFieldType.Lookup,
      'User': SPFieldType.User,
      'UserMulti': SPFieldType.UserMulti,
      'Boolean': SPFieldType.Boolean,
      'URL': SPFieldType.URL,
      'Calculated': SPFieldType.Calculated,
    };
    return typeMap[spType] || SPFieldType.Text;
  }

  async getItem(listName: string, itemId: number): Promise<any> {
    try {
      const item = await this.sp.web.lists.getByTitle(listName).items.getById(itemId)();
      return item;
    } catch (error) {
      console.error(`Error fetching item ${itemId} from list ${listName}:`, error);
      throw error;
    }
  }

  async createItem(listName: string, itemData: any): Promise<any> {
    try {
      const newItem = await this.sp.web.lists.getByTitle(listName).items.add(itemData);
      return newItem.data;
    } catch (error) {
      console.error(`Error creating item in list ${listName}:`, error);
      throw error;
    }
  }

  async updateItem(listName: string, itemId: number, itemData: any): Promise<any> {
    try {
      const updatedItem = await this.sp.web.lists.getByTitle(listName).items.getById(itemId).update(itemData);
      return updatedItem.data;
    } catch (error) {
      console.error(`Error updating item ${itemId} in list ${listName}:`, error);
      throw error;
    }
  }

  async getLookupChoices(lookupList: string, lookupField: string = 'Title'): Promise<any[]> {
    try {
      const items = await this.sp.web.lists.getById(lookupList).items.select('Id', lookupField).top(5000)();
      return items;
    } catch (error) {
      console.error(`Error fetching lookup choices from list ${lookupList}:`, error);
      throw error;
    }
  }

  async getUserSuggestions(filter: string = ''): Promise<any[]> {
    try {
      if (!filter) return [];
      const users = await this.sp.web.siteUsers.select('Id', 'Title', 'Email').filter(`substringof('${filter}', Title)`).top(20)();
      return users;
    } catch (error) {
      console.error('Error fetching user suggestions:', error);
      return [];
    }
  }
}

export function mapSPFieldToFormField(spFieldType: SPFieldType): string {
  const mapping: Record<SPFieldType, string> = {
    [SPFieldType.Text]: 'text',
    [SPFieldType.Note]: 'multiline',
    [SPFieldType.Number]: 'number',
    [SPFieldType.Integer]: 'number',
    [SPFieldType.DateTime]: 'datetime',
    [SPFieldType.Choice]: 'dropdown',
    [SPFieldType.MultiChoice]: 'multiselect',
    [SPFieldType.Lookup]: 'lookup',
    [SPFieldType.User]: 'person',
    [SPFieldType.UserMulti]: 'person',
    [SPFieldType.Boolean]: 'boolean',
    [SPFieldType.URL]: 'text',
    [SPFieldType.Calculated]: 'text',
  };
  return mapping[spFieldType] || 'text';
}
