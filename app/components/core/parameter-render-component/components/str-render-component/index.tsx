import { InputProps, StrRenderComponentType } from "../../types";
import CopyFieldAreaComponent from "../copy-field-area-component";
import DropdownComponent from "../dropdown-component";
import InputGlobalComponent from "../input-global-component";
import TextAreaComponent from "../text-area-component";
import WebhookFieldComponent from "../webhook-field-component";

export function StrRenderComponent({
  templateData,
  name,
  display_name,
  placeholder,
  ...baseInputProps
}: InputProps<string, StrRenderComponentType>) {
  const { handleOnNewValue, id, isToolMode, nodeInformationMetadata } =
    baseInputProps;

  const noOptions = !templateData.options;
  const isMultiline = templateData.multiline;
  const copyField = templateData.copy_field;
  const hasOptions = !!templateData.options;
  const isWebhook = nodeInformationMetadata?.nodeType === "webhook";

  if (noOptions) {
    if (isMultiline) {
      if (isWebhook) {
        return <WebhookFieldComponent {...baseInputProps} />;
      }

      if (copyField) {
        return <CopyFieldAreaComponent {...baseInputProps} />;
      }

      return (
        <TextAreaComponent
          {...baseInputProps}
          updateVisibility={() => {
            if (templateData.password !== undefined) {
              handleOnNewValue(
                { password: !templateData.password },
                { skipSnapshot: true },
              );
            }
          }}
          id={`textarea_${id}`}
          isToolMode={isToolMode}
        />
      );
    }

    return (
      <InputGlobalComponent
        {...baseInputProps}
        password={templateData.password}
        load_from_db={templateData.load_from_db}
        placeholder={placeholder}
        display_name={display_name}
        id={`input-${name}`}
        isToolMode={isToolMode}
      />
    );
  } else if (hasOptions) {
    return (
      <DropdownComponent
        {...baseInputProps}
        dialogInputs={templateData.dialog_inputs}
        options={templateData.options ?? []}
        optionsMetaData={templateData.options_metadata}
        combobox={templateData.combobox}
        name={templateData?.name!}
      />
    );
  } else {
    return null
  }
}
