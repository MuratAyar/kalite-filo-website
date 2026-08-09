declare const entityIdBrand: unique symbol;
declare const slugBrand: unique symbol;
declare const internalPathBrand: unique symbol;
declare const httpsUrlBrand: unique symbol;
declare const isoDateBrand: unique symbol;
declare const currencyCodeBrand: unique symbol;
declare const localAssetPathBrand: unique symbol;

export type EntityId = string & { readonly [entityIdBrand]: "EntityId" };
export type Slug = string & { readonly [slugBrand]: "Slug" };
export type InternalPath = string & {
  readonly [internalPathBrand]: "InternalPath";
};
export type HttpsUrl = string & { readonly [httpsUrlBrand]: "HttpsUrl" };
export type IsoDate = string & { readonly [isoDateBrand]: "IsoDate" };
export type CurrencyCode = string & {
  readonly [currencyCodeBrand]: "CurrencyCode";
};
export type LocalAssetPath = string & {
  readonly [localAssetPathBrand]: "LocalAssetPath";
};

export type PublicationStatus = "draft" | "approved";
export type TelephoneUrl = `tel:${string}`;
export type EmailUrl = `mailto:${string}`;

