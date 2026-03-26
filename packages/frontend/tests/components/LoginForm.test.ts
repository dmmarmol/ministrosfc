import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import LoginForm from "../../src/components/auth/LoginForm.vue";

describe("LoginForm", () => {
  const mountForm = () =>
    mount(LoginForm, {
      props: { loading: false, error: "" },
    });

  it("renders email and password fields", () => {
    const wrapper = mountForm();
    expect(wrapper.find('input[type="email"]').exists()).toBe(true);
    expect(wrapper.find('input[type="password"]').exists()).toBe(true);
  });

  it("renders submit button with correct label", () => {
    const wrapper = mountForm();
    const button = wrapper.find('button[type="submit"]');
    expect(button.exists()).toBe(true);
    expect(button.text()).toBe("Iniciar sesión");
  });

  it("shows loading state on submit button", () => {
    const wrapper = mount(LoginForm, {
      props: { loading: true, error: "" },
    });
    const button = wrapper.find('button[type="submit"]');
    expect(button.text()).toBe("Iniciando sesión…");
    expect(button.attributes("disabled")).toBeDefined();
  });

  it("emits submit event with email and password", async () => {
    const wrapper = mountForm();
    await wrapper.find('input[type="email"]').setValue("test@example.com");
    await wrapper.find('input[type="password"]').setValue("Password1!");
    await wrapper.find("form").trigger("submit.prevent");
    expect(wrapper.emitted("submit")).toBeTruthy();
    expect(wrapper.emitted("submit")![0]).toEqual([
      { email: "test@example.com", password: "Password1!" },
    ]);
  });

  it("displays error message when error prop is set", () => {
    const wrapper = mount(LoginForm, {
      props: { loading: false, error: "Credenciales inválidas" },
    });
    expect(wrapper.text()).toContain("Credenciales inválidas");
  });

  it("does not display error message when error prop is empty", () => {
    const wrapper = mountForm();
    expect(wrapper.find(".text-red-600").exists()).toBe(false);
  });
});
