import { AuthContext } from "@/contexts/auth-context";
import { useGetBuildsMutation } from "@/controllers/API/queries/_builds/use-get-builds-polling-mutation";
import SecretKeyModalButton from "@/customization/components/CustomSecretKeyModalButton";
import useFlowStore from "@/stores/flow-store";
import { useContext, useEffect, useRef, useState } from "react";
import { InputProps, TextAreaComponentType } from "../../types";
import CopyFieldAreaComponent from "../copy-field-area-component";
import TextAreaComponent from "../text-area-component";

export default function WebhookFieldComponent({
  value,
  handleOnNewValue,
  editNode = false,
  id = "",
  nodeInformationMetadata,
  ...baseInputProps
}: InputProps<string, TextAreaComponentType>): JSX.Element {
  const { userData } = useContext(AuthContext);
  const [userId, setUserId] = useState("");
  const { mutate: getBuildsMutation } = useGetBuildsMutation();
  const hasInitialized = useRef(false);

  const isBackendUrl = nodeInformationMetadata?.variableName === "endpoint";
  const isCurlWebhook = nodeInformationMetadata?.variableName === "curl";
  const isAuth = nodeInformationMetadata?.isAuth;
  const showGenerateToken = isBackendUrl && !editNode && !isAuth;

  useEffect(() => {
    if (!editNode && isBackendUrl && !hasInitialized.current) {
      hasInitialized.current = true;
      getBuildsMutation({
        flowId: nodeInformationMetadata?.flowId!,
      });
    }
  }, []);

  useEffect(() => {
    if (userData) {
      setUserId(userData.id);
    }
  }, [userData]);

  return (
    <div className="grid w-full gap-2">
      {isBackendUrl && (
        <div>
          <CopyFieldAreaComponent
            id={id}
            value={value}
            editNode={editNode}
            handleOnNewValue={handleOnNewValue}
            {...baseInputProps}
          />
        </div>
      )}

      {isCurlWebhook && (
        <div>
          <TextAreaComponent
            id={id}
            value={value}
            editNode={editNode}
            handleOnNewValue={handleOnNewValue}
            {...baseInputProps}
            nodeInformationMetadata={nodeInformationMetadata}
          />
        </div>
      )}

      {showGenerateToken && (
        <div>
          <SecretKeyModalButton userId={userId} />
        </div>
      )}
    </div>
  );
}
