import { ENABLE_VOICE_ASSISTANT } from "@/customization/feature-flags";
import { FilePreviewType } from "@/types/components";
import React from "react";
import {
  CHAT_INPUT_PLACEHOLDER,
  CHAT_INPUT_PLACEHOLDER_SEND,
} from "../../../../../../constants/constants";
import FilePreview from "../../file-component/components/FilePreview";
import ButtonSendWrapper from "./ButtonSendWrapper";
import TextAreaWrapper from "./TextAreaWrapper";
import UploadFileButton from "./UploadFileButton";
import VoiceButton from "./voice-assistant/components/VoiceButton";

interface InputWrapperProps {
  isBuilding: boolean;
  checkSendingOk: (event: React.KeyboardEvent<HTMLTextAreaElement>) => boolean;
  send: () => void;
  noInput: boolean;
  chatValue: string;
  inputRef: React.RefObject<HTMLTextAreaElement>;
  files: FilePreviewType[];
  isDragging: boolean;
  handleDeleteFile: (file: FilePreviewType) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleButtonClick: () => void;
  setShowAudioInput: (value: boolean) => void;
  currentFlowId: string;
  playgroundPage: boolean;
  isStreaming?: boolean;
  stopStreaming?: () => void;
  chatPage?: boolean;
}

const InputWrapper: React.FC<InputWrapperProps> = ({
  isBuilding,
  checkSendingOk,
  send,
  noInput,
  chatValue,
  inputRef,
  files,
  isDragging,
  handleDeleteFile,
  fileInputRef,
  handleFileChange,
  handleButtonClick,
  setShowAudioInput,
  currentFlowId,
  playgroundPage,
  isStreaming,
  stopStreaming,
  chatPage,
}) => {
  const classNameFilePreview = `flex w-full items-center gap-2 py-2 overflow-auto custom-scroll`;

  return (
    <div className="flex w-full flex-col-reverse">
      <div
        data-testid="input-wrapper"
        className="flex w-full flex-col rounded-md border border-input p-4 hover:border-muted-foreground focus:border-[1.75px] has-focus:border-primary"
      >
        <TextAreaWrapper
          isBuilding={isBuilding}
          checkSendingOk={checkSendingOk}
          send={send}
          noInput={noInput}
          chatValue={chatValue}
          CHAT_INPUT_PLACEHOLDER={CHAT_INPUT_PLACEHOLDER}
          CHAT_INPUT_PLACEHOLDER_SEND={CHAT_INPUT_PLACEHOLDER_SEND}
          inputRef={inputRef}
          files={files}
          isDragging={isDragging}
        />
        <div className={classNameFilePreview}>
          {files.map((file) => (
            <FilePreview
              error={file.error}
              file={file.file}
              loading={file.loading}
              key={file.id}
              onDelete={() => {
                handleDeleteFile(file);
              }}
            />
          ))}
        </div>
        <div className="flex w-full items-end justify-between">
          {!playgroundPage && (
            <div className={isBuilding ? "cursor-not-allowed" : ""}>
              <UploadFileButton
                isBuilding={isBuilding}
                fileInputRef={fileInputRef}
                handleFileChange={handleFileChange}
                handleButtonClick={handleButtonClick}
              />
            </div>
          )}
          <div className="flex items-center gap-2">
            {/* {ENABLE_VOICE_ASSISTANT && (
              <VoiceButton toggleRecording={() => setShowAudioInput(true)} />
            )} */}

            <div className={playgroundPage ? "ml-auto" : ""}>
              <ButtonSendWrapper
                send={send}
                noInput={noInput}
                chatValue={chatValue}
                files={files}
                isStreaming={isStreaming}
                stopStreaming={stopStreaming}
                chatPage={chatPage}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InputWrapper;
