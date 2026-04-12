/**
 * `true` when the function runs under the SAM CLI emulator (`sam local start-api` / `sam local invoke`).
 * Real AWS Lambda does not set `AWS_SAM_LOCAL`.
 */
export const isSamLocalLambda = (): boolean => process.env.AWS_SAM_LOCAL === 'true';
