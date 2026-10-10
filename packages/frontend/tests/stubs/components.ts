import { defineComponent, h } from "vue";

export const NuxtLink = defineComponent({
  name: "NuxtLink",
  props: {
    to: {
      type: String,
      default: "",
    },
  },
  setup(_props, { slots }) {
    return () => h("a", {}, slots.default?.());
  },
});

export const UButton = defineComponent({
  name: "UButton",
  props: {
    label: {
      type: String,
      default: "",
    },
  },
  setup(props, { attrs }) {
    return () => h("button", attrs, props.label);
  },
});
