import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";

vi.stubGlobal("useRuntimeConfig", () => ({
  public: { apiBaseUrl: "http://localhost:5102" },
}));
vi.stubGlobal("$fetch", vi.fn());

import ProfileEditForm from "../../src/components/profile/ProfileEditForm.vue";

describe("ProfileEditForm", () => {
  /** @TODO reuse an existing interface to type defaultProfile */
  const defaultProfile = {
    firstName: "Juan",
    lastName: "Pérez",
    nickname: "Juanchi",
    position: "CMF",
    jerseyNumber: 10,
    dateOfBirth: "1990-05-15",
    address: "Av. Corrientes 1234",
    phone: "+54 11 1234-5678",
    whatsapp: "+54 11 1234-5678",
    emergencyContact: "María Pérez",
    status: "ACTIVE",
  };

  const mountForm = (props = {}) =>
    mount(ProfileEditForm, {
      props: {
        profile: defaultProfile,
        takenJerseys: [1, 2, 3, 5],
        loading: false,
        error: "",
        ...props,
      },
    });

  it("renders all editable fields", () => {
    const wrapper = mountForm();
    expect(wrapper.find("#profile-firstName").exists()).toBe(true);
    expect(wrapper.find("#profile-lastName").exists()).toBe(true);
    expect(wrapper.find("#profile-nickname").exists()).toBe(true);
    expect(wrapper.find("#profile-position").exists()).toBe(true);
    expect(wrapper.find("#jerseyNumberInput").exists()).toBe(true);
    expect(wrapper.find("#profile-dateOfBirth").exists()).toBe(true);
    expect(wrapper.find("#profile-address").exists()).toBe(true);
    expect(wrapper.find("#profile-phone").exists()).toBe(true);
    expect(wrapper.find("#profile-whatsapp").exists()).toBe(true);
    expect(wrapper.find("#profile-emergencyContact").exists()).toBe(true);
    expect(wrapper.find("#profileStatus").exists()).toBe(true);
  });

  it("populates fields from profile prop", () => {
    const wrapper = mountForm();
    expect(
      (wrapper.find("#profile-firstName").element as HTMLInputElement).value,
    ).toBe("Juan");
    expect(
      (wrapper.find("#profile-lastName").element as HTMLInputElement).value,
    ).toBe("Pérez");
  });

  it("emits save with form data on submit", async () => {
    const wrapper = mountForm();
    await wrapper.find("#profile-nickname").setValue("Carlitos");
    await wrapper.find("form").trigger("submit.prevent");

    expect(wrapper.emitted("save")).toBeTruthy();
    const emitted = wrapper.emitted("save")![0][0] as any;
    expect(emitted.nickname).toBe("Carlitos");
  });

  it("shows jersey available ranges hint", () => {
    const wrapper = mountForm({
      profile: { ...defaultProfile, jerseyNumber: null },
      takenJerseys: [7, 10],
    });
    const hint = wrapper.find("[data-testid='jersey-available-hint']");
    expect(hint.exists()).toBe(true);
    // Available ranges should exclude 7 and 10
    expect(hint.text()).not.toContain("7");
  });

  it("shows loading state", () => {
    const wrapper = mountForm({ loading: true });
    const button = wrapper.find('button[type="submit"]');
    expect(button.attributes("disabled")).toBeDefined();
  });

  it("shows error message", () => {
    const wrapper = mountForm({ error: "Error al guardar" });
    expect(wrapper.text()).toContain("Error al guardar");
  });

  it("renders IsPlayerCheckbox checked when status is ACTIVE", () => {
    const wrapper = mountForm();
    const checkbox = wrapper.find("#profileStatus");
    expect((checkbox.element as HTMLInputElement).checked).toBe(true);
  });

  it("emits save with status INACTIVE when IsPlayerCheckbox is unchecked", async () => {
    const wrapper = mountForm();
    await wrapper.find("#profileStatus").setValue(false);
    await wrapper.find("form").trigger("submit.prevent");
    const emitted = wrapper.emitted("save")![0][0] as any;
    expect(emitted.status).toBe("INACTIVE");
  });
});
