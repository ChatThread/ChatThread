import { lazy } from "react";
import { createBrowserRouter, createHashRouter, createRoutesFromElements, Route, Navigate } from "react-router-dom";
import { BASENAME } from "./customization/config-constants";

// 基础布局组件 - 立即加载
import { AppAuthenticatedPage } from "./pages/app-authenticated-page";
import { AppInitPage } from "./pages/app-init-page";
import { AppWrapperPage } from "./pages/app-wrapper-page";
import ContextWrapper from "./contexts";

// 路由守卫组件 - 立即加载
import { ProtectedLoginRoute } from "./components/authorization/auth-login-guard";
import { CustomNavigate } from "./customization/components/CustomNavigate";

// 懒加载页面组件
const MainPage = lazy(() => import("./pages/main-page"));
const LoginPage = lazy(() => import("./pages/login-page"));
const SignUp = lazy(() => import("./pages/sign-up-page"));
const ForgotPasswordPage = lazy(() => import("./pages/forgot-password-page"));
const FlowPage = lazy(() => import("./pages/flow-page"));
const DashboardWrapperPage = lazy(() => import("./pages/dashboard-wrapper-page"));
const ViewPage = lazy(() => import("./pages/view-page"));
// const ChatPage = lazy(() => import("./pages/chat-page"));
const ChatPage = lazy(() => import("./pages/new-chat-page"))
const HomePage = lazy(() => import("./pages/main-page/pages/home-page"));
const ExplorePage = lazy(() => import("./pages/main-page/pages/explore-page"));

// 设置页面按需加载
const SettingsPage = lazy(() => import("./pages/settings-page"));
const AccountPage = lazy(() =>
  import("./pages/settings-page/pages/account-page")
);
const AgreementPage = lazy(() =>
  import("./pages/settings-page/pages/agreement-page")
);

// const ApiKeysPage = lazy(() => 
//   import("./pages/SettingsPage/pages/ApiKeysPage").then(module => ({
//     default: module.default
//   }))
// );
// const GeneralPage = lazy(() => 
//   import("./pages/SettingsPage/pages/GeneralPage").then(module => ({
//     default: module.GeneralPage
//   }))
// );
// const MessagesPage = lazy(() => 
//   import("./pages/SettingsPage/pages/messagesPage")
// );
const GlobalVariablesPage = lazy(() => 
  import("./pages/settings-page/pages/global-variables-page")
);
const ShortcutsPage = lazy(() => 
  import("./pages/settings-page/pages/shortcuts-page")
);
const MCPSettingsPage = lazy(() => import("./pages/settings-page/pages/mcp-page"));
const MCPPage = lazy(() => import("./pages/mcp-page"));

const WishlistListPage = lazy(() => import("./pages/wishlist/WishlistListPage"));
// Wishlist detail page removed; items now stay in the list view
// Publish wishlist is now a modal opened from the list page; removed page route.

// 在 file:// 协议下（直接用浏览器打开本地文件），BrowserRouter 会触发 history.replaceState 的安全限制。
// 因此检测到 file:// 时，改用 HashRouter，避免报错；其他情况下继续使用 BrowserRouter。
const isFileProtocol = typeof window !== "undefined" && window.location.protocol === "file:";
const createRouter = isFileProtocol ? createHashRouter : createBrowserRouter;

// 创建路由配置
const router = createRouter(
  createRoutesFromElements(
    <Route element={<ContextWrapper><AppInitPage /></ContextWrapper>}>
      <Route element={<AppWrapperPage />}>
        <Route
          path=""
          element={<AppAuthenticatedPage />}
        >
          {/* 主页路由 */}
          <Route path="" element={<MainPage />}>
            <Route index element={<Navigate to="chat" replace />} />
            <Route path="chat/*" element={<ChatPage />} />
            <Route path="flows/*" element={<HomePage type="flows" />} />
            <Route path="explore/*" element={<ExplorePage type="store" />} />
            <Route path="wishlist" element={<WishlistListPage /> } />
            <Route path="mcp" element={<MCPPage />} />
            {/* 设置路由 */}
            <Route path="settings">
              <Route element={<SettingsPage />}>
                {/* <Route path="api-keys" element={<ApiKeysPage />} /> */}
                <Route
                    index
                    element={<CustomNavigate replace to={"account"} />}
                  />
                <Route path="account" element={<AccountPage />} />
                <Route path="agreement" element={<AgreementPage />} />
                <Route path="global-variables" element={<GlobalVariablesPage />} />
                <Route path="mcp" element={<CustomNavigate replace to="/mcp" />} />
                
                {/* <Route path="shortcuts" element={<ShortcutsPage />} /> */}
                {/* <Route path="messages" element={<MessagesPage />} /> */}
              </Route>
            </Route>
          </Route>
          {/* Flow相关路由 */}
          <Route path="flow/:id" element={<DashboardWrapperPage />}>
            <Route path="" element={<FlowPage />} />
            <Route path="folder/:folderId" element={<FlowPage />} />
            <Route path="view" element={<ViewPage />} />
          </Route>
        </Route>

        {/* 认证相关路由 */}
        <Route path="login" element={
          <ProtectedLoginRoute>
            <LoginPage />
          </ProtectedLoginRoute>
        } />
        <Route path="signup" element={
          <ProtectedLoginRoute>
            <SignUp />
          </ProtectedLoginRoute>
        } />
        <Route path="forgot" element={
          <ProtectedLoginRoute>
            <ForgotPasswordPage />
          </ProtectedLoginRoute>
        } />
      </Route>
      <Route path="*" element={<CustomNavigate replace to="/" />} />
    </Route>
  ),
  { basename: BASENAME || undefined }
);

export default router;
