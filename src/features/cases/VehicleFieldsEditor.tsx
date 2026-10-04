import type { ReactNode } from "react";
import { VEHICLE_TYPES } from "../../constants/options";
import type { VehicleFormItem } from "./vehicleForm";

interface VehicleFieldsEditorProps {
  vehicles: VehicleFormItem[];
  onChange: (index: number, patch: Partial<VehicleFormItem>) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}

const inputClass =
  "w-40 rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none";

interface RowDef {
  label: string;
  render: (vehicle: VehicleFormItem, index: number, ariaLabel: string) => ReactNode;
}

/** Compact, spreadsheet-style editor: each vehicle is a column so adding vehicles grows the table sideways. */
export default function VehicleFieldsEditor({ vehicles, onChange, onAdd, onRemove }: VehicleFieldsEditorProps) {
  const rows: RowDef[] = [
    {
      label: "Vehicle no.",
      render: (v, i, ariaLabel) => (
        <input
          type="text"
          required
          aria-label={ariaLabel}
          value={v.vehicleNo}
          onChange={(e) => onChange(i, { vehicleNo: e.target.value })}
          className={inputClass}
        />
      ),
    },
    {
      label: "Registration date",
      render: (v, i, ariaLabel) => (
        <input
          type="date"
          aria-label={ariaLabel}
          value={v.vehicleRegistrationDate}
          onChange={(e) => onChange(i, { vehicleRegistrationDate: e.target.value })}
          className={inputClass}
        />
      ),
    },
    {
      label: "Vehicle type",
      render: (v, i, ariaLabel) => (
        <select
          aria-label={ariaLabel}
          value={v.vehicleType}
          onChange={(e) => onChange(i, { vehicleType: e.target.value })}
          className={inputClass}
        >
          <option value="">Select…</option>
          {VEHICLE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      ),
    },
    {
      label: "Vehicle Model",
      render: (v, i, ariaLabel) => (
        <input
          type="text"
          aria-label={ariaLabel}
          value={v.vehicleCategory}
          onChange={(e) => onChange(i, { vehicleCategory: e.target.value })}
          className={inputClass}
        />
      ),
    },
    {
      label: "Vehicle owner",
      render: (v, i, ariaLabel) => (
        <input
          type="text"
          aria-label={ariaLabel}
          value={v.vehicleOwner}
          onChange={(e) => onChange(i, { vehicleOwner: e.target.value })}
          className={inputClass}
        />
      ),
    },
    {
      label: "Driver name",
      render: (v, i, ariaLabel) => (
        <input
          type="text"
          aria-label={ariaLabel}
          value={v.driverName}
          onChange={(e) => onChange(i, { driverName: e.target.value })}
          className={inputClass}
        />
      ),
    },
    {
      label: "Driving license",
      render: (v, i, ariaLabel) => (
        <input
          type="text"
          aria-label={ariaLabel}
          value={v.drivingLicense}
          onChange={(e) => onChange(i, { drivingLicense: e.target.value })}
          className={inputClass}
        />
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
        <table className="border-collapse text-sm">
          <thead>
            <tr>
              <th className="w-36 border-b border-slate-200 bg-slate-50 p-2 text-left text-xs font-semibold text-slate-500">
                Field
              </th>
              {vehicles.map((vehicle, index) => (
                <th
                  key={vehicle.id ?? index}
                  className="border-b border-l border-slate-200 bg-slate-50 p-2 text-left"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-700">Vehicle {index + 1}</span>
                    {vehicles.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onRemove(index)}
                        className="text-xs font-medium text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <th
                  scope="row"
                  className="border-b border-slate-100 p-2 text-left text-xs font-medium text-slate-500"
                >
                  {row.label}
                </th>
                {vehicles.map((vehicle, index) => (
                  <td key={vehicle.id ?? index} className="border-b border-l border-slate-100 p-2">
                    {row.render(vehicle, index, `${row.label} for vehicle ${index + 1}`)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={onAdd}
        className="w-full rounded-md border border-dashed border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:border-slate-400"
      >
        + Add another vehicle
      </button>
    </div>
  );
}
