export const customerTypeOptions = [
  { description: "Personal account for one person or family use.", label: "Individual", value: "individual" },
  { description: "Private company, store, or commercial trading account.", label: "Business", value: "business" },
  { description: "Government ministry, department, or public office account.", label: "Government", value: "government" },
  { description: "NGO, charity, or other non-profit organization account.", label: "NGO / Organization", value: "ngo" },
] as const;

export type CustomerType = (typeof customerTypeOptions)[number]["value"];

export function normalizeCustomerType(value: string | null | undefined): CustomerType {
  switch (value) {
    case "business":
    case "government":
    case "ngo":
      return value;
    default:
      return "individual";
  }
}

export function getCustomerTypeLabel(value: string | null | undefined) {
  return customerTypeOptions.find((option) => option.value === value)?.label ?? "Individual";
}

export function isOrganizationCustomerType(value: string | null | undefined) {
  return normalizeCustomerType(value) !== "individual";
}

export function getCustomerDocumentLabel(value: string | null | undefined) {
  return isOrganizationCustomerType(value) ? "Organization Registration" : "ID";
}
