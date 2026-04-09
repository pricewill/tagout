"use client";

import { useState, useTransition, FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Harvest } from "@prisma/client";

const LAND_TYPES = ["", "PUBLIC", "PRIVATE", "UNKNOWN"] as const;
const WEATHERS = ["", "SUNNY", "OVERCAST", "WIND", "RAIN", "SNOW"] as const;
const MOON_PHASES = [
  "",
  "NEW",
  "WAXING_CRESCENT",
  "FIRST_QUARTER",
  "WAXING_GIBBOUS",
  "FULL",
  "WANING_GIBBOUS",
  "LAST_QUARTER",
  "WANING_CRESCENT",
] as const;
const TIMES_OF_DAY = ["", "MORNING", "MIDDAY", "AFTERNOON", "NIGHT"] as const;
const SEASON_TYPES = [
  "",
  "ARCHERY",
  "MUZZLELOADER",
  "RIFLE",
  "GENERAL",
  "SHOTGUN",
] as const;
const TAG_TYPES = ["", "GENERAL", "LIMITED_ENTRY", "OTC", "PRIVATE"] as const;
const ANIMAL_AGES = ["", "MATURE", "YOUNG", "UNKNOWN"] as const;
const WATER_TYPES = [
  "",
  "RIVER",
  "LAKE",
  "RESERVOIR",
  "STREAM",
  "POND",
  "BAY_ESTUARY",
  "OCEAN_OFFSHORE",
  "OCEAN_FLATS",
] as const;
const TECHNIQUES = [
  "",
  "DRY_FLY",
  "NYMPH",
  "STREAMER",
  "SPIN",
  "BAITCAST",
  "TROLLING",
  "ICE_FISHING",
  "FLY",
] as const;
const WATER_CONDITIONS = ["", "CLEAR", "MURKY", "HIGH", "LOW"] as const;

function label(cls = "") {
  return `text-xs font-bold uppercase tracking-widest text-[#4a7a4a] ${cls}`;
}

const inputCls =
  "w-full rounded-lg border border-[#2D4A2D] bg-[#111f11] px-3 py-2 text-sm text-white placeholder:text-[#4a7a4a] focus:border-[#C17F24] focus:outline-none";

