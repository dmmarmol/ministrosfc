declare module "#app" {
  interface PageMeta {
    requiresAuth?: boolean;
    /** @TODO use UserRole.EDITOR | UserRole.ADMIN instead of plain strings */
    requiresRole?: "editor" | "admin";
    authPage?: boolean;
    onboardingPage?: boolean;
    skipOnboardingCheck?: boolean;
    noPadding?: boolean;
  }
}

export {};
