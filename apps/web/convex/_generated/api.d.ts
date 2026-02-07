/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as categories from "../categories.js";
import type * as collections from "../collections.js";
import type * as comments from "../comments.js";
import type * as crons from "../crons.js";
import type * as debug from "../debug.js";
import type * as http from "../http.js";
import type * as lib_access from "../lib/access.js";
import type * as lib_sanitizeSoulContent from "../lib/sanitizeSoulContent.js";
import type * as migrations from "../migrations.js";
import type * as reports from "../reports.js";
import type * as search from "../search.js";
import type * as seed from "../seed.js";
import type * as soulActions from "../soulActions.js";
import type * as souls from "../souls.js";
import type * as tags from "../tags.js";
import type * as trending from "../trending.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  categories: typeof categories;
  collections: typeof collections;
  comments: typeof comments;
  crons: typeof crons;
  debug: typeof debug;
  http: typeof http;
  "lib/access": typeof lib_access;
  "lib/sanitizeSoulContent": typeof lib_sanitizeSoulContent;
  migrations: typeof migrations;
  reports: typeof reports;
  search: typeof search;
  seed: typeof seed;
  soulActions: typeof soulActions;
  souls: typeof souls;
  tags: typeof tags;
  trending: typeof trending;
  users: typeof users;
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
