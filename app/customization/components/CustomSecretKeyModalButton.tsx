import { getModalPropsApiKey } from "@/pages/settings-page/pages/api-keys-page/helpers/use-get-modal-props";

export const SecretKeyModalButton = ({
  userId,
}: {
  userId: string;
}): JSX.Element => {
  const modalProps = getModalPropsApiKey();

  return <></>;
};

export default SecretKeyModalButton;
