"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";

import { validatePostImage } from "@/lib/supabase/storage";
import { POST_CATEGORIES, type Post, type PostPayload, type PostType } from "@/types/posts";

type FormValues = { postType: PostType; category: string; description: string; location: string; eventTime: string };
function toLocalInput(value: string) { const date = new Date(value); return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16); }
function initialValues(post?: Post): FormValues { return { postType: post?.post_type ?? "LOST", category: post?.category ?? "Electronics", description: post?.description ?? "", location: post?.location ?? "", eventTime: post ? toLocalInput(post.event_time) : "" }; }

export function PostForm({ post, submitLabel, onSubmit }: { post?: Post; submitLabel: string; onSubmit: (payload: PostPayload, image: File | null) => Promise<void> }) {
  const [values, setValues] = useState(() => initialValues(post));
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(post?.image_url ?? null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => () => { if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl); }, [previewUrl]);
  function update<K extends keyof FormValues>(key: K, value: FormValues[K]) { setValues((current) => ({ ...current, [key]: value })); }
  function selectImage(event: ChangeEvent<HTMLInputElement>) { const file = event.target.files?.[0]; if (!file) return; const validationError = validatePostImage(file); if (validationError) { setError(validationError); event.target.value = ""; return; } setError(null); setImage(file); setPreviewUrl(URL.createObjectURL(file)); }
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setError(null); if (!values.eventTime) { setError("Choose when the item was lost or found."); return; } setSubmitting(true); try { await onSubmit({ post_type: values.postType, category: values.category, description: values.description, location: values.location, event_time: new Date(values.eventTime).toISOString() }, image); } catch (submissionError) { setError(submissionError instanceof Error ? submissionError.message : "The post could not be saved."); setSubmitting(false); } }
  return <form className="space-y-5" onSubmit={submit}>
    {error ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
    <div className="grid gap-5 sm:grid-cols-2"><label className="text-sm font-medium text-slate-700">Report type<select className="mt-1.5 w-full rounded-md border border-slate-300 bg-white p-2.5" value={values.postType} onChange={(e) => update("postType", e.target.value as PostType)}><option value="LOST">LOST</option><option value="FOUND">FOUND</option></select></label><label className="text-sm font-medium text-slate-700">Category<select className="mt-1.5 w-full rounded-md border border-slate-300 bg-white p-2.5" value={values.category} onChange={(e) => update("category", e.target.value)}>{POST_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label></div>
    <label className="block text-sm font-medium text-slate-700">Description<textarea className="mt-1.5 min-h-32 w-full rounded-md border border-slate-300 p-2.5" maxLength={2000} required value={values.description} onChange={(e) => update("description", e.target.value)} /></label>
    <div className="grid gap-5 sm:grid-cols-2"><label className="text-sm font-medium text-slate-700">Location<input className="mt-1.5 w-full rounded-md border border-slate-300 p-2.5" maxLength={300} required value={values.location} onChange={(e) => update("location", e.target.value)} /></label><label className="text-sm font-medium text-slate-700">Lost/found time<input className="mt-1.5 w-full rounded-md border border-slate-300 p-2.5" required type="datetime-local" value={values.eventTime} onChange={(e) => update("eventTime", e.target.value)} /></label></div>
    <label className="block text-sm font-medium text-slate-700">Optional image<span className="mt-1 block text-xs font-normal text-slate-500">JPEG, PNG, or WebP; maximum 5 MB.</span><input accept="image/jpeg,image/png,image/webp" className="mt-1.5 block w-full text-sm text-slate-700" onChange={selectImage} type="file" /></label>
    {previewUrl ? <img alt="Image preview" className="max-h-64 rounded-md border border-slate-200 object-cover" src={previewUrl} /> : null}
    <button className="w-full rounded-md bg-cyan-700 px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60" disabled={submitting} type="submit">{submitting ? "Saving and uploading image…" : submitLabel}</button>
  </form>;
}
