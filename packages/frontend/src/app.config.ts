export default defineAppConfig({
  ui: {
    primary: "brand",
    gray: "cool",

    button: {
      defaultVariants: {
        color: "primary",
        variant: "soft",
      },
      slots: {
        base: "font-semibold transition-colors duration-200",
      },
    },
  },
});
