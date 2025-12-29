import { useState, useEffect, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertTriangle, Check, X } from "lucide-react";

interface DecodedVehicle {
  year?: number;
  make?: string;
  model?: string;
  trim?: string;
}

interface VehicleSelectorProps {
  year: string;
  make: string;
  model: string;
  trim?: string;
  vin?: string;
  onYearChange: (year: string) => void;
  onMakeChange: (make: string) => void;
  onModelChange: (model: string) => void;
  onTrimChange?: (trim: string) => void;
  onVinChange?: (vin: string) => void;
  showTrim?: boolean;
  showVin?: boolean;
  disabled?: boolean;
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 1900 + 2 }, (_, i) => currentYear + 1 - i);

export function VehicleSelector({
  year,
  make,
  model,
  trim = "",
  vin = "",
  onYearChange,
  onMakeChange,
  onModelChange,
  onTrimChange,
  onVinChange,
  showTrim = false,
  showVin = false,
  disabled = false,
}: VehicleSelectorProps) {
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [trims, setTrims] = useState<string[]>([]);
  const [loadingMakes, setLoadingMakes] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingTrims, setLoadingTrims] = useState(false);
  const [loadingVin, setLoadingVin] = useState(false);
  const [makesError, setMakesError] = useState<string | null>(null);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [trimsError, setTrimsError] = useState<string | null>(null);
  const [vinError, setVinError] = useState<string | null>(null);
  
  const [decodedVehicle, setDecodedVehicle] = useState<DecodedVehicle | null>(null);
  const [showReconciliation, setShowReconciliation] = useState(false);
  const [vinInput, setVinInput] = useState(vin);

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

  const handleVinInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, "").slice(0, 17);
    setVinInput(value);
    setVinError(null);
    setShowReconciliation(false);
    setDecodedVehicle(null);
  };

  const decodeVinHandler = useCallback(async () => {
    if (vinInput.length !== 17) {
      setVinError("VIN must be exactly 17 characters");
      return;
    }

    setLoadingVin(true);
    setVinError(null);
    
    try {
      const res = await fetch(`/api/vehicles/decode-vin?vin=${vinInput}`);
      if (!res.ok) {
        throw new Error("Failed to decode VIN");
      }
      
      const decoded: DecodedVehicle = await res.json();
      setDecodedVehicle(decoded);
      
      if (onVinChange) {
        onVinChange(vinInput);
      }

      const hasYear = !!decoded.year;
      const hasMake = !!decoded.make;
      const hasModel = !!decoded.model;
      
      const yearMismatch = hasYear && year && String(decoded.year) !== year;
      const makeMismatch = hasMake && make && decoded.make?.toLowerCase() !== make.toLowerCase();
      const modelMismatch = hasModel && model && decoded.model?.toLowerCase() !== model.toLowerCase();
      
      if ((yearMismatch || makeMismatch || modelMismatch) && (year || make || model)) {
        setShowReconciliation(true);
      } else if (hasYear || hasMake || hasModel) {
        applyDecodedVehicle(decoded);
      }
    } catch (err) {
      console.error(err);
      setVinError("Could not decode VIN. Please check and try again.");
    } finally {
      setLoadingVin(false);
    }
  }, [vinInput, year, make, model, onVinChange]);

  const applyDecodedVehicle = (decoded: DecodedVehicle) => {
    if (decoded.year) {
      onYearChange(String(decoded.year));
    }
    if (decoded.make) {
      onMakeChange(decoded.make);
    }
    if (decoded.model) {
      onModelChange(decoded.model);
    }
    if (decoded.trim && onTrimChange) {
      onTrimChange(decoded.trim);
    }
    setShowReconciliation(false);
  };

  const dismissReconciliation = () => {
    setShowReconciliation(false);
  };

  return (
    <div className="space-y-4">
      {showVin && (
        <div className="space-y-2">
          <Label htmlFor="vin">VIN (Optional)</Label>
          <div className="flex gap-2">
            <Input
              id="vin"
              data-testid="input-vin"
              value={vinInput}
              onChange={handleVinInputChange}
              placeholder="Enter 17-character VIN"
              maxLength={17}
              disabled={disabled || loadingVin}
              className="font-mono uppercase"
            />
            <Button
              type="button"
              variant="outline"
              onClick={decodeVinHandler}
              disabled={disabled || loadingVin || vinInput.length !== 17}
              data-testid="button-decode-vin"
            >
              {loadingVin ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Decode"
              )}
            </Button>
          </div>
          {vinError && (
            <p className="text-sm text-red-500" data-testid="text-vin-error">{vinError}</p>
          )}
          <p className="text-xs text-slate-500">
            Enter your VIN to auto-fill vehicle details, or select manually below.
          </p>
        </div>
      )}

      {showReconciliation && decodedVehicle && (
        <Alert className="border-amber-500 bg-amber-50" data-testid="alert-vin-reconciliation">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Vehicle Details Found</AlertTitle>
          <AlertDescription className="text-amber-700">
            <p className="mb-2">
              We found vehicle details from your VIN that differ from your current selection:
            </p>
            <div className="bg-white rounded p-2 mb-3 text-sm">
              <p><strong>From VIN:</strong> {decodedVehicle.year} {decodedVehicle.make} {decodedVehicle.model} {decodedVehicle.trim || ""}</p>
              {(year || make || model) && (
                <p><strong>Current:</strong> {year} {make} {model} {trim}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => applyDecodedVehicle(decodedVehicle)}
                data-testid="button-apply-vin"
              >
                <Check className="h-4 w-4 mr-1" />
                Apply VIN Details
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={dismissReconciliation}
                data-testid="button-dismiss-vin"
              >
                <X className="h-4 w-4 mr-1" />
                Keep Current Selection
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

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
