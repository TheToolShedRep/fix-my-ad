"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

/**
 * This page is used by Clerk to complete OAuth logins (Google, GitHub, etc.)
 * after redirecting from the provider. Clerk handles the authentication and redirects the user.
 */
export default function SSOCallbackPage() {
  return <AuthenticateWithRedirectCallback />;
}
