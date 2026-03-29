import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import ProfileEditForm from "../../src/components/profile/ProfileEditForm.vue";

describe("ProfileEditForm", () => {
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
    expect(wrapper.find("#profile-jerseyNumber").exists()).toBe(true);
    expect(wrapper.find("#profile-dateOfBirth").exists()).toBe(true);
    expect(wrapper.find("#profile-address").exists()).toBe(true);
    expect(wrapper.find("#profile-phone").exists()).toBe(true);
    expect(wrapper.find("#profile-whatsapp").exists()).toBe(true);
    expect(wrapper.find("#profile-emergencyContact").exists()).toBe(true);
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

  it("shows jersey conflict warning", () => {
    const wrapper = mountForm({
      profile: { ...defaultProfile, jerseyNumber: null },
      takenJerseys: [7, 10],
    });
    const hint = wrapper.find("[data-testid='jersey-hint']");
    expect(hint.exists()).toBe(true);
    expect(hint.text()).toContain("7");
    expect(hint.text()).toContain("10");
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
});
