"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import {
  Upload, X, ChevronRight, ChevronLeft, Sparkles,
  CheckCircle, Camera
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { METHOD_OPTIONS, US_STATES, cn } from "@/lib/utils";

const STEPS = ["Photos", "Details", "Caption", "Review"] as const;
type Step = 0 | 1 | 2 | 3;

interface ImagePreview {
  file: File;
  preview: string;
}

interface FormData {
  species: string;
  species_type: string;
  method: string;
  location_label: string;
  lat: string;
  lng: string;
  weight_lbs: string;
  length_in: string;
  caption: string;
  harvested_at: string;
}

export function NewHarvestForm({ userId }: { userId: string }) {
  void userId;
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [form, setForm] = useState<FormData>({
    species: "",
    species_type: "FISH",
    method: "",
    location_label: "",
    lat: "",
    lng: "",
    weight_lbs: "",
    length_in: "",
    caption: "",
    harvested_at: new Date().toISOString().slice(0, 16),
  });
  const [aiResult, setAiResult] = useState<{
    species: string;
    confidence: number;
    notes: string;
  } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newImages = acceptedFiles.slice(0, 10 - images.length).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...newImages]);
  }, [images.length]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp", ".heic"] },
    maxFiles: 10,
    maxSize: 20 * 1024 * 1024,
  });

  const removeImage = (index: number) => {
    setImages((prev) => {
      const next = [...prev];
      URL.revokeObjectURL(next[index].preview);
      next.splice(index, 1);
      return next;
    });
  };

  const handleAIIdentify = async () => {
    if (!images[0]) return;
    setAiLoading(true);
    try {
      // Upload first image temporarily for identification
      const tmpForm = new FormData();
      tmpForm.append("images", images[0].file);

      // We need a public URL — use a data URL approach via base64 for AI
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        try {
          const res = await fetch("/api/ai-identify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageUrl: dataUrl }),
          });
          if (res.ok) {
            const data = await res.json();
            setAiResult(data);
            if (data.species && data.species !== "Unknown") {
              setForm((f) => ({ ...f, species: data.species }));
            }
          }
        } catch (err) {
          console.error("AI identify error:", err);
        } finally {
          setAiLoading(false);
        }
      };
      reader.readAsDataURL(images[0].file);
    } catch {
      setAiLoading(false);
    }
  };

  const updateForm = (key: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append("species", form.species);
      fd.append("species_type", form.species_type);
      fd.append("method", form.method);
      fd.append("location_label", form.location_label);
      if (form.lat) fd.append("lat", form.lat);
      if (form.lng) fd.append("lng", form.lng);
      if (form.weight_lbs) fd.append("weight_lbs", form.weight_lbs);
      if (form.length_in) fd.append("length_in", form.length_in);
      if (form.caption) fd.append("caption", form.caption);
      fd.append("harvested_at", new Date(form.harvested_at).toISOString());

      for (const img of images) {
        fd.append("images", img.file);
      }

      const res = await fetch("/api/harvests", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Failed to create harvest");

      router.push(`/harvest/${data.harvest.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  };

  const canProceed = () => {
    if (step === 0) return images.length > 0;
    if (step === 1)
      return (
        form.species.trim() &&
        form.species_type &&
        form.method &&
        form.location_label.trim() &&
        form.harvested_at
      );
    return true;
  };

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-1">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center flex-1">
            <div
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all",
                i < step
                  ? "bg-forest-600 text-white"
                  : i === step
                  ? "bg-amber-600 text-white"
                  : "bg-slate-700 text-slate-400"
              )}
            >
              {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
            </div>
            <span
              className={cn(
                "ml-1.5 text-xs font-medium hidden sm:block",
                i === step ? "text-amber-400" : "text-slate-500"
              )}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-2",
                  i < step ? "bg-forest-600" : "bg-slate-700"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 0: Photos */}
      {step === 0 && (
        <div className="space-y-4">
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
              isDragActive
                ? "border-amber-500 bg-amber-500/10"
                : "border-slate-600 hover:border-amber-600 hover:bg-amber-600/5"
            )}
          >
            <input {...getInputProps()} />
            <Camera className="w-10 h-10 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-300 font-medium">
              {isDragActive ? "Drop photos here" : "Upload harvest photos"}
            </p>
            <p className="text-slate-500 text-sm mt-1">
              Drag & drop or click • Up to 10 photos • JPEG, PNG, WebP, HEIC
            </p>
          </div>

          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {images.map((img, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden group">
                  <Image
                    src={img.preview}
                    alt={`Upload ${i + 1}`}
                    fill
                    className="object-cover"
                  />
                  {i === 0 && (
                    <span className="absolute top-1 left-1 bg-amber-600 text-white text-xs px-1.5 py-0.5 rounded font-semibold">
                      Primary
                    </span>
                  )}
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              ))}
              {images.length < 10 && (
                <div
                  {...getRootProps()}
                  className="aspect-square rounded-lg border-2 border-dashed border-slate-600 flex items-center justify-center cursor-pointer hover:border-amber-600 transition-colors"
                >
                  <input {...getInputProps()} />
                  <Upload className="w-6 h-6 text-slate-500" />
                </div>
              )}
            </div>
          )}

          {/* AI Identify button */}
          {images.length > 0 && (
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-200">AI Species ID</p>
                  <p className="text-xs text-slate-400">Let AI identify what you caught/harvested</p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleAIIdentify}
                  loading={aiLoading}
                >
                  <Sparkles className="w-4 h-4" />
                  Identify
                </Button>
              </div>
              {aiResult && (
                <div className="bg-forest-900/50 border border-forest-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-forest-300 font-semibold">{aiResult.species}</span>
                    <span className="text-xs text-forest-400">
                      {Math.round(aiResult.confidence * 100)}% confident
                    </span>
                  </div>
                  {aiResult.notes && (
                    <p className="text-xs text-forest-400">{aiResult.notes}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 1: Details */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Species <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.species}
                onChange={(e) => updateForm("species", e.target.value)}
                placeholder="e.g. Largemouth Bass, White-tailed Deer"
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Type <span className="text-red-400">*</span>
              </label>
              <select
                value={form.species_type}
                onChange={(e) => updateForm("species_type", e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="FISH">Fish</option>
                <option value="BIG_GAME">Big Game</option>
                <option value="BIRD">Bird</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Method <span className="text-red-400">*</span>
              </label>
              <select
                value={form.method}
                onChange={(e) => updateForm("method", e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="">Select method…</option>
                {METHOD_OPTIONS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Location <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.location_label}
                onChange={(e) => updateForm("location_label", e.target.value)}
                placeholder="e.g. Lake Lanier, GA"
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Weight (lbs)
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={form.weight_lbs}
                onChange={(e) => updateForm("weight_lbs", e.target.value)}
                placeholder="0.0"
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Length (inches)
              </label>
              <input
                type="number"
                min="0"
                step="0.25"
                value={form.length_in}
                onChange={(e) => updateForm("length_in", e.target.value)}
                placeholder="0.0"
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Harvest Date & Time <span className="text-red-400">*</span>
              </label>
              <input
                type="datetime-local"
                value={form.harvested_at}
                onChange={(e) => updateForm("harvested_at", e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-slate-200 focus:outline-none focus:border-amber-500 [color-scheme:dark]"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Caption */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Caption <span className="text-slate-500">(optional)</span>
            </label>
            <textarea
              value={form.caption}
              onChange={(e) => updateForm("caption", e.target.value)}
              placeholder="Tell the story behind this harvest…"
              rows={5}
              maxLength={2000}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none"
            />
            <p className="text-xs text-slate-500 mt-1 text-right">
              {form.caption.length}/2000
            </p>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden">
            {/* Photo preview */}
            {images[0] && (
              <div className="relative aspect-video">
                <Image
                  src={images[0].preview}
                  alt="Primary photo"
                  fill
                  className="object-cover"
                />
                {images.length > 1 && (
                  <span className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                    +{images.length - 1} more
                  </span>
                )}
              </div>
            )}

            <div className="p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-white text-lg">{form.species}</h3>
                  <p className="text-slate-400 text-sm">{form.method}</p>
                </div>
                <span className="text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded">
                  {form.species_type.replace("_", " ")}
                </span>
              </div>

              <p className="text-slate-400 text-sm">📍 {form.location_label}</p>

              <div className="flex gap-4 text-sm text-slate-400">
                {form.weight_lbs && <span>⚖️ {form.weight_lbs} lbs</span>}
                {form.length_in && <span>📏 {form.length_in}&quot;</span>}
              </div>

              {form.caption && (
                <p className="text-slate-300 text-sm border-t border-slate-700 pt-3 mt-3">
                  {form.caption}
                </p>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-300 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="ghost"
          onClick={() => setStep((s) => (s - 1) as Step)}
          disabled={step === 0}
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </Button>

        {step < 3 ? (
          <Button
            onClick={() => setStep((s) => (s + 1) as Step)}
            disabled={!canProceed()}
          >
            Continue
            <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} loading={submitting}>
            Post Harvest
          </Button>
        )}
      </div>
    </div>
  );
}
