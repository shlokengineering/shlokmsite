/** Shared shape for a vehicle + its single driver/owner, used by both the create and edit case forms. */
export interface VehicleFormItem {
  /** Present when editing an existing vehicle row. */
  id?: string;
  /** Present when editing an existing driver row. */
  driverId?: string;
  vehicleNo: string;
  vehicleRegistrationDate: string;
  vehicleType: string;
  vehicleCategory: string;
  vehicleOwner: string;
  driverName: string;
  drivingLicense: string;
}

export function createEmptyVehicle(): VehicleFormItem {
  return {
    vehicleNo: "",
    vehicleRegistrationDate: "",
    vehicleType: "",
    vehicleCategory: "",
    vehicleOwner: "",
    driverName: "",
    drivingLicense: "",
  };
}
