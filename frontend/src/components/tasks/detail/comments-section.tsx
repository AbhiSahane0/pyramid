"use client";

import { formatDistanceToNow } from "date-fns";
import {
  MoreHorizontal,
  Paperclip,
  SendHorizontal,
  SmilePlus,
  Trash2,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/user-avatar";
import { useAddComment, useDeleteComment, useMe } from "@/hooks/use-api";
import type { Comment } from "@/lib/types";

interface CommentInputProps {
  placeholder: string;
  avatar: { name: string; avatarUrl: string | null };
  onSubmit: (body: string) => Promise<unknown>;
  disabled?: boolean;
}

function CommentInput({ placeholder, avatar, onSubmit, disabled }: CommentInputProps) {
  const [value, setValue] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const body = value.trim();
    if (!body) return;
    await onSubmit(body);
    setValue("");
  };

  return (
    <form
      onSubmit={submit}
      className="flex items-center gap-2.5 rounded-xl border bg-card px-3 py-2"
    >
      <UserAvatar
        name={avatar.name}
        avatarUrl={avatar.avatarUrl}
        className="size-6 shrink-0"
      />
      <Input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="h-8 flex-1 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 dark:bg-transparent"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Attach file"
        className="size-7 text-muted-foreground"
      >
        <Paperclip className="size-4" aria-hidden />
      </Button>
      <Button
        type="submit"
        variant="ghost"
        size="icon"
        aria-label="Send"
        disabled={disabled || !value.trim()}
        className="size-7 text-muted-foreground hover:text-foreground"
      >
        <SendHorizontal className="size-4" aria-hidden />
      </Button>
    </form>
  );
}

function CommentCard({ comment, taskId }: { comment: Comment; taskId: string }) {
  const { data: me } = useMe();
  const addComment = useAddComment(taskId);
  const deleteComment = useDeleteComment(taskId);

  return (
    <article className="space-y-3 rounded-xl border bg-card p-3.5">
      <header className="flex items-center gap-2">
        <UserAvatar
          name={comment.author.name}
          avatarUrl={comment.author.avatarUrl}
          className="size-6"
        />
        <span className="text-sm font-semibold">{comment.author.name}</span>
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
        </span>
        <span className="flex-1" />
        <Button
          variant="ghost"
          size="icon"
          aria-label="React"
          className="size-7 text-muted-foreground"
        >
          <SmilePlus className="size-4" aria-hidden />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Comment actions"
              className="size-7 text-muted-foreground"
            >
              <MoreHorizontal className="size-4" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36 rounded-xl p-1.5">
            <DropdownMenuItem
              variant="destructive"
              className="gap-2"
              onClick={() => deleteComment.mutate(comment.id)}
            >
              <Trash2 className="size-4" aria-hidden />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <p className="text-sm leading-relaxed">{comment.body}</p>

      {comment.replies && comment.replies.length > 0 ? (
        <div className="space-y-2 border-l-2 pl-3">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="space-y-1">
              <div className="flex items-center gap-2">
                <UserAvatar
                  name={reply.author.name}
                  avatarUrl={reply.author.avatarUrl}
                  className="size-5"
                />
                <span className="text-xs font-semibold">{reply.author.name}</span>
                <span className="text-[0.65rem] text-muted-foreground">
                  {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                </span>
              </div>
              <p className="pl-7 text-sm">{reply.body}</p>
            </div>
          ))}
        </div>
      ) : null}

      <CommentInput
        placeholder="Leave a reply…"
        avatar={{ name: me?.name ?? "You", avatarUrl: me?.avatarUrl ?? null }}
        onSubmit={(body) => addComment.mutateAsync({ body, parentId: comment.id })}
        disabled={addComment.isPending}
      />
    </article>
  );
}

export function CommentsSection({
  taskId,
  comments,
}: {
  taskId: string;
  comments: Comment[];
}) {
  const { data: me } = useMe();
  const addComment = useAddComment(taskId);

  return (
    <section aria-label="Comments" className="space-y-3">
      <h2 className="text-sm font-semibold">Comments</h2>
      {comments.map((comment) => (
        <CommentCard key={comment.id} comment={comment} taskId={taskId} />
      ))}
      <CommentInput
        placeholder="Add a comment…"
        avatar={{ name: me?.name ?? "You", avatarUrl: me?.avatarUrl ?? null }}
        onSubmit={(body) => addComment.mutateAsync({ body })}
        disabled={addComment.isPending}
      />
    </section>
  );
}
