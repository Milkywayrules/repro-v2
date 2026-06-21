'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import {
  completeAvatar,
  formatTreatyError,
  presignAvatar,
  uploadFileToPresignedUrl,
} from '@repro-v2/api-client/queries'
import { isAllowedContentType } from '@repro-v2/s3'
import { Button } from '@repro-v2/ui/components/button'
import { Input } from '@repro-v2/ui/components/input'
import { Label } from '@repro-v2/ui/components/label'
import { useMutation } from '@tanstack/react-query'

import { InlineErrorCallout } from '@/components/inline-error-callout'
import { PageErrorState } from '@/components/page-error-state'
import { apiClient } from '@/lib/api-client'
import { iamClient } from '@/lib/iam-client'
import { routes } from '@/lib/routes'
import { useOnboardingGate } from '@/modules/iam/use-onboarding-gate'

export function SettingsPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { data: session, isPending: sessionPending } = iamClient.useSession()
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [hasSelectedFile, setHasSelectedFile] = useState(false)

  useEffect(() => {
    if (sessionPending) {
      return
    }

    if (!session?.user) {
      router.replace(routes.login)
    }
  }, [sessionPending, session?.user, router])

  const { error: onboardingError, isChecking: onboardingChecking } =
    useOnboardingGate(session?.user?.id)

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!isAllowedContentType(file.type)) {
        throw new Error('Unsupported file type')
      }

      const presign = await presignAvatar(apiClient, {
        filename: file.name,
        contentType: file.type,
        sizeBytes: file.size,
      })

      await uploadFileToPresignedUrl(presign.data.uploadUrl, file)
      return await completeAvatar(apiClient, { key: presign.data.key })
    },
    onSuccess: async () => {
      await iamClient.getSession({ query: { disableCookieCache: true } })
      setPreviewUrl(null)
      setHasSelectedFile(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    },
  })

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) {
      setPreviewUrl(null)
      setHasSelectedFile(false)
      return
    }

    setHasSelectedFile(true)
    setPreviewUrl(URL.createObjectURL(file))
  }

  function handleUpload() {
    const file = fileInputRef.current?.files?.[0]
    if (!file) {
      return
    }

    uploadMutation.mutate(file)
  }

  const error = uploadMutation.error
    ? formatTreatyError(uploadMutation.error, 'Avatar upload failed')
    : null

  if (sessionPending || !session?.user || onboardingChecking) {
    return <p className="p-4">Loading…</p>
  }

  if (onboardingError) {
    return (
      <main className="mx-auto w-full max-w-3xl p-4">
        <PageErrorState
          className="mt-0 p-0"
          message={onboardingError}
          title="Could not continue"
        />
      </main>
    )
  }

  const avatarSrc = previewUrl ?? session.user.image ?? undefined

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4">
      <h1 className="font-semibold text-2xl">Settings</h1>

      <section className="flex flex-col gap-4">
        <h2 className="font-medium text-lg">Avatar</h2>

        {avatarSrc ? (
          // biome-ignore lint/performance/noImgElement: user-uploaded avatar preview
          <img
            alt="Avatar preview"
            className="size-24 rounded-full object-cover"
            height={96}
            src={avatarSrc}
            width={96}
          />
        ) : (
          <p className="text-muted-foreground text-sm">No avatar set</p>
        )}

        {error ? <InlineErrorCallout>{error}</InlineErrorCallout> : null}

        <div className="flex flex-col gap-2">
          <Label htmlFor="avatar-file">Choose image</Label>
          <Input
            accept="image/jpeg,image/png,image/webp,image/gif"
            id="avatar-file"
            onChange={handleFileChange}
            ref={fileInputRef}
            type="file"
          />
        </div>

        <Button
          disabled={!hasSelectedFile || uploadMutation.isPending}
          onClick={handleUpload}
          type="button"
        >
          {uploadMutation.isPending ? 'Uploading…' : 'Upload avatar'}
        </Button>
      </section>
    </main>
  )
}
