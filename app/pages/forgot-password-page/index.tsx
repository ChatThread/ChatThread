// src/app/forgot-password/page.tsx
"use client";

import { CONTROL_FORGOT_PASSWORD_STATE } from "../../constants/constants";
import { useContext, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import InputComponent from "../../components/core/parameter-render-component/components/input-component";
import { Input } from "@/components/ui/input";
import * as Form from "@radix-ui/react-form";
import {
  inputHandlerEventType,
  forgotPasswordInputStateType,
  UserSendCodeType,
  UserRegisterType,
} from "../../types/components";
import { useCustomNavigate } from "@/customization/hooks/use-custom-navigate";
import ChatThreadLogo from "@/assets/logo.svg?react";
import { toast } from "sonner";
import { useSendCode,useForgot } from "@/controllers/API/queries/auth";


export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"email" | "verify">("email");
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const navigate = useCustomNavigate();
  const ref = useRef<HTMLInputElement>(null);
  const [inputState, setInputState] = useState<forgotPasswordInputStateType>(CONTROL_FORGOT_PASSWORD_STATE);
  const [isDisabled, setDisableBtn] = useState<boolean>(true);

  const { username, code, password, cnfPassword } = inputState;
  const { mutate: mutateSendCode } = useSendCode();
  const { mutate: mutateForgot } = useForgot();

  function handleInput({
    target: { name, value },
  }: inputHandlerEventType): void {
    setInputState((prev) => ({ ...prev, [name]: value }));
  }

  useEffect(() => {
    if (password !== cnfPassword) return setDisableBtn(true);
    if (password === "" || cnfPassword === "") return setDisableBtn(true);
    if (username === "") return setDisableBtn(true);
    setDisableBtn(false);
  }, [password, cnfPassword, username, handleInput]);

  async function sendVerificationCode() {
    if (!username) {
      ref.current?.reportValidity();
      return;
    }

    setIsSendingCode(true);
    try {
      setStep("verify")
      // 设置300秒倒计时
      setCountdown(300);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      const sendCodeRequest : UserSendCodeType = {
        username: username.trim()
      }
      mutateSendCode(sendCodeRequest, {
        onSuccess: (user) => {
          toast.success("verification code send success")
        },
        onError: (error) => {
          const {
            response: {
              data: { detail },
            },
          } = error;
          toast.error(detail);
          setStep("email")
        },
      })
    } catch (error) {
      toast.error("verification code send failed");
    } finally {
      setIsSendingCode(false);
    }
  }

  // 重置密码
  async function resetPassword() {
    if (password !== cnfPassword) {
      return;
    }
    setIsSendingCode(true);
    try {
      const newUser: UserRegisterType = {
        username: username.trim(),
        password: password.trim(),
        code: code.trim(),
      };
      const toastId = toast.loading("Loading...");
      mutateForgot(newUser, {
        onSuccess: (data) => {
          toast.dismiss(toastId);
          toast.success("Password reset successful, please login again")
          navigate(-1)
        },
        onError: (error) => {
          const err_msg = error.message
          if(error.response?.data && error.response?.data.detail) {
            toast.error(error.response?.data.detail, { id: toastId });
          }else{
            toast.error(err_msg, { id: toastId });
          }
        },
      })
    } catch (error) {
      toast.error("Password reset failed");
    } finally {
      setIsSendingCode(false);
    }
  }

  return (
    <Form.Root
      onSubmit={(event) => {
        event.preventDefault();
        if (step === "email") {
          sendVerificationCode();
        } else {
          resetPassword();
        }
      }}
      className="h-full w-full"
    >
      <div className="flex h-full w-full flex-col items-center justify-center bg-muted">
        <div className="flex w-72 flex-col items-center justify-center gap-2">
          <ChatThreadLogo
            title="ChatThread logo"
            className="mb-4 h-10 w-10 scale-[1.5]"
          />
          <span className="mb-6 text-2xl font-semibold text-primary">
            {step === "email" ? "Forgot password" : "Reset password"}
          </span>

          {step === "email" ? (
            <>
              <div className="mb-3 w-full">
                <Form.Field name="email">
                  <Form.Label className="data-[invalid]:label-invalid">
                    Email <span className="font-medium text-destructive">*</span>
                  </Form.Label>

                  <Form.Control asChild>
                    <Input
                      type="email"
                      onChange={({ target: { value } }) => {
                        handleInput({ target: { name: "username", value } });
                      }}
                      value={username}
                      className="w-full"
                      required
                      placeholder="example@example.com"
                    />
                  </Form.Control>

                  <Form.Message match="valueMissing" className="field-invalid">
                    Please enter your email
                  </Form.Message>
                </Form.Field>
              </div>

              <div className="w-full">
                <Form.Submit asChild>
                  <Button className="mr-3 mt-6 w-full" type="submit" disabled={isSendingCode}>
                    {isSendingCode ? "Sending..." : "Send Verification Code"}
                  </Button>
                </Form.Submit>
              </div>
            </>
          ) : (
            <>
              <div className="mb-3 w-full">
                <Form.Field name="verificationCode">
                  <Form.Label className="data-[invalid]:label-invalid">
                    Verification code <span className="font-medium text-destructive">*</span>
                  </Form.Label>
                  
                  <div className="flex gap-2">
                    <Form.Control asChild>
                      <Input
                        type="text"
                        maxLength={6}
                        onChange={({ target: { value } }) => {
                          handleInput({ target: { name: "code", value } });
                        }}
                        value={code}
                        className="flex-1"
                        required
                        placeholder="verification code"
                      />
                    </Form.Control>
                    
                    <Button
                      type="button"
                      onClick={sendVerificationCode}
                      disabled={isSendingCode || countdown > 0}
                      className="w-32 px-0"
                    >
                      {countdown > 0 ? `${countdown}s` : "Send"}
                    </Button>
                  </div>

                  <Form.Message match="valueMissing" className="field-invalid">
                    Please enter your verification code
                  </Form.Message>
                </Form.Field>
              </div>

              <div className="mb-3 w-full">
                <Form.Field name="newPassword">
                  <Form.Label className="data-[invalid]:label-invalid">
                    New password <span className="font-medium text-destructive">*</span>
                  </Form.Label>

                  <InputComponent
                    onChange={(value) => {
                      handleInput({ target: { name: "password", value } });
                    }}
                    value={password}
                    isForm
                    password={true}
                    required
                    placeholder="至少8位字符"
                    className="w-full"
                  />

                  <Form.Message className="field-invalid" match="valueMissing">
                    Please enter a new password
                  </Form.Message>

                  {password != cnfPassword && cnfPassword!="" && (
                    <Form.Message className="field-invalid">
                      Passwords do not match
                    </Form.Message>
                  )}
                </Form.Field>
              </div>

              <div className="mb-3 w-full">
                <Form.Field name="confirmPassword">
                  <Form.Label className="data-[invalid]:label-invalid">
                    Confirm your password <span className="font-medium text-destructive">*</span>
                  </Form.Label>

                  <InputComponent
                    onChange={(value) => {
                      handleInput({ target: { name: "cnfPassword", value } });
                    }}
                    value={cnfPassword}
                    isForm
                    password={true}
                    required
                    placeholder="Confirm your password"
                    className="w-full"
                  />

                  <Form.Message className="field-invalid" match="valueMissing">
                    Please confirm your password
                  </Form.Message>
                </Form.Field>
              </div>

              <div className="w-full">
                <Form.Submit asChild>
                  <Button 
                    disabled={isDisabled} 
                    className="mr-3 mt-6 w-full" 
                    type="submit">
                    Reset password
                  </Button>
                </Form.Submit>
              </div>
            </>
          )}

          <div className="w-full">
            <Button 
              className="w-full" 
              variant="outline" 
              type="button" 
              onClick={() => navigate(-1)}
            >
              Back to login
            </Button>
          </div>
        </div>
      </div>
    </Form.Root>
  );
}