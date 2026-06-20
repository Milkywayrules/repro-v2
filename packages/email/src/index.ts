// biome-ignore lint/performance/noBarrelFile: intentional public surface re-exports
export {
  type EmailKind,
  type EmailSenderConfig,
  emailConfig,
} from './config'
export {
  type CreateEmailClientOptions,
  createEmailClient,
  type SendEmailFailure,
  type SendEmailParams,
  type SendEmailResult,
  type SendEmailSuccess,
} from './send'
export * from './templates/index'
