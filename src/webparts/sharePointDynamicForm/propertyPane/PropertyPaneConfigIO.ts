import * as React from 'react';
import * as ReactDom from 'react-dom';
import {
  IPropertyPaneCustomFieldProps,
  IPropertyPaneField,
  PropertyPaneFieldType,
} from '@microsoft/sp-property-pane';

import { ConfigIOControl, ConfigIOControlProps } from './ConfigIOControl';

export interface ConfigIOFieldProps extends ConfigIOControlProps {
  key?: string;
}

class PropertyPaneConfigIOBuilder implements IPropertyPaneField<IPropertyPaneCustomFieldProps> {
  public type = PropertyPaneFieldType.Custom;
  public targetProperty: string;
  public properties: IPropertyPaneCustomFieldProps;

  private _elem?: HTMLElement;
  private _props: ConfigIOFieldProps;

  public constructor(targetProperty: string, props: ConfigIOFieldProps) {
    this.targetProperty = targetProperty;
    this._props = props;
    this.properties = {
      key: props.key ?? 'configIO',
      onRender: (elem: HTMLElement): void => {
        this._elem = elem;
        const controlProps: ConfigIOControlProps = {
          exportConfig: this._props.exportConfig,
          importConfig: this._props.importConfig,
          strings: this._props.strings,
        };
        ReactDom.render(React.createElement(ConfigIOControl, controlProps), elem);
      },
      onDispose: (): void => {
        if (this._elem) {
          ReactDom.unmountComponentAtNode(this._elem);
        }
      },
    };
  }
}

export function PropertyPaneConfigIO(
  targetProperty: string,
  props: ConfigIOFieldProps
): IPropertyPaneField<IPropertyPaneCustomFieldProps> {
  return new PropertyPaneConfigIOBuilder(targetProperty, props);
}
