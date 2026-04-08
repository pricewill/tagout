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
  state: string;
  weight_lbs: string;
  length_in: string;
  caption: string;
  harvested_at: string;
  // general
  companions: string;
  land_type: string;
  weather: string;
  moon_phase: string;
  time_of_day: string;
  personal_best: boolean;
  harvest_success: boolean;
  video_url: string;
  // hunting-specific
  shot_distance_yards: string;
  season_type: string;
  tag_type: string;
  animal_age: string;
  point_count: string;
  score: string;
  // fishing-specific
  fly_pattern: string;
  water_type: string;
  technique: string;
  catch_release: boolean;
  fish_count: string;
  water_conditions: string;
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
    state: "",
    weight_lbs: "",
    length_in: "",
    caption: "",
    harvested_at: new Date().toISOString().slice(0, 16),
    // general
    companions: "",
    land_type: "",
    weather: "",
    moon_phase: "",
    time_of_day: "",
    personal_best: false,
    harvest_success: true,
    video_url: "",
    // hunting-specific
    shot_distance_yards: "",
    season_type: "",
    tag_type: "",
    animal_age: "",
    point_count: "",
    score: "",
    // fishing-specific
    fly_pattern: "",
    water_type: "",
    technique: "",
    catch_release: false,
    fish_count: "",
    water_conditions: "",
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
      if (form.state) fd.append("state", form.state);
      if (form.weight_lbs) fd.append("weight_lbs", form.weight_lbs);
      if (form.length_in) fd.append("length_in", form.length_in);
      if (form.caption) fd.append("caption", form.caption);
      fd.append("harvested_at", new Date(form.harvested_at).toISOString());
      // general
      if (form.companions) fd.append("companions", form.companions);
      if (form.land_type) fd.append("land_type", form.land_type);
      if (form.weather) fd.append("weather", form.weather);
      if (form.moon_phase) fd.append("moon_phase", form.moon_phase);
      if (form.time_of_day) fd.append("time_of_day", form.time_of_day);
      fd.append("personal_best", String(form.personal_best));
      fd.append("harvest_success", String(form.harvest_success));
      if (form.video_url) fd.append("video_url", form.video_url);
      // hunting-specific
      if (form.shot_distance_yards) fd.append("shot_distance_yards", form.shot_distance_yards);
      if (form.season_type) fd.append("season_type", form.season_type);
      if (form.tag_type) fd.append("tag_type", form.tag_type);
      if (form.animal_age) fd.append("animal_age", form.animal_age);
      if (form.point_count) fd.append("point_count", form.point_count);
      if (form.score) fd.append("score", form.score);
      // fishing-specific
      if (form.fly_pattern) fd.append("fly_pattern", form.fly_pattern);
      if (form.water_type) fd.append("water_type", form.water_type);
      if (form.technique) fd.append("technique", form.technique);
      fd.append("catch_release", String(form.catch_release));
      if (form.fish_count) fd.append("fish_count", form.fish_count);
      if (form.water_conditions) fd.append("water_conditions", form.water_conditions);

      for (const img of images) {
        fd.append("images", img.file);
      }

      const res = await fetch("/api/harvests", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Failed to create adventure");

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
              {isDragActive ? "Drop photos here" : "Upload adventure photos"}
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
                  <p className="text-xs text-slate-400">Let AI identify what you caught</p>
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
                Adventure Date & Time <span className="text-red-400">*</span>
              </label>
              <input
                type="datetime-local"
                value={form.harvested_at}
                onChange={(e) => updateForm("harvested_at", e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-slate-200 focus:outline-none focus:border-amber-500 [color-scheme:dark]"
              />
            </div>

            {/* ── General conditions ── */}
            <div className="col-span-2 border-t border-slate-700 pt-4 mt-1">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Conditions (optional)</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">State</label>
                  <input type="text" value={form.state} onChange={(e) => updateForm("state", e.target.value)}
                    placeholder="e.g. Wyoming" className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Land Type</label>
                  <select value={form.land_type} onChange={(e) => updateForm("land_type", e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 text-sm">
                    <option value="">— optional —</option>
                    <option value="PUBLIC">Public</option>
                    <option value="PRIVATE">Private</option>
                    <option value="UNKNOWN">Unknown</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Time of Day</label>
                  <select value={form.time_of_day} onChange={(e) => updateForm("time_of_day", e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 text-sm">
                    <option value="">— optional —</option>
                    <option value="MORNING">Morning</option>
                    <option value="MIDDAY">Midday</option>
                    <option value="EVENING">Evening</option>
                    <option value="NIGHT">Night</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Weather</label>
                  <select value={form.weather} onChange={(e) => updateForm("weather", e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 text-sm">
                    <option value="">— optional —</option>
                    <option value="SUNNY">Sunny</option>
                    <option value="OVERCAST">Overcast</option>
                    <option value="WIND">Windy</option>
                    <option value="RAIN">Rain</option>
                    <option value="SNOW">Snow</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Moon Phase</label>
                  <select value={form.moon_phase} onChange={(e) => updateForm("moon_phase", e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 text-sm">
                    <option value="">— optional —</option>
                    {["NEW","WAXING_CRESCENT","FIRST_QUARTER","WAXING_GIBBOUS","FULL","WANING_GIBBOUS","LAST_QUARTER","WANING_CRESCENT"].map(p => (
                      <option key={p} value={p}>{p.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Companions</label>
                  <input type="text" value={form.companions} onChange={(e) => updateForm("companions", e.target.value)}
                    placeholder="Solo, or names…" className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm" />
                </div>
                <div className="col-span-2 flex gap-5">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                    <input type="checkbox" checked={form.personal_best} onChange={(e) => updateForm("personal_best", e.target.checked as any)}
                      className="h-4 w-4 rounded border-slate-600 bg-slate-800 accent-amber-500" />
                    Personal best
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                    <input type="checkbox" checked={form.harvest_success} onChange={(e) => updateForm("harvest_success", e.target.checked as any)}
                      className="h-4 w-4 rounded border-slate-600 bg-slate-800 accent-amber-500" />
                    Successful adventure
                  </label>
                </div>
              </div>
            </div>

            {/* ── Hunting-specific (BIG_GAME | BIRD) ── */}
            {(form.species_type === "BIG_GAME" || form.species_type === "BIRD") && (
              <div className="col-span-2 bg-slate-800/40 border border-slate-700 rounded-xl p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">🦌 Hunting Details</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Season Type</label>
                    <select value={form.season_type} onChange={(e) => updateForm("season_type", e.target.value)}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 text-sm">
                      <option value="">— optional —</option>
                      <option value="ARCHERY">Archery</option>
                      <option value="MUZZLELOADER">Muzzleloader</option>
                      <option value="RIFLE">Rifle</option>
                      <option value="GENERAL">General</option>
                      <option value="SHOTGUN">Shotgun</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Tag Type</label>
                    <select value={form.tag_type} onChange={(e) => updateForm("tag_type", e.target.value)}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 text-sm">
                      <option value="">— optional —</option>
                      <option value="GENERAL">General</option>
                      <option value="LIMITED_ENTRY">Limited Entry</option>
                      <option value="OTC">Over the Counter</option>
                      <option value="PRIVATE">Private</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Animal Age</label>
                    <select value={form.animal_age} onChange={(e) => updateForm("animal_age", e.target.value)}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 text-sm">
                      <option value="">— optional —</option>
                      <option value="MATURE">Mature</option>
                      <option value="YOUNG">Young</option>
                      <option value="UNKNOWN">Unknown</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Shot Distance (yds)</label>
                    <input type="number" min="0" value={form.shot_distance_yards} onChange={(e) => updateForm("shot_distance_yards", e.target.value)}
                      placeholder="0" className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Point Count</label>
                    <input type="number" min="0" value={form.point_count} onChange={(e) => updateForm("point_count", e.target.value)}
                      placeholder="e.g. 6" className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Score (B&C / P&Y)</label>
                    <input type="number" min="0" step="0.1" value={form.score} onChange={(e) => updateForm("score", e.target.value)}
                      placeholder="0.0" className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm" />
                  </div>
                </div>
              </div>
            )}

            {/* ── Fishing-specific (FISH) ── */}
            {form.species_type === "FISH" && (
              <div className="col-span-2 bg-slate-800/40 border border-slate-700 rounded-xl p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">🎣 Fishing Details</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Technique</label>
                    <select value={form.technique} onChange={(e) => updateForm("technique", e.target.value)}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 text-sm">
                      <option value="">— optional —</option>
                      {["DRY_FLY","NYMPH","STREAMER","SPIN","BAITCAST","TROLLING","ICE_FISHING","FLY"].map(t => (
                        <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Water Type</label>
                    <select value={form.water_type} onChange={(e) => updateForm("water_type", e.target.value)}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 text-sm">
                      <option value="">— optional —</option>
                      {["RIVER","LAKE","RESERVOIR","STREAM","POND","BAY_ESTUARY","OCEAN_OFFSHORE","OCEAN_FLATS"].map(w => (
                        <option key={w} value={w}>{w.replace(/_/g, " ")}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Water Conditions</label>
                    <select value={form.water_conditions} onChange={(e) => updateForm("water_conditions", e.target.value)}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 text-sm">
                      <option value="">— optional —</option>
                      <option value="CLEAR">Clear</option>
                      <option value="MURKY">Murky</option>
                      <option value="HIGH">High</option>
                      <option value="LOW">Low</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Fly Pattern</label>
                    <input type="text" value={form.fly_pattern} onChange={(e) => updateForm("fly_pattern", e.target.value)}
                      placeholder="e.g. PMD #16" className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Fish Count</label>
                    <input type="number" min="1" value={form.fish_count} onChange={(e) => updateForm("fish_count", e.target.value)}
                      placeholder="1" className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm" />
                  </div>
                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                      <input type="checkbox" checked={form.catch_release} onChange={(e) => updateForm("catch_release", e.target.checked as any)}
                        className="h-4 w-4 rounded border-slate-600 bg-slate-800 accent-amber-500" />
                      Catch &amp; release
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* ── Video URL ── */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Video URL (optional)</label>
              <input type="url" value={form.video_url} onChange={(e) => updateForm("video_url", e.target.value)}
                placeholder="YouTube, Vimeo, Instagram, or TikTok link"
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500" />
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
              placeholder="Tell the story behind this adventure…"
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
            Post Adventure
          </Button>
        )}
      </div>
    </div>
  );
}
