"use client";

import { SignedOut } from "@clerk/nextjs";
import HeaderClient from "./HeaderClient";

export default function ShowHeaderClient() {
  return (
    <SignedOut>
      <HeaderClient />
    </SignedOut>
  );
}
