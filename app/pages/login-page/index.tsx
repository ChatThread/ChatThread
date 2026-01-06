import ChatThreadLogo from "@/assets/logo.svg?react";
import { useLoginUser } from "@/controllers/API/queries/auth";
import { CustomLink } from "@/customization/components/CustomLink";
import * as Form from "@radix-ui/react-form";
import { useContext, useState } from "react";
import InputComponent from "../../components/core/parameter-render-component/components/input-component";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { CONTROL_LOGIN_STATE } from "../../constants/constants";
import { AuthContext } from "../../contexts/auth-context";
import { LoginType } from "../../types/api";
import { useCustomNavigate } from "@/customization/hooks/use-custom-navigate";
import {
  inputHandlerEventType,
  loginInputStateType,
} from "../../types/components";
import { toast } from "sonner"
import { useEffect } from "react";

export default function LoginPage(): JSX.Element {
  const [inputState, setInputState] =
    useState<loginInputStateType>(CONTROL_LOGIN_STATE);
  const navigate = useCustomNavigate();

  useEffect(() => {
    return () => {
      toast.dismiss();
    };
  }, []);

  const { password, username } = inputState;
  const { login } = useContext(AuthContext);
  let isSubmitted = false;

  function handleInput({
    target: { name, value },
  }: inputHandlerEventType): void {
    setInputState((prev) => ({ ...prev, [name]: value }));
  }

  const { mutate } = useLoginUser();

  function signIn() {
    const user: LoginType = {
      username: username.trim(),
      password: password.trim(),
    };
    const toastId = toast.loading("Loading...");
    mutate(user, {
      onSuccess: (data) => {
        isSubmitted = false;
        toast.dismiss(toastId);
        localStorage.setItem("authToken", data.token.access_token);
        localStorage.setItem("authRefreshToken", data.token.refresh_token);
        localStorage.setItem("folderId", data.folder.id);
        localStorage.setItem("folderName", data.folder.name);
        login(data.token.access_token, "login", data.token.refresh_token);
        navigate(-1)
      },
      onError: (error) => {
        isSubmitted = false;
        const err_msg = error.message
        if(error.response?.data && error.response?.data.detail) {
          toast.error(error.response?.data.detail, { id: toastId });
        }else{
          toast.error(err_msg, { id: toastId });
        }
      },
    });
  }
  const isElectron = (
    typeof window !== 'undefined' && (
      window.process?.type === 'renderer' ||
      window.electron !== undefined ||
      navigator.userAgent.toLowerCase().includes('electron')
    )
  );
  function toTermsOfService() {
    // @ts-expect-error - Vite env vars are injected at build time
    const base = (import.meta.env.VITE_PUBLIC_SITE_URL as string) || "";
    const url = base ? `${base}/agreement` : "";
    if (!url) return;
    if (isElectron) {
      window.api.invoke("open-new-window", url)
    } else {
      // 非 Electron 环境下的备用方案
      window.open(url, '_blank')
    }
  }
  function toPrivacy() {
    // @ts-expect-error - Vite env vars are injected at build time
    const base = (import.meta.env.VITE_PUBLIC_SITE_URL as string) || "";
    const url = base ? `${base}/privacy` : "";
    if (!url) return;
    if (isElectron) {
      window.api.invoke("open-new-window", url)
    } else {
      // 非 Electron 环境下的备用方案
      window.open(url, '_blank')
    }
  }
  return (
    <Form.Root
      onSubmit={(event) => {
        if (password === "") {
          event.preventDefault();
          return;
        }
        if (isSubmitted){
          event.preventDefault();
          return;
        }
        signIn();
        isSubmitted = true;
        event.preventDefault();
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
            Sign in to ChatThread
          </span>
          <div className="mb-3 w-full">
            <Form.Field name="username">
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
                  placeholder="example@example"
                />
              </Form.Control>

              <Form.Message match="valueMissing" className="field-invalid">
                Please enter your email
              </Form.Message>
            </Form.Field>
          </div>
          <div className="mb-3 w-full">
            <Form.Field name="password">
              <Form.Label htmlFor="form-password" className="data-[invalid]:label-invalid flex justify-between items-center">
                Password <span className="font-medium text-destructive">*</span>

                <a
                href="#"
                className="ml-auto text-sm underline-offset-4 hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  // Using React Router's navigation
                  navigate('/forgot');
                }}
              >
                Forgot your password?
              </a>
              </Form.Label>

              <InputComponent
                id="password"
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
                Please enter your password
              </Form.Message>
            </Form.Field>
          </div>
          <div className="w-full">
            <Form.Submit asChild>
              <Button className="mr-3 mt-6 w-full" type="submit">
                Sign in
              </Button>
            </Form.Submit>
          </div>
          <div className="w-full">
            <CustomLink to="/signup">
              <Button className="w-full" variant="outline" type="button">
                Don't have an account?&nbsp;<b>Sign Up</b>
              </Button>
            </CustomLink>
          </div>

          <div className="w-full">
            <Button className="w-full" variant="outline" type="button" onClick={() => navigate(-1)} >
              Cancel
            </Button>
          </div>

          <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary  ">
            By clicking continue, you agree to our <a href="#" onClick={() => {
              toTermsOfService();
            }}>Terms of Service</a>{" "}
            and <a href="#" onClick={() => {
              toPrivacy();
            }}>Privacy Policy</a>.
          </div>
        </div>
      </div>
    </Form.Root>
  );
}
