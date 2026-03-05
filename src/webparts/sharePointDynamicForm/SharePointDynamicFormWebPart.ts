import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version, DisplayMode } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneDropdown,
  PropertyPaneToggle,
  PropertyPaneTextField,
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { IReadonlyTheme } from '@microsoft/sp-component-base';

import * as strings from 'SharePointDynamicFormWebPartStrings';
import { SharePointDataSource } from '../../formEngine/data/SharePointDataSource';
import { FormSchema, FormMode } from '../../formEngine/core/types';
import { SharePointDynamicFormContainer } from './components/SharePointDynamicForm';

export interface ISharePointDynamicFormWebPartProps {
  formSchemaJson: string;
  listName: string;
  mode: FormMode;
  useItemId: boolean;
  itemId: number;
  itemIdQueryParam?: string;
  isInDesignerMode: boolean;
  labelPosition?: 'top' | 'left';
  showFieldDescription?: boolean;
  // 按钮配置
  submitButtonLabel?: string;
  showCancelButton?: boolean;
  cancelButtonLabel?: string;
  cancelRedirectUrl?: string;
  submitRedirectUrl?: string;
  onSubmitMessage?: string;
}

export interface IDropdownOption {
  key: string | number;
  text: string;
}

export default class SharePointDynamicFormWebPart extends BaseClientSideWebPart<ISharePointDynamicFormWebPartProps> {

  private _isDarkTheme: boolean = false;
  private _lists: IDropdownOption[] = [];
  private _isInDesignerMode: boolean = false;

  public render(): void {
    const element: React.ReactElement = React.createElement(
      SharePointDynamicFormContainer,
      {
        isInDesignerMode: this.properties.isInDesignerMode ?? false,
        onToggleDesignerMode: () => this.toggleDesignerMode(),
        formSchemaJson: this.properties.formSchemaJson || '',
        labelPosition: this.properties.labelPosition || 'top',
        listName: this.properties.listName || '',
        mode: this.properties.mode || 'new',
        useItemId: this.properties.useItemId || false,
        itemId: this.properties.itemId || 0,
        itemIdQueryParam: this.properties.itemIdQueryParam || 'ID',
        isDarkTheme: this._isDarkTheme,
        hasTeamsContext: !!this.context.sdks.microsoftTeams,
        context: this.context,
        onSaveSchema: (schema) => this.saveSchema(schema),
        isPageEditMode: this.displayMode === DisplayMode.Edit,
        showFieldDescription: this.properties.showFieldDescription,
        // 按钮配置
        submitButtonLabel: this.properties.submitButtonLabel,
        showCancelButton: this.properties.showCancelButton,
        cancelButtonLabel: this.properties.cancelButtonLabel,
        cancelRedirectUrl: this.properties.cancelRedirectUrl,
        submitRedirectUrl: this.properties.submitRedirectUrl,
        onSubmitMessage: this.properties.onSubmitMessage,
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onInit(): Promise<void> {
    return this._getEnvironmentMessage().then(() => {
      return this.loadLists();
    });
  }

  private async loadLists(): Promise<void> {
    try {
      const dataSource = new SharePointDataSource(this.context);
      const lists = await dataSource.getLists();

      this._lists = lists.map((list: any) => ({
        key: list.Title,
        text: list.Title,
      }));

      this.context.propertyPane.refresh();
    } catch (error) {
      console.error('Error loading lists:', error);
    }
  }

  private _getEnvironmentMessage(): Promise<string> {
    if (!!this.context.sdks.microsoftTeams) {
      return this.context.sdks.microsoftTeams.teamsJs.app.getContext()
        .then(context => {
          let environmentMessage: string = '';
          switch (context.app.host.name) {
            case 'Office':
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentOffice : strings.AppOfficeEnvironment;
              break;
            case 'Outlook':
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentOutlook : strings.AppOutlookEnvironment;
              break;
            case 'Teams':
            case 'TeamsModern':
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentTeams : strings.AppTeamsTabEnvironment;
              break;
            default:
              environmentMessage = strings.UnknownEnvironment;
          }
          return environmentMessage;
        });
    }
    return Promise.resolve(this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentSharePoint : strings.AppSharePointEnvironment);
  }

  protected onThemeChanged(currentTheme: IReadonlyTheme | undefined): void {
    if (!currentTheme) {
      return;
    }

    this._isDarkTheme = !!currentTheme.isInverted;
    const {
      semanticColors
    } = currentTheme;

    if (semanticColors) {
      this.domElement.style.setProperty('--bodyText', semanticColors.bodyText || null);
      this.domElement.style.setProperty('--link', semanticColors.link || null);
      this.domElement.style.setProperty('--linkHovered', semanticColors.linkHovered || null);
    }
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  private toggleDesignerMode(): void {
    this._isInDesignerMode = !this._isInDesignerMode;
    this.properties.isInDesignerMode = this._isInDesignerMode;
    this.render();
  }

  private saveSchema(schema: FormSchema): void {
    this.properties.formSchemaJson = JSON.stringify(schema);
    // 刷新属性面板以保存更改
    this.context.propertyPane.refresh();
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: '基本设置',
              groupFields: [
                PropertyPaneDropdown('listName', {
                  label: 'SharePoint 列表',
                  options: this._lists,
                  selectedKey: this.properties.listName,
                }),
                PropertyPaneDropdown('mode', {
                  label: '表单模式',
                  options: [
                    { key: 'new', text: '新建' },
                    { key: 'edit', text: '编辑' },
                    { key: 'view', text: '查看' },
                  ],
                }),
                PropertyPaneTextField('itemIdQueryParam', {
                  label: 'ItemId 参数名',
                  placeholder: 'ID',
                  value: this.properties.itemIdQueryParam,
                }),
                PropertyPaneDropdown('labelPosition', {
                  label: '标签位置',
                  options: [
                    { key: 'top', text: '上方' },
                    { key: 'left', text: '左侧' },
                  ],
                  selectedKey: this.properties.labelPosition || 'top',
                }),
                PropertyPaneToggle('showFieldDescription', {
                  label: '显示字段描述',
                  onText: '显示',
                  offText: '隐藏',
                  checked: this.properties.showFieldDescription,
                }),
              ]
            },
            {
              groupName: '按钮配置',
              groupFields: [
                PropertyPaneTextField('submitButtonLabel', {
                  label: '提交按钮文字',
                  placeholder: '提交（默认）',
                  value: this.properties.submitButtonLabel,
                }),
                PropertyPaneToggle('showCancelButton', {
                  label: '显示取消按钮',
                  onText: '显示',
                  offText: '隐藏',
                  checked: this.properties.showCancelButton,
                }),
                PropertyPaneTextField('cancelButtonLabel', {
                  label: '取消按钮文字',
                  placeholder: '取消（默认）',
                  value: this.properties.cancelButtonLabel,
                }),
                PropertyPaneTextField('cancelRedirectUrl', {
                  label: '取消后跳转URL',
                  placeholder: '留空则关闭表单',
                  value: this.properties.cancelRedirectUrl,
                }),
                PropertyPaneTextField('submitRedirectUrl', {
                  label: '提交后跳转URL',
                  placeholder: '留空则显示成功消息',
                  value: this.properties.submitRedirectUrl,
                }),
                PropertyPaneTextField('onSubmitMessage', {
                  label: '提交成功消息',
                  placeholder: '表单提交成功！（默认）',
                  value: this.properties.onSubmitMessage,
                  multiline: true,
                  resizable: true,
                  rows: 2,
                }),
              ]
            },
          ]
        }
      ]
    };
  }
}
