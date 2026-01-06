import { SVGProps } from "react";

export type LoadingProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

// https://github.com/feathericons/feather/issues/695#issuecomment-1503699643
export const Loading = ({ size = 24, className = "", ...props }: LoadingProps & { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={"feather feather-circle animate-spin " + className}
    {...props}
    data-testid="loading-icon"
  >
    <circle
      cx={12}
      cy={12}
      r={10}
      strokeDasharray={63}
      strokeDashoffset={21}
      strokeLinecap="round"
    />
  </svg>
);
export default Loading;
