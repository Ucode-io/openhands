import React from "react";
import { DragOver } from "../drag-over";
import { UploadedFiles } from "../uploaded-files";
import { ChatInputRow } from "./chat-input-row";
import { ChatInputActions } from "./chat-input-actions";
import { useConversationStore } from "#/stores/conversation-store";
import { cn } from "#/utils/utils";
import { SiNotion } from "react-icons/si";
import { FiX } from "react-icons/fi";
import { NotionTask } from "#/api/notion-service/notion-service.api";

interface ChatInputContainerProps {
  chatContainerRef: React.RefObject<HTMLDivElement | null>;
  isDragOver: boolean;
  disabled: boolean;
  showButton: boolean;
  buttonClassName: string;
  chatInputRef: React.RefObject<HTMLDivElement | null>;
  handleFileIconClick: (isDisabled: boolean) => void;
  handleSubmit: () => void;
  handleResumeAgent: () => void;
  onDragOver: (e: React.DragEvent, isDisabled: boolean) => void;
  onDragLeave: (e: React.DragEvent, isDisabled: boolean) => void;
  onDrop: (e: React.DragEvent, isDisabled: boolean) => void;
  onInput: () => void;
  onPaste: (e: React.ClipboardEvent) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  selectedNotionTask?: NotionTask | null;
  onClearNotionTask?: () => void;
}

export function ChatInputContainer({
  chatContainerRef,
  isDragOver,
  disabled,
  showButton,
  buttonClassName,
  chatInputRef,
  handleFileIconClick,
  handleSubmit,
  handleResumeAgent,
  onDragOver,
  onDragLeave,
  onDrop,
  onInput,
  onPaste,
  onKeyDown,
  onFocus,
  onBlur,
  selectedNotionTask,
  onClearNotionTask,
}: ChatInputContainerProps) {
  const conversationMode = useConversationStore(
    (state) => state.conversationMode,
  );

  return (
    <div
      ref={chatContainerRef}
      className={cn(
        "bg-[#111113] box-border content-stretch flex flex-col items-start justify-center p-4 pt-3 relative rounded-2xl w-full",
        "border border-zinc-800/60 shadow-lg shadow-black/20",
        "transition-all duration-200",
        "hover:border-zinc-700/60",
        "focus-within:border-blue-600/40 focus-within:shadow-blue-600/5",
        conversationMode === "plan" && "border-blue-500/50 shadow-blue-500/10",
        disabled && "opacity-60",
      )}
      onDragOver={(e) => onDragOver(e, disabled)}
      onDragLeave={(e) => onDragLeave(e, disabled)}
      onDrop={(e) => onDrop(e, disabled)}
    >
      {/* Drag Over UI */}
      {isDragOver && <DragOver />}

      <UploadedFiles />

      {/* Selected Notion Task Pill */}
      {selectedNotionTask && (
        <div className="flex items-center gap-2 mb-2 px-2 py-1.5 rounded-lg bg-gradient-to-r from-blue-500/15 to-purple-500/15 border border-blue-500/30">
          <SiNotion className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <span className="text-sm text-zinc-200 truncate flex-1">
            {selectedNotionTask.title}
          </span>
          {selectedNotionTask.status && (
            <span className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide rounded-full bg-yellow-500/20 text-yellow-400 flex-shrink-0">
              {selectedNotionTask.status}
            </span>
          )}
          <button
            type="button"
            onClick={onClearNotionTask}
            className="p-1 hover:bg-zinc-700/50 rounded-md transition-colors flex-shrink-0"
            title="Clear selected task"
          >
            <FiX className="w-3.5 h-3.5 text-zinc-400 hover:text-white" />
          </button>
        </div>
      )}

      <ChatInputRow
        chatInputRef={chatInputRef}
        disabled={disabled}
        showButton={showButton}
        buttonClassName={buttonClassName}
        handleFileIconClick={handleFileIconClick}
        handleSubmit={handleSubmit}
        onInput={onInput}
        onPaste={onPaste}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        onBlur={onBlur}
      />

      <ChatInputActions
        disabled={disabled}
        handleResumeAgent={handleResumeAgent}
      />
    </div>
  );
}
