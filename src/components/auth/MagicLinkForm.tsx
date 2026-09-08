import React, { useState } from "react";
import { Mail, Send } from "lucide-react";
import { FormField } from "@/components/auth/FormField";
import { ServerError } from "@/components/auth/ServerError";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { isValidEmail } from "@/lib/auth/passwordless";

interface Props {
  serverError?: string | null;
}

export default function MagicLinkForm({ serverError }: Props) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();

  function validate() {
    const trimmedEmail = email.trim();
    const nextError = !trimmedEmail
      ? "Email is required"
      : !isValidEmail(trimmedEmail)
        ? "Enter a valid email address"
        : undefined;

    setError(nextError);
    return !nextError;
  }

  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    if (!validate()) {
      event.preventDefault();
    }
  }

  return (
    <form method="POST" action="/api/auth/magic-link" className="space-y-4" onSubmit={handleSubmit} noValidate>
      <FormField
        id="email"
        type="email"
        label="Email"
        value={email}
        onChange={(value) => {
          setEmail(value);
          if (error) setError(undefined);
        }}
        placeholder="you@example.com"
        error={error}
        icon={<Mail className="size-4" />}
      />

      <ServerError message={serverError} />

      <SubmitButton pendingText="Sending sign-in link..." icon={<Send className="size-4" />}>
        Email me a sign-in link
      </SubmitButton>
    </form>
  );
}
