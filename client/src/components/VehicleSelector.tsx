import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface VehicleSelectorProps {
  year: string;
  make: string;
  model: string;
  trim?: string;
  onYearChange: (year: string) => void;
  onMakeChange: (make: string) => void;
  onModelChange: (model: string) => void;
  onTrimChange?: (trim: string) => void;
  showTrim?: boolean;
  disabled?: boolean;
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 1900 + 2 }, (_, i) => currentYear + 1 - i);

export function VehicleSelector({
  year,
  make,
  model,
  trim = "",
  onYearChange,
  onMakeChange,
  onModelChange,
  onTrimChange,
  showTrim = false,
  disabled = false,
}: VehicleSelectorProps) {
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [trims, setTrims] = useState<string[]>([]);
  const [loadingMakes, setLoadingMakes] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingTrims, setLoadingTrims] = useState(false);
  const [makesError, setMakesError] = useState<string | null>(null);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [trimsError, setTrimsError] = useState<string | null>(null);

  useEffect(() => {
    if (!year) {
      setMakes([]);
      return;
    }

    setLoadingMakes(true);
    setMakesError(null);
    fetch(`/api/vehicles/makes?year=${year}`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to load makes");
        return res.json();
      })
      .then(data => {
        setMakes(data.makes || []);
      })
      .catch(err => {
        console.error(err);
        setMakesError("Could not load manufacturers");
        setMakes([]);
      })
      .finally(() => setLoadingMakes(false));
  }, [year]);

  useEffect(() => {
    if (!year || !make) {
      setModels([]);
      return;
    }

    setLoadingModels(true);
    setModelsError(null);
    fetch(`/api/vehicles/models?year=${year}&make=${encodeURIComponent(make)}`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to load models");
        return res.json();
      })
      .then(data => {
        setModels(data.models || []);
      })
      .catch(err => {
        console.error(err);
        setModelsError("Could not load models");
        setModels([]);
      })
      .finally(() => setLoadingModels(false));
  }, [year, make]);

  useEffect(() => {
    if (!showTrim || !year || !make || !model) {
      setTrims([]);
      return;
    }

    setLoadingTrims(true);
    setTrimsError(null);
    fetch(`/api/vehicles/trims?year=${year}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to load trims");
        return res.json();
      })
      .then(data => {
        setTrims(data.trims || []);
      })
      .catch(err => {
        console.error(err);
        setTrimsError("Could not load trims");
        setTrims([]);
      })
      .finally(() => setLoadingTrims(false));
  }, [showTrim, year, make, model]);

  const handleYearChange = (newYear: string) => {
    onYearChange(newYear);
    onMakeChange("");
    onModelChange("");
    if (onTrimChange) onTrimChange("");
  };

  const handleMakeChange = (newMake: string) => {
    onMakeChange(newMake);
    onModelChange("");
    if (onTrimChange) onTrimChange("");
  };

  const handleModelChange = (newModel: string) => {
    onModelChange(newModel);
    if (onTrimChange) onTrimChange("");
  };

  return (
    <div className="space-y-4">
      {/* VIN input field at top, full width */}
      <div className="w-full">
        <Label htmlFor="vin">VIN</Label>
        <input
          id="vin"
          type="text"
          maxLength={17}
          className="w-full border rounded-md px-3 py-2 text-sm"
          placeholder="Enter VIN"
          onChange={e => onTrimChange && onTrimChange(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="year">Year *</Label>
          <Select
            value={year}
            onValueChange={handleYearChange}
            disabled={disabled}
          >
            <SelectTrigger id="year" data-testid="select-year">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="make">Make *</Label>
          <Select
            value={make}
            onValueChange={handleMakeChange}
            disabled={disabled || !year || loadingMakes}
          >
            <SelectTrigger id="make" data-testid="select-make">
              {loadingMakes ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading...</span>
                </div>
              ) : (
                <SelectValue placeholder={!year ? "Select year first" : "Select make"} />
              )}
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {makesError ? (
                <div className="px-2 py-1 text-sm text-red-500">{makesError}</div>
              ) : makes.length === 0 ? (
                <div className="px-2 py-1 text-sm text-slate-500">No makes available</div>
              ) : (
                makes.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="model">Model *</Label>
          <Select
            value={model}
            onValueChange={handleModelChange}
            disabled={disabled || !year || !make || loadingModels}
          >
            <SelectTrigger id="model" data-testid="select-model">
              {loadingModels ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading...</span>
                </div>
              ) : (
                <SelectValue placeholder={!make ? "Select make first" : "Select model"} />
              )}
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {modelsError ? (
                <div className="px-2 py-1 text-sm text-red-500">{modelsError}</div>
              ) : models.length === 0 ? (
                <div className="px-2 py-1 text-sm text-slate-500">No models available</div>
              ) : (
                models.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>


      {showTrim && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="trim">Trim (Optional)</Label>
            <Select
              value={trim}
              onValueChange={onTrimChange || (() => {})}
              disabled={disabled || !year || !make || !model || loadingTrims}
            >
              <SelectTrigger id="trim" data-testid="select-trim">
                {loadingTrims ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading...</span>
                  </div>
                ) : (
                  <SelectValue placeholder={!model ? "Select model first" : "Select trim"} />
                )}
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {trimsError ? (
                  <div className="px-2 py-1 text-sm text-red-500">{trimsError}</div>
                ) : trims.length === 0 ? (
                  <div className="px-2 py-1 text-sm text-slate-500">No trims available</div>
                ) : (
                  trims.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}
