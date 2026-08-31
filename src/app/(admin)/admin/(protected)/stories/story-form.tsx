"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { createStory, updateStory } from "./actions";
import { storyFieldsSchema, EXCERPT_MAX } from "@/lib/validations/story";
import { formatDate } from "@/lib/format-date";
import type { ActionResult } from "@/lib/action-result";
import type { Post, Sector } from "@/generated/prisma/client";
import { CloudinaryImageUpload } from "@/components/admin/image-upload";

const inputClass =
  "rounded-md border border-border-strong px-3 py-2 text-ink-800 outline-none focus-visible:border-brand-700";

// Title → slug. Matches the server-side slugPattern (lowercase alphanumerics
// joined by single hyphens); anything else becomes a hyphen boundary.
function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function StoryForm({ post, sectors }: { post?: Post; sectors: Sector[] }) {
  const router = useRouter();
  const isEditing = Boolean(post);

  // A story that has ever been published has a publishedAt stamp. After
  // that point the slug must never change on its own (a title edit must not
  // touch it), and changing it by hand breaks existing links — so we only
  // auto-derive the slug from the title while CREATING, and warn on a
  // manual change once published.
  const hasBeenPublished = post?.publishedAt != null;

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  // Once the editor types in the slug field themselves, stop tracking the
  // title. Always true when editing — no auto-sync there at all.
  const [slugTouched, setSlugTouched] = useState(isEditing);
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");

  const slugChangedAfterPublish = hasBeenPublished && slug !== post?.slug;
  const excerptOver = excerpt.length > EXCERPT_MAX;

  function onTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) {
      setSlug(slugify(value));
    }
  }

  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    async (_prev, formData) => {
      // Client-side pass, sharing the server schema. A courtesy — the
      // Server Action re-validates authoritatively.
      const parsed = storyFieldsSchema.safeParse({
        slug: formData.get("slug"),
        title: formData.get("title"),
        excerpt: formData.get("excerpt"),
        body: formData.get("body"),
        coverImage: formData.get("coverImage") ?? "",
        coverAlt: formData.get("coverAlt") ?? "",
        sectorId: formData.get("sectorId") ?? "",
        status: formData.get("status"),
      });
      if (!parsed.success) {
        return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
      }

      const result = isEditing ? await updateStory(formData) : await createStory(formData);
      if (result.ok && !isEditing) {
        router.push("/admin/stories");
      }
      return result;
    },
    null
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {post ? <input type="hidden" name="id" value={post.id} /> : null}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="title" className="text-sm font-medium text-ink-700">
          Title
        </label>
        <input
          id="title"
          name="title"
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          required
          maxLength={200}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="slug" className="text-sm font-medium text-ink-700">
          Slug{" "}
          {isEditing ? null : (
            <span className="font-normal text-ink-500">(filled in from the title — edit if you like)</span>
          )}
        </label>
        <input
          id="slug"
          name="slug"
          value={slug}
          onChange={(event) => {
            setSlug(event.target.value);
            setSlugTouched(true);
          }}
          required
          maxLength={100}
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          title="Lowercase letters, numbers, and hyphens only."
          className={inputClass}
        />
        {slugChangedAfterPublish ? (
          <p role="alert" className="text-xs text-warning">
            This story is already published. Changing the slug will break existing links to it
            (was <span className="font-medium">/{post?.slug}</span>).
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <label htmlFor="excerpt" className="text-sm font-medium text-ink-700">
            Excerpt <span className="font-normal text-ink-500">(cards, search results, previews)</span>
          </label>
          <span className={`text-xs ${excerptOver ? "text-danger" : "text-ink-500"}`}>
            {excerpt.length}/{EXCERPT_MAX}
          </span>
        </div>
        <textarea
          id="excerpt"
          name="excerpt"
          value={excerpt}
          onChange={(event) => setExcerpt(event.target.value)}
          required
          rows={3}
          aria-invalid={excerptOver}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="body" className="text-sm font-medium text-ink-700">
          Body <span className="font-normal text-ink-500">(Markdown)</span>
        </label>
        <textarea
          id="body"
          name="body"
          defaultValue={post?.body ?? ""}
          required
          maxLength={50000}
          rows={18}
          className={`${inputClass} font-mono text-sm`}
        />
        <p className="text-xs text-ink-500">
          Markdown: <code># Heading</code>, <code>**bold**</code>, <code>[link](https://…)</code>,
          <code>- list item</code>. Leave a blank line between paragraphs. Raw HTML is ignored.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="sectorId" className="text-sm font-medium text-ink-700">
          Sector <span className="font-normal text-ink-500">(optional)</span>
        </label>
        <select
          id="sectorId"
          name="sectorId"
          defaultValue={post?.sectorId ?? ""}
          className={inputClass}
        >
          <option value="">— None —</option>
          {sectors.map((sector) => (
            <option key={sector.id} value={sector.id}>
              {sector.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink-700">
          Cover image <span className="font-normal text-ink-500">(optional)</span>
        </span>
        <CloudinaryImageUpload
          folder="stories"
          fieldName="coverImage"
          altFieldName="coverAlt"
          defaultValue={post?.coverImage}
          defaultAlt={post?.coverAlt}
          label="Cover image"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="status" className="text-sm font-medium text-ink-700">
          Publish status
        </label>
        <select id="status" name="status" defaultValue={post?.status ?? "DRAFT"} className={inputClass}>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
        </select>
        {/* ARCHIVED isn't offered here on purpose — see stories/actions.ts
            archiveStory, an ADMIN-only action. */}
        {hasBeenPublished ? (
          <p className="text-xs text-ink-500">
            First published {post?.publishedAt ? formatDate(post.publishedAt) : ""} — that date is
            fixed and won&apos;t change if you unpublish and re-publish.
          </p>
        ) : null}
      </div>

      {state && !state.ok ? (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p role="status" className="text-sm text-success">
          Saved.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-card bg-brand-600 px-4 py-2 font-medium text-white disabled:opacity-60"
      >
        {isPending ? "Saving…" : isEditing ? "Save" : "Create story"}
      </button>
    </form>
  );
}
