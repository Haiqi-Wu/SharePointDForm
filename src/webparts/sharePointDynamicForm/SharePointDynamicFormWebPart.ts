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
import { PropertyPaneConfigIO } from './propertyPane/PropertyPaneConfigIO';
import { buildConfigExport, parseConfigExport } from './utils/configIO';

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

  private exportConfigJson(): string {
    return JSON.stringify(buildConfigExport(this.properties), null, 2);
  }

  private async importConfigJson(json: string): Promise<{ ok: boolean; level?: 'success' | 'warning' | 'error'; message?: string }> {
    const parsed = parseConfigExport(json);
    if (!parsed.ok) {
      return { ok: false, level: 'error', message: strings.ConfigImportInvalid };
    }

    const imported = parsed.value || {};
    const nextProps: ISharePointDynamicFormWebPartProps = {
      formSchemaJson: imported.formSchemaJson ?? '',
      listName: imported.listName ?? '',
      mode: (imported.mode as FormMode) ?? 'new',
      useItemId: imported.useItemId ?? false,
      itemId: imported.itemId ?? 0,
      itemIdQueryParam: imported.itemIdQueryParam ?? 'ID',
      isInDesignerMode: imported.isInDesignerMode ?? false,
      labelPosition: imported.labelPosition ?? 'top',
      showFieldDescription: imported.showFieldDescription ?? false,
      submitButtonLabel: imported.submitButtonLabel,
      showCancelButton: imported.showCancelButton ?? false,
      cancelButtonLabel: imported.cancelButtonLabel,
      cancelRedirectUrl: imported.cancelRedirectUrl,
      submitRedirectUrl: imported.submitRedirectUrl,
      onSubmitMessage: imported.onSubmitMessage,
    };

    this.properties.formSchemaJson = nextProps.formSchemaJson;
    this.properties.listName = nextProps.listName;
    this.properties.mode = nextProps.mode;
    this.properties.useItemId = nextProps.useItemId;
    this.properties.itemId = nextProps.itemId;
    this.properties.itemIdQueryParam = nextProps.itemIdQueryParam;
    this.properties.isInDesignerMode = nextProps.isInDesignerMode;
    this.properties.labelPosition = nextProps.labelPosition;
    this.properties.showFieldDescription = nextProps.showFieldDescription;
    this.properties.submitButtonLabel = nextProps.submitButtonLabel;
    this.properties.showCancelButton = nextProps.showCancelButton;
    this.properties.cancelButtonLabel = nextProps.cancelButtonLabel;
    this.properties.cancelRedirectUrl = nextProps.cancelRedirectUrl;
    this.properties.submitRedirectUrl = nextProps.submitRedirectUrl;
    this.properties.onSubmitMessage = nextProps.onSubmitMessage;
    this._isInDesignerMode = nextProps.isInDesignerMode ?? false;
    this.context.propertyPane.refresh();
    this.render();

    if (nextProps.listName && this._lists.length > 0) {
      const hasList = this._lists.some((list) => list.key === nextProps.listName);
      if (!hasList) {
        return { ok: true, level: 'warning', message: strings.ConfigImportWarningList };
      }
    }

    return { ok: true, level: 'success', message: strings.ConfigImportSuccess };
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
              groupName: strings.PropertyGroupBasic,
              groupFields: [
                PropertyPaneDropdown('listName', {
                  label: strings.PropListLabel,
                  options: this._lists,
                  selectedKey: this.properties.listName,
                }),
                PropertyPaneDropdown('mode', {
                  label: strings.PropModeLabel,
                  options: [
                    { key: 'new', text: strings.PropModeNew },
                    { key: 'edit', text: strings.PropModeEdit },
                    { key: 'view', text: strings.PropModeView },
                  ],
                }),
                PropertyPaneTextField('itemIdQueryParam', {
                  label: strings.PropItemIdQueryParamLabel,
                  placeholder: 'ID',
                  value: this.properties.itemIdQueryParam,
                }),
                PropertyPaneDropdown('labelPosition', {
                  label: strings.PropLabelPositionLabel,
                  options: [
                    { key: 'top', text: strings.PropLabelTop },
                    { key: 'left', text: strings.PropLabelLeft },
                  ],
                  selectedKey: this.properties.labelPosition || 'top',
                }),
                PropertyPaneToggle('showFieldDescription', {
                  label: strings.PropShowFieldDescriptionLabel,
                  onText: strings.PropToggleOn,
                  offText: strings.PropToggleOff,
                  checked: this.properties.showFieldDescription,
                }),
              ]
            },
            {
              groupName: strings.PropertyGroupButtons,
              groupFields: [
                PropertyPaneTextField('submitButtonLabel', {
                  label: strings.PropSubmitButtonLabel,
                  placeholder: strings.PropSubmitButtonPlaceholder,
                  value: this.properties.submitButtonLabel,
                }),
                PropertyPaneToggle('showCancelButton', {
                  label: strings.PropShowCancelButtonLabel,
                  onText: strings.PropToggleOn,
                  offText: strings.PropToggleOff,
                  checked: this.properties.showCancelButton,
                }),
                PropertyPaneTextField('cancelButtonLabel', {
                  label: strings.PropCancelButtonLabel,
                  placeholder: strings.PropCancelButtonPlaceholder,
                  value: this.properties.cancelButtonLabel,
                }),
                PropertyPaneTextField('cancelRedirectUrl', {
                  label: strings.PropCancelRedirectUrlLabel,
                  placeholder: strings.PropCancelRedirectUrlPlaceholder,
                  value: this.properties.cancelRedirectUrl,
                }),
                PropertyPaneTextField('submitRedirectUrl', {
                  label: strings.PropSubmitRedirectUrlLabel,
                  placeholder: strings.PropSubmitRedirectUrlPlaceholder,
                  value: this.properties.submitRedirectUrl,
                }),
                PropertyPaneTextField('onSubmitMessage', {
                  label: strings.PropSubmitSuccessMessageLabel,
                  placeholder: strings.PropSubmitSuccessMessagePlaceholder,
                  value: this.properties.onSubmitMessage,
                  multiline: true,
                  resizable: true,
                  rows: 2,
                }),
              ]
            },
            {
              groupName: strings.PropertyGroupConfigIO,
              groupFields: [
                PropertyPaneConfigIO('configIO', {
                  exportConfig: () => this.exportConfigJson(),
                  importConfig: (json) => this.importConfigJson(json),
                  strings: {
                    exportLabel: strings.ConfigExportButton,
                    importLabel: strings.ConfigImportButton,
                    importSuccess: strings.ConfigImportSuccess,
                    importInvalid: strings.ConfigImportInvalid,
                    importReadError: strings.ConfigImportReadError,
                    importWarningList: strings.ConfigImportWarningList,
                  },
                }),
              ]
            },
          ]
        }
      ]
    };
  }
}
