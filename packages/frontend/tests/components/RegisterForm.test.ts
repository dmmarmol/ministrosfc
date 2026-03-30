import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import RegisterForm from "../../src/components/auth/RegisterForm.vue";

describe("RegisterForm", () => {
  const mountForm = (props = {}) =>
    mount(RegisterForm, {
      props: { loading: false, error: "", ...props },
    });

  it("renders firstName, lastName, email, password, and confirmation fields", () => {
    const wrapper = mountForm();
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

  it("renders submit button with correct label", () => {
    const wrapper = mountForm();
    const button = wrapper.find('button[type="submit"]');
    expect(button.exists()).toBe(true);
    expect(button.text()).toBe("Registrarse");
  });

  it("shows loading state on submit button", () => {
    const wrapper = mountForm({ loading: true });
    const button = wrapper.find('button[type="submit"]');
    expect(button.text()).toBe("Registrando…");
    expect(button.attributes("disabled")).toBeDefined();
  });

  it("shows password rules feedback", async () => {
    const wrapper = mountForm();
    await wrapper.find("#password").setValue("a");
    // Should show password rules list
    const rulesContainer = wrapper.find("[data-testid='password-rules']");
    expect(rulesContainer.exists()).toBe(true);
    expect(rulesContainer.text()).toContain("Mínimo 8 caracteres");
    expect(rulesContainer.text()).toContain("Al menos una letra mayúscula");
    expect(rulesContainer.text()).toContain("Al menos un número");
    expect(rulesContainer.text()).toContain("Al menos un carácter especial");
  });

  it("marks satisfied password rules with check mark", async () => {
    const wrapper = mountForm();
    await wrapper.find("#password").setValue("Abcdefgh1!");
    const rulesContainer = wrapper.find("[data-testid='password-rules']");
    // All rules should be satisfied — all items should have the satisfied class
    const ruleItems = rulesContainer.findAll("li");
    for (const item of ruleItems) {
      expect(item.classes()).toContain("text-green-600");
    }
  });

  it("shows password mismatch validation", async () => {
    const wrapper = mountForm();
    await wrapper.find("#password").setValue("Abcdefgh1!");
    await wrapper.find("#passwordConfirmation").setValue("Different1!");
    await wrapper.find("form").trigger("submit.prevent");
    expect(wrapper.text()).toContain("Las contraseñas no coinciden");
  });

  it("emits submit with form data when valid", async () => {
    const wrapper = mountForm();
    await wrapper.find("#firstName").setValue("Juan");
    await wrapper.find("#lastName").setValue("Pérez");
    await wrapper.find("#email").setValue("juan@example.com");
    await wrapper.find("#password").setValue("Abcdefgh1!");
    await wrapper.find("#passwordConfirmation").setValue("Abcdefgh1!");
    await wrapper.find("form").trigger("submit.prevent");
    expect(wrapper.emitted("submit")).toBeTruthy();
    expect(wrapper.emitted("submit")![0]).toEqual([
      {
        firstName: "Juan",
        lastName: "Pérez",
        email: "juan@example.com",
        password: "Abcdefgh1!",
        passwordConfirmation: "Abcdefgh1!",
        isPlayer: true,
      },
    ]);
  });

  it("emits isPlayer=false when checkbox is unchecked", async () => {
    const wrapper = mountForm();
    await wrapper.find("#firstName").setValue("Juan");
    await wrapper.find("#lastName").setValue("Pérez");
    await wrapper.find("#email").setValue("juan@example.com");
    await wrapper.find("#password").setValue("Abcdefgh1!");
    await wrapper.find("#passwordConfirmation").setValue("Abcdefgh1!");
    await wrapper.find("#isPlayer").setValue(false);
    await wrapper.find("form").trigger("submit.prevent");

    expect(wrapper.emitted("submit")![0]).toEqual([
      {
        firstName: "Juan",
        lastName: "Pérez",
        email: "juan@example.com",
        password: "Abcdefgh1!",
        passwordConfirmation: "Abcdefgh1!",
        isPlayer: false,
      },
    ]);
  });

  it("does not emit submit when passwords do not match", async () => {
    const wrapper = mountForm();
    await wrapper.find("#firstName").setValue("Juan");
    await wrapper.find("#lastName").setValue("Pérez");
    await wrapper.find("#email").setValue("juan@example.com");
    await wrapper.find("#password").setValue("Abcdefgh1!");
    await wrapper.find("#passwordConfirmation").setValue("Mismatch1!");
    await wrapper.find("form").trigger("submit.prevent");
    expect(wrapper.emitted("submit")).toBeFalsy();
  });

  it("displays server error when error prop is set", () => {
    const wrapper = mountForm({ error: "Este correo ya está registrado" });
    expect(wrapper.text()).toContain("Este correo ya está registrado");
  });
});
