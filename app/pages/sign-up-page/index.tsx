import InputComponent from "@/components/core/parameter-render-component/components/input-component";
import { useRegister, useSendCode } from "@/controllers/API/queries/auth";
import { useCustomNavigate } from "@/customization/hooks/use-custom-navigate";
import * as Form from "@radix-ui/react-form";
import { FormEvent, useEffect, useRef, useState,useContext } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { AuthContext } from "../../contexts/auth-context";
import {
  CONTROL_INPUT_STATE,
} from "../../constants/constants";
import {
  UserRegisterType,
  UserSendCodeType,
  inputHandlerEventType,
  signUpInputStateType,
} from "../../types/components";
import { toast } from "sonner";

export default function SignUp(): JSX.Element {
  const [inputState, setInputState] =
    useState<signUpInputStateType>(CONTROL_INPUT_STATE);

  const [isDisabled, setDisableBtn] = useState<boolean>(true);

  const { password, cnfPassword, username, code} = inputState;
  const navigate = useCustomNavigate();
  const [countdown, setCountdown] = useState(0);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const { mutate: mutateRegister } = useRegister();
  const { mutate: mutateSendCode } = useSendCode();

  const [sendCodeTip, setSendCodeTip] = useState("Send");
  const ref = useRef<HTMLInputElement>(null);
  const { login } = useContext(AuthContext);
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
      toast.success("verification code sent");
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
          // navigate("/chat");
        },
        onError: (error) => {
          const {
            response: {
              data: { detail },
            },
          } = error;
          toast.error(detail);
        },
      })
    } catch (error) {
      toast.error("verification code send failed");
    } finally {
      setIsSendingCode(false);
    }
  }

  function handleSignup(): void {
    const { username, password } = inputState;
    const newUser: UserRegisterType = {
      username: username.trim(),
      password: password.trim(),
      code: code.trim(),
    };
    const toastId = toast.loading("Loading...");
    mutateRegister(newUser, {
      onSuccess: (data) => {
        toast.dismiss(toastId);
        localStorage.setItem("authToken", data.token.access_token);
        localStorage.setItem("authRefreshToken", data.token.refresh_token);
        localStorage.setItem("folderId", data.folder.id);
        localStorage.setItem("folderName", data.folder.name);
        login(data.token.access_token, "login", data.token.refresh_token);
        navigate(-1);
        navigate(-1);
      },
      onError: (error) => {
        const err_msg = error.message
        if(error.response?.data && error.response?.data.detail) {
          toast.error(error.response?.data.detail, { id: toastId });
        }else{
          toast.error(err_msg, { id: toastId });
        }
      },
    });
  }

  return (
    <Form.Root
      onSubmit={(event: FormEvent<HTMLFormElement>) => {
        if (password === "") {
          event.preventDefault();
          return;
        }
        const data = Object.fromEntries(new FormData(event.currentTarget));
        event.preventDefault();
      }}
      className="h-full w-full"
    >
      <div className="flex h-full w-full flex-col items-center justify-center bg-muted">
        <div className="flex w-72 flex-col items-center justify-center gap-2">
          <span className="mb-6 text-2xl font-semibold text-primary">
            Sign up for ChatThread
          </span>
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
                  ref={ref}
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
                  {countdown > 0 ? `${countdown}s` : sendCodeTip}
                </Button>
              </div>

              <Form.Message match="valueMissing" className="field-invalid">
                Please enter your verification code
              </Form.Message>
            </Form.Field>
          </div>
          <div className="mb-3 w-full">
            <Form.Field name="password">
              <Form.Label htmlFor="form-password-input" className="data-[invalid]:label-invalid">
                Password <span className="font-medium text-destructive">*</span>
              </Form.Label>
              <InputComponent
                id="password-input"
                onChange={(value) => {
                  handleInput({ target: { name: "password", value } });
                }}
                value={password}
                isForm
                password={true}
                required
                placeholder="Password"
                className="w-full"
              />

              <Form.Message className="field-invalid" match="valueMissing">
                Please enter a password
              </Form.Message>

              {password != cnfPassword && cnfPassword!="" && (
                <Form.Message className="field-invalid">
                  Passwords do not match
                </Form.Message>
              )}
            </Form.Field>
          </div>
          <div className="w-full">
            <Form.Field
              name="confirmpassword"
            >
              <Form.Label htmlFor="form-confirm-password-input" className="data-[invalid]:label-invalid">
                Confirm your password{" "}
                <span className="font-medium text-destructive">*</span>
              </Form.Label>

              <InputComponent
                id="confirm-password-input"
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
                type="submit"
                className="mr-3 mt-6 w-full"
                onClick={() => {
                  handleSignup();
                }}
              >
                Sign up
              </Button>
            </Form.Submit>
          </div>
          <div className="w-full">
            <Button className="w-full" variant="outline" type="button" onClick={() => navigate(-1)} >
              Cancel
            </Button>
          </div>
          <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary  ">
            By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
            and <a href="#">Privacy Policy</a>.
          </div>
        </div>
      </div>
    </Form.Root>
    
  );
}