export function EditHarvestForm({ harvest }: { harvest: Harvest }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isHunting =
    harvest.species_type === "BIG_GAME" || harvest.species_type === "BIRD";
  const isFishing = harvest.species_type === "FISH";

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);

    // Build payload — empty strings become null so the field clears.
    const payload: Record<string, unknown> = {};
    const str = (k: string) => {
      const v = fd.get(k);
      if (v === null) return;
      const s = String(v).trim();
      payload[k] = s === "" ? null : s;
    };
    const num = (k: string) => {
      const v = fd.get(k);
      if (v === null) return;
      const s = String(v).trim();
      payload[k] = s === "" ? null : Number(s);
    };
    const bool = (k: string) => {
      payload[k] = fd.get(k) === "on";
    };

    str("caption");
    str("video_url");
    str("species");
    str("method");
    num("weight_lbs");
    num("length_in");
    str("companions");
    str("state");
    str("land_type");
    str("weather");
    str("moon_phase");
    str("time_of_day");
    bool("personal_best");
    bool("harvest_success");

    if (isHunting) {
      num("shot_distance_yards");
      str("season_type");
      str("tag_type");
      str("animal_age");
      num("point_count");
      num("score");
    }
    if (isFishing) {
      str("fly_pattern");
      str("water_type");
      str("technique");
      bool("catch_release");
      num("fish_count");
      str("water_conditions");
    }

    startTransition(async () => {
      try {
        const res = await fetch(`/api/harvests/${harvest.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Failed to save");
        }
        router.push(`/harvest/${harvest.id}`);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save");
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-2">
        <p className={label()}>Species</p>
        <input
          name="species"
          defaultValue={harvest.species}
          required
          className={inputCls}
        />
      </div>

      <div className="space-y-2">
        <p className={label()}>Caption</p>
        <textarea
          name="caption"
          defaultValue={harvest.caption ?? ""}
          rows={4}
          className={inputCls}
          placeholder="Tell the story…"
        />
      </div>

      <div className="space-y-2">
        <p className={label()}>Video URL</p>
        <input
          name="video_url"
          type="url"
          defaultValue={harvest.video_url ?? ""}
          className={inputCls}
          placeholder="https://youtube.com/…"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <p className={label()}>Weight (lbs)</p>
          <input
            name="weight_lbs"
            type="number"
            step="0.01"
            defaultValue={harvest.weight_lbs ?? ""}
            className={inputCls}
          />
        </div>
        <div className="space-y-2">
          <p className={label()}>Length (in)</p>
          <input
            name="length_in"
            type="number"
            step="0.01"
            defaultValue={harvest.length_in ?? ""}
            className={inputCls}
          />
        </div>
      </div>

      <div className="space-y-2">
        <p className={label()}>Method</p>
        <input
          name="method"
          defaultValue={harvest.method ?? ""}
          className={inputCls}
        />
      </div>

      <div className="space-y-2">
        <p className={label()}>Companions</p>
        <input
          name="companions"
          defaultValue={harvest.companions ?? ""}
          className={inputCls}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <p className={label()}>State</p>
          <input
            name="state"
            defaultValue={harvest.state ?? ""}
            className={inputCls}
          />
        </div>
        <div className="space-y-2">
          <p className={label()}>Land type</p>
          <select
            name="land_type"
            defaultValue={harvest.land_type ?? ""}
            className={inputCls}
          >
            {LAND_TYPES.map((v) => (
              <option key={v} value={v}>
                {v || "—"}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <p className={label()}>Weather</p>
          <select
            name="weather"
            defaultValue={harvest.weather ?? ""}
            className={inputCls}
          >
            {WEATHERS.map((v) => (
              <option key={v} value={v}>
                {v || "—"}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <p className={label()}>Moon phase</p>
          <select
            name="moon_phase"
            defaultValue={harvest.moon_phase ?? ""}
            className={inputCls}
          >
            {MOON_PHASES.map((v) => (
              <option key={v} value={v}>
                {v || "—"}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <p className={label()}>Time of day</p>
        <select
          name="time_of_day"
          defaultValue={harvest.time_of_day ?? ""}
          className={inputCls}
        >
          {TIMES_OF_DAY.map((v) => (
            <option key={v} value={v}>
              {v || "—"}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-6 text-sm text-[#c8d8c8]">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="personal_best"
            defaultChecked={!!harvest.personal_best}
          />
          Personal best
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="harvest_success"
            defaultChecked={harvest.harvest_success ?? true}
          />
          Successful harvest
        </label>
      </div>

      {isHunting && (
        <div className="rounded-xl border border-[#2D4A2D] bg-[#111f11] p-4 space-y-4">
          <p className={label()}>🦌 Hunt details</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <p className={label()}>Shot distance (yds)</p>
              <input
                name="shot_distance_yards"
                type="number"
                step="1"
                defaultValue={harvest.shot_distance_yards ?? ""}
                className={inputCls}
              />
            </div>
            <div className="space-y-2">
              <p className={label()}>Season</p>
              <select
                name="season_type"
                defaultValue={harvest.season_type ?? ""}
                className={inputCls}
              >
                {SEASON_TYPES.map((v) => (
                  <option key={v} value={v}>
                    {v || "—"}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <p className={label()}>Tag</p>
              <select
                name="tag_type"
                defaultValue={harvest.tag_type ?? ""}
                className={inputCls}
              >
                {TAG_TYPES.map((v) => (
                  <option key={v} value={v}>
                    {v || "—"}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <p className={label()}>Age</p>
              <select
                name="animal_age"
                defaultValue={harvest.animal_age ?? ""}
                className={inputCls}
              >
                {ANIMAL_AGES.map((v) => (
                  <option key={v} value={v}>
                    {v || "—"}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <p className={label()}>Points</p>
              <input
                name="point_count"
                type="number"
                step="1"
                defaultValue={harvest.point_count ?? ""}
                className={inputCls}
              />
            </div>
            <div className="space-y-2">
              <p className={label()}>Score</p>
              <input
                name="score"
                type="number"
                step="0.01"
                defaultValue={harvest.score ?? ""}
                className={inputCls}
              />
            </div>
          </div>
        </div>
      )}

      {isFishing && (
        <div className="rounded-xl border border-[#2D4A2D] bg-[#111f11] p-4 space-y-4">
          <p className={label()}>🎣 Fishing details</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <p className={label()}>Water type</p>
              <select
                name="water_type"
                defaultValue={harvest.water_type ?? ""}
                className={inputCls}
              >
                {WATER_TYPES.map((v) => (
                  <option key={v} value={v}>
                    {v || "—"}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <p className={label()}>Technique</p>
              <select
                name="technique"
                defaultValue={harvest.technique ?? ""}
                className={inputCls}
              >
                {TECHNIQUES.map((v) => (
                  <option key={v} value={v}>
                    {v || "—"}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <p className={label()}>Water conditions</p>
              <select
                name="water_conditions"
                defaultValue={harvest.water_conditions ?? ""}
                className={inputCls}
              >
                {WATER_CONDITIONS.map((v) => (
                  <option key={v} value={v}>
                    {v || "—"}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <p className={label()}>Fly pattern</p>
              <input
                name="fly_pattern"
                defaultValue={harvest.fly_pattern ?? ""}
                className={inputCls}
              />
            </div>
            <div className="space-y-2">
              <p className={label()}>Fish count</p>
              <input
                name="fish_count"
                type="number"
                step="1"
                defaultValue={harvest.fish_count ?? ""}
                className={inputCls}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-[#c8d8c8] self-end pb-2">
              <input
                type="checkbox"
                name="catch_release"
                defaultChecked={!!harvest.catch_release}
              />
              Catch &amp; release
            </label>
          </div>
        </div>
      )}

      {error && (
        <p className="rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-[#C17F24] px-5 py-2.5 text-sm font-bold text-[#0d1a0d] hover:bg-[#d68d2a] disabled:opacity-50 transition-colors"
        >
          {isPending ? "Saving…" : "Save changes"}
        </button>
        <a
          href={`/harvest/${harvest.id}`}
          className="text-sm text-[#8aaa8a] hover:text-white transition-colors"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
