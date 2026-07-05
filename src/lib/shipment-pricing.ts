import type { ShipmentType } from "@/lib/demo-data";

export type ChargeType =
  | "freight"
  | "minimum_charge"
  | "handling_fee"
  | "customs_fee"
  | "delivery_fee";

export type PricingRuleInput = {
  chargeType: ChargeType;
  currency: string;
  maximumValue: number | null;
  minimumValue: number;
  price: number;
  shipmentType: ShipmentType;
};

export type ShipmentPricingEstimate = {
  currency: string;
  customsFee: number;
  deliveryFee: number;
  freightAmount: number;
  freightRuleFound: boolean;
  handlingFee: number;
  measurementLabel: "cbm" | "kg";
  measurementValue: number;
  minimumCharge: number;
  minimumChargeApplied: boolean;
  shipmentType: ShipmentType;
};

export function getShipmentMeasurement(
  shipmentType: ShipmentType,
  metrics: { volume: number; weight: number },
) {
  if (shipmentType === "SEA") {
    return {
      label: "cbm" as const,
      value: Number(metrics.volume ?? 0),
    };
  }

  return {
    label: "kg" as const,
    value: Number(metrics.weight ?? 0),
  };
}

function selectRangeRule(
  rules: PricingRuleInput[],
  measurementValue: number,
) {
  return rules.find((rule) => {
    const min = Number(rule.minimumValue ?? 0);
    const max =
      rule.maximumValue === null || rule.maximumValue === undefined
        ? null
        : Number(rule.maximumValue);

    return measurementValue >= min && (max === null ? true : measurementValue <= max);
  });
}

function selectFixedCharge(
  rules: PricingRuleInput[],
) {
  return rules
    .slice()
    .sort((a, b) => Number(a.minimumValue ?? 0) - Number(b.minimumValue ?? 0))[0];
}

export function calculateShipmentInvoiceEstimate(input: {
  pricingRules: PricingRuleInput[];
  shipmentType: ShipmentType;
  volume: number;
  weight: number;
}): ShipmentPricingEstimate {
  const measurement = getShipmentMeasurement(input.shipmentType, {
    volume: input.volume,
    weight: input.weight,
  });

  const rulesByType = input.pricingRules.filter(
    (rule) => rule.shipmentType === input.shipmentType,
  );
  const freightRule = selectRangeRule(
    rulesByType.filter((rule) => rule.chargeType === "freight"),
    measurement.value,
  );
  const minimumChargeRule = selectFixedCharge(
    rulesByType.filter((rule) => rule.chargeType === "minimum_charge"),
  );
  const handlingFeeRule = selectFixedCharge(
    rulesByType.filter((rule) => rule.chargeType === "handling_fee"),
  );
  const customsFeeRule = selectFixedCharge(
    rulesByType.filter((rule) => rule.chargeType === "customs_fee"),
  );
  const deliveryFeeRule = selectFixedCharge(
    rulesByType.filter((rule) => rule.chargeType === "delivery_fee"),
  );

  const freightBase = freightRule ? measurement.value * Number(freightRule.price ?? 0) : 0;
  const minimumCharge = Number(minimumChargeRule?.price ?? 0);
  const freightAmount = Math.max(freightBase, minimumCharge);
  const minimumChargeApplied = minimumCharge > 0 && freightAmount > freightBase;
  const currency =
    freightRule?.currency ??
    minimumChargeRule?.currency ??
    handlingFeeRule?.currency ??
    customsFeeRule?.currency ??
    deliveryFeeRule?.currency ??
    "USD";

  return {
    currency,
    customsFee: Number(customsFeeRule?.price ?? 0),
    deliveryFee: Number(deliveryFeeRule?.price ?? 0),
    freightAmount,
    freightRuleFound: Boolean(freightRule),
    handlingFee: Number(handlingFeeRule?.price ?? 0),
    measurementLabel: measurement.label,
    measurementValue: measurement.value,
    minimumCharge,
    minimumChargeApplied,
    shipmentType: input.shipmentType,
  };
}
