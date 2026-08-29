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
import type * as chaos from "../chaos.js";
import type * as finalReport from "../finalReport.js";
import type * as lib_auth from "../lib/auth.js";
import type * as qa from "../qa.js";
import type * as redTeam from "../redTeam.js";
import type * as reports from "../reports.js";
import type * as rubrics from "../rubrics.js";
import type * as sessions from "../sessions.js";
import type * as transcripts from "../transcripts.js";
import type * as uploads from "../uploads.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  actions: typeof actions;
  chaos: typeof chaos;
  finalReport: typeof finalReport;
  "lib/auth": typeof lib_auth;
  qa: typeof qa;
  redTeam: typeof redTeam;
  reports: typeof reports;
  rubrics: typeof rubrics;
  sessions: typeof sessions;
  transcripts: typeof transcripts;
  uploads: typeof uploads;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
