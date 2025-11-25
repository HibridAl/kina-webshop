export type OilSelectorDataset = {
  [make: string]: OilSelectorMakeEntry;
};

export type OilSelectorMakeEntry = {
  [modelKey: string]: OilSelectorModelEntry;
};

export type OilSelectorModelEntry = {
  [hash: string]: OilSelectorVehicleRecord;
};

export interface OilSelectorVehicleRecord {
  vehicle: {
    make: string;
    model: string;
    type: string;
    hash: string;
  };
  results: {
    [systemName: string]: OilSelectorSystem;
  };
}

export interface OilSelectorSystem {
  capacities?: string[];
  uses?: {
    [usageName: string]: {
      interval?: string[];
      products?: {
        [productCode: string]: OilSelectorProduct;
      };
    };
  };
}

export interface OilSelectorProduct {
  name: string;
  url: string;
  image: string;
}

export const CHINESE_MAKES = ['MG', 'BYD', 'Omoda', 'Geely', 'Haval'] as const;
export type ChineseMake = (typeof CHINESE_MAKES)[number];


