declare module "#app" {
  interface PageMeta {
    requiresAuth?: boolean;
    requiresRole?: "editor" | "admin";
    authPage?: boolean;
    onboardingPage?: boolean;
    skipOnboardingCheck?: boolean;
    noPadding?: boolean;
  }
}

export {};
