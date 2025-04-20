import { z } from "zod";

// Base types matching WordPress PHP enums/types where applicable
const geoConditionTypeSchema = z.enum([
  "continent",
  "country",
  "region",
  "city",
  "ip",
]);
const geoOperatorSchema = z.enum(["is", "is not"]);
const pageTargetingTypeSchema = z.enum(["all", "specific"]);
const exclusionTypeSchema = z.enum([
  "url_equals",
  "url_contains",
  "query_contains",
  "hash_contains",
]);

// Schema for GeoCondition
const geoConditionSchema = z.object({
  // No ID needed here as it's managed by RHF's useFieldArray
  type: geoConditionTypeSchema,
  value: z.string().min(1, { message: "Condition value cannot be empty" }),
  operator: geoOperatorSchema,
});

// Schema for RedirectMapping
const redirectMappingSchema = z.object({
  id: z.string(), // Keep ID for React keys if needed, but not validated by RHF directly
  fromUrl: z
    .string()
    .min(1, { message: "From URL cannot be empty" })
    .refine((val) => val.startsWith("/") || val.startsWith("http"), {
      message: "From URL must start with '/' or 'http(s)://'",
    }),
  toUrl: z
    .string()
    .min(1, { message: "To URL cannot be empty" })
    .refine((val) => val.startsWith("/") || val.startsWith("http"), {
      message: "To URL must start with '/' or 'http(s)://'",
    }),
});

// Schema for PageExclusion
const pageExclusionSchema = z.object({
  id: z.string(), // Keep ID for React keys
  value: z.string().min(1, { message: "Exclusion value cannot be empty" }),
  type: exclusionTypeSchema,
});

// Schema for RedirectionLocation
// We use superRefine for cross-field validation
const redirectionLocationSchema = z
  .object({
    id: z.any(), // Keep ID for React keys
    conditions: z
      .array(geoConditionSchema)
      .min(1, { message: "At least one location condition is required" }),
    operator: z.enum(["AND", "OR"]),
    pageTargetingType: pageTargetingTypeSchema,
    redirectUrl: z.string().optional(), // Optional initially
    redirectMappings: z.array(redirectMappingSchema),
    exclusions: z.array(pageExclusionSchema),
    passPath: z.boolean(),
    passQuery: z.boolean(),
  })
  .superRefine((data, ctx) => {
    // Rule 1: If pageTargetingType is 'all', redirectUrl must be a valid URL or path
    if (data.pageTargetingType === "all") {
      if (!data.redirectUrl || data.redirectUrl.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Redirect URL is required when targeting all pages",
          path: ["redirectUrl"], // Target the specific field
        });
      } else if (
        !data.redirectUrl.startsWith("/") &&
        !data.redirectUrl.startsWith("http")
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Redirect URL must start with '/' or 'http(s)://'",
          path: ["redirectUrl"],
        });
      }
    }

    // Rule 2: If pageTargetingType is 'specific', redirectMappings must not be empty
    if (
      data.pageTargetingType === "specific" &&
      data.redirectMappings.length === 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "At least one URL mapping is required for specific page targeting",
        path: ["redirectMappings"], // Target the array itself or the button area
      });
    }
    // Note: Individual mapping fields (fromUrl, toUrl) are validated by redirectMappingSchema
  });

// Schema for the entire Redirection object (the form)
export const redirectionSchema = z.object({
  id: z.string(), // Keep ID
  isEnabled: z.boolean(),
  name: z.string().min(1, { message: "Redirection name cannot be empty" }),
  locations: z
    .array(redirectionLocationSchema)
    .min(1, { message: "At least one location must be configured" }),
});

// Export the inferred TypeScript type from the schema
export type RedirectionFormData = z.infer<typeof redirectionSchema>;
// Export nested types if needed elsewhere, though RHF handles nesting
export type RedirectionLocationFormData = z.infer<
  typeof redirectionLocationSchema
>;
export type GeoConditionFormData = z.infer<typeof geoConditionSchema>;
export type RedirectMappingFormData = z.infer<typeof redirectMappingSchema>;
export type PageExclusionFormData = z.infer<typeof pageExclusionSchema>;
