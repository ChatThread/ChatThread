import { cn } from "@/utils/utils";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CodeTabsComponent from "../../../../../../components/core/code-tabs-component/ChatCodeTabComponent";
import MessageLoading from "./MessageLoading";

type MarkdownFieldProps = {
  chat: any;
  isEmpty: boolean;
  chatMessage: string;
  editedFlag: React.ReactNode;
  isAudioMessage?: boolean;
};

// Function to replace <think> tags with a placeholder before markdown processing
const preprocessChatMessage = (text: string): string => {
  // Replace <think> tags with `<span class="think-tag">think:</span>`
  return text
    .replace(/<think>/g, "`<think>`")
    .replace(/<\/think>/g, "`</think>`");
};

export const MarkdownField = ({
  chat,
  isEmpty,
  chatMessage,
  editedFlag,
  isAudioMessage,
}: MarkdownFieldProps) => {
  // Process the chat message to handle <think> tags
  const processedChatMessage = preprocessChatMessage(chatMessage);

  return (
    <div className="w-full items-baseline gap-2">
      <div className={cn(
          "markdown prose flex w-fit max-w-full flex-col items-baseline text-[14px] font-normal word-break-break-word dark:prose-invert",
          isEmpty ? "text-muted-foreground" : "text-primary",
        )}>
        {isEmpty && !chat.stream_url ? (
          <div className="flex items-center">
            <MessageLoading />
          </div>
        ) : (
          <Markdown
            remarkPlugins={[remarkGfm as any]}
            components={{
              h1({node, ...props}) {
                return <h1 className="mt-2 mb-3 text-xl font-semibold">{props.children}</h1>;
              },
              h2({node, ...props}) {
                return <h2 className="mt-2 mb-2 text-lg font-semibold">{props.children}</h2>;
              },
              h3({ node, className, children, ...props }) {
                return (
                  <h3
                    {...props}
                    className={cn(
                      "mt-1.5 mb-1.5 text-base font-semibold leading-snug",
                      className,
                    )}
                  >
                    {children}
                  </h3>
                );
              },
              h4({ node, className, children, ...props }) {
                return (
                  <h4
                    {...props}
                    className={cn(
                      "mt-1 mb-1 text-sm font-semibold uppercase tracking-wide",
                      className,
                    )}
                  >
                    {children}
                  </h4>
                );
              },
              p({ node, ...props }) {
                return <span className="w-fit max-w-full">{props.children}</span>;
              },
              ol({ node, ...props }) {
                return <ol className="max-w-full">{props.children}</ol>;
              },
              ul({ node, className, children, ...props }) {
                return (
                  <ul
                    className={cn("max-w-full mb-1 last:mb-0", className)}
                    {...props}
                  >
                    {children}
                  </ul>
                );
              },
              hr({ node, className, ...props }) {
                return (
                  <hr
                    {...props}
                    className={cn(
                      "my-0.5 w-full border-0 border-t border-border/60",
                      className,
                    )}
                  />
                );
              },
              pre({ node, ...props }) {
                return <>{props.children}</>;
              },
              table: ({ node, ...props }) => {
                return (
                  <div className="max-w-full overflow-hidden rounded-md border mb-2 bg-muted">
                    <div className="max-h-[600px] w-full overflow-auto p-2">
                      <table className="my-0! w-full">{props.children}</table>
                    </div>
                  </div>
                );
              },
              code(props) {
                const {children, className, node, ...rest} = props
                let content = children as string;
                if (
                  Array.isArray(children) &&
                  children.length === 1 &&
                  typeof children[0] === "string"
                ) {
                  content = children[0] as string;
                }
                if (typeof content === "string") {
                  if (content.length) {
                    if (content[0] === "▍") {
                      return <span className="form-modal-markdown-span"></span>;
                    }

                    // Specifically handle <think> tags that were wrapped in backticks
                    if (content === "<think>" || content === "</think>") {
                      return <span>{content}</span>;
                    }
                  }

                  const match = /language-(\w+)/.exec(className || "");

                  return match ? (
                    <CodeTabsComponent
                      language={(match && match[1]) || ""}
                      code={String(content).replace(/\n$/, "")}
                    />
                  ) : (
                    <code className={className} {...props}>
                      {content}
                    </code>
                  );
                }

                return null;
              },
            }}
          >
            {processedChatMessage}
          </Markdown>
        )}
      </div>
      {editedFlag}
    </div>
  );
};
