import { useCustomNavigate } from "@/customization/hooks/use-custom-navigate";
import useTheme from "@/customization/hooks/use-custom-theme";
import { ReactFlowProvider } from "@xyflow/react";
import { Outlet } from "react-router-dom";

export default function DashboardWrapperPage() {
  useTheme();
  const navigate = useCustomNavigate();
  return (
    <ReactFlowProvider>
      {/* <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="h-10 border-b flex items-center">
        <button 
          onClick={() => {
            // 这里写点击事件的处理逻辑
            // 例如返回上一页：
            navigate(`/flows`, { replace: true });
          }}
          className="mr-2 ml-2 p-1 rounded hover:bg-gray-100 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
        </button>
        <p></p>
      </div> */}
        <div className="flex w-full flex-1 flex-row overflow-hidden"> 
          <Outlet />
        </div>
    </ReactFlowProvider>
  );
}
