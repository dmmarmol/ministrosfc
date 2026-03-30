import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import RegisterForm from "../../src/components/auth/RegisterForm.vue";

describe("register form fields", () => {
  it("renders registration fields and player checkbox defaulted to true", () => {
    const wrapper = mount(RegisterForm, {
      props: { loading: false, error: "" },
    });

    expect(wrapper.find("#firstName").exists()).toBe(true);
    expect(wrapper.find("#lastName").exists()).toBe(true);
    expect(wrapper.find("#email").exists()).toBe(true);
    expect(wrapper.find("#password").exists()).toBe(true);
    expect(wrapper.find("#passwordConfirmation").exists()).toBe(true);
    expect(wrapper.find("#isPlayer").exists()).toBe(true);
    expect(
      (wrapper.find("#isPlayer").element as HTMLInputElement).checked,
    ).toBe(true);
  });
});
