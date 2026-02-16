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
      const lists = await this.sp.web.lists.select('Id', 'Title', 'Name', 'EnableAttachments')();
      return lists;
    } catch (error) {
      console.error('Error fetching lists:', error);
      throw error;
    }
  }

  async getListFields(listName: string): Promise<SPFieldInfo[]> {
    try {
      // 获取列表信息和字段
      const [listInfo, fields] = await Promise.all([
        this.sp.web.lists.getByTitle(listName).select('Id', 'Title', 'EnableAttachments')(),
        this.sp.web.lists.getByTitle(listName).fields.select(
          'Id', 'InternalName', 'Title', 'TypeAsString', 'Required', 'ReadOnlyField',
          'Hidden', 'FromBaseType', 'Choices', 'LookupList', 'LookupField',
          'AllowMultipleValues', 'MaxLength', 'TextField', 'TermSetId'
        )()
      ]);


      // 过滤掉隐藏字段、基类型字段和系统字段
      // 但保留 Title 字段（优先使用 Title，排除 LinkTitle 和 LinkTitleNoMenu 以避免重复）
      const hasTitleField = fields.some((f: any) => f.InternalName === 'Title' && !f.Hidden);

      const filteredFields = fields
        .filter((field: any) => {
          // 跳过 Taxonomy 字段关联的隐藏文本字段
          if (field.TypeAsString === 'Text' && field.FromBaseType) {
            // 检查是否是某个 Taxonomy 字段的 TextField
            const isTaxonomyTextField = fields.some((f: any) =>
              f.TextField === f.Id && (f.TypeAsString === 'TaxonomyFieldType' || f.TypeAsString === 'TaxonomyFieldTypeMulti')
            );
            if (isTaxonomyTextField) return false;
          }

          // 如果已经有 Title 字段，跳过 LinkTitle 和 LinkTitleNoMenu
          if (hasTitleField && (field.InternalName === 'LinkTitle' || field.InternalName === 'LinkTitleNoMenu')) {
            return false;
          }
          // 保留 Title 字段（Title, LinkTitle, LinkTitleNoMenu）
          if (field.InternalName === 'Title' || field.InternalName === 'LinkTitle' || field.InternalName === 'LinkTitleNoMenu') {
            return !field.Hidden;
          }
          // 其他字段过滤掉隐藏、基类型和系统字段
          return !field.Hidden && !field.FromBaseType && !this.isSystemField(field.InternalName);
        })
        .map((field: any) => this.mapToFieldInfo(field));
      // 如果列表启用了附件，添加附件字段
      if (listInfo.EnableAttachments) {
        const attachmentField = {
          id: 'attachment-field',
          internalName: 'Attachments',
          title: 'Attachments',
          type: SPFieldType.Attachments,
          required: false,
          readOnly: false,
        };
        filteredFields.push(attachmentField);
      }

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
      'ItemChildCount', 'FolderChildCount', 'ComplianceAssetId',
      // 注意：LinkTitle 和 LinkTitleNoMenu 是实际的 Title 字段，不应被过滤
    ];
    return systemFields.includes(internalName);
  }

  private mapToFieldInfo(field: any): SPFieldInfo {
    const type = this.mapFieldType(field.TypeAsString);
    // Title, LinkTitle 和 LinkTitleNoMenu 都映射为 "Title" 字段
    const isTitleField = field.InternalName === 'Title' || field.InternalName === 'LinkTitle' || field.InternalName === 'LinkTitleNoMenu';
    const internalName = isTitleField ? 'Title' : field.InternalName;
    const title = isTitleField ? 'Title' : (field.Title || field.InternalName);

    // 处理 Choices 字段 - SharePoint 可能返回不同格式
    let choices: string[] | undefined;
    if (field.Choices) {
      if (Array.isArray(field.Choices)) {
        choices = [...field.Choices];
      } else if (field.Choices.results && Array.isArray(field.Choices.results)) {
        choices = [...field.Choices.results];
      } else if (typeof field.Choices === 'string') {
        choices = field.Choices.split(';');
      }
    }

    return {
      id: field.Id,
      internalName,
      title,
      type,
      required: field.Required || false,
      readOnly: field.ReadOnlyField || false,
      choices,
      lookupList: field.LookupList || undefined,
      lookupField: field.LookupField || undefined,
      allowMultipleValues: field.AllowMultipleValues || false,
      maxLength: field.MaxLength || undefined,
      textField: field.TextField || undefined,
      termSetId: field.TermSetId || undefined,
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
      'Hyperlink': SPFieldType.Hyperlink,
      'Image': SPFieldType.Image,
      'Thumbnail': SPFieldType.Image,
      'Calculated': SPFieldType.Calculated,
      'TaxonomyFieldType': SPFieldType.Taxonomy,
      'TaxonomyFieldTypeMulti': SPFieldType.TaxonomyMulti,
    };
    // Try exact match first, then case-insensitive
    let result = typeMap[spType];
    if (!result) {
      const lowerKey = Object.keys(typeMap).find(k => k.toLowerCase() === spType.toLowerCase());
      if (lowerKey) {
        result = typeMap[lowerKey];
      }
    }
    if (!result && spType) {
      console.log(`[SharePointDataSource] Unknown field type: ${spType}, defaulting to Text`);
    }
    return result || SPFieldType.Text;
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
    [SPFieldType.URL]: 'url',
    [SPFieldType.Hyperlink]: 'url',
    [SPFieldType.Image]: 'image',
    [SPFieldType.Calculated]: 'text',
    [SPFieldType.Taxonomy]: 'taxonomy',
    [SPFieldType.TaxonomyMulti]: 'taxonomy',
    [SPFieldType.Attachments]: 'attachment',
  };
  return mapping[spFieldType] || 'text';
}
