/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actions from "../actions.js";
import type * as companies from "../companies.js";
import type * as lib_openai_service from "../lib/openai_service.js";
import type * as lib_perplexity_service from "../lib/perplexity_service.js";
import type * as lib_types from "../lib/types.js";
import type * as reportMutations from "../reportMutations.js";
import type * as reports from "../reports.js";
import type * as seed from "../seed.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  actions: typeof actions;
  companies: typeof companies;
  "lib/openai_service": typeof lib_openai_service;
  "lib/perplexity_service": typeof lib_perplexity_service;
  "lib/types": typeof lib_types;
  reportMutations: typeof reportMutations;
  reports: typeof reports;
  seed: typeof seed;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {};
