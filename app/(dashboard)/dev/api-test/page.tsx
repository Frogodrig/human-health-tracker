"use client";

import { APITestComponent } from "@/components/dev/api-test";

export default function APITestPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">API Testing</h1>
      <APITestComponent />
    </div>
  );
}
