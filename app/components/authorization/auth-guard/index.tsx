
export const ProtectedRoute = ({ children }) => {


  // if (shouldRedirect || testMockAutoLogin) {
  //   const currentPath = window.location.pathname;
  //   const isHomePath = currentPath === "/" || currentPath === "/flows";
  //   const isLoginPage = location.pathname.includes("login");
  //   return (
  //     <CustomNavigate
  //       to={
  //         "/login" +
  //         (!isHomePath && !isLoginPage ? "?redirect=" + currentPath : "")
  //       }
  //       replace
  //     />
  //   );
  // } else {
    return children;
  // }
};
