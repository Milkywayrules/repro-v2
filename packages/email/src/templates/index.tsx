// biome-ignore lint/performance/noBarrelFile: intentional templates subpath export surface
export { EmailShell } from './email-shell'
export {
  IamMagicLinkEmail,
  type IamMagicLinkEmailProps,
} from './iam-magic-link'
export {
  IamPasswordResetEmail,
  type IamPasswordResetEmailProps,
} from './iam-password-reset'
export {
  IamVerifyEmail,
  type IamVerifyEmailProps,
} from './iam-verify-email'
export {
  WorkspaceInviteEmail,
  type WorkspaceInviteEmailProps,
} from './workspace-invite'
